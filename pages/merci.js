import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Merci() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => setUser(data.user))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div className="ornament" style={{ marginBottom: 28 }}><span>+</span></div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gold2)', marginBottom: 16, lineHeight: 1 }}>+</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, letterSpacing: -.5, marginBottom: 8 }}>
          Abonnement active !
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 28, lineHeight: 1.7 }}>
          Bienvenue {user?.name || ''}. Votre acces est immediatement disponible.
        </p>
        <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', borderRadius: 3, padding: '20px 24px', marginBottom: 28 }}>
          {['Annonces incluses', 'Reponses acheteurs', 'Estimation de prix', 'Historique complet'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--cream)', marginBottom: 8 }}>
              <span style={{ color: 'var(--gold3)', fontSize: 10 }}>+</span>{f}
            </div>
          ))}
        </div>
        <Link href="/dashboard">
          <button className="btn-gold" style={{ width: '100%', fontSize: 13, padding: '16px', letterSpacing: 2 }}>
            ACCEDER A MON ESPACE
          </button>
        </Link>
      </div>
    </div>
  )
}
