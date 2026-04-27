export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang, urgence } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  const LANG = {
    fr: 'Rédige UNIQUEMENT en français.',
    en: 'Write ONLY in English.',
    es: 'Redacta ÚNICAMENTE en español.',
    de: 'Schreibe AUSSCHLIESSLICH auf Deutsch.',
  };

  const URGENCE = {
    rapide: 'Vente urgente — mets en avant le prix attractif et la disponibilité immédiate.',
    optimise: 'Maximise la valeur perçue pour justifier le prix demandé.',
    normal: 'Ton professionnel et équilibré.'
  };

  const l = LANG[lang] || LANG.fr;
  const u = URGENCE[urgence] || URGENCE.normal;

  const promptLong = `${l} ${u}

Tu es expert en rédaction d'annonces de vente (LeBonCoin, Vinted, etc).

Article à vendre :
${specs}

Rédige une annonce complète avec ces sections exactes :

TITRE: [max 70 caractères, accrocheur]
ACCROCHE: [1-2 phrases percutantes]
DESCRIPTION: [3-4 phrases sur l'état et le contexte]
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

Règles : minimaliste, structuré, professionnel, sans bullshit.`;

  const promptCourt = `${l} Rédige une annonce COURTE (5 lignes max) pour : ${(specs||'').slice(0,300)}. Format : titre + 3 points clés + prix + contact.`;

  async function callGemini(prompt, tokens) {
    // Essaie plusieurs modèles dans l'ordre
    const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: tokens, temperature: 0.7 }
          })
        });
        const data = await resp.json();
        if (data?.error?.code === 429) continue; // quota dépassé, essaie le suivant
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      } catch(e) {
        console.error('Model', model, 'failed:', e.message);
      }
    }
    throw new Error('Tous les modèles ont échoué');
  }

  try {
    const [long, short] = await Promise.all([
      callGemini(promptLong, 1200),
      callGemini(promptCourt, 300)
    ]);
    res.status(200).json({ long, short });
  } catch(e) {
    console.error('Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
