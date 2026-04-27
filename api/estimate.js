export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  const prompt = `Tu es expert en estimation de prix de vente d'occasion en France (LeBonCoin, La Centrale).

Article : ${(specs||'').slice(0,500)}

Réponds UNIQUEMENT avec ce JSON sur une seule ligne, sans texte avant ni après :
{"low":8000,"mid":10000,"high":12000,"note":"Explication courte."}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || 'Erreur ' + resp.status);
    const text = (data?.content?.[0]?.text || '').trim();
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('Pas de JSON');
    const result = JSON.parse(match[0]);
    if (!result.low || !result.mid || !result.high) throw new Error('JSON incomplet');
    res.status(200).json(result);
  } catch(e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
