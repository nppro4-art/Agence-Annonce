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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ref })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur inscription'); setLoading(false); return }

      if (router.query.plan === 'pro') {
        const subRes = await fetch('/api/stripe/create-subscription', { method: 'POST' })
        const subData = await subRes.json()
        if (subData.url) { window.location.href = subData.url; return }
      }

      router.push('/dashboard')
    } catch(e) {
      setError('Erreur de connexion. Réessayez.'); setLoading(false)
    }
  }

  const inp = {
    background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10,
    color: 'var(--white)', fontSize: 14, padding: '11px 13px', outline: 'none',
    width: '100%', marginBottom: 12
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 28px', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, marginBottom: 6 }}>
            Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Créer votre compte gratuit</div>
        </div>
        <form onSubmit={submit}>
          <input style={inp} type="text" placeholder="Prénom" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
          <input style={inp} type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
          <input style={inp} type="password" placeholder="Mot de passe (min 8 caractères)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8}/>
          {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 12, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1, padding: 15, opacity: loading ? .6 : 1 }}>
            {loading ? 'CRÉATION EN COURS...' : 'CRÉER MON COMPTE'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted2)' }}>
          Déjà un compte ? <Link href="/auth/login" style={{ color: 'var(--red)' }}>Se connecter</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--muted2)' }}>← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  )
}
