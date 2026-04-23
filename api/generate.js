export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang, type, urgence } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const LANG = { fr:'en français', en:'in English', es:'en español', de:'auf Deutsch', it:'in italiano' };
  const URGENCE = {
    rapide: 'Vente urgente, mets en avant le prix attractif.',
    optimise: 'Maximise la valeur perçue pour justifier le prix.',
    normal: 'Ton équilibré, professionnel et crédible.'
  };

  async function call(prompt, tokens) {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: tokens, temperature: 0.7 }
      })
    });
    const d = await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  const promptLong = `Tu es expert en copywriting d'annonces LeBonCoin. Rédige ${LANG[lang] || 'en français'}. ${URGENCE[urgence] || ''}

Informations de l'article :
${specs}

Génère une annonce complète avec ces sections dans cet ordre :
TITRE: [max 70 caractères, accrocheur]
ACCROCHE: [1-2 lignes percutantes]
DESCRIPTION: [3-4 phrases sur l'état, contexte, historique]
POINTS FORTS:
• [point 1]
• [point 2]
• [point 3]
• [point 4]
CARACTÉRISTIQUES:
• [spec 1]
• [spec 2]
TRANSPARENCE: [défauts honnêtes]
INFOS PRATIQUES: [localisation, dispo, call to action]

Règles : pas de bullshit, minimaliste, structuré, professionnel.`;

  const promptCourt = `Rédige ${LANG[lang] || 'en français'} une annonce courte (5 lignes max) pour : ${specs}
Format : titre + 3 points clés + prix + contact. Zéro fioriture.`;

  try {
    const [long, short] = await Promise.all([
      call(promptLong, 1200),
      call(promptCourt, 300)
    ]);
    res.status(200).json({ long, short });
  } catch (e) {
    console.error('Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
