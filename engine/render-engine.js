/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  CRÉAZIO — Moteur de rendu                               ║
 * ║  JSON data + HTML template → Site final                  ║
 * ║                                                          ║
 * ║  Principe : Claude modifie UNIQUEMENT le JSON.           ║
 * ║  Ce moteur reconstruit le HTML proprement.               ║
 * ║  Rien ne peut casser le layout.                          ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Chargement des templates et composants ──────────────────
const TEMPLATES_DIR   = path.join(__dirname, '../templates/base');
const COMPONENTS_DIR  = path.join(__dirname, '../templates/components');

function loadTemplate(templateName) {
  const file = path.join(TEMPLATES_DIR, `${templateName}.html`);
  if (!fs.existsSync(file)) {
    throw new Error(`Template "${templateName}" introuvable`);
  }
  return fs.readFileSync(file, 'utf-8');
}

function loadComponent(componentName) {
  const file = path.join(COMPONENTS_DIR, `${componentName}.html`);
  if (!fs.existsSync(file)) {
    console.warn(`[RENDER] Composant "${componentName}" introuvable, ignoré`);
    return '';
  }
  return fs.readFileSync(file, 'utf-8');
}

// ── Échappement HTML basique (texte utilisateur) ─────────────
function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Injection de données scalaires dans un template HTML ─────
// Remplace {{variable}} (chemins imbriqués type pages.home.hero.title)
// par la valeur correspondante dans data. Les tableaux sont ignorés
// ici — ils sont gérés par les fonctions de rendu dédiées ci-dessous.
function injectData(html, data, extra = {}) {
  let result = html;

  function flatten(obj, pre = '') {
    for (const [key, val] of Object.entries(obj || {})) {
      const fullKey = pre ? `${pre}.${key}` : key;
      if (Array.isArray(val)) continue;
      if (typeof val === 'object' && val !== null) {
        flatten(val, fullKey);
      } else {
        const regex = new RegExp(`{{\\s*${fullKey.replace(/\./g, '\\.')}\\s*}}`, 'g');
        result = result.replace(regex, escapeHTML(val));
      }
    }
  }

  flatten(data);
  // `extra` peut contenir des clés déjà "à points" (ex: "site.api_url")
  // ou des noms simples en MAJUSCULES (ex: HERO_CTA_PRIMARY) — dans les
  // deux cas on les traite comme des clés complètes, pas comme des
  // objets à aplatir davantage.
  for (const [key, val] of Object.entries(extra)) {
    if (val === undefined || val === null || typeof val === 'object') continue;
    const regex = new RegExp(`{{\\s*${key.replace(/\./g, '\\.')}\\s*}}`, 'g');
    result = result.replace(regex, val); // pas d'échappement : ces valeurs sont déjà du HTML généré
  }

  // Nettoyer les variables non remplies
  result = result.replace(/{{[^}]+}}/g, '');

  return result;
}

// ── Rendu d'un sous-composant répété (ex: une carte de service) ──
function renderItem(componentName, item, index, data, extra = {}) {
  const tpl = loadComponent(componentName);
  return injectData(tpl, { ...data, item }, { ...extra, ITEM_DELAY: String(Math.min(index, 3)) });
}

// ── Image avec fallback élégant si aucune URL n'est fournie ──
// Plutôt qu'une case vide, on affiche un dégradé décoratif basé
// sur les couleurs du site — chaque site garde un rendu "fini"
// même sans visuels fournis par le client.
//
// Si `credit` est fourni (photo Unsplash), une attribution discrète
// est affichée en surimpression — obligation des conditions Unsplash.
function imageOrFallback(url, alt, opts = {}) {
  const { className = '', loading = 'lazy', aspect = '', credit = '' } = opts;
  if (url) {
    const img = `<img src="${escapeHTML(url)}" alt="${escapeHTML(alt || '')}" loading="${loading}" class="${className}">`;
    if (!credit) return img;
    return `<div style="position:relative;width:100%;height:100%">${img}<span class="img-credit">${escapeHTML(credit)}</span></div>`;
  }
  const style = aspect ? `aspect-ratio:${aspect};` : '';
  return `<div class="${className}" style="${style}width:100%;height:100%;background:linear-gradient(135deg, var(--color-surface), var(--color-border));display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:.78rem;font-weight:600;letter-spacing:.05em">${escapeHTML(alt || '')}</div>`;
}

