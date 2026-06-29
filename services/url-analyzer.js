/**
 * services/url-analyzer.js
 * ─────────────────────────────────────────────────────────────
 * Analyse une URL fournie par l'utilisateur comme inspiration.
 * Extrait : palette de couleurs, typographies, structure des sections,
 * ton général, ambiance visuelle — sans jamais copier le contenu.
 *
 * Renvoie un objet `InspirationProfile` injecté dans le prompt Claude.
 * ─────────────────────────────────────────────────────────────
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Timeout en ms pour le fetch du site externe
const FETCH_TIMEOUT = 8000;

// Taille max du HTML récupéré (150 Ko) — évite les sites trop lourds
const MAX_HTML_SIZE = 150_000;

/**
 * analyzeInspirationUrl(url)
 * Retourne un InspirationProfile ou null si le site est inaccessible.
 *
 * @param {string} url
 * @returns {Promise<InspirationProfile|null>}
 */
export async function analyzeInspirationUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Normaliser l'URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch {
    return null;
  }

  // Bloquer les URLs locales / privées (sécurité SSRF)
  if (isPrivateUrl(parsedUrl)) {
    return { error: 'URL locale ou privée non autorisée.' };
  }

  let html;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Creazio-Bot/1.0; +https://creazio.fr/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return { error: `Site inaccessible (HTTP ${response.status})` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { error: 'L\'URL ne pointe pas vers une page HTML.' };
    }

    const raw = await response.text();
    html = raw.slice(0, MAX_HTML_SIZE);

  } catch (err) {
    if (err.name === 'AbortError') {
      return { error: 'Le site a mis trop de temps à répondre.' };
    }
    return { error: `Impossible d\'accéder à ce site : ${err.message}` };
  }

  // Parser le HTML
  let dom;
  try {
    dom = new JSDOM(html, { url: parsedUrl.href });
  } catch {
    return { error: 'Impossible de parser le HTML de ce site.' };
  }

  const doc = dom.window.document;

  return {
    url:        parsedUrl.href,
    domain:     parsedUrl.hostname,
    colors:     extractColors(doc, html),
    fonts:      extractFonts(doc, html),
    sections:   extractSections(doc),
    tone:       extractTone(doc),
    darkMode:   detectDarkMode(doc, html),
    layout:     detectLayout(doc),
    hasVideo:   detectVideo(doc),
    hasGallery: detectGallery(doc),
    pageTitle:  doc.querySelector('title')?.textContent?.trim()?.slice(0, 80) || '',
    metaDesc:   doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()?.slice(0, 160) || '',
  };
}

// ── Extraction des couleurs ─────────────────────────────────
function extractColors(doc, html) {
  const colors = new Set();

  // 1. CSS variables (les plus fiables)
  const cssVarMatches = html.matchAll(/--[\w-]*(?:color|bg|background|primary|accent|brand|text|foreground|surface)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/gi);
  for (const m of cssVarMatches) {
    const c = normalizeColor(m[1]);
    if (c) colors.add(c);
  }

  // 2. Couleurs dans les balises style inline
  const inlineStyles = html.matchAll(/(?:background|color|background-color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi);
  for (const m of inlineStyles) {
    const c = normalizeColor(m[1]);
    if (c) colors.add(c);
  }

  // 3. Classes Tailwind communes (détection de thème)
  const bgClasses = html.matchAll(/bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)-(\d+)/gi);
  const twPalette = new Set();
  for (const m of bgClasses) {
    twPalette.add(m[1].toLowerCase());
  }

  const result = [...colors].slice(0, 10);

  // Détecter dominante claire/sombre
  const darkHints  = result.filter(c => isDarkColor(c)).length;
  const lightHints = result.filter(c => !isDarkColor(c)).length;

  return {
    extracted: result,
    palette_type: darkHints > lightHints ? 'dark' : 'light',
    tailwind_palette: [...twPalette].slice(0, 4),
    primary_guess: result[0] || null,
  };
}

