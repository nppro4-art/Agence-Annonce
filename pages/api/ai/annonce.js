import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateAnnonce } from '../../../lib/ai'
import { scoreAnnonce } from '../../../lib/score'
import { canUse, useCredit } from '../../../lib/credits'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const plan = user.planKey || user.plan
  const { allowed, source, remaining } = await canUse(user.id, 'annonces', plan)

  if (!allowed) return res.status(403).json({
    error: 'Limite atteinte',
    message: 'Vous avez utilise toutes vos annonces cette semaine. Elles se renouvellent lundi.',
    upgrade: plan === 'free',
    remaining: 0
  })

  const { specs, lang, urgence, inputData, type } = req.body
  if (!specs) return res.status(400).json({ error: 'Specs manquantes' })

  try {
    const result = await generateAnnonce(specs, lang, urgence)
    const get = (p) => (result.match(p) || [])[1]?.trim() || ''
    const annonceData = {
      titre: get(/TITRE\s*[:\-]\s*(.+)/i),
      description: get(/DESCRIPTION\s*[:\-]?\s*([\s\S]+?)(?=POINTS|CARACT|$)/i),
      pointsForts: get(/POINTS?\s+FORTS?\s*[:\-]?\s*([\s\S]+?)(?=CARACT|TRANSP|$)/i),
      defauts: get(/TRANSPARENCE\s*[:\-]?\s*([\s\S]+?)(?=INFOS|PRIX|$)/i),
      prixConseil: get(/PRIX\s+CONSEILL[EÉ]\s*[:\-]?\s*(.+)/i),
      shortVersion: get(/VERSION\s+COURTE\s*[:\-]?\s*([\s\S]+?)$/i),
    }
    const scoreResult = scoreAnnonce({ ...annonceData, inputData })
    const annonce = await prisma.annonce.create({
      data: { userId: user.id, type: type || 'autre', inputData: inputData || {}, ...annonceData, score: scoreResult.score, scoreGrade: scoreResult.grade }
    })
    if (source === 'pack') await useCredit(user.id, 'annonces')
    res.status(200).json({ annonce, raw: result, score: scoreResult, remaining: remaining - 1, source })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
