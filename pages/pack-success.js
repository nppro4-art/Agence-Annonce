import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function PackSuccess() {
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [pack, setPack] = useState(null)

  useEffect(() => {
    if (!router.isReady) return
    const { session_id } = router.query
    if (!session_id) { setStatus('error'); return }

    fetch('/api/stripe/pack-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) { setPack(data.pack); setStatus('success') }
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [router.isReady, router.query])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030303', color: '#f0ece4', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #333', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
        <div style={{ color: '#7a7268', fontSize: 14 }}>Confirmation en cours…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030303', color: '#f0ece4', fontFamily: 'DM Sans, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Problème de confirmation</h2>
        <p style={{ color: '#7a7268', marginBottom: 24, lineHeight: 1.7 }}>
          Si vous avez été prélevé, vos crédits seront ajoutés manuellement. Contactez-nous si besoin.
        </p>
        <Link href="/dashboard">
          <button style={{ background: '#c8392b', border: 'none', borderRadius: 3, color: 'white', cursor: 'pointer', fontSize: 13, padding: '13px 28px', letterSpacing: 1 }}>
            Retour au dashboard
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030303', color: '#f0ece4', fontFamily: 'DM Sans, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✦</div>
        <h1 style={{ fontSize: 36, fontWeight: 600, marginBottom: 8 }}>Pack activé !</h1>
        <p style={{ color: '#7a7268', marginBottom: 28, lineHeight: 1.7 }}>
          Votre <strong style={{ color: '#f0ece4' }}>{pack?.name}</strong> a bien été ajouté à votre compte.
        </p>
        {pack && (
          <div style={{ background: '#0e0e0e', border: '1px solid rgba(201,168,76,.25)', borderRadius: 4, padding: '20px 24px', marginBottom: 28, display: 'inline-block' }}>
            <div style={{ fontSize: 40, color: '#c9a84c', fontWeight: 700, lineHeight: 1 }}>+{pack.qty}</div>
            <div style={{ fontSize: 13, color: '#7a7268', marginTop: 6 }}>{pack.type === 'annonces' ? 'annonces' : 'réponses'} ajoutées</div>
          </div>
        )}
        <br/>
        <Link href="/dashboard">
          <button style={{ background: 'linear-gradient(135deg,#a8843c,#c9a84c,#e8c878)', border: 'none', borderRadius: 3, color: '#030303', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '15px 36px', letterSpacing: 2 }}>
            UTILISER MES CRÉDITS →
          </button>
        </Link>
      </div>
    </div>
  )
}
