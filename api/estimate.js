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

Réponds UNIQUEMENT en JSON avec ce format exact, sans texte avant ni après :
{"low": 8500, "mid": 10200, "high": 11800, "note": "Explication courte du raisonnement et de l'impact des défauts sur le prix."}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await resp.json();
    const text = data?.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.status(200).json(result);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
