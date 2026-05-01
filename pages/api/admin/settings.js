import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await prisma.settings.findUnique({ where: { id: 'main' } })
    return res.status(200).json({ settings })
  }
  if (req.method === 'POST') {
    const { commissionFirst, commissionRecurring, stripePrice, adminWebhook, stripePriceIdWeekly, stripePriceIdMonthly, stripeLinkPack5, stripeLinkPack10, stripeLinkRep20 } = req.body
    const settings = await prisma.settings.upsert({
      where: { id: 'main' },
      update: {
        commissionFirst: parseFloat(commissionFirst) || 6,
        commissionRecurring: parseFloat(commissionRecurring) || 2,
        stripePrice: parseFloat(stripePrice) || 5.99,
        adminWebhook: adminWebhook || null,
      },
      create: {
        id: 'main',
        commissionFirst: parseFloat(commissionFirst) || 6,
        commissionRecurring: parseFloat(commissionRecurring) || 2,
        stripePrice: parseFloat(stripePrice) || 5.99,
        adminWebhook: adminWebhook || null,
      }
    })
    return res.status(200).json({ success: true, settings })
  }
  res.status(405).end()
})
