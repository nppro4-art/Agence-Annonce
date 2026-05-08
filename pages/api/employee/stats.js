import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Code manquant' })

  const emp = await prisma.employee.findUnique({ where: { code: code.toUpperCase() } })
  if (!emp) return res.status(404).json({ error: 'Code invalide' })

  // Stats réelles uniquement
  const [clicks, firstCommissions, recurringCommissions] = await Promise.all([
    prisma.click.count({ where: { employeeId: emp.id } }),
    prisma.commission.findMany({ where: { employeeId: emp.id, type: 'first' } }),
    prisma.commission.findMany({ where: { employeeId: emp.id, type: 'recurring' } }),
  ])

  const ventes = firstCommissions.length
  const commissionsDues = await prisma.commission.aggregate({ where: { employeeId: emp.id, paid: false }, _sum: { amount: true } })
  const commissionsTotal = await prisma.commission.aggregate({ where: { employeeId: emp.id }, _sum: { amount: true } })

  // Clients actifs via ce lien
  const clientIds = [...new Set(firstCommissions.map(c => c.userId))]
  const clientsActifs = await prisma.user.count({ where: { id: { in: clientIds }, plan: 'pro', subStatus: 'active' } })

  // Distribution par plan
  const planDist = { starter: 0, business: 0, expert: 0 }
  firstCommissions.forEach(c => {
    if (planDist[c.planKey] !== undefined) planDist[c.planKey]++
  })

  // Revenus par période
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const weekEarnings = await prisma.commission.aggregate({ where: { employeeId: emp.id, createdAt: { gte: weekStart } }, _sum: { amount: true } })
  const monthEarnings = await prisma.commission.aggregate({ where: { employeeId: emp.id, createdAt: { gte: monthStart } }, _sum: { amount: true } })
  const yearEarnings = await prisma.commission.aggregate({ where: { employeeId: emp.id, createdAt: { gte: yearStart } }, _sum: { amount: true } })

  res.status(200).json({
    name: emp.name,
    code: emp.code,
    clicks,
    ventes,
    clientsActifs,
    planDist,
    commissionsDues: commissionsDues._sum.amount || 0,
    commissionsTotal: commissionsTotal._sum.amount || 0,
    weekEarnings: weekEarnings._sum.amount || 0,
    monthEarnings: monthEarnings._sum.amount || 0,
    yearEarnings: yearEarnings._sum.amount || 0,
  })
}
