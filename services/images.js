/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  IMAGES — Recherche automatique via Unsplash                 ║
 * ║                                                                ║
 * ║  Utilisé à la génération d'un site : remplit les champs       ║
 * ║  image_url / background_image (laissés à `null` par l'IA)     ║
 * ║  avec de vraies photos correspondant au secteur/contenu.       ║
 * ║                                                                ║
 * ║  ⚠️ Attribution obligatoire (conditions Unsplash) : chaque     ║
 * ║  image renvoyée inclut le nom du photographe + lien profil,    ║
 * ║  affichés discrètement par le moteur de rendu.                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import fetch from 'node-fetch';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com';

// ── Cache mémoire simple ─────────────────────────────────────
// Évite de re-requêter Unsplash pour la même recherche pendant
// la durée de vie du process (utile en cas de génération multiple
// avec des requêtes similaires, ex: "boulangerie pain artisanal").
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

/**
 * Recherche une image sur Unsplash correspondant à une requête.
 *
 * @param {string} query - termes de recherche (ex: "boulangerie artisanale pain")
 * @param {object} opts
 * @param {string} [opts.orientation] - 'landscape' | 'portrait' | 'squarish'
 * @returns {Promise<{url: string, alt: string, photographer: string, photographer_url: string, unsplash_url: string} | null>}
 */
export async function searchUnsplashImage(query, opts = {}) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[IMAGES] UNSPLASH_ACCESS_KEY non configurée — images laissées vides');
    return null;
  }
  if (!query) return null;

  const orientation = opts.orientation || 'landscape';
  const cacheKey = `${query.toLowerCase()}|${orientation}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    if (!res.ok) {
      console.warn(`[IMAGES] Unsplash a renvoyé ${res.status} pour "${query}"`);
      return null;
    }

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    const result = {
      url: photo.urls?.regular || photo.urls?.full,
      alt: photo.alt_description || query,
      photographer: photo.user?.name || 'Photographe Unsplash',
      photographer_url: photo.user?.links?.html
        ? `${photo.user.links.html}?utm_source=creazio&utm_medium=referral`
        : 'https://unsplash.com',
      unsplash_url: 'https://unsplash.com/?utm_source=creazio&utm_medium=referral',
    };

    cache.set(cacheKey, { value: result, time: Date.now() });

    // Déclencher le tracking de téléchargement requis par Unsplash
    // (ne bloque pas la réponse — best effort)
    if (photo.links?.download_location) {
      fetch(`${photo.links.download_location}?client_id=${UNSPLASH_ACCESS_KEY}`).catch(() => {});
    }

    return result;
  } catch (err) {
    console.warn(`[IMAGES] Erreur recherche Unsplash pour "${query}" :`, err.message);
    return null;
  }
}

/**
 * Parcourt un site_data généré par l'IA et remplit automatiquement
 * tous les champs image laissés à `null` (hero, about, gallery)
 * avec des photos Unsplash pertinentes.
 *
 * Construit la requête de recherche à partir de :
 * - le secteur du site (site.sector)
 * - le champ "alt" fourni par l'IA pour chaque image (description)
 *
 * @param {object} siteData - JSON généré par Claude
 * @returns {Promise<object>} le même objet, avec les images remplies
 */
export async function fillSiteImages(siteData) {
  if (!UNSPLASH_ACCESS_KEY) return siteData; // pas de clé → on laisse les fallbacks dégradés

  const sector = siteData?.site?.sector || '';
  const home = siteData?.pages?.home;
  if (!home) return siteData;

  const tasks = [];

  // ── Hero (image de fond, format paysage) ──────────────────
  if (home.hero && !home.hero.background_image) {
    const query = buildQuery(sector, home.hero.title, home.hero.subtitle);
    tasks.push(
      searchUnsplashImage(query, { orientation: 'landscape' }).then(img => {
        if (img) {
          home.hero.background_image = img.url;
          home.hero.background_image_credit = creditString(img);
        }
      })
    );
  }

  // ── About (image portrait/4:5) ─────────────────────────────
  if (home.about && !home.about.image_url) {
    const query = buildQuery(sector, home.about.title, 'atelier équipe métier');
    tasks.push(
      searchUnsplashImage(query, { orientation: 'portrait' }).then(img => {
        if (img) {
          home.about.image_url = img.url;
          home.about.image_credit = creditString(img);
        }
      })
    );
  }

  // ── Galerie (carrousel d'images, formats variés) ───────────
  if (Array.isArray(home.gallery?.images)) {
    home.gallery.images.forEach((image, i) => {
      if (image.url) return; // déjà fourni, ne pas écraser
      const query = buildQuery(sector, image.alt);
      const orientation = i % 3 === 0 ? 'portrait' : 'landscape';
      tasks.push(
        searchUnsplashImage(query, { orientation }).then(img => {
          if (img) {
            image.url = img.url;
            image.credit = creditString(img);
          }
        })
      );
    });
  }

  // Toutes les recherches en parallèle — best effort, n'importe
  // quel échec individuel n'empêche pas la génération du site.
  await Promise.allSettled(tasks);

  return siteData;
}

// ── Helpers ──────────────────────────────────────────────────

// Construit une requête de recherche concise à partir du secteur
// et de textes descriptifs (titre, alt, etc.). Limite à ~6 mots
// pour rester pertinent côté Unsplash.
function buildQuery(...parts) {
  const text = parts.filter(Boolean).join(' ');
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôöùûüÿçñ\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  return words.slice(0, 5).join(' ') || 'business professionnel';
}

function creditString(img) {
  return `Photo par ${img.photographer} sur Unsplash`;
}

const STOPWORDS = new Set([
  'les','des','une','un','le','la','de','du','et','pour','avec','vos','votre',
  'notre','nos','est','sont','dans','sur','plus','tout','tous','toute','toutes',
  'qui','que','aux','ces','ses','son','sa','ils','elle','nous','vous','ils',
  'cette','cet','comme','depuis','chez','par','sans','être','avoir','fait',
]);