// ── CSS dynamique basé sur les couleurs et polices ──────────
function buildDynamicCSS(siteData) {
  const { colors, fonts } = siteData;
  return `
<style id="creazio-theme">
  :root {
    --color-primary:    ${colors?.primary    || '#15140f'};
    --color-accent:     ${colors?.accent     || '#c9a84c'};
    --color-text:       ${colors?.text       || '#15140f'};
    --color-bg:         ${colors?.bg         || '#f7f5f0'};
    --color-surface:    ${colors?.surface    || '#ffffff'};
    --color-border:     ${colors?.border     || '#e8e4da'};
    --color-text-muted: ${colors?.textMuted  || '#6f6b60'};
    --font-heading:     '${fonts?.heading    || 'Instrument Serif'}', serif;
    --font-body:        '${fonts?.body       || 'DM Sans'}', sans-serif;
  }
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${
  (fonts?.heading || 'Instrument+Serif').replace(/ /g, '+')
}:ital,wght@0,400;0,700;1,400&family=${
  (fonts?.body || 'DM+Sans').replace(/ /g, '+')
}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  `.trim();
}

// ── Génération des balises SEO ───────────────────────────────
function buildSEOTags(seo, site) {
  return `
<meta name="description" content="${escapeHTML(seo?.description)}">
<meta name="keywords" content="${escapeHTML((seo?.keywords || []).join(', '))}">
<meta property="og:title" content="${escapeHTML(seo?.title || site?.name)}">
<meta property="og:description" content="${escapeHTML(seo?.description)}">
<meta property="og:type" content="website">
${seo?.og_image ? `<meta property="og:image" content="${escapeHTML(seo.og_image)}">` : ''}
<meta name="viewport-fit" content="cover">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHTML(site?.url)}">
  `.trim();
}

// ── Génération des mentions légales ─────────────────────────
function buildLegalFooter(legal) {
  if (!legal) return '';
  return `
<div id="mentions-legales" class="legal-section">
  <div class="legal-container">
    <h3>Mentions légales</h3>
    <p><strong>Raison sociale :</strong> ${escapeHTML(legal.company_name)}</p>
    <p><strong>Forme juridique :</strong> ${escapeHTML(legal.legal_form)}</p>
    <p><strong>SIRET :</strong> ${escapeHTML(legal.siret)}</p>
    ${legal.vat_number ? `<p><strong>TVA :</strong> ${escapeHTML(legal.vat_number)}</p>` : ''}
    <p><strong>Adresse :</strong> ${escapeHTML(legal.address)}</p>
    <p><strong>Email :</strong> <a href="mailto:${escapeHTML(legal.email)}">${escapeHTML(legal.email)}</a></p>
    <p><strong>Téléphone :</strong> ${escapeHTML(legal.phone)}</p>
    <p><strong>Hébergement :</strong> Créazio SAS — creazio.fr | Vercel Inc. — 340 Pine St, San Francisco, CA</p>
    ${legal.capital ? `<p><strong>Capital social :</strong> ${escapeHTML(legal.capital)}</p>` : ''}
  </div>
</div>
  `.trim();
}

// ── Bandeau RGPD ─────────────────────────────────────────────
function buildRGPDBanner() {
  return `
<div id="rgpd-banner" class="rgpd-banner" style="display:none">
  <div class="rgpd-content">
    <p>Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez notre <a href="#mentions-legales">politique de confidentialité</a>.</p>
    <div class="rgpd-actions">
      <button onclick="acceptRGPD()" class="btn-rgpd-accept">Accepter</button>
      <button onclick="refuseRGPD()" class="btn-rgpd-refuse">Refuser</button>
    </div>
  </div>
</div>
<script>
  if (!localStorage.getItem('rgpd')) {
    document.getElementById('rgpd-banner').style.display = 'flex';
  }
  function acceptRGPD() {
    localStorage.setItem('rgpd', 'accepted');
    document.getElementById('rgpd-banner').style.display = 'none';
  }
  function refuseRGPD() {
    localStorage.setItem('rgpd', 'refused');
    document.getElementById('rgpd-banner').style.display = 'none';
  }
</script>
  `.trim();
}

