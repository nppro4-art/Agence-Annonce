export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang } = req.body;

  const LANG_PROMPTS = {
    fr: 'Tu es un expert en rédaction d\'annonces automobiles sur LeBonCoin. Rédige en français.',
    en: 'You are an expert in writing car listings. Write in English.',
    es: 'Eres un experto en redacción de anuncios de coches. Redacta en español.',
    de: 'Du bist Experte für Fahrzeugverkaufsanzeigen. Schreibe auf Deutsch.',
    it: 'Sei un esperto nella redazione di annunci auto. Scrivi in italiano.'
  };

  const promptLong = `${LANG_PROMPTS[lang] || LANG_PROMPTS.fr}

Voici les informations du véhicule :
${specs}

Génère une annonce LeBonCoin complète et professionnelle avec :
1. TITRE : accrocheur, max 70 caractères
2. DESCRIPTION : 300-400 mots, convaincante, valorise le véhicule, honnête sur les défauts
3. POINTS FORTS : liste de 4-5 bullet points
4. CONSEIL PRIX : analyse honnête du prix par rapport au marché
5. CONCLUSION : phrase engageante pour inviter à contacter

Formate ta réponse avec ces sections clairement séparées.`;

  const promptCourt = `${LANG_PROMPTS[lang] || LANG_PROMPTS.fr}

Voici les informations du véhicule :
${specs}

Génère une version COURTE de l'annonce (max 5 lignes) : titre + description condensée percutante. Idéal pour Facebook Marketplace ou SMS.`;

  try {
    const [respLong, respCourt] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: promptLong }]
        })
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: promptCourt }]
        })
      })
    ]);

    const dataLong = await respLong.json();
    const dataCourt = await respCourt.json();

    res.status(200).json({
      long: dataLong?.content?.[0]?.text || 'Erreur de génération.',
      short: dataCourt?.content?.[0]?.text || 'Erreur de génération.'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
