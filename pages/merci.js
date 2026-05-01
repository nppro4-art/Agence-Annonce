import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Merci() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => setUser(data.user))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--s1)', border: '1px solid rgba(0,217,126,.3)', borderRadius: 20, padding: '40px 28px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 1, marginBottom: 8 }}>
          Bienvenue dans la version Pro !
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7, marginBottom: 28 }}>
          Votre abonnement est actif. Vous avez maintenant accès à toutes les fonctionnalités illimitées.
        </div>
        <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
          {['Annonces illimitées', 'Réponses acheteurs illimitées', 'Estimation de prix avancée', 'Historique complet'].map(f => (
            <div key={f} style={{ fontSize: 13, color: 'var(--white)', display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: 'var(--success)' }}>✓</span>{f}
            </div>
          ))}
        </div>
        <Link href="/dashboard">
          <button style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, padding: 16 }}>
            ACCÉDER À MON ESPACE →
          </button>
        </Link>
      </div>
    </div>
  )
}