// ── Badge Créazio ────────────────────────────────────────────
function buildCreazioBadge(showBadge) {
  if (!showBadge) return '';
  return `
<div class="creazio-badge">
  <a href="https://creazio.fr" target="_blank" rel="noopener">
    Créé avec <strong>Créazio</strong>
  </a>
</div>
  `.trim();
}

// ── Petit badge footer (variante discrète, dans le footer) ────
function buildFooterBadge(showBadge) {
  if (!showBadge) return '';
  return `<a href="https://creazio.fr" target="_blank" rel="noopener" style="color:inherit;opacity:.6">Créé avec Créazio</a>`;
}

// ══════════════════════════════════════════════════════════
//  RENDU DES COMPOSANTS
// ══════════════════════════════════════════════════════════

function renderNavLinks(nav) {
  return (nav?.links || [])
    .map(link => `<li><a href="${escapeHTML(link.href)}">${escapeHTML(link.label)}</a></li>`)
    .join('\n');
}

function renderNavCTA(nav) {
  if (!nav?.cta) return '';
  return `<a href="${escapeHTML(nav.cta.href)}" class="btn btn-accent">${escapeHTML(nav.cta.text)}</a>`;
}

function renderLogo(site) {
  if (site?.logo?.type === 'image' && site.logo.image_url) {
    return `<img src="${escapeHTML(site.logo.image_url)}" alt="${escapeHTML(site.name)}">`;
  }
  const name = site?.logo?.text || site?.name || 'Mon Site';
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    const last = words.pop();
    return `${escapeHTML(words.join(' '))} <em>${escapeHTML(last)}</em>`;
  }
  return escapeHTML(name);
}

function renderHero(siteData) {
  const hero = siteData.pages?.home?.hero || {};
  const tpl = loadComponent('hero');

  const hasImage = !!hero.background_image;
  const bgClass = hasImage ? ' has-image' : '';
  const bgImage = hasImage
    ? `<img src="${escapeHTML(hero.background_image)}" alt="" loading="eager">${hero.background_image_credit ? `<span class="img-credit">${escapeHTML(hero.background_image_credit)}</span>` : ''}`
    : '';

  const ctaPrimary = hero.cta_primary
    ? `<a href="${escapeHTML(hero.cta_primary.href)}" class="btn btn-primary">${escapeHTML(hero.cta_primary.text)}</a>`
    : '';
  const ctaSecondary = hero.cta_secondary
    ? `<a href="${escapeHTML(hero.cta_secondary.href)}" class="btn btn-outline">${escapeHTML(hero.cta_secondary.text)}</a>`
    : '';

  return injectData(tpl, siteData, {
    HERO_BG_CLASS: bgClass,
    HERO_BG_IMAGE: bgImage,
    HERO_CTA_PRIMARY: ctaPrimary,
    HERO_CTA_SECONDARY: ctaSecondary,
  });
}

function renderServices(siteData) {
  const services = siteData.pages?.home?.services;
  if (!services?.items?.length) return '';
  const tpl = loadComponent('services');

  const items = services.items.map((item, i) => {
    const price = item.price ? `<div class="service-price">${escapeHTML(item.price)}</div>` : '';
    return renderItem('_service-item', item, i, siteData, { ITEM_PRICE: price });
  }).join('\n');

  return injectData(tpl, siteData, { SERVICES_ITEMS: items });
}

