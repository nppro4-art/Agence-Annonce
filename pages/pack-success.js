import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function PackSuccess() {
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [pack, setPack] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const { session_id } = router.query
    if (!session_id) return

    fetch('/api/stripe/pack-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id })
    }).then(r => r.json()).then(data => {
      if (data.success) { setPack(data.pack); setStatus('success') }
      else { setError(data.error || 'Erreur inconnue'); setStatus('error') }
    }).catch(() => { setError('Erreur de connexion'); setStatus('error') })
  }, [router.query])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--muted2)', fontStyle: 'italic' }}>Confirmation en cours…</div>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>Problème de confirmation</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>{error}</div>
        <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>
          Si vous avez été prélevé, contactez-nous. Vos crédits seront ajoutés manuellement.
        </p>
        <Link href="/dashboard">
          <button className="btn-primary">Retour au dashboard</button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.06) 0%, transparent 60%)', pointerEvents: 'none' }}/>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div className="ornament" style={{ marginBottom: 28 }}><span>✦</span></div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--gold2)', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>✦</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, letterSpacing: -.5, marginBottom: 8 }}>
          Pack activé !
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 28, lineHeight: 1.7 }}>
          Votre <strong style={{ color: 'var(--cream)' }}>{pack?.name}</strong> a bien été ajouté à votre compte.
        </p>

        {pack && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', borderRadius: 4, padding: '20px 24px', marginBottom: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 8, left: 8, width: 10, height: 10, borderTop: '1px solid var(--gold-border)', borderLeft: '1px solid var(--gold-border)' }}/>
            <div style={{ position: 'absolute', bottom: 8, right: 8, width: 10, height: 10, borderBottom: '1px solid var(--gold-border)', borderRight: '1px solid var(--gold-border)' }}/>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 28, letterSpacing: -1, color: 'var(--gold2)' }}>
              +{pack.qty}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 4 }}>
              {pack.type === 'annonces' ? 'annonces' : 'réponses'} ajoutées à votre compte
            </div>
          </div>
        )}

        <Link href="/dashboard">
          <button className="btn-gold" style={{ width: '100%' }}>
            Utiliser mes crédits →
          </button>
        </Link>
      </div>
    </div>
  )
}
