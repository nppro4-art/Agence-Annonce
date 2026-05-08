import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  try {
    const now = new Date()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const since = new Date('2026-05-01')

    const [
      totalUsers, proUsers, freeUsers,
      totalAnnonces, totalReponses,
      annoncesWeek, reponsesWeek,
      annoncesSince, reponsesSince,
      commissions, employees,
      newUsersWeek, newUsersMonth,
      purchasesAll,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'pro', subStatus: 'active' } }),
      prisma.user.count({ where: { plan: 'free' } }),
      prisma.annonce.count(),
      prisma.reponse.count(),
      prisma.annonce.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.reponse.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.annonce.count({ where: { createdAt: { gte: since } } }),
      prisma.reponse.count({ where: { createdAt: { gte: since } } }),
      prisma.commission.findMany({ where: { paid: false }, include: { employee: { select: { name: true } } } }),
      prisma.employee.findMany({ include: { _count: { select: { clicks: true, commissions: true } } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.purchase.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { email: true } } } }),
    ])

    // CA brut estimé
    const PLAN_PRICES = { starter: 3.99, business: 5.99, expert: 9.99 }
    const allProUsers = await prisma.user.findMany({ where: { plan: 'pro', subStatus: 'active' }, select: { planKey: true } })
    const CAWeek = allProUsers.reduce((acc, u) => acc + (PLAN_PRICES[u.planKey] || 5.99), 0)
    const commTotal = commissions.reduce((a, c) => a + c.amount, 0)

    // Graphique 7 jours
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0)
      const d2 = new Date(d); d2.setHours(23,59,59,999)
      const ventes = await prisma.user.count({ where: { createdAt: { gte: d, lte: d2 }, plan: 'pro' } })
      days.push({ date: d.toLocaleDateString('fr-FR', { weekday: 'short' }), ventes })
    }

    // Stats par affilié
    const empStats = await Promise.all(employees.map(async e => {
      const clicks = e._count.clicks
      const conversions = await prisma.commission.count({ where: { employeeId: e.id, type: 'first' } })
      const commDues = await prisma.commission.aggregate({ where: { employeeId: e.id, paid: false }, _sum: { amount: true } })
      return { id: e.id, name: e.name, code: e.code, clicks, conversions, commissionsDues: commDues._sum.amount || 0 }
    }))

    // Derniers inscrits
    const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { email: true, name: true, plan: true, planKey: true, createdAt: true, subStatus: true } })

    res.status(200).json({
      // Utilisateurs
      users: totalUsers, proUsers, freeUsers,
      newUsersWeek, newUsersMonth,
      recentUsers,
      // Contenu
      annonces: totalAnnonces, reponses: totalReponses,
      annoncesWeek, reponsesWeek,
      annoncesSince, reponsesSince,
      // Finance
      CAWeek: CAWeek.toFixed(2),
      CABrut: CAWeek.toFixed(2),
      beneficeNet: (CAWeek - commTotal).toFixed(2),
      commTotal: commTotal.toFixed(2),
      commissions,
      // Graphique
      days,
      // Affiliés
      employees, empStats,
      // Achats récents
      purchasesAll,
    })
  } catch(e) {
    console.error('stats error:', e)
    res.status(500).json({ error: e.message })
  }
})
