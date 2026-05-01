import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  const [users, proUsers, commissions, annonces, reponses] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: 'pro', subStatus: 'active' } }),
    prisma.commission.findMany({ where: { paid: false } }),
    prisma.annonce.count(),
    prisma.reponse.count(),
  ])

  const CABrut = proUsers * 19.99
  const commTotal = commissions.reduce((s, c) => s + c.amount, 0)
  const beneficeNet = CABrut - commTotal - (proUsers * 0.5)

  const employees = await prisma.employee.findMany({
    include: {
      clicks: true,
      commissions: { where: { paid: false } }
    }
  })

  const empStats = employees.map(e => {
    const usersByRef = prisma.user.count({ where: { refBy: e.code, plan: 'pro' } })
    return {
      id: e.id, name: e.name, code: e.code, active: e.active,
      clicks: e.clicks.length,
      conversions: e.clicks.filter(c => c.converted).length,
      commissionsDues: e.commissions.reduce((s, c) => s + c.amount, 0)
    }
  })

  // Ventes par jour (7 derniers jours)
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const count = await prisma.user.count({
      where: { plan: 'pro', createdAt: { gte: d, lt: next } }
    })
    days.push({ date: d.toLocaleDateString('fr-FR', { weekday: 'short' }), ventes: count })
  }

  res.status(200).json({ users, proUsers, CABrut, commTotal, beneficeNet, annonces, reponses, empStats, days })
})
