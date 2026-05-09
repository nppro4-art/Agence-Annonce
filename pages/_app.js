import { useState, useEffect } from 'react'
import '../styles/globals.css'

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => { localStorage.setItem('cookies_accepted', '1'); setVisible(false) }
  const decline = () => { localStorage.setItem('cookies_accepted', '0'); setVisible(false) }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(10,10,10,.97)', borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(20px)', padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: 2, color: 'var(--gold3)', marginBottom: 4 }}>
          COOKIES &amp; CONFIDENTIALITE
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, margin: 0 }}>
          Nous utilisons uniquement un cookie de session pour votre connexion. Aucun cookie publicitaire.{' '}
          <a href="/confidentialite" style={{ color: 'var(--gold2)', textDecoration: 'underline' }}>Politique de confidentialite</a>
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline}
          style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '8px 16px' }}>
          Refuser
        </button>
        <button onClick={accept}
          style={{ background: 'linear-gradient(135deg,var(--gold3),var(--gold2))', border: 'none', borderRadius: 2, color: '#030303', cursor: 'pointer', fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '8px 20px' }}>
          Accepter
        </button>
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <CookieBanner />
    </>
  )
}
