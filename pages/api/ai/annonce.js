import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateAnnonce } from '../../../lib/ai'
import { scoreAnnonce } from '../../../lib/score'
import { aiAnnonceLimiter } from '../../../lib/rateLimit'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()
  if (user.plan !== 'pro') return res.status(403).json({
    error: 'Fonctionnalité Pro uniquement',
    message: 'La création d\'annonces est réservée aux membres Pro. 19,99€/mois, résiliable à tout moment.',
    upgrade: true
  })

  // 200 annonces par mois (usage raisonnable)
  const { limited, remaining } = aiAnnonceLimiter(user.id)
  if (limited) return res.status(429).json({
    error: 'Limite mensuelle atteinte',
    message: 'Vous avez atteint la limite de 200 annonces par mois (usage raisonnable). Contactez le support si besoin.',
    upgrade: false
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
      data: {
        userId: user.id, type: type || 'autre', inputData: inputData || {},
        ...annonceData, score: scoreResult.score, scoreGrade: scoreResult.grade
      }
    })
    res.status(200).json({ annonce, raw: result, score: scoreResult, remaining })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})
