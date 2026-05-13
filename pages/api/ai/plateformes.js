import { requireAuth } from '../../../lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { article, prix } = req.body
  if (!article) return res.status(400).json({ error: 'Article requis' })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Tu es expert en vente entre particuliers en France sur toutes les plateformes.

Article a vendre: ${article}
Prix envisage: ${prix ? prix + ' EUR' : 'non precise'}

Compare les 4 principales plateformes en texte brut:

LEBONCOIN:
- Audience: [description]
- Prix moyen marche: [fourchette EUR]
- Avantages: [2 points]
- Inconvenients: [1 point]
- Note: [/10]

VINTED:
- Audience: [description]
- Prix moyen marche: [fourchette EUR]
- Avantages: [2 points]
- Inconvenients: [1 point]
- Note: [/10]

FACEBOOK MARKETPLACE:
- Audience: [description]
- Prix moyen marche: [fourchette EUR]
- Avantages: [2 points]
- Inconvenients: [1 point]
- Note: [/10]

EBAY:
- Audience: [description]
- Prix moyen marche: [fourchette EUR]
- Avantages: [2 points]
- Inconvenients: [1 point]
- Note: [/10]

RECOMMANDATION: [Quelle plateforme choisir et pourquoi en 2 phrases]`
      }]
    })

    const text = msg.content[0].text.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').trim()

    // Parser chaque plateforme
    const parsePlateforme = (name) => {
      const pattern = new RegExp(name + '\\s*[:\\-]?\\s*([\\s\\S]+?)(?=LEBONCOIN|VINTED|FACEBOOK|EBAY|RECOMMANDATION|$)', 'i')
      const match = text.match(pattern)
      return match ? match[1].trim() : ''
    }

    const reco = text.match(/RECOMMANDATION\s*[:\-]\s*([\s\S]+?)$/i)

    res.status(200).json({
      leboncoin: parsePlateforme('LEBONCOIN'),
      vinted: parsePlateforme('VINTED'),
      facebook: parsePlateforme('FACEBOOK MARKETPLACE'),
      ebay: parsePlateforme('EBAY'),
      recommandation: reco ? reco[1].trim() : '',
      raw: text,
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
