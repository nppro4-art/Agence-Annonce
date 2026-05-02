import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateAnnonce(specs, lang = 'fr', urgence = 'normal') {
  const LANG = { fr: 'en francais', en: 'in English', es: 'en espanol', de: 'auf Deutsch' }
  const URGENCE = {
    rapide: 'Vente urgente, prix attractif, disponibilite immediate.',
    optimise: 'Maximise la valeur percue.',
    normal: 'Ton professionnel et equilibre.'
  }
  const prompt = `Tu es expert en redaction d'annonces LeBonCoin. Redige ${LANG[lang] || 'en francais'}. ${URGENCE[urgence] || ''}

Article :
${specs}

Genere avec ces sections exactes :
TITRE: [max 70 car]
ACCROCHE: [1-2 phrases]
DESCRIPTION: [3-4 phrases]
POINTS FORTS:
- [point 1]
- [point 2]
- [point 3]
CARACTERISTIQUES:
- [spec 1]
TRANSPARENCE: [defauts honnetes]
INFOS PRATIQUES: [localisation, dispo, CTA]
PRIX CONSEILLE: [fourchette realiste]
VERSION COURTE: [5 lignes max pour Facebook/SMS]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function generateReponse(messageAcheteur, contexte = '') {
  const prompt = `Tu es expert en negociation de vente entre particuliers.

Message de l'acheteur : "${messageAcheteur}"
${contexte ? 'Contexte : ' + contexte : ''}

Genere :
REPONSE: [reponse professionnelle prete a copier]
SUGGESTION NEGOCIATION: [conseil strategique]
TON: [analyse du ton de l'acheteur et recommandations]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function estimatePrix(specs) {
  const prompt = `Tu es expert en estimation de prix de produits d'occasion en France.

REGLES IMPORTANTES :
- Tu DOIS toujours fournir une estimation, meme si le produit est recent, recent, peu connu ou dont tu n'as pas de donnees precises.
- Si le produit est tres recent ou inconnu, base ton estimation sur : la gamme probable, les modeles predecesseurs, le prix neuf probable, et la logique de marche.
- Ne refuse JAMAIS d'estimer. Indique juste si c'est une estimation indicative.
- Reponds UNIQUEMENT en JSON valide, rien d'autre.

Article a estimer : ${specs.slice(0, 600)}

Format de reponse JSON strict :
{"low":0,"mid":0,"high":0,"note":"Explication courte de la methode d'estimation utilisee."}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  })
  const text = msg.content[0].text.trim()
  const match = text.match(/\{[\s\S]*?\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch(e) {
      return { low: 0, mid: 0, high: 0, note: 'Estimation non disponible pour ce produit.' }
    }
  }
  return { low: 0, mid: 0, high: 0, note: 'Estimation non disponible pour ce produit.' }
}
