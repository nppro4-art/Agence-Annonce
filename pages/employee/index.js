import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function EmployeeDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    const savedCode = localStorage.getItem('emp_code')
    if (savedCode) loadStats(savedCode)
  }, [])

  const loadStats = async (c) => {
    const res = await fetch('/api/employee/stats?code=' + c)
    const data = await res.json()
    if (data.error) { alert('Code invalide'); return }
    setStats(data); setCode(c); localStorage.setItem('emp_code', c)
  }

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://tonsite.com'

  if (!stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 28px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, marginBottom: 20 }}>
          Agence d'<span style={{ color: 'var(--red)' }}>Annonce</span>
          <div style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'DM Sans', fontWeight: 400, letterSpacing: 0 }}>Espace Employé</div>
        </div>
        <input
          style={{ background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 14, padding: '11px 13px', outline: 'none', width: '100%', marginBottom: 12, textAlign: 'center', letterSpacing: 2 }}
          placeholder="Votre code"
          value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadStats(code)}
        />
        <button onClick={() => loadStats(code)}
          style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1, padding: '15px' }}>
          ACCÉDER
        </button>
      </div>
    </div>
  )

  const link = SITE_URL + '/?ref=' + stats.code

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, marginBottom: 4 }}>
          Agence d'<span style={{ color: 'var(--red)' }}>Annonce</span>
        </div>
        <div style={{ fontSize: 20, fontFamily: 'Bebas Neue', color: 'var(--muted2)' }}>Bonjour {stats.name} 👋</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['👆', 'Clics', stats.clicks],
          ['✅', 'Conversions', stats.conversions],
          ['💰', 'Ventes', stats.ventes],
          ['🔄', 'Clients actifs', stats.clientsActifs],
          ['💸', 'Commissions dues', stats.commissionsDues + '€'],
          ['📊', 'Total gagné', stats.commissionsTotal + '€'],
        ].map(([icon, label, value]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: -1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, marginBottom: 10 }}>TON LIEN PERSONNEL</div>
        <div style={{ fontSize: 12, color: 'var(--muted2)', background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>{link}</div>
        <button onClick={() => navigator.clipboard.writeText(link)}
          style={{ width: '100%', background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '10px' }}>
          📋 Copier mon lien
        </button>
      </div>

      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, marginBottom: 10 }}>COMMISSIONS</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'var(--s2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--success)' }}>6€</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 2 }}>Premier mois</div>
          </div>
          <div style={{ flex: 1, background: 'var(--s2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--warning)' }}>2€</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 2 }}>Chaque mois suivant</div>
          </div>
        </div>
      </div>

      <button onClick={() => { localStorage.removeItem('emp_code'); setStats(null); setCode('') }}
        style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '10px', marginTop: 10 }}>
        Changer de compte
      </button>
    </div>
  )
}
