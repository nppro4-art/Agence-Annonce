export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Estime le prix de vente occasion en France pour cet article : ${specs.slice(0, 300)}. Réponds SEULEMENT avec ce JSON : {"low":5000,"mid":7000,"high":9000,"note":"raison"}`
          }]
        }],
        generationConfig: { maxOutputTokens: 100, temperature: 0 }
      })
    });

    const data = await resp.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    console.log('TEXT:', text);

    const match = text.match(/\{.*\}/s);
    if (!match) throw new Error('Pas de JSON: [' + text + ']');

    res.status(200).json(JSON.parse(match[0]));

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
