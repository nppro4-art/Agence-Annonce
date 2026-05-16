import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await prisma.settings.findUnique({ where: { id: 'main' } })
    return res.status(200).json({ settings })
  }
  if (req.method === 'POST') {
    const {
      commissionFirst, commissionRecurring, commissionStarter,
      commissionBusiness, commissionExpert,
      stripePrice, adminWebhook, discordWebhookAvis,
      skyMode, skyTheme
    } = req.body

    const settings = await prisma.settings.upsert({
      where: { id: 'main' },
      update: {
        commissionFirst: parseFloat(commissionFirst) || 6,
        commissionRecurring: parseFloat(commissionRecurring) || 2,
        commissionStarter: parseFloat(commissionStarter) || 0.5,
        commissionBusiness: parseFloat(commissionBusiness) || 1.5,
        commissionExpert: parseFloat(commissionExpert) || 2.5,
        stripePrice: parseFloat(stripePrice) || 5.99,
        adminWebhook: adminWebhook || null,
        discordWebhookAvis: discordWebhookAvis || null,
        skyMode: skyMode || 'auto',
        skyTheme: skyTheme || 'deep_night',
      },
      create: {
        id: 'main',
        commissionFirst: parseFloat(commissionFirst) || 6,
        commissionRecurring: parseFloat(commissionRecurring) || 2,
        commissionStarter: parseFloat(commissionStarter) || 0.5,
        commissionBusiness: parseFloat(commissionBusiness) || 1.5,
        commissionExpert: parseFloat(commissionExpert) || 2.5,
        stripePrice: parseFloat(stripePrice) || 5.99,
        adminWebhook: adminWebhook || null,
        discordWebhookAvis: discordWebhookAvis || null,
        skyMode: skyMode || 'auto',
        skyTheme: skyTheme || 'deep_night',
      }
    })
    return res.status(200).json({ success: true, settings })
  }
  res.status(405).end()
})
