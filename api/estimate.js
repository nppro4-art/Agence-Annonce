generateContentefault async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs } = req.body;

  const prompt = `Tu es un expert en estimation de prix de vente d'occasion en France.

Article à estimer :
${specs}

Réponds uniquement avec un objet JSON valide sur une seule ligne, sans markdown, sans explication :
{"low":8000,"mid":10000,"high":12000,"note":"Explication courte ici."}`;

  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generteContentContent?key=${API_KEY}`;

  try {
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.1
        }
      })
    });

    const data = await resp.json();
    
    // Log pour debug
    console.log('Gemini raw:', JSON.stringify(data?.candidates?.[0]?.content));

    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    
    if (!text) throw new Error('Gemini a renvoyé une réponse vide. Raison: ' + JSON.stringify(data?.promptFeedback || data?.candidates?.[0]?.finishReason));

    // Extraction robuste du JSON
    const match = text.match(/\{[^{}]+\}/);
    if (!match) throw new Error('Aucun JSON trouvé dans: ' + text.slice(0, 200));

    const result = JSON.parse(match[0]);
    
    if (!result.low || !result.mid || !result.high) throw new Error('JSON incomplet: ' + match[0]);

    res.status(200).json(result);

  } catch (e) {
    console.error('Estimate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
