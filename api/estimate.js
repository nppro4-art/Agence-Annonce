export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  const prompt = `Tu es expert en estimation de prix de vente d'occasion en France.

Article : ${(specs||'').slice(0,400)}

Réponds UNIQUEMENT avec ce JSON sur une seule ligne sans rien d'autre :
{"low":8000,"mid":10000,"high":12000,"note":"Explication courte."}`;

  const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0 }
        })
      });
      const data = await resp.json();
      if (data?.error?.code === 429) continue;
      const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) continue;
      const match = text.match(/\{[\s\S]*?\}/);
      if (!match) continue;
      const result = JSON.parse(match[0]);
      if (result.low && result.mid && result.high) {
        return res.status(200).json(result);
      }
    } catch(e) {
      console.error('Model', model, 'failed:', e.message);
    }
  }

  console.error('Estimate error: all models failed');
  res.status(500).json({ error: 'Estimation impossible' });
}
