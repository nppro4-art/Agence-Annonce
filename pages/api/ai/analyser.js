import { requireAuth } from '../../../lib/auth'
import { hasFeature } from '../../../lib/credits'
import { prisma } from '../../../lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function clean(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6} /g, '').replace(/`{1,3}/g, '').trim()
}

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const plan = user?.planKey || user?.plan || 'free'
  if (!hasFeature(plan, 'analyser')) {
    return res.status(403).json({ error: 'Cette fonctionnalite necessite le plan Business ou superieur.' })
  }
  const { annonce } = req.body
  if (!annonce || annonce.length < 20) return res.status(400).json({ error: 'Annonce trop courte' })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Tu es expert en optimisation d'annonces LeBonCoin et Vinted.

Analyse cette annonce existante et fournis une version amelioree.

ANNONCE ORIGINALE:
${annonce}

Reponds en texte brut sans markdown avec ces sections:

SCORE ORIGINAL: [note sur 100]
PROBLEMES: [liste des 3 principaux problemes]
SCORE AMELIORE: [note sur 100 apres correction]
ANNONCE AMELIOREE: [version complete reecrite, optimisee, professionnelle]
CONSEILS: [2-3 conseils specifiques pour cette annonce]`
      }]
    })

    const text = clean(msg.content[0].text)

    const getSection = (pattern) => {
      const match = text.match(pattern)
      return match ? match[1].trim() : ''
    }

    const scoreOriginal = parseInt(getSection(/SCORE ORIGINAL\s*[:\-]\s*(\d+)/i)) || 40
    const scoreAmeliore = parseInt(getSection(/SCORE AMELIORE\s*[:\-]\s*(\d+)/i)) || 85
    const problemes = getSection(/PROBLEMES\s*[:\-]\s*([\s\S]+?)(?=SCORE AMELIORE|$)/i)
    const annonceAmelioree = getSection(/ANNONCE AMELIOREE\s*[:\-]\s*([\s\S]+?)(?=CONSEILS|$)/i)
    const conseils = getSection(/CONSEILS\s*[:\-]\s*([\s\S]+?)$/i)

    res.status(200).json({ scoreOriginal, scoreAmeliore, problemes, annonceAmelioree, conseils, raw: text })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
