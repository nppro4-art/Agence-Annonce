import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { generateAnnonce } from '../../../lib/ai'
import { scoreAnnonce } from '../../../lib/score'
import { aiAnnonceLimiter as aiLimiter } from '../../../lib/rateLimit'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user || user.plan !== 'pro') return res.status(403).json({ error: 'Pro requis' })

  const { limited } = aiLimiter(user.id)
  if (limited) return res.status(429).json({ error: 'Limite horaire atteinte' })

  const { annonceId, instruction } = req.body
  if (!annonceId) return res.status(400).json({ error: 'ID annonce manquant' })

  const existing = await prisma.annonce.findFirst({ where: { id: annonceId, userId: user.id } })
  if (!existing) return res.status(404).json({ error: 'Annonce non trouvée' })

  const baseSpecs = Object.entries(existing.inputData || {})
    .filter(([,v]) => v).map(([k,v]) => `- ${k}: ${v}`).join('\n')

  const extraInstruction = instruction
    ? `\n\nInstruction supplémentaire du vendeur : "${instruction}"`
    : '\n\nAméliore le titre et la description pour les rendre plus accrocheurs.'

  try {
    const result = await generateAnnonce(baseSpecs + extraInstruction, 'fr', 'optimise')
    const get = (p) => (result.match(p) || [])[1]?.trim() || ''
    const annonceData = {
      titre: get(/TITRE\s*[:\-]\s*(.+)/i),
      description: get(/DESCRIPTION\s*[:\-]?\s*([\s\S]+?)(?=POINTS|CARACT|$)/i),
      pointsForts: get(/POINTS?\s+FORTS?\s*[:\-]?\s*([\s\S]+?)(?=CARACT|TRANSP|$)/i),
      defauts: get(/TRANSPARENCE\s*[:\-]?\s*([\s\S]+?)(?=INFOS|PRIX|$)/i),
      prixConseil: get(/PRIX\s+CONSEILL[EÉ]\s*[:\-]?\s*(.+)/i),
      shortVersion: get(/VERSION\s+COURTE\s*[:\-]?\s*([\s\S]+?)$/i),
    }
    const updated = await prisma.annonce.update({ where: { id: annonceId }, data: annonceData })
    const scoreResult = scoreAnnonce({ ...annonceData, inputData: existing.inputData })
    res.status(200).json({ annonce: updated, raw: result, score: scoreResult })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
