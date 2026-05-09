import { getUserFromRequest } from '../../../lib/auth'
import { estimatePrix } from '../../../lib/ai'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { specs } = req.body
  if (!specs) return res.status(400).json({ error: 'Specs manquantes' })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Tu es expert en optimisation d'annonces LeBonCoin.

Article: ${specs}

Genere exactement 5 titres differents et optimises pour cet article.
Chaque titre doit etre sur une ligne separee.
Maximum 70 caracteres par titre.
Pas de numerotation, pas de tirets, juste les titres.
Pas de markdown, pas d'asterisques.
Varie les angles: prix, etat, caracteristique cle, urgence, avantage principal.`
      }]
    })

    const text = msg.content[0].text.trim()
    const titres = text.split('\n').map(t => t.trim()).filter(t => t.length > 5 && t.length <= 70).slice(0, 5)

    res.status(200).json({ titres })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
