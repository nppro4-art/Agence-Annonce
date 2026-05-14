import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

const resend = new Resend(process.env.RESEND_API_KEY)
const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://annonza.business'

export default requireAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { newEmail, password } = req.body
  if (!newEmail || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: 'Mot de passe incorrect' })

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing) return res.status(400).json({ error: 'Cet email est deja utilise' })

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.emailChange.upsert({
    where: { userId: user.id },
    create: { userId: user.id, newEmail, token, expiresAt },
    update: { newEmail, token, expiresAt },
  }).catch(() => {})

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@annonza.business',
      to: newEmail,
      subject: 'Confirmer votre nouvel email - Annonza',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#030303;color:#f0ece4;border-radius:8px;overflow:hidden;"><div style="background:linear-gradient(135deg,#a8843c,#c9a84c);padding:20px 32px;"><div style="font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:3px;color:#030303;">Annonza</div></div><div style="padding:32px;"><h2 style="font-size:20px;font-weight:400;margin:0 0 12px 0;">Confirmer votre nouvel email</h2><p style="color:#9a9590;font-size:13px;line-height:1.7;margin:0 0 24px 0;">Vous avez demande a changer votre email vers <strong style="color:#f0ece4;">${newEmail}</strong>.</p><a href="${siteUrl}/api/auth/confirm-email?token=${token}" style="display:block;background:linear-gradient(135deg,#a8843c,#c9a84c);color:#030303;text-decoration:none;padding:14px 24px;border-radius:4px;font-size:13px;font-weight:700;text-align:center;">CONFIRMER MON EMAIL</a><p style="color:#5a5550;font-size:12px;margin-top:20px;">Ce lien expire dans 24h.</p></div></div>`
    })
  } catch(e) { console.error(e.message) }

  res.status(200).json({ success: true })
})
