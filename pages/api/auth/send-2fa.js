import { prisma } from '../../../lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(200).json({ success: true }) // Ne pas révéler si existe

  // Générer code 6 chiffres + token unique pour les boutons
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  await prisma.twoFACode.upsert({
    where: { userId: user.id },
    create: { userId: user.id, code, token, expiresAt, used: false },
    update: { code, token, expiresAt, used: false },
  }).catch(() => {})

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://annonza.business'
  const acceptUrl = `${siteUrl}/api/auth/confirm-2fa?token=${token}&action=accept`
  const refuseUrl = `${siteUrl}/api/auth/confirm-2fa?token=${token}&action=refuse`
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' })

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@annonza.business',
      to: email,
      subject: 'Connexion a votre compte Annonza',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#030303;color:#f0ece4;border-radius:8px;overflow:hidden;">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#a8843c,#c9a84c);padding:24px 32px;">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:3px;color:#030303;">Annonza</div>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <h2 style="font-size:20px;font-weight:400;margin:0 0 8px 0;color:#f0ece4;">Tentative de connexion</h2>
            <p style="color:#7a7268;font-size:13px;margin:0 0 24px 0;">
              Une connexion a ete tentee sur votre compte le <strong style="color:#9a9590;">${now}</strong>.
            </p>

            <p style="color:#9a9590;font-size:13px;margin:0 0 20px 0;">
              Etait-ce vous ? Confirmez ou refusez cette connexion ci-dessous.
            </p>

            <!-- Boutons -->
            <div style="display:flex;gap:12px;margin-bottom:28px;">
              <a href="${acceptUrl}" style="flex:1;background:linear-gradient(135deg,#a8843c,#c9a84c);color:#030303;text-decoration:none;padding:14px 20px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:1px;text-align:center;display:block;">
                ✓ ACCEPTER
              </a>
              <a href="${refuseUrl}" style="flex:1;background:transparent;color:#e05a4a;text-decoration:none;padding:14px 20px;border-radius:4px;font-size:13px;font-weight:600;text-align:center;display:block;border:1px solid rgba(200,57,43,.4);">
                ✕ REFUSER
              </a>
            </div>

            <!-- Code -->
            <div style="background:#0e0e0e;border:1px solid #2a2520;border-radius:4px;padding:20px;text-align:center;margin-bottom:20px;">
              <p style="color:#7a7268;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px 0;">Votre code de connexion</p>
              <div style="font-family:monospace;font-size:38px;font-weight:700;letter-spacing:10px;color:#c9a84c;">${code}</div>
              <p style="color:#5a5550;font-size:11px;margin:10px 0 0 0;">Expire dans 10 minutes</p>
            </div>

            <p style="color:#5a5550;font-size:12px;line-height:1.7;margin:0;">
              Si ce n'etait pas vous, cliquez sur Refuser. Votre mot de passe n'a pas ete compromis mais nous vous conseillons de le changer.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #1e1c18;padding:16px 32px;text-align:center;">
            <p style="color:#3a3830;font-size:11px;margin:0;">annonza.business — Ne repondez pas a cet email</p>
          </div>
        </div>
      `
    })
  } catch(e) {
    console.error('Email 2FA error:', e.message)
  }

  res.status(200).json({ success: true })
}
