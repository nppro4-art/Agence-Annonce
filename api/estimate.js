export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const prompt = `Tu es un expert en estimation de prix de vente d'occasion en France.
Voici l'article : ${specs}
Donne une fourchette de prix réaliste pour LeBonCoin.
Réponds avec UNIQUEMENT ce JSON sur une seule ligne :
{"low":8000,"mid":10000,"high":12000,"note":"Raison courte."}`;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.1 }
      })
    });

    const data = await resp.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('Pas de JSON: ' + text.slice(0, 100));
    res.status(200).json(JSON.parse(match[0]));

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
