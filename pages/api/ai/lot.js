import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { canUse, useCredit, hasFeature } from '../../../lib/credits'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function clean(t) { return t.replace(/\*\*/g,'').replace(/\*/g,'').replace(/#{1,6} /g,'').replace(/`{1,3}/g,'').trim() }

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const plan = user.planKey || user.plan
  if (!hasFeature(plan, 'lot')) {
    return res.status(403).json({ error: 'Le mode lot necessite le plan Expert.' })
  }
  const { allowed } = await canUse(user.id, 'annonces', plan)
  if (!allowed) return res.status(403).json({ error: 'Limite annonces atteinte' })

  const { objets, prixTotal, contexte } = req.body
  // objets = [{ nom, prix, etat }, ...]
  if (!objets || objets.length < 2) return res.status(400).json({ error: 'Minimum 2 objets pour un lot' })

  const listeObjets = objets.map((o,i) => `${i+1}. ${o.nom}${o.prix?' - '+o.prix+' EUR':''} ${o.etat?'('+o.etat+')':''}`).join('\n')
  const totalSepare = objets.reduce((a,o) => a + (parseFloat(o.prix)||0), 0)

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu es expert en vente de lots sur LeBonCoin et Vinted.

OBJETS A VENDRE EN LOT:
${listeObjets}

Prix total separe: ${totalSepare} EUR
Prix lot propose: ${prixTotal ? prixTotal + ' EUR' : 'a determiner'}
Contexte: ${contexte || 'vide grenier / demenagement'}

Genere une annonce de lot attractive en texte brut sans markdown:

TITRE: [Titre accrocheur mentionnant les articles principaux, max 70 caracteres]

DESCRIPTION: [Presentation du lot, pourquoi c'est interessant, contexte de vente]

LISTE COMPLETE:
[Liste detaillee de chaque article avec etat]

ECONOMIE: [Combien l'acheteur economise par rapport au prix separe]

PRIX LOT: [Prix suggere si non precise, avec justification]

VERSION COURTE: [5 lignes max pour copier-coller]`
      }]
    })

    const text = clean(msg.content[0].text)
    const getSection = (p) => { const m = text.match(p); return m ? m[1].trim() : '' }

    res.status(200).json({
      titre: getSection(/TITRE\s*[:\-]\s*(.+?)(?:\n|$)/i),
      description: getSection(/DESCRIPTION\s*[:\-]\s*([\s\S]+?)(?=LISTE|$)/i),
      liste: getSection(/LISTE COMPLETE\s*[:\-]\s*([\s\S]+?)(?=ECONOMIE|$)/i),
      economie: getSection(/ECONOMIE\s*[:\-]\s*([\s\S]+?)(?=PRIX|$)/i),
      prixLot: getSection(/PRIX LOT\s*[:\-]\s*([\s\S]+?)(?=VERSION|$)/i),
      shortVersion: getSection(/VERSION COURTE\s*[:\-]\s*([\s\S]+?)$/i),
      totalSepare,
      raw: text,
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
