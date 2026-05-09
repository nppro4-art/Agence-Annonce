import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateReponse } from '../../../lib/ai'
import { canUse, useCredit } from '../../../lib/credits'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth - récupérer l'utilisateur
  const payload = getUserFromRequest(req)
  if (!payload) return res.status(401).json({ error: 'Non connecte' })

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouve' })

  const plan = user.planKey || user.plan || 'free'
  const { allowed, source } = await canUse(user.id, 'reponses', plan)

  if (!allowed) {
    return res.status(403).json({
      error: 'Limite atteinte',
      message: 'Vous avez utilise toutes vos reponses cette semaine.',
      upgrade: plan === 'free',
    })
  }

  const { message, contexte, annonceId } = req.body
  if (!message) return res.status(400).json({ error: 'Message manquant' })

  // Récupérer les données complètes de l'annonce si fournie
  let annonceData = null
  if (annonceId) {
    annonceData = await prisma.annonce.findFirst({
      where: { id: annonceId, userId: user.id }
    }).catch(() => null)
  }

  try {
    const raw = await generateReponse(message, contexte || '', annonceData)

    // Parser la réponse
    const getSection = (text, pattern) => {
      const match = text.match(pattern)
      return match ? match[1].trim() : ''
    }

    const reponsePrete = getSection(raw, /R[EÉ]PONSE\s*[:\-]\s*([\s\S]+?)(?=SUGGESTION|ANALYSE|$)/i) || raw
    const suggestion = getSection(raw, /SUGGESTION[^:]*[:\-]\s*([\s\S]+?)(?=ANALYSE|$)/i)

    // Sauvegarder
    const reponse = await prisma.reponse.create({
      data: {
        userId: user.id,
        messageAcheteur: message,
        reponsePrete: reponsePrete || raw,
        suggestion: suggestion || '',
      }
    })

    if (source === 'pack') await useCredit(user.id, 'reponses')

    res.status(200).json({ reponse, raw })
  } catch(e) {
    console.error('Erreur reponse API:', e.message)
    res.status(500).json({ error: 'Erreur IA: ' + e.message })
  }
}
