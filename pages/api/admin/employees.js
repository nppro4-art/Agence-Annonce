import { requireAdmin } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default requireAdmin(async function handler(req, res) {
  if (req.method === 'GET') {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } })
    return res.status(200).json({ employees })
  }
  if (req.method === 'POST') {
    const { name, code, email, webhook } = req.body
    if (!name || !code) return res.status(400).json({ error: 'Nom et code requis' })
    const emp = await prisma.employee.create({ data: { name, code, email, webhook } })
    return res.status(201).json({ employee: emp })
  }
  if (req.method === 'DELETE') {
    const { id } = req.query
    await prisma.employee.delete({ where: { id } })
    return res.status(200).json({ success: true })
  }
  if (req.method === 'PUT') {
    const { id } = req.query
    const { name, webhook, active } = req.body
    const emp = await prisma.employee.update({ where: { id }, data: { name, webhook, active } })
    return res.status(200).json({ employee: emp })
  }
  res.status(405).end()
})
