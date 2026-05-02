import { useState, useEffect } from 'react'

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('emp_code')
    if (saved) loadStats(saved)
  }, [])

  const loadStats = async (c) => {
    setLoading(true); setError('')
    const res = await fetch('/api/employee/stats?code=' + c)
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError('Code invalide ou inexistant.'); return }
    setStats(data); setCode(c)
    localStorage.setItem('emp_code', c)
  }

  const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''
  const link = SITE_URL + '/?ref=' + code

  if (!stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Panneau gauche */}
      <div style={{ flex: 1, background: 'var(--ink)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}
        className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 50%, rgba(201,168,76,.05), transparent)', pointerEvents: 'none' }}/>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 3 }}>
          A.<span style={{ color: 'var(--red)' }}>A</span>
        </div>
        <div>
          <div className="ornament" style={{ marginBottom: 24 }}><span>✦</span></div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: 'var(--gold3)', letterSpacing: 1, marginBottom: 12 }}>Espace affilié</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, letterSpacing: -.5, lineHeight: 1.1, marginBottom: 20, color: 'var(--cream)' }}>
            Suivez vos<br/><span style={{ fontWeight: 700, fontStyle: 'italic' }}>performances</span>
          </h2>
          {[
            { icon: '◎', text: '6€ au premier paiement' },
            { icon: '◈', text: '2€ par renouvellement' },
            { icon: '✦', text: 'Paiement hebdomadaire' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--muted2)', marginBottom: 10 }}>
              <span style={{ color: 'var(--gold3)', fontSize: 12 }}>{f.icon}</span>{f.text}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: .5 }}>Agence d&apos;Annonce</div>
      </div>

      {/* Formulaire */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <div className="label" style={{ marginBottom: 10 }}>Accès sécurisé</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, letterSpacing: -.5, lineHeight: 1 }}>
              Votre espace
            </h1>
          </div>

          <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
            <label style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Votre code
            </label>
            <input
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 18, fontFamily: 'var(--font-label)', letterSpacing: 3, padding: '8px 0', width: '100%', outline: 'none', textTransform: 'uppercase' }}
              placeholder="XXXX0"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && loadStats(input)}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(200,57,43,.08)', border: '1px solid rgba(200,57,43,.2)', padding: '10px 14px', fontSize: 12, color: 'var(--red2)', marginBottom: 1 }}>
              {error}
            </div>
          )}

          <button onClick={() => loadStats(input)} disabled={loading || !input}
            className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '15px', letterSpacing: 2, opacity: (loading || !input) ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/> Connexion…</> : 'ACCÉDER'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>

      {/* Header */}
      <header style={{ background: 'rgba(3,3,3,.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3 }}>
              A.<span style={{ color: 'var(--red)' }}>A</span>
            </span>
            <div style={{ width: 1, height: 18, background: 'var(--border2)' }}/>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 2, color: 'var(--gold3)' }}>AFFILIÉ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: 'var(--muted2)' }}>{stats.name}</span>
            <button onClick={() => { localStorage.removeItem('emp_code'); setStats(null); setCode(''); setInput('') }}
              style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '6px 12px' }}>
              Quitter
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 80px' }} className="db-fade">

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <div className="label" style={{ marginBottom: 8 }}>Tableau de bord</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>
            Bonjour, <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{stats.name}</span>
          </h1>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
          {[
            { label: 'Clics', val: stats.clicks, sub: 'sur votre lien' },
            { label: 'Ventes', val: stats.ventes, sub: 'abonnements' },
            { label: 'Actifs', val: stats.clientsActifs, sub: 'clients en cours' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--ink)', padding: '20px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Commissions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 24 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(201,168,76,.04),transparent)', pointerEvents: 'none' }}/>
            <div style={{ fontSize: 10, color: 'var(--gold3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>À recevoir</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 36, color: 'var(--gold2)', letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>{stats.commissionsDues}€</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>En attente de versement</div>
          </div>
          <div style={{ background: 'var(--ink)', padding: '20px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Total gagné</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>{stats.commissionsTotal}€</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Depuis le début</div>
          </div>
        </div>

        {/* Taux de conversion */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase' }}>Taux de conversion</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--gold2)', letterSpacing: -1 }}>
              {stats.clicks > 0 ? Math.round((stats.ventes / stats.clicks) * 100) : 0}%
            </div>
          </div>
          <div style={{ background: 'var(--s3)', borderRadius: 1, height: 3, overflow: 'hidden' }}>
            <div style={{ width: (stats.clicks > 0 ? Math.min((stats.ventes / stats.clicks) * 100, 100) : 0) + '%', height: '100%', background: 'linear-gradient(90deg,var(--gold3),var(--gold2))', transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }}/>
          </div>
        </div>

        {/* Lien */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Votre lien personnel</div>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted2)', wordBreak: 'break-all', marginBottom: 12 }}>
            {link}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="btn-ghost" style={{ width: '100%', color: copied ? 'var(--gold2)' : 'var(--muted2)', borderColor: copied ? 'var(--gold-border)' : 'var(--border2)', fontSize: 12 }}>
            {copied ? '✦ Lien copié !' : '□ Copier mon lien'}
          </button>
        </div>

        {/* Commissions structure */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginTop: 16 }}>
          {[
            { label: 'Premier paiement', val: '6€', sub: 'par nouveau client' },
            { label: 'Chaque renouvellement', val: '2€', sub: 'par client actif' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'var(--ink)', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 28, color: 'var(--gold3)', letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{c.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
