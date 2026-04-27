export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang, type, urgence } = req.body;
  const API_KEY = process.env.ANTHROPIC_API_KEY;

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

  const promptCourt = `${l} Rédige une annonce COURTE (5 lignes max) pour : ${(specs || '').slice(0, 300)}. Format : titre + 3 points clés + prix + contact.`;

  async function callClaude(prompt, tokens) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: tokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || 'Erreur API Anthropic ' + resp.status);
    const text = data?.content?.[0]?.text || '';
    if (!text) throw new Error('Réponse vide');
    return text;
  }

  try {
    const [long, short] = await Promise.all([
      callClaude(promptLong, 1200),
      callClaude(promptCourt, 300)
    ]);
    res.status(200).json({ long, short });
  } catch (e) {
    console.error('Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
