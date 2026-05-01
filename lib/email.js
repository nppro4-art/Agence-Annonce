// Système d'emails automatiques via Resend (gratuit jusqu'à 3000 emails/mois)
// Inscription sur resend.com pour obtenir une clé API

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@agence-annonce.com'
const SITE_NAME = "Agence d'Annonce"
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://tonsite.com'

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log('Email non envoyé (RESEND_API_KEY manquante):', subject)
    return
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
    })
  } catch(e) {
    console.error('Erreur email:', e.message)
  }
}

const baseStyle = `
  font-family: 'DM Sans', Arial, sans-serif;
  background: #050505;
  color: #f5f5f5;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 24px;
`
const btnStyle = `
  display: inline-block;
  background: #ff2d2d;
  color: white;
  font-weight: 700;
  font-size: 15px;
  padding: 14px 28px;
  border-radius: 10px;
  text-decoration: none;
  margin: 20px 0;
`
const cardStyle = `
  background: #0c0c0c;
  border: 1px solid #242424;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`

export async function sendWelcomeEmail({ to, name }) {
  await sendEmail({
    to,
    subject: `Bienvenue sur ${SITE_NAME} 👋`,
    html: `<div style="${baseStyle}">
      <h1 style="font-size:24px;margin-bottom:8px">Bienvenue ${name || ''} ! 🎉</h1>
      <p style="color:#888;line-height:1.7;margin-bottom:16px">
        Votre compte est créé. Vous pouvez dès maintenant estimer le prix de vos articles gratuitement.
      </p>
      <div style="${cardStyle}">
        <p style="font-size:14px;color:#888;margin-bottom:12px">Pour accéder à toutes les fonctionnalités :</p>
        <ul style="font-size:14px;color:#f5f5f5;line-height:2;padding-left:20px">
          <li>✍️ Créer des annonces professionnelles illimitées</li>
          <li>💬 Répondre aux acheteurs avec l'IA</li>
          <li>📋 Historique de toutes vos annonces</li>
        </ul>
      </div>
      <a href="${SITE_URL}/pricing" style="${btnStyle}">Découvrir la version Pro →</a>
      <p style="font-size:12px;color:#555;margin-top:24px">
        ${SITE_NAME} · <a href="${SITE_URL}" style="color:#888">${SITE_URL}</a>
      </p>
    </div>`
  })
}

export async function sendPaymentConfirmationEmail({ to, name }) {
  await sendEmail({
    to,
    subject: `✅ Votre abonnement Pro est actif — ${SITE_NAME}`,
    html: `<div style="${baseStyle}">
      <h1 style="font-size:24px;margin-bottom:8px">Paiement confirmé ✅</h1>
      <p style="color:#888;line-height:1.7;margin-bottom:16px">
        Bonjour ${name || ''}, votre abonnement Pro est maintenant actif.
      </p>
      <div style="${cardStyle}">
        <div style="font-size:13px;color:#888;margin-bottom:6px">Récapitulatif</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:4px">Plan Pro — 19,99€/mois</div>
        <div style="font-size:13px;color:#888">Résiliable à tout moment depuis votre espace client</div>
      </div>
      <div style="${cardStyle}">
        <p style="font-size:14px;color:#888;margin-bottom:8px">Ce qui est inclus :</p>
        <ul style="font-size:14px;color:#f5f5f5;line-height:2;padding-left:20px">
          <li>✍️ Annonces illimitées</li>
          <li>💬 Réponses acheteurs illimitées</li>
          <li>💰 Estimation de prix avancée</li>
          <li>📋 Historique complet</li>
        </ul>
      </div>
      <a href="${SITE_URL}/dashboard" style="${btnStyle}">Accéder à mon espace →</a>
      <p style="font-size:12px;color:#555;margin-top:24px">
        Pour gérer votre abonnement : <a href="${SITE_URL}/dashboard" style="color:#888">ici</a>
      </p>
    </div>`
  })
}

export async function sendCancellationEmail({ to, name }) {
  await sendEmail({
    to,
    subject: `Votre abonnement a été résilié — ${SITE_NAME}`,
    html: `<div style="${baseStyle}">
      <h1 style="font-size:24px;margin-bottom:8px">Abonnement résilié</h1>
      <p style="color:#888;line-height:1.7;margin-bottom:16px">
        Bonjour ${name || ''}, votre abonnement Pro a bien été résilié. Vous conservez l'accès gratuit.
      </p>
      <div style="${cardStyle}">
        <p style="font-size:14px;color:#888">Vous pouvez vous réabonner à tout moment depuis votre espace client.</p>
      </div>
      <a href="${SITE_URL}/pricing" style="${btnStyle}">Se réabonner →</a>
    </div>`
  })
}

export async function sendNewSaleToAdmin({ adminEmail, clientEmail, ref, amount }) {
  await sendEmail({
    to: adminEmail,
    subject: `💰 Nouvelle vente — ${amount}€`,
    html: `<div style="${baseStyle}">
      <h1 style="font-size:24px;margin-bottom:8px">Nouvelle vente 💰</h1>
      <div style="${cardStyle}">
        <div style="font-size:14px;line-height:2">
          <div><strong>Client :</strong> ${clientEmail}</div>
          <div><strong>Montant :</strong> ${amount}€</div>
          <div><strong>Apporté par :</strong> ${ref || 'Direct'}</div>
        </div>
      </div>
      <a href="${SITE_URL}/admin" style="${btnStyle}">Voir le dashboard →</a>
    </div>`
  })
}
