import { useState, useEffect } from 'react'

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Verifier si un code est sauvegarde - sans appel automatique infini
    const saved = typeof window !== 'undefined' ? localStorage.getItem('emp_code') : null
    if (saved) {
      setInput(saved)
    }
    setInitialized(true)
  }, [])

  const loadStats = async (c) => {
    if (!c || !c.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/employee/stats?code=' + c.trim())
      const data = await res.json()
      if (data.error) {
        setError('Code invalide ou inexistant.')
        localStorage.removeItem('emp_code')
        setLoading(false)
        return
      }
      setStats(data)
      setCode(c.trim())
      localStorage.setItem('emp_code', c.trim())
    } catch(e) {
      setError('Erreur de connexion.')
    }
    setLoading(false)
  }

  const handleConnect = () => {
    if (input.trim()) loadStats(input.trim())
  }

  const handleDisconnect = () => {
    localStorage.removeItem('emp_code')
    setStats(null)
    setCode('')
    setInput('')
    setError('')
  }

  if (!initialized) return null

  const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''
  const link = SITE_URL + '/?ref=' + code

  // PAGE CONNEXION
  if (!stats) return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ flex: 1, background: 'var(--ink)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}
        className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 50%, rgba(201,168,76,.05), transparent)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 3 }}>
          A.<span style={{ color: 'var(--red)' }}>A</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic', color: 'var(--gold3)', letterSpacing: 1, marginBottom: 16 }}>Espace affilie</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, letterSpacing: -.5, lineHeight: 1.1, marginBottom: 24, color: 'var(--cream)' }}>
            Suivez vos<br /><span style={{ fontWeight: 700, fontStyle: 'italic' }}>performances</span>
          </h2>
          {[
            '6 EUR au premier paiement',
            '2 EUR par renouvellement',
            'Stats en temps reel',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--muted2)', marginBottom: 10 }}>
              <span style={{ color: 'var(--gold3)', fontSize: 10 }}>+</span>{f}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: .5 }}>annonza.business</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <div className="label" style={{ marginBottom: 10 }}>Acces securise</div>
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
              onKeyDown={e => { if (e.key === 'Enter') handleConnect() }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(200,57,43,.08)', border: '1px solid rgba(200,57,43,.2)', padding: '10px 14px', fontSize: 12, color: 'var(--red2)', marginBottom: 1 }}>
              {error}
            </div>
          )}

          <button onClick={handleConnect} disabled={loading || !input.trim()}
            className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '15px', letterSpacing: 2, opacity: (loading || !input.trim()) ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 1 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Connexion...</>
              : 'ACCEDER'}
          </button>
        </div>
      </div>
    </div>
  )

  // PAGE DASHBOARD AFFILIE
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .db-fade { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) forwards; }
      `}</style>

      <header style={{ background: 'rgba(3,3,3,.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3 }}>
              A.<span style={{ color: 'var(--red)' }}>A</span>
            </span>
            <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 2, color: 'var(--gold3)' }}>AFFILIE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontStyle: 'italic', color: 'var(--muted2)' }}>{stats.name}</span>
            <button onClick={handleDisconnect}
              style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '6px 12px' }}>
              Quitter
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 80px' }} className="db-fade">

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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(201,168,76,.04),transparent)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 10, color: 'var(--gold3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>A recevoir</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 36, color: 'var(--gold2)', letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>{stats.commissionsDues} EUR</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>En attente de versement</div>
          </div>
          <div style={{ background: 'var(--ink)', padding: '20px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Total gagne</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 36, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>{stats.commissionsTotal} EUR</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Depuis le debut</div>
          </div>
        </div>

        {/* Taux conversion */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase' }}>Taux de conversion</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--gold2)', letterSpacing: -1 }}>
              {stats.clicks > 0 ? Math.round((stats.ventes / stats.clicks) * 100) : 0}%
            </div>
          </div>
          <div style={{ background: 'var(--s3)', borderRadius: 1, height: 2, overflow: 'hidden' }}>
            <div style={{ width: (stats.clicks > 0 ? Math.min((stats.ventes / stats.clicks) * 100, 100) : 0) + '%', height: '100%', background: 'linear-gradient(90deg,var(--gold3),var(--gold2))', transition: 'width 1.2s' }} />
          </div>
        </div>

        {/* Lien */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Votre lien personnel</div>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted2)', wordBreak: 'break-all', marginBottom: 10 }}>
            {link}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="btn-ghost" style={{ width: '100%', fontSize: 11, color: copied ? 'var(--gold2)' : 'var(--muted2)', borderColor: copied ? 'var(--gold-border)' : 'var(--border2)' }}>
            {copied ? 'Lien copie !' : 'Copier mon lien'}
          </button>
        </div>

        {/* Structure commissions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
          {[
            { label: 'Premier paiement', val: '6 EUR', sub: 'par nouveau client' },
            { label: 'Chaque renouvellement', val: '2 EUR', sub: 'par client actif' },
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
