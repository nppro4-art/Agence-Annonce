import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const ref = typeof window !== 'undefined' ? sessionStorage.getItem('ref') || '' : ''
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ref })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur inscription'); setLoading(false); return }
      if (router.query.plan === 'elite' || router.query.plan === 'pro') {
        const subRes = await fetch('/api/stripe/create-subscription', { method: 'POST' })
        const subData = await subRes.json()
        if (subData.url) { window.location.href = subData.url; return }
      }
      router.push('/dashboard')
    } catch(e) {
      setError('Erreur de connexion. Réessayez.'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .auth-left { display: none !important; }
          .auth-right { padding: 32px 20px !important; }
        }
      `}</style>

      {/* Panneau gauche */}
      <div style={{ flex: 1, background: 'var(--ink)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(200,57,43,.06) 0%, transparent 60%)', pointerEvents: 'none' }}/>
        <Link href="/" style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 3 }}>
          AGENCE D&apos;<span style={{ color: 'var(--red)' }}>ANNONCE</span>
        </Link>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
            {['Annonces professionnelles illimitées', 'Réponses acheteurs IA', 'Score qualité de chaque annonce', 'Historique complet'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--muted3)' }}>
                <div style={{ width: 20, height: 20, background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--gold2)', flexShrink: 0 }}>✦</div>
                {f}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--s2)', border: '1px solid var(--gold-border)', borderRadius: 4, padding: '14px 18px', display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 32, color: 'var(--gold2)', letterSpacing: -1 }}>5,99€</span>
            <span style={{ fontSize: 12, color: 'var(--muted2)' }}>/ semaine</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Annulable à tout moment · Non remboursable</div>
      </div>

      {/* Formulaire */}
      <div className="auth-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-up d1">
          <div style={{ marginBottom: 36 }}>
            <div className="label" style={{ marginBottom: 10 }}>Rejoignez-nous</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, letterSpacing: -.5, lineHeight: 1 }}>Créer un compte</h1>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 8 }}>Gratuit · Résultat en 15 secondes</p>
          </div>

          <form onSubmit={submit}>
            {[
              { key: 'name', label: 'Prénom', type: 'text', ph: 'Thomas', req: false },
              { key: 'email', label: 'Adresse e-mail', type: 'email', ph: 'votre@email.com', req: true },
              { key: 'password', label: 'Mot de passe', type: 'password', ph: 'Min. 8 caractères', req: true },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  {f.label}{f.req && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
                </label>
                <input className="input-field" type={f.type} placeholder={f.ph}
                  value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                  required={f.req} minLength={f.key === 'password' ? 8 : undefined}/>
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(200,57,43,.08)', border: '1px solid rgba(200,57,43,.2)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--red2)', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/> Création...</>
              ) : 'CRÉER MON COMPTE'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted2)' }}>
            Déjà un compte ?{' '}
            <Link href="/auth/login" style={{ color: 'var(--gold2)', borderBottom: '1px solid var(--gold-border)', paddingBottom: 1 }}>Se connecter</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/" style={{ fontSize: 12, color: 'var(--muted)' }}>← Retour à l&apos;accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
