import { prisma } from '../../../lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorise' })
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: {
      plan: 'pro',
      subStatus: 'active',
      createdAt: { gte: eightDaysAgo, lte: sevenDaysAgo }
    },
    include: {
      annonces: { where: { type: { not: 'estimation' } }, take: 1, orderBy: { createdAt: 'desc' } }
    }
  })

  let sent = 0
  for (const user of users) {
    const annonce = user.annonces[0]
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@annonza.business',
        to: user.email,
        subject: 'Comment se passe votre vente ?',
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#030303;color:#f0ece4;padding:32px;border-radius:8px;">
          <div style="font-size:18px;font-weight:700;letter-spacing:3px;margin-bottom:24px;color:#c9a84c;">Agence d'Annonce</div>
          <h2 style="font-size:22px;font-weight:400;margin-bottom:16px;">Bonjour ${user.name || ''}</h2>
          <p style="color:#9a9590;line-height:1.8;margin-bottom:20px;">Cela fait une semaine que vous utilisez Annonza${annonce ? ' pour votre annonce <strong style="color:#f0ece4;">' + annonce.titre + '</strong>' : ''}.</p>
          <p style="color:#9a9590;line-height:1.8;margin-bottom:24px;">On aimerait savoir comment ca se passe. Repondez directement a cet email :</p>
          <div style="background:#0e0e0e;border:1px solid #2a2520;border-radius:4px;padding:20px;margin-bottom:24px;">
            <div style="font-size:13px;color:#c9a84c;margin-bottom:12px;font-weight:600;">Quelques questions rapides :</div>
            <ul style="color:#9a9590;line-height:2.2;margin:0;padding-left:20px;font-size:13px;">
              <li>Avez-vous reussi a vendre ?</li>
              <li>En combien de temps ?</li>
              <li>A quel prix par rapport au prix demande ?</li>
              <li>Combien de contacts avez-vous eu ?</li>
              <li>L'annonce generee vous a-t-elle aide ?</li>
            </ul>
          </div>
          <p style="color:#7a7268;font-size:12px;line-height:1.7;">Vos retours nous aident a ameliorer le service et peuvent apparaitre (anonymes) sur notre page d'accueil.</p>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #2a2520;">
            <a href="${process.env.NEXT_PUBLIC_URL || 'https://annonza.business'}/dashboard" style="background:linear-gradient(135deg,#a8843c,#c9a84c);color:#030303;text-decoration:none;padding:12px 24px;border-radius:3px;font-size:13px;font-weight:700;letter-spacing:1px;">RETOUR AU DASHBOARD</a>
          </div>
        </div>`
      })
      sent++
    } catch(e) {
      console.error('Email error:', e.message)
    }
  }

  res.status(200).json({ sent, total: users.length })
}
