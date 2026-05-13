import { requireAuth } from '../../../lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { categorie, article } = req.body
  if (!categorie) return res.status(400).json({ error: 'Categorie requise' })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Tu es expert en comportement des acheteurs sur LeBonCoin et Vinted en France.

Pour cet article: ${categorie} ${article ? '('+article+')' : ''}
Aujourd\'hui nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}

Reponds en texte brut:

MEILLEUR JOUR: [Quel jour publier]
MEILLEURE HEURE: [A quelle heure publier]
RAISON: [Pourquoi en 1-2 phrases]
CONSEIL SAISON: [Conseil specifique pour la periode actuelle]
SCORE MOMENT ACTUEL: [Note /10 si on publie maintenant]`
      }]
    })

    const text = msg.content[0].text.replace(/\*\*/g,'').replace(/\*/g,'').trim()
    const getSection = (p) => { const m = text.match(p); return m ? m[1].trim() : '' }

    res.status(200).json({
      meilleurJour: getSection(/MEILLEUR JOUR\s*[:\-]\s*(.+?)(?:\n|$)/i),
      meilleureHeure: getSection(/MEILLEURE HEURE\s*[:\-]\s*(.+?)(?:\n|$)/i),
      raison: getSection(/RAISON\s*[:\-]\s*([\s\S]+?)(?=CONSEIL|$)/i),
      conseilSaison: getSection(/CONSEIL SAISON\s*[:\-]\s*([\s\S]+?)(?=SCORE|$)/i),
      scoreMoment: getSection(/SCORE MOMENT ACTUEL\s*[:\-]\s*(.+?)(?:\n|$)/i),
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
