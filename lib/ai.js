import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Nettoyer le markdown et les caractères parasites des réponses IA
function clean(text) {
  if (!text) return ''
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6} /g, '')
    .replace(/`{1,3}/g, '')
    .replace(/_{2}/g, '')
    .replace(/\"/g, '"')
    .replace(/\"/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .trim()
}

export async function generateAnnonce(specs, lang = 'fr', urgence = 'normal', categorie = 'article', chatBotMention = null) {
  const URGENCE_PROMPT = {
    rapide: 'VENTE URGENTE : mets en avant la disponibilite immediate, propose un prix attractif.',
    optimise: 'MAXIMISER LE PRIX : valorise au maximum chaque aspect, justifie le prix par la qualite.',
    normal: 'Ton professionnel et equilibre, honnete sur les points forts et les defauts.',
  }

  const CATEGORIE_PROMPT = {
    Voiture: 'Pour un vehicule, mets en avant: historique entretien, CT, nb proprietaires, consommation, options cles.',
    Telephone: 'Pour un telephone, specifie: sante batterie, boite incluse, debloque ou non, accessoires.',
    Informatique: 'Pour du materiel informatique, detaille: specs techniques, sante batterie, compatibilite, accessoires.',
    Mobilier: 'Pour du mobilier, precise: dimensions exactes, matiere, demontable ou non, etat des fixations.',
    Electromenager: 'Pour de electromenager, mentionne: consommation energetique, age, frequence utilisation, dimensions.',
    Vetements: 'Pour des vetements, precise: tableau des tailles, matiere, entretien, frequence de port.',
    'Jeux video': 'Pour des jeux video, detaille: plateforme, region, etat du boitier et du disque, DLC inclus.',
    Sport: 'Pour du materiel sportif, specifie: taille adaptee, niveau pratique vise, usure des parties cles.',
    Bijoux: 'Pour des bijoux, precise: matiere exacte, poids, certificat authenticite, etat du fermoir.',
    Autre: 'Adapte le ton et les details au type objet specifique.',
  }

  const catPrompt = CATEGORIE_PROMPT[categorie] || CATEGORIE_PROMPT.Autre

  const prompt = `Tu es un expert en redaction d'annonces LeBonCoin et Vinted.
Contexte categorie: ${catPrompt}
Instruction urgence: ${URGENCE_PROMPT[urgence] || URGENCE_PROMPT.normal}

REGLES DE FORMATAGE STRICTES:
- Ecris du texte brut uniquement, sans aucun markdown
- Pas d'asterisques, pas de dièses, pas de guillemets typographiques
- Pas de gras, pas d'italique, pas de titres avec #
- Juste du texte naturel avec des tirets simples pour les listes
- Corrige TOUTES les fautes d'orthographe, de grammaire et d'accord
- Utilise un français parfait, naturel et professionnel
- Reformule les phrases maladroites pour qu'elles sonnent naturellement

Donnees de l'article:
${specs}

Genere l'annonce avec ces sections en texte brut:

TITRE: [max 70 caracteres, marque + modele + caracteristique cle]

ACCROCHE: [1-2 phrases qui donnent envie de lire]

DESCRIPTION: [3-5 paragraphes detailles et naturels]

POINTS FORTS:
- [point 1]
- [point 2]
- [point 3]
- [point 4]

CARACTERISTIQUES:
- [spec: valeur]
- [spec: valeur]

TRANSPARENCE: [defauts honnetes mentionnes simplement]

INFOS PRATIQUES: [localisation, disponibilite, mode de contact]

PRIX CONSEILLE: [fourchette realiste avec courte justification]

VERSION COURTE:
[5-7 lignes max pour Facebook ou SMS, sans emoji sauf si pertinent]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })
  return clean(msg.content[0].text)
}

export async function generateReponse(messageAcheteur, contexte = '', annonceData = null) {
  let annonceContext = ''
  if (annonceData && annonceData.inputData) {
    const d = annonceData.inputData
    const infos = Object.entries(d)
      .filter(([k, v]) => v && v !== 'Non applicable' && v !== 'Non' && k !== 'urgence')
      .map(([k, v]) => k + ': ' + v)
      .join('\n')

    annonceContext = `
INFORMATIONS COMPLETES SUR L'ARTICLE EN VENTE:
Titre: ${annonceData.titre || ''}
${infos}

Tu connais toutes les infos sur cet article. Utilise-les pour repondre precisement.
Si l'acheteur pose une question dont la reponse est dans le contexte, reponds directement.
`
  }

  const prompt = `Tu es un expert en vente entre particuliers.

MESSAGE DE L'ACHETEUR:
"${messageAcheteur}"

${annonceContext}
${!annonceContext && contexte ? 'Contexte: ' + contexte : ''}

REGLES DE FORMATAGE STRICTES:
- Ecris du texte brut uniquement
- Pas d'asterisques, pas de markdown, pas de guillemets typographiques
- Juste du texte naturel pret a copier-coller

Genere:

REPONSE: [Reponse complete prete a copier. 4-8 lignes. Chaleureuse et professionnelle.]

SUGGESTION NEGOCIATION: [Conseil en 1-2 phrases pour le vendeur uniquement]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
  return clean(msg.content[0].text)
}

export async function estimatePrix(specs) {
  const prompt = `Tu es un expert en estimation de prix sur le marche de l'occasion en France.

REGLE ABSOLUE: Tu DOIS toujours fournir une estimation numerique.
Si le produit est recent ou peu connu, base-toi sur la gamme, le prix neuf probable et les modeles similaires.

Article: ${specs.slice(0, 800)}

Reponds UNIQUEMENT en JSON valide, sans aucun texte avant ou apres, sans markdown:
{"low":0,"mid":0,"high":0,"note":"Methode estimation en 1-2 phrases simples sans formatage."}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = msg.content[0].text.trim()
  const match = text.match(/\{[\s\S]*?\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed.note) parsed.note = clean(parsed.note)
      return parsed
    } catch(e) {}
  }
  return { low: 0, mid: 0, high: 0, note: 'Estimation non disponible pour ce produit.' }
}
