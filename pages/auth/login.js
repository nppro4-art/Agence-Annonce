import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Identifiants incorrects'); setLoading(false); return }
      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) {
      setError('Erreur de connexion. Réessayez.'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>

      {/* Panneau gauche décoratif */}
      <div style={{ flex: 1, background: 'var(--ink)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, rgba(201,168,76,.06) 0%, transparent 60%)', pointerEvents: 'none' }}/>
        <Link href="/" style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 3, color: 'var(--white)' }}>
          AGENCE D&apos;<span style={{ color: 'var(--red)' }}>ANNONCE</span>
        </Link>
        <div>
          <div className="ornament" style={{ marginBottom: 24 }}><span>✦</span></div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.6, color: 'var(--cream)', marginBottom: 16 }}>
            &ldquo;J&apos;ai vendu en 2 jours au lieu de 3 semaines.&rdquo;
          </blockquote>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>— Thomas R., Lyon</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: .5 }}>
          +1 247 vendeurs · 2× plus vite
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-up d1">
          <Link href="/" style={{ display: 'block', marginBottom: 40, fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3 }} className="hide-desktop">
            AGENCE D&apos;<span style={{ color: 'var(--red)' }}>ANNONCE</span>
          </Link>

          <div style={{ marginBottom: 36 }}>
            <div className="label" style={{ marginBottom: 10 }}>Espace personnel</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, letterSpacing: -.5, lineHeight: 1 }}>Connexion</h1>
          </div>

          <form onSubmit={submit}>
            {[
              { key: 'email', label: 'Adresse e-mail', type: 'email', ph: 'votre@email.com' },
              { key: 'password', label: 'Mot de passe', type: 'password', ph: '••••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{f.label}</label>
                <input className="input-field" type={f.type} placeholder={f.ph}
                  value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required/>
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(200,57,43,.08)', border: '1px solid rgba(200,57,43,.2)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--red2)', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/> Connexion...</>
              ) : 'SE CONNECTER'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted2)' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{ color: 'var(--gold2)', borderBottom: '1px solid var(--gold-border)', paddingBottom: 1 }}>S&apos;inscrire</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link href="/" style={{ fontSize: 12, color: 'var(--muted)' }}>← Retour à l&apos;accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
