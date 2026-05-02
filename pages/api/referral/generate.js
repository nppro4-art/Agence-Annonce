import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

function generateCode(name) {
  const clean = (name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4)
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return clean + suffix
}

export default requireAuth(async function handler(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()
  if (user.plan !== 'pro') return res.status(403).json({ error: 'Reserve aux membres Elite' })

  if (user.referralCode) {
    return res.status(200).json({
      code: user.referralCode,
      // Lien avec client_reference_id pour que Stripe trackle le parrain
      link: (process.env.NEXT_PUBLIC_URL || '') + '/auth/register?ref=' + user.referralCode,
      stats: await getReferralStats(user.referralCode)
    })
  }

  const code = generateCode(user.name)
  await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })

  res.status(200).json({
    code,
    link: (process.env.NEXT_PUBLIC_URL || '') + '/auth/register?ref=' + code,
    stats: { total: 0, active: 0 }
  })
})

async function getReferralStats(code) {
  const parraines = await prisma.user.findMany({
    where: { referralUsed: code },
    select: { plan: true, subStatus: true, createdAt: true }
  })
  return {
    total: parraines.length,
    active: parraines.filter(u => u.plan === 'pro' && u.subStatus === 'active').length
  }
}
