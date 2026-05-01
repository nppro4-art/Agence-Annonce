import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateAnnonce(specs, lang = 'fr', urgence = 'normal') {
  const LANG = { fr: 'en français', en: 'in English', es: 'en español', de: 'auf Deutsch' }
  const URGENCE = {
    rapide: 'Vente urgente, prix attractif, disponibilité immédiate.',
    optimise: 'Maximise la valeur perçue.',
    normal: 'Ton professionnel et équilibré.'
  }
  const prompt = `Tu es expert en rédaction d'annonces LeBonCoin. Rédige ${LANG[lang] || 'en français'}. ${URGENCE[urgence] || ''}

Article :
${specs}

Génère avec ces sections exactes :
TITRE: [max 70 car]
ACCROCHE: [1-2 phrases]
DESCRIPTION: [3-4 phrases]
POINTS FORTS:
• [point 1]
• [point 2]
• [point 3]
CARACTÉRISTIQUES:
• [spec 1]
TRANSPARENCE: [défauts honnêtes]
INFOS PRATIQUES: [localisation, dispo, CTA]
PRIX CONSEILLÉ: [fourchette réaliste]
VERSION COURTE: [5 lignes max pour Facebook/SMS]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function generateReponse(messageAcheteur, contexte = '') {
  const prompt = `Tu es expert en négociation de vente entre particuliers.

Message de l'acheteur : "${messageAcheteur}"
${contexte ? 'Contexte : ' + contexte : ''}

Génère :
RÉPONSE: [réponse professionnelle prête à copier]
SUGGESTION NÉGOCIATION: [conseil stratégique]
TON: [analyse du ton de l'acheteur]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function estimatePrix(specs) {
  const prompt = `Expert en estimation de prix d'occasion en France.

Article : ${specs.slice(0, 500)}

Réponds UNIQUEMENT en JSON :
{"low":8000,"mid":10000,"high":12000,"note":"Explication courte."}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  })
  const text = msg.content[0].text.trim()
  const match = text.match(/\{[\s\S]*?\}/)
  return match ? JSON.parse(match[0]) : { low: 0, mid: 0, high: 0, note: 'Erreur' }
}
