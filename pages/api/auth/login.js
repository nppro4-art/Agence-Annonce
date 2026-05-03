import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

  const isAdmin = email === process.env.ADMIN_EMAIL
  const role = isAdmin ? 'admin' : 'user'

  const token = signToken({ id: user.id, email: user.email, role })

  const cookieOptions = {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  }
  // Ne pas mettre secure:true en dev
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true
  }

  res.setHeader('Set-Cookie', serialize('token', token, cookieOptions))
  res.status(200).json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role }
  })
}