// ── Extraction des polices ──────────────────────────────────
function extractFonts(doc, html) {
  const fonts = new Set();

  // Google Fonts dans les links
  const gfLinks = doc.querySelectorAll('link[href*="fonts.googleapis.com"]');
  for (const link of gfLinks) {
    const href = link.getAttribute('href') || '';
    const families = href.match(/family=([^&]+)/g) || [];
    for (const f of families) {
      const name = decodeURIComponent(f.replace('family=', '')).split(':')[0].replace(/\+/g, ' ');
      if (name) fonts.add(name);
    }
  }

  // font-family dans le CSS
  const cssMatches = html.matchAll(/font-family\s*:\s*['"]?([A-Za-z][A-Za-z0-9 ]{2,30})['"]?/gi);
  for (const m of cssMatches) {
    const name = m[1].trim();
    if (!['serif','sans-serif','monospace','inherit','initial','system-ui','ui-sans-serif'].includes(name.toLowerCase())) {
      fonts.add(name);
    }
  }

  const list = [...fonts].slice(0, 4);
  return {
    detected: list,
    heading_guess: list[0] || null,
    body_guess: list[1] || list[0] || null,
  };
}

// ── Détection des sections ──────────────────────────────────
function extractSections(doc) {
  const sectionMap = {
    hero:         ['hero','banner','jumbotron','masthead','header','landing'],
    services:     ['service','prestation','offre','offer','feature','solution'],
    about:        ['about','equipe','team','histoire','story','qui-sommes'],
    gallery:      ['gallery','galerie','portfolio','realization','projet','work'],
    testimonials: ['testimonial','avis','review','temoignage','client'],
    pricing:      ['pricing','tarif','price','plan','abonnement'],
    faq:          ['faq','question','accordion'],
    contact:      ['contact','formulaire','form','nous-contacter'],
    process:      ['process','etape','step','how','comment'],
    video:        ['video','youtube','vimeo'],
  };

  const html = doc.body?.innerHTML || '';
  const detected = [];

  for (const [section, keywords] of Object.entries(sectionMap)) {
    const pattern = new RegExp(keywords.join('|'), 'i');
    if (pattern.test(html)) {
      detected.push(section);
    }
  }

  return detected;
}

// ── Ton général ─────────────────────────────────────────────
function extractTone(doc) {
  const text = (doc.body?.textContent || '').slice(0, 3000).toLowerCase();
  const scores = {
    luxe:      countWords(text, ['prestige','excellence','raffiné','exclusif','haut de gamme','premium','luxury','elite']),
    artisanal: countWords(text, ['artisan','fait main','savoir-faire','traditionnel','local','terroir','passion']),
    moderne:   countWords(text, ['innovant','digital','solution','performance','efficace','rapide','agile']),
    chaleureux:countWords(text, ['bienvenue','famille','convivial','humain','partage','ensemble','accueil']),
    technique: countWords(text, ['spécialiste','expert','certifié','professionnel','qualification','norme']),
  };

  const dominant = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  return dominant[1] > 0 ? dominant[0] : 'neutre';
}

// ── Détections diverses ─────────────────────────────────────
function detectDarkMode(doc, html) {
  // Chercher les indices de dark mode
  const hasDarkClass = /class=["'][^"']*dark[^"']*["']/i.test(html);
  const hasDarkBg    = /#0[0-3][0-3][0-3][0-3][0-3]|#111|#000|#0f0f|#050505/i.test(html);
  const prefersMedia = /@media\s*\(prefers-color-scheme:\s*dark\)/i.test(html);
  return hasDarkClass || hasDarkBg || prefersMedia;
}

function detectLayout(doc) {
  const html = doc.body?.innerHTML || '';
  const hasGrid  = /grid-template|display:\s*grid/i.test(html);
  const hasFlex  = /display:\s*flex/i.test(html);
  const sections = doc.querySelectorAll('section, [class*="section"]').length;
  return {
    type: hasGrid ? 'grid' : hasFlex ? 'flex' : 'block',
    sections_count: sections,
    is_one_pager: sections <= 6,
  };
}

function detectVideo(doc) {
  return !!(doc.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]'));
}

function detectGallery(doc) {
  const imgs = doc.querySelectorAll('img').length;
  const hasGrid = !!(doc.querySelector('[class*="grid"], [class*="gallery"], [class*="masonry"]'));
  return imgs > 4 && hasGrid;
}

// ── Utils ───────────────────────────────────────────────────
function normalizeColor(c) {
  if (!c) return null;
  c = c.trim();
  // Ignorer blanc/noir purs et transparents
  if (/^#(?:fff|ffffff|000|000000)$/i.test(c)) return null;
  if (/transparent|inherit|initial/i.test(c)) return null;
  // Normaliser hex 3 → 6
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    c = '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
  }
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(c) ? c.slice(0,7).toLowerCase() : null;
}

function isDarkColor(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (0.299*r + 0.587*g + 0.114*b) < 128;
}

function countWords(text, words) {
  return words.reduce((acc, w) => acc + (text.split(w).length - 1), 0);
}

function isPrivateUrl(url) {
  const host = url.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  );
}

/**
 * buildInspirationPrompt(profile)
 * Convertit un InspirationProfile en texte injecté dans le prompt Claude.
 *
 * @param {object} profile
 * @returns {string}
 */
export function buildInspirationPrompt(profile) {
  if (!profile || profile.error) {
    return profile?.error
      ? `Note : L'URL d'inspiration n'a pas pu être analysée (${profile.error}). Ignore-la.`
      : '';
  }

  const lines = [
    `URL analysée : ${profile.domain}`,
    `Thème visuel : ${profile.colors.palette_type === 'dark' ? 'Sombre (dark mode)' : 'Clair (light mode)'}`,
  ];

  if (profile.colors.extracted.length > 0) {
    lines.push(`Couleurs détectées sur le site : ${profile.colors.extracted.slice(0,6).join(', ')}`);
  }

  if (profile.colors.tailwind_palette.length > 0) {
    lines.push(`Palette Tailwind détectée : ${profile.colors.tailwind_palette.join(', ')}`);
  }

  if (profile.fonts.detected.length > 0) {
    lines.push(`Typographies détectées : ${profile.fonts.detected.join(', ')}`);
    if (profile.fonts.heading_guess) lines.push(`Police titre probable : ${profile.fonts.heading_guess}`);
    if (profile.fonts.body_guess)    lines.push(`Police corps probable : ${profile.fonts.body_guess}`);
  }

  if (profile.sections.length > 0) {
    lines.push(`Sections présentes sur ce site : ${profile.sections.join(', ')}`);
  }

  if (profile.tone !== 'neutre') {
    lines.push(`Ton général perçu : ${profile.tone}`);
  }

  if (profile.darkMode) {
    lines.push(`Ce site utilise un design sombre — inspire-toi de cette ambiance si elle est cohérente avec le secteur du client.`);
  }

  if (profile.hasVideo) {
    lines.push(`Ce site utilise de la vidéo — considère l'option hero vidéo si pertinent.`);
  }

  if (profile.hasGallery) {
    lines.push(`Ce site a une galerie photo — inclus la section gallery si pertinent.`);
  }

  if (profile.layout.sections_count) {
    lines.push(`Nombre de sections sur ce site : ${profile.layout.sections_count} — adapte la longueur en conséquence.`);
  }

  if (profile.metaDesc) {
    lines.push(`Description SEO de ce site (pour comprendre le positionnement) : "${profile.metaDesc}"`);
  }

  return [
    `\nAnalyse du site d'inspiration (${profile.domain}) :`,
    ...lines.map(l => `  · ${l}`),
    `  ⚠️ IMPORTANT : utilise ces informations uniquement comme référence d'ambiance.`,
    `  Ne copie JAMAIS le contenu, les textes, les images ni le design exact.`,
    `  Crée une version originale, améliorée et adaptée au métier du client.`,
  ].join('\n');
}
