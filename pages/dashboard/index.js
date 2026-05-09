import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateAnnonce(specs, lang = 'fr', urgence = 'normal', categorie = 'article') {
  const URGENCE_PROMPT = {
    rapide: 'VENTE URGENTE : mets en avant la disponibilite immediate, propose un prix attractif, insiste sur la simplicite de la transaction.',
    optimise: 'MAXIMISER LE PRIX : valorise au maximum chaque aspect, justifie le prix par la qualite, cible les acheteurs serieux prets a payer le juste prix.',
    normal: 'Tone professionnel et equilibre, honnete sur les points forts et les defauts.',
  }

  const CATEGORIE_PROMPT = {
    Voiture: 'Pour une annonce de vehicule, mets en avant: historique entretien, CT, nb proprietaires, consommation, options cles, fiabilite du modele.',
    Telephone: 'Pour un telephone, specifie: etat de la batterie, presence de la boite, debloque ou non, eventuels accessoires, garantie restante.',
    Informatique: 'Pour du materiel informatique, detaille: specs techniques (CPU, RAM, stockage), sante batterie, compatibilite logiciels, accessoires inclus.',
    Mobilier: 'Pour du mobilier, precise: dimensions exactes, matiere, facilite de montage/demontage, etat des fixations, presence des instructions.',
    Electromenager: 'Pour de l\'electromenager, mentionne: consommation energetique, age, frequence d\'utilisation, etat joint/bac, dimensions.',
    Vetements: 'Pour des vetements, precise: tableau des tailles, matiere, entretien, frequence de port, marque visible ou non.',
    'Jeux video': 'Pour des jeux video, detaille: plateforme, region, etat du boitier et du disque, presence de la notice et de tous les DLC.',
    Sport: 'Pour du materiel sportif, specifie: taille/pointure adaptee, niveau pratique vise, usure des parties cles, accessoires inclus.',
    Autre: 'Adapte le ton et les details au type d\'objet specifique.',
  }

  const catPrompt = CATEGORIE_PROMPT[categorie] || CATEGORIE_PROMPT.Autre

  const prompt = `Tu es un expert en redaction d'annonces LeBonCoin et Vinted qui genere des annonces qui VENDENT.
Contexte categorie: ${catPrompt}
Instruction urgence: ${URGENCE_PROMPT[urgence] || URGENCE_PROMPT.normal}

Donnees de l'article:
${specs}

REGLES IMPORTANTES:
- Redige en francais naturel, chaleureux mais professionnel
- Sois TRES specifique avec les details techniques
- Le titre doit etre optimise pour les recherches (mots-cles importants en premier)
- La description doit donner envie de contacter immediatement
- Sois honnete sur les defauts (ca rassure les acheteurs et evite les problemes)
- Adapte le vocabulaire a la categorie de l'objet
- Le prix conseille doit etre realiste par rapport au marche actuel

Genere l'annonce avec EXACTEMENT ces sections:

TITRE: [Titre optimise max 70 caracteres, avec marque, modele, caracteristique cle]

ACCROCHE: [1-2 phrases qui donnent envie de lire la suite]

DESCRIPTION: [3-5 paragraphes detailles, fluides, qui valorisent l'article sans mentir]

POINTS FORTS:
- [Point fort 1 - sois tres specifique]
- [Point fort 2]
- [Point fort 3]
- [Point fort 4 si applicable]

CARACTERISTIQUES TECHNIQUES:
- [Spec 1 : valeur]
- [Spec 2 : valeur]
[Continue selon la categorie]

TRANSPARENCE: [Defauts honnetes mentionnes de facon non alarmante]

INFOS PRATIQUES: [Localisation, disponibilite, mode de contact prefere, remise en main propre ou envoi]

PRIX CONSEILLE: [Fourchette realiste avec justification courte]

VERSION COURTE (Facebook/SMS/WhatsApp):
[5-7 lignes max, direct, avec emoji si pertinent, pour copier-coller rapidement]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function generateReponse(messageAcheteur, contexte = '', annonceData = null) {
  // Construire le contexte complet depuis les données de l'annonce
  let annonceContext = ''
  if (annonceData && annonceData.inputData) {
    const d = annonceData.inputData
    const infos = Object.entries(d)
      .filter(([k, v]) => v && v !== 'Non applicable' && v !== 'Non' && k !== 'urgence')
      .map(([k, v]) => k + ': ' + v)
      .join('\n')

    annonceContext = `
INFORMATIONS COMPLETES SUR L'ARTICLE EN VENTE:
Titre de l'annonce: ${annonceData.titre || ''}
${infos}

REGLES IMPORTANTES pour la reponse:
- Tu connais TOUTES les infos sur cet article grace au contexte ci-dessus
- Utilise ces infos pour repondre PRECISEMENT sans demander a l'acheteur de repreciser
- Si l'acheteur pose une question sur une info presente dans le contexte, reponds directement
- Ne dis jamais "je ne sais pas" si l'info est dans le contexte
- Adapte le prix de negociation selon si "negociable: Oui/Non/Legerement" est specifie
`
  }

  const prompt = `Tu es un expert en vente entre particuliers et en negociation.

MESSAGE DE L'ACHETEUR:
"${messageAcheteur}"

${annonceContext}
${!annonceContext && contexte ? 'Contexte additionnel:\n' + contexte : ''}

INSTRUCTIONS:
1. Analyse le message: l'acheteur est-il serieux, curieux, ou en train de negocier ?
2. Reponds directement et precisement en utilisant toutes les infos disponibles
3. Sois chaleureux mais professionnel
4. Si une info cle manque dans le contexte, tu peux la laisser vide ou la formuler de facon ouverte

Genere EXACTEMENT:

REPONSE: [Reponse complete, chaleureuse, prete a copier-coller sans aucune modification. 4-8 lignes maximum. Repond directement a toutes les questions posees.]

SUGGESTION NEGOCIATION: [Conseil strategique en 1-2 phrases pour le vendeur - pas visible par l'acheteur]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
  return msg.content[0].text
}

export async function estimatePrix(specs) {
  const prompt = `Tu es un expert en estimation de prix sur le marche de l'occasion en France (LeBonCoin, Vinted, Facebook Marketplace).

REGLE ABSOLUE: Tu DOIS toujours fournir une estimation numerique, meme si:
- Le produit est tres recent ou pas encore sorti
- Tu n'as pas de donnees exactes
- L'article est rare ou inhabituel
Dans ce cas, base-toi sur la gamme, le prix neuf probable, les modeles similaires, et la logique du marche de l'occasion.

Article a estimer:
${specs.slice(0, 800)}

Reponds UNIQUEMENT en JSON valide, sans aucun texte avant ou apres:
{"low":0,"mid":0,"high":0,"note":"Methode d'estimation et facteurs pris en compte en 1-2 phrases."}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  })
  const text = msg.content[0].text.trim()
  const match = text.match(/\{[\s\S]*?\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch(e) {}
  }
  return { low: 0, mid: 0, high: 0, note: 'Estimation non disponible pour ce produit.' }
}
