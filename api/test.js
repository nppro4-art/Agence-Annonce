export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    return res.status(200).json({ 
      status: 'ERREUR',
      message: 'GEMINI_API_KEY est vide ou non définie sur Vercel'
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Dis juste: OK' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const error = data?.error?.message || null;
    
    res.status(200).json({ 
      status: resp.ok ? 'OK' : 'ERREUR HTTP ' + resp.status,
      reponse: text || '(vide)',
      erreur_gemini: error,
      cle_presente: '✅ Clé détectée (' + API_KEY.slice(0,8) + '...)'
    });
  } catch(e) {
    res.status(200).json({ status: 'ERREUR', message: e.message });
  }
}
