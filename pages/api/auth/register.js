import bcrypt from 'bcryptjs'
import { serialize } from 'cookie'
import { prisma } from '../../../lib/db'
import { signToken } from '../../../lib/auth'
import { sendWelcomeEmail } from '../../../lib/email'
import { authLimiter } from '../../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const { limited } = authLimiter(ip)
  if (limited) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' })

  const { email, password, name, ref } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (min 8 caractères)' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé' })

  if (ref) {
    const emp = await prisma.employee.findUnique({ where: { code: ref } })
    if (emp) {
      await prisma.click.updateMany({
        where: { employeeId: emp.id, converted: false },
        data: { converted: true }
      })
    }
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name, refBy: ref || null }
  })

  // Email de bienvenue (async, ne bloque pas la réponse)
  sendWelcomeEmail({ to: email, name }).catch(console.error)

  const token = signToken({ id: user.id, email: user.email, role: 'user' })
  res.setHeader('Set-Cookie', serialize('token', token, { httpOnly: true, path: '/', maxAge: 604800, sameSite: 'lax' }))
  res.status(201).json({ success: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } })
}
