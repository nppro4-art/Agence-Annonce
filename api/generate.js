export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang, type, urgence } = req.body;

  const LANG = {
    fr: 'Rédige en français.',
    en: 'Write in English.',
    es: 'Redacta en español.',
    de: 'Schreibe auf Deutsch.',
    it: 'Scrivi in italiano.'
  };

  const URGENCE_HINT = {
    rapide: 'La vente est urgente. Mets en avant le prix attractif et la disponibilité immédiate.',
    optimise: 'Le vendeur veut maximiser le prix. Mets en valeur chaque point fort pour justifier le prix demandé.',
    normal: 'Vente classique. Équilibre entre attractivité et crédibilité.'
  };

  const promptLong = `Tu es un expert en copywriting et rédaction d'annonces de vente sur LeBonCoin. ${LANG[lang] || LANG.fr}

${URGENCE_HINT[urgence] || URGENCE_HINT.normal}

Voici les informations de l'article à vendre :
${specs}

Génère une annonce professionnelle complète avec EXACTEMENT ces sections dans cet ordre, chacune clairement labellisée :

TITRE: [titre ultra-accrocheur, clair, optimisé pour la recherche, max 70 caractères, avec l'élément le plus attractif]

ACCROCHE: [1-2 lignes directes qui donnent envie, sans bullshit]

DESCRIPTION: [contexte, état global, historique, utilisation — 3-9 phrases claires et précises]

POINTS FORTS:
• [point fort 1]
• [point fort 2]
• [point fort 3]
• [point fort 4]
• [point fort 5 si pertinent]

CARACTÉRISTIQUES:
• [spec technique 1]
• [spec technique 2]
• [etc.]

TRANSPARENCE: [défauts honnêtes mentionnés clairement — l'honnêteté inspire confiance et évite les mauvaises surprises]

INFOS PRATIQUES: [localisation, disponibilité, modalités de visite, livraison si applicable — et call to action]

Règles absolues :
- Pas de phrases vagues
- Pas de texte inutile
- Minimaliste, lisible, structuré, professionnel, crédible`;

  const promptCourt = `Tu es expert en annonces LeBonCoin. ${LANG[lang] || LANG.fr}

Voici l'article :
${specs}

Rédige une version COURTE et percutante (5 lignes max) : titre + accroche + 3 points clés + prix + contact. Idéal pour Facebook Marketplace ou message SMS. Zéro fioriture.`;

  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

  async function callGemini(prompt, tokens = 1200) {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: tokens, temperature: 0.7 }
      })
    });
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Erreur de génération.';
  }

  try {
    const [long, short] = await Promise.all([
      callGemini(promptLong, 1200),
      callGemini(promptCourt, 300)
    ]);
    res.status(200).json({ long, short });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
