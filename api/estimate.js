export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;

  const prompt = `Tu es un expert automobile français spécialisé dans la cote des véhicules d'occasion.

Voici les informations de l'article :
${specs}

Donne une estimation réaliste de la valeur marchande sur le marché français actuel.

Réponds UNIQUEMENT avec ce JSON, rien d'autre, pas de texte avant, pas de texte après, pas de balises markdown :
{"low": 8500, "mid": 10200, "high": 11800, "note": "Explication courte."}`;

  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          maxOutputTokens: 200, 
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const clean = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Pas de JSON trouvé dans: ' + clean);
    
    const result = JSON.parse(match[0]);
    res.status(200).json(result);

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: 'Erreur serveur: ' + e.message });
  }
}
