export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + API_KEY;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Estime le prix occasion France pour : ' + specs.slice(0, 400) + '. Reponds UNIQUEMENT avec ce JSON sans rien dautre : {"low":5000,"mid":7000,"high":9000,"note":"raison courte"}' }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0 }
      })
    });

    const data = await resp.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON: [' + text + ']');
    res.status(200).json(JSON.parse(match[0]));

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
