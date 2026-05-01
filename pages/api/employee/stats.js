import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Code manquant' })
  const emp = await prisma.employee.findUnique({
    where: { code },
    include: { clicks: true, commissions: true }
  })
  if (!emp) return res.status(404).json({ error: 'Non trouvé' })
  const clients = await prisma.user.findMany({ where: { refBy: code, plan: 'pro' } })
  const commDues = emp.commissions.filter(c => !c.paid).reduce((s, c) => s + c.amount, 0)
  const commTotal = emp.commissions.reduce((s, c) => s + c.amount, 0)
  res.status(200).json({
    name: emp.name, code: emp.code,
    clicks: emp.clicks.length,
    conversions: emp.clicks.filter(c => c.converted).length,
    ventes: clients.length,
    clientsActifs: clients.filter(c => c.subStatus === 'active').length,
    commissionsDues: commDues,
    commissionsTotal: commTotal
  })
}
