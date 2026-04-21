export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;

  const prompt = `Tu es un expert automobile français spécialisé dans la cote des véhicules d'occasion.

Voici toutes les informations du véhicule, y compris les défauts et problèmes connus :
${specs}

Analyse ces informations et donne une estimation réaliste de la valeur marchande sur le marché français actuel (LeBonCoin, La Centrale), en tenant compte de tous les défauts signalés et de leur impact sur le prix.

Réponds UNIQUEMENT en JSON avec ce format exact, sans texte avant ni après, sans balises markdown :
{"low": 8500, "mid": 10200, "high": 11800, "note": "Explication courte du raisonnement et de l'impact des défauts sur le prix."}`;

  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.2 }
      })
    });

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.status(200).json(result);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
