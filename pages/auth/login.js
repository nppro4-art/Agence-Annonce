import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
  const token = signToken({ id: user.id, email: user.email, role })
  res.setHeader('Set-Cookie', serialize('token', token, { httpOnly: true, path: '/', maxAge: 604800, sameSite: 'lax' }))
  res.status(200).json({ success: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role } })
}