function renderAbout(siteData) {
  const about = siteData.pages?.home?.about;
  if (!about) return '';
  const tpl = loadComponent('about');

  const image = imageOrFallback(about.image_url, about.title, { className: '', aspect: '4/5', credit: about.image_credit });
  const stats = (about.stats || [])
    .map((item, i) => renderItem('_about-stat', item, i, siteData))
    .join('\n');

  return injectData(tpl, siteData, { ABOUT_IMAGE: image, ABOUT_STATS: stats });
}

function renderGallery(siteData) {
  const gallery = siteData.pages?.home?.gallery;
  if (!gallery?.images?.length) return '';
  const tpl = loadComponent('gallery');

  const items = gallery.images.map((img, i) => {
    const image = imageOrFallback(img.url, img.alt, { credit: img.credit });
    return renderItem('_gallery-item', img, i, siteData, { GALLERY_IMAGE: image });
  }).join('\n');

  return injectData(tpl, siteData, { GALLERY_ITEMS: items });
}

function renderTestimonials(siteData) {
  const testimonials = siteData.pages?.home?.testimonials;
  if (!testimonials?.items?.length) return '';
  const tpl = loadComponent('testimonials');

  const items = testimonials.items.map((item, i) => {
    const rating = Math.max(0, Math.min(5, Number(item.rating) || 5));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return renderItem('_testimonial-item', item, i, siteData, { ITEM_STARS: stars });
  }).join('\n');

  return injectData(tpl, siteData, { TESTIMONIAL_ITEMS: items });
}

function renderContact(siteData) {
  const contact = siteData.pages?.home?.contact;
  if (!contact) return '';
  const tpl = loadComponent('contact');

  const hours = (contact.hours || [])
    .map((item, i) => renderItem('_contact-hours', item, i, siteData))
    .join('\n');

  const form = contact.form_enabled !== false ? loadComponent('_contact-form') : '';
  const formHTML = injectData(form, siteData);

  return injectData(tpl, siteData, { CONTACT_HOURS: hours, CONTACT_FORM: formHTML });
}

function renderFAQ(siteData) {
  const faq = siteData.pages?.home?.faq;
  if (!faq?.items?.length) return '';
  const tpl = loadComponent('faq');

  const items = faq.items
    .map((item, i) => renderItem('_faq-item', item, i, siteData))
    .join('\n');

  return injectData(tpl, siteData, { FAQ_ITEMS: items });
}

function renderCTABanner(siteData) {
  const cta = siteData.pages?.home?.cta_banner;
  if (!cta) return '';
  const tpl = loadComponent('cta-banner');

  const button = cta.button
    ? `<a href="${escapeHTML(cta.button.href)}" class="btn btn-accent">${escapeHTML(cta.button.text)}</a>`
    : '';

  return injectData(tpl, siteData, { CTA_BANNER_BUTTON: button });
}

function renderProcess(siteData) {
  const process = siteData.pages?.home?.process;
  if (!process?.steps?.length) return '';
  const tpl = loadComponent('process');

  const steps = process.steps
    .map((item, i) => renderItem('_process-step', item, i, siteData, { ITEM_NUMBER: String(i + 1).padStart(2, '0') }))
    .join('\n');

  return injectData(tpl, siteData, { PROCESS_STEPS: steps });
}

function renderBeforeAfter(siteData) {
  const ba = siteData.pages?.home?.before_after;
  if (!ba) return '';
  const tpl = loadComponent('before-after');

  const imgBefore = imageOrFallback(ba.before_image, 'Avant', { aspect: '4/3', credit: ba.before_image_credit });
  const imgAfter  = imageOrFallback(ba.after_image, 'Après', { aspect: '4/3', credit: ba.after_image_credit });

  return injectData(tpl, siteData, { BA_IMAGE_BEFORE: imgBefore, BA_IMAGE_AFTER: imgAfter });
}

