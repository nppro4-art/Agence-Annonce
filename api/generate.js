export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { specs, lang, type, urgence } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const LANG_INSTRUCTIONS = {
    fr: 'Tu dois rédiger UNIQUEMENT en français. Toute la réponse doit être en français.',
    en: 'You MUST write ONLY in English. The entire response must be in English.',
    es: 'Debes escribir ÚNICAMENTE en español. Toda la respuesta debe estar en español.',
    de: 'Du musst AUSSCHLIESSLICH auf Deutsch schreiben. Die gesamte Antwort muss auf Deutsch sein.',
  };

  const URGENCE_HINTS = {
    rapide: { fr:'Vente urgente — mets en avant le prix attractif et la disponibilité immédiate.', en:'Urgent sale — emphasize the attractive price and immediate availability.', es:'Venta urgente — destaca el precio atractivo y disponibilidad inmediata.', de:'Dringender Verkauf — betone den attraktiven Preis und sofortige Verfügbarkeit.' },
    optimise: { fr:'Maximise la valeur perçue pour justifier le prix demandé.', en:'Maximize the perceived value to justify the asking price.', es:'Maximiza el valor percibido para justificar el precio pedido.', de:'Maximiere den wahrgenommenen Wert um den Preis zu rechtfertigen.' },
    normal: { fr:'Ton professionnel et équilibré.', en:'Professional and balanced tone.', es:'Tono profesional y equilibrado.', de:'Professioneller und ausgewogener Ton.' }
  };

  const SECTION_LABELS = {
    fr: { titre:'TITRE', accroche:'ACCROCHE', desc:'DESCRIPTION', points:'POINTS FORTS', carac:'CARACTÉRISTIQUES', transp:'TRANSPARENCE', infos:'INFOS PRATIQUES' },
    en: { titre:'TITLE', accroche:'HOOK', desc:'DESCRIPTION', points:'KEY STRENGTHS', carac:'SPECIFICATIONS', transp:'TRANSPARENCY', infos:'PRACTICAL INFO' },
    es: { titre:'TÍTULO', accroche:'GANCHO', desc:'DESCRIPCIÓN', points:'PUNTOS FUERTES', carac:'CARACTERÍSTICAS', transp:'TRANSPARENCIA', infos:'INFORMACIÓN PRÁCTICA' },
    de: { titre:'TITEL', accroche:'AUFHÄNGER', desc:'BESCHREIBUNG', points:'STÄRKEN', carac:'EIGENSCHAFTEN', transp:'TRANSPARENZ', infos:'PRAKTISCHE INFOS' },
  };

  const l = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.fr;
  const u = (URGENCE_HINTS[urgence] || URGENCE_HINTS.normal)[lang] || (URGENCE_HINTS[urgence] || URGENCE_HINTS.normal).fr;
  const labels = SECTION_LABELS[lang] || SECTION_LABELS.fr;

  async function call(prompt, tokens) {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: tokens, temperature: 0.7 }
      })
    });
    const d = await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  const promptLong = `${l}
${u}

Tu es expert en copywriting d'annonces de vente en ligne (LeBonCoin, Vinted, etc).

Informations de l'article à vendre :
${specs}

Génère une annonce complète avec ces sections dans cet ordre (utilise exactement ces labels) :

${labels.titre}: [max 70 caractères, accrocheur, optimisé recherche]
${labels.accroche}: [1-2 phrases percutantes qui donnent envie]
${labels.desc}: [3-4 phrases sur l'état, contexte, historique]
${labels.points}:
• [point 1]
• [point 2]
• [point 3]
• [point 4]
${labels.carac}:
• [spec 1]
• [spec 2]
${labels.transp}: [défauts honnêtes — l'honnêteté inspire confiance]
${labels.infos}: [localisation, disponibilité, call to action]

Règles absolues : minimaliste, structuré, professionnel, zéro bullshit.`;

  const promptCourt = `${l}

Rédige une annonce COURTE (5 lignes max) pour cet article : ${specs.slice(0, 400)}
Format : titre + 3 points clés + prix + contact. Zéro fioriture.`;

  try {
    const [long, short] = await Promise.all([
      call(promptLong, 1200),
      call(promptCourt, 300)
    ]);
    res.status(200).json({ long, short });
  } catch (e) {
    console.error('Generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
