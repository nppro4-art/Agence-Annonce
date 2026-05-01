import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code manquant' })
  const emp = await prisma.employee.findUnique({ where: { code } })
  if (!emp) return res.status(404).json({ error: 'Employé non trouvé' })
  await prisma.click.create({
    data: { employeeId: emp.id, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }
  })
  res.status(200).json({ success: true })
}
