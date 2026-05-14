import { prisma } from '../../../lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://annonza.business'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { token, action } = req.query
  if (!token || !action) return res.redirect(siteUrl + '/auth/login?error=invalid')

  // Trouver le code correspondant au token
  const record = await prisma.twoFACode.findFirst({
    where: { token, used: false },
    include: { user: { select: { email: true, id: true } } }
  }).catch(() => null)

  if (!record || new Date() > record.expiresAt) {
    return res.redirect(siteUrl + '/auth/login?error=expired')
  }

  if (action === 'refuse') {
    // Invalider le code
    await prisma.twoFACode.update({
      where: { id: record.id },
      data: { used: true }
    }).catch(() => {})

    // Envoyer un email d'alerte
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@annonza.business',
        to: record.user.email,
        subject: 'Connexion refusee - Annonza',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#030303;color:#f0ece4;padding:32px;border-radius:8px;">
          <div style="font-size:18px;font-weight:700;letter-spacing:3px;margin-bottom:20px;color:#c9a84c;">Annonza</div>
          <h2 style="color:#e05a4a;font-size:18px;margin:0 0 12px 0;">Connexion refusee</h2>
          <p style="color:#9a9590;font-size:13px;line-height:1.7;">Vous avez refuse la tentative de connexion. Votre compte est securise.</p>
          <p style="color:#7a7268;font-size:13px;line-height:1.7;">Si vous pensez que quelqu'un essaie d'acceder a votre compte, nous vous conseillons de changer votre mot de passe.</p>
        </div>`
      })
    } catch(e) {}

    return res.redirect(siteUrl + '/auth/login?error=refused')
  }

  if (action === 'accept') {
    // Marquer comme confirmé (pas encore utilisé - le code doit encore être entré)
    await prisma.twoFACode.update({
      where: { id: record.id },
      data: { confirmed: true }
    }).catch(() => {})

    return res.redirect(siteUrl + '/auth/login?email=' + encodeURIComponent(record.user.email) + '&step=code')
  }

  res.redirect(siteUrl + '/auth/login')
}
