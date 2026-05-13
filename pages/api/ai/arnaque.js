import { requireAuth } from '../../../lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function clean(t) { return t.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').replace(/`{1,3}/g,'').trim() }

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { message } = req.body
  if (!message || message.length < 10) return res.status(400).json({ error: 'Message trop court' })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Tu es expert en arnaques LeBonCoin, Vinted et Facebook Marketplace en France.

Analyse ce message recu d'un "acheteur" et dis si c'est une arnaque ou non.

MESSAGE:
"${message}"

Reponds en texte brut avec:

VERDICT: [ARNAQUE PROBABLE / SUSPECT / LEGITIME]
NIVEAU DE RISQUE: [Eleve / Moyen / Faible]
EXPLICATION: [2-3 phrases expliquant pourquoi]
CONSEILS: [Que faire concretement]`
      }]
    })

    const text = clean(msg.content[0].text)
    const getSection = (p) => { const m = text.match(p); return m ? m[1].trim() : '' }

    const verdict = getSection(/VERDICT\s*[:\-]\s*(.+?)(?:\n|$)/i)
    const risque = getSection(/NIVEAU DE RISQUE\s*[:\-]\s*(.+?)(?:\n|$)/i)
    const explication = getSection(/EXPLICATION\s*[:\-]\s*([\s\S]+?)(?=CONSEILS|$)/i)
    const conseils = getSection(/CONSEILS\s*[:\-]\s*([\s\S]+?)$/i)

    const isArnaque = verdict.toLowerCase().includes('arnaque')
    const isSuspect = verdict.toLowerCase().includes('suspect')

    res.status(200).json({ verdict, risque, explication, conseils, isArnaque, isSuspect })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