function renderFooter(siteData) {
  const footer = siteData.pages?.home?.footer;
  if (!footer) return '';
  const tpl = loadComponent('footer');

  const links = (footer.links || [])
    .map((item, i) => renderItem('_footer-link', item, i, siteData))
    .join('\n');

  const socialIcons = { instagram: '📷', facebook: '📘', linkedin: '💼', tiktok: '🎵', x: '𝕏' };
  const social = Object.entries(footer.social || {})
    .filter(([, url]) => !!url)
    .map(([key, url]) => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener" aria-label="${escapeHTML(key)}">${socialIcons[key] || '🔗'}</a>`)
    .join('\n');

  const badge = buildFooterBadge(siteData.site?.show_badge !== false);

  return injectData(tpl, siteData, {
    FOOTER_LINKS: links,
    FOOTER_SOCIAL: social,
    FOOTER_BADGE: badge,
    CURRENT_YEAR: String(new Date().getFullYear()),
  });
}

// ── Table de rendu : nom de composant → fonction de rendu ────
const COMPONENT_RENDERERS = {
  hero: renderHero,
  services: renderServices,
  about: renderAbout,
  gallery: renderGallery,
  process: renderProcess,
  before_after: renderBeforeAfter,
  testimonials: renderTestimonials,
  faq: renderFAQ,
  cta_banner: renderCTABanner,
  contact: renderContact,
  footer: renderFooter,
};

function renderComponents(componentNames, siteData) {
  return componentNames
    .filter(name => name !== 'nav')
    .map(name => {
      const renderer = COMPONENT_RENDERERS[name];
      if (!renderer) {
        console.warn(`[RENDER] Aucun renderer pour le composant "${name}", ignoré`);
        return '';
      }
      return renderer(siteData);
    })
    .filter(Boolean)
    .join('\n\n');
}

// ══════════════════════════════════════════════════════════
//  FONCTION PRINCIPALE — renderSite(siteData) → HTML complet
// ══════════════════════════════════════════════════════════
export function renderSite(siteData) {
  const { site, pages, legal, seo } = siteData;

  if (!site?.template) throw new Error('Aucun template spécifié dans les données du site');

  let baseHTML = loadTemplate(site.template);

  const homePage = pages?.home || {};
  const componentsHTML = homePage.components
    ? renderComponents(homePage.components, siteData)
    : '';

  const themeCSS = buildDynamicCSS(site);
  const seoTags = buildSEOTags(seo, site);

  const navLinksHTML = renderNavLinks(homePage.nav);
  const navCTAHTML   = renderNavCTA(homePage.nav);
  const logoHTML     = renderLogo(site);

  const legalHTML  = buildLegalFooter(legal);
  const rgpdHTML   = buildRGPDBanner();
  const badgeHTML  = buildCreazioBadge(site.show_badge !== false);

  let finalHTML = baseHTML
    .replace('<!-- CREAZIO:THEME -->', themeCSS)
    .replace('<!-- CREAZIO:SEO -->', seoTags)
    .replace('<!-- CREAZIO:TITLE -->', escapeHTML(seo?.title || site?.name || 'Mon site'))
    .replace('<!-- CREAZIO:LOGO -->', logoHTML)
    .replace('<!-- CREAZIO:NAVLINKS -->', navLinksHTML)
    .replace('<!-- CREAZIO:NAVCTA -->', navCTAHTML)
    .replace('<!-- CREAZIO:COMPONENTS -->', componentsHTML)
    .replace('<!-- CREAZIO:LEGAL -->', legalHTML)
    .replace('<!-- CREAZIO:RGPD -->', rgpdHTML)
    .replace('<!-- CREAZIO:BADGE -->', badgeHTML);

  // ⚠️ FRONTEND_API_URL doit pointer vers le BACKEND (Render), pas le
  // frontend Créazio — c'est l'URL que le formulaire de contact des
  // sites générés utilise pour envoyer les messages. Un fallback en
  // dur est fourni pour que les sites continuent de fonctionner même
  // si la variable n'est pas définie sur Render.
  const backendApiUrl = process.env.FRONTEND_API_URL || process.env.BACKEND_URL || 'https://creazio-backend.onrender.com';
  finalHTML = injectData(finalHTML, siteData, { 'site.api_url': backendApiUrl });

  return finalHTML;
}

export default { renderSite, injectData, buildDynamicCSS };
