import { prisma } from '../../../lib/db'
import { canUseChatbot } from '../../../lib/credits'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function clean(text) {
  if (!text) return ''
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6} /g, '').replace(/`{1,3}/g, '').trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { code, question, history = [] } = req.body
  if (!code || !question) return res.status(400).json({ error: 'Parametres manquants' })

  const bot = await prisma.chatBot.findUnique({
    where: { code },
    include: { user: { select: { plan: true, planKey: true, subStatus: true } } }
  })
  if (!bot || !bot.actif) return res.status(404).json({ error: 'Cet assistant n\'est plus disponible.' })

  // Vérifier la limite chatbot du vendeur
  const plan = bot.user?.planKey || bot.user?.plan || 'free'
  const { allowed, remaining } = await canUseChatbot(bot.userId, plan)

  if (!allowed) {
    return res.status(429).json({
      error: 'Limite atteinte',
      answer: 'Je ne peux plus repondre pour aujourd\'hui. Contactez le vendeur directement.'
    })
  }

  const infos = Object.entries(bot.inputData || {})
    .filter(([, v]) => v && v !== 'Non' && v !== 'Non applicable')
    .map(([k, v]) => k + ': ' + v)
    .join('\n')

  const systemPrompt = `Tu es un assistant vendeur pour l'annonce suivante. Reponds aux questions des acheteurs de facon concise, honnete et sympathique.

ARTICLE EN VENTE:
Titre: ${bot.titre}
${infos}

REGLES:
- Reponds uniquement sur cet article
- Sois honnete, ne cache pas les defauts
- Si une info manque, dis-le simplement
- Court et direct (2-4 phrases max)
- Texte simple, pas de markdown
- Si l'acheteur veut acheter, dis-lui de contacter le vendeur`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: question }
      ],
    })

    const answer = clean(response.content[0].text)

    // Sauvegarder le message et incrémenter
    await prisma.$transaction([
      prisma.chatMessage.create({ data: { id: require('crypto').randomUUID(), chatBotId: bot.id, role: 'user', content: question } }),
      prisma.chatMessage.create({ data: { id: require('crypto').randomUUID(), chatBotId: bot.id, role: 'assistant', content: answer } }),
      prisma.chatBot.update({ where: { code }, data: { nbQuestions: { increment: 1 } } }),
    ]).catch(() => {})

    res.status(200).json({ answer, remaining: remaining ? remaining - 1 : null })
  } catch(e) {
    res.status(500).json({ error: 'Erreur IA', answer: 'Une erreur est survenue. Reessayez.' })
  }
}
