import { stripe } from '../../../lib/stripe'
import { prisma } from '../../../lib/db'
import { addCredits, PACK_MAP } from '../../../lib/credits'
import { getUserFromRequest } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const userPayload = getUserFromRequest(req)
  if (!userPayload) return res.status(401).json({ error: 'Non connecté' })

  const { session_id } = req.body
  if (!session_id) return res.status(400).json({ error: 'session_id manquant' })

  try {
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    })

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Paiement non confirmé' })
    }

    // Vérifier que cette session n'a pas déjà été traitée
    const alreadyProcessed = await prisma.purchase.findFirst({
      where: { stripeId: session_id }
    })
    if (alreadyProcessed) {
      return res.status(200).json({
        success: true,
        pack: { name: alreadyProcessed.packName, qty: alreadyProcessed.quantity, type: alreadyProcessed.packType },
        message: 'Déjà traité'
      })
    }

    // Identifier le pack
    const priceId = session.line_items?.data[0]?.price?.id
    const pack = PACK_MAP[priceId]
    if (!pack) return res.status(400).json({ error: 'Pack non reconnu. Contactez le support.' })

    // Créditer le compte
    await addCredits(userPayload.id, pack.type, pack.qty, pack.name, pack.amount, session_id)

    res.status(200).json({ success: true, pack })
  } catch(e) {
    console.error('Pack confirm error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
