import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Admin() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [commissions, setCommissions] = useState([])
  const [newEmp, setNewEmp] = useState({ name: '', code: '', email: '', webhook: '' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      if (data.user.role !== 'admin') { router.push('/dashboard'); return }
      loadData()
    })
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
      fetch('/api/admin/commissions').then(r => r.json()),
    ]).then(([s, e, c]) => {
      setStats(s)
      setEmployees(e.employees || [])
      setCommissions(c.commissions || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.code) return
    await fetch('/api/admin/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEmp) })
    setNewEmp({ name: '', code: '', email: '', webhook: '' })
    loadData(); showToast(newEmp.name + ' ajouté !')
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet affilié ?')) return
    await fetch('/api/admin/employees?id=' + id, { method: 'DELETE' })
    loadData(); showToast('Affilié supprimé')
  }

  const markPaid = async (id) => {
    await fetch('/api/admin/commissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
    loadData(); showToast('Commission payée ✓')
  }

  const copyLink = (code) => {
    navigator.clipboard.writeText(window.location.origin + '/?ref=' + code)
    showToast('Lien copié !')
  }

  const TABS = [
    { id: 'overview',    label: 'Vue globale' },
    { id: 'employees',   label: 'Affiliés' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'access',      label: 'Accès Elite' },
    { id: 'settings',    label: 'Paramètres' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }}/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--muted2)', fontStyle: 'italic' }}>Chargement…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .tab-btn{transition:all .2s;border-bottom:2px solid transparent}
        .tab-btn:hover{color:var(--cream)!important}
        .tab-btn.active{color:var(--gold2)!important;border-bottom-color:var(--gold)!important}
        input:focus,select:focus,textarea:focus{border-color:var(--gold-border)!important;outline:none}
        .row-hover{transition:background .15s}
        .row-hover:hover{background:var(--s2)!important}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--s1)', border: '1px solid var(--gold-border)', borderRadius: 3, padding: '10px 20px', fontSize: 13, color: 'var(--gold2)', zIndex: 9999, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-gold)' }}>
          ✦ {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'rgba(3,3,3,.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3 }}>
              A.<span style={{ color: 'var(--red)' }}>A</span>
            </span>
            <div style={{ width: 1, height: 18, background: 'var(--border2)' }}/>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 3, color: 'var(--muted2)' }}>ADMINISTRATION</span>
          </div>
          <nav style={{ display: 'flex', gap: 0, height: '100%', alignItems: 'stretch' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', borderBottom: '2px solid transparent', color: tab === t.id ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, padding: '0 14px', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '6px 12px' }}>
            Quitter
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── VUE GLOBALE ── */}
        {tab === 'overview' && stats && (
          <div className="db-fade">
            <div style={{ marginBottom: 28 }}>
              <div className="label" style={{ marginBottom: 8 }}>Tableau de bord</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>Vue globale</h1>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
              {[
                { label: 'Utilisateurs', val: stats.users, sub: 'inscrits' },
                { label: 'Abonnés Elite', val: stats.proUsers, sub: 'actifs' },
                { label: 'CA brut', val: (stats.CABrut || 0).toFixed(2) + '€', sub: 'ce mois' },
                { label: 'Bénéfice net', val: (stats.beneficeNet || 0).toFixed(2) + '€', sub: 'après commissions' },
                { label: 'Commissions', val: (stats.commTotal || 0) + '€', sub: 'dues aux affiliés' },
                { label: 'Annonces', val: stats.annonces, sub: 'générées total' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'var(--ink)', padding: '20px 24px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, letterSpacing: -1, lineHeight: 1, marginBottom: 4, color: i === 2 || i === 3 ? 'var(--gold2)' : 'var(--cream)' }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Graphique 7 jours */}
            <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '24px', marginBottom: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>Ventes — 7 derniers jours</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                {(stats.days || []).map((d, i) => {
                  const max = Math.max(...(stats.days || []).map(x => x.ventes), 1)
                  const h = Math.max(3, (d.ventes / max) * 72)
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 10, color: d.ventes > 0 ? 'var(--gold2)' : 'var(--muted)', fontFamily: 'var(--font-label)' }}>{d.ventes > 0 ? d.ventes : ''}</div>
                      <div style={{ width: '100%', height: h, background: d.ventes > 0 ? 'linear-gradient(180deg,var(--gold2),var(--gold3))' : 'var(--s3)', borderRadius: '2px 2px 0 0', transition: 'height .6s cubic-bezier(.4,0,.2,1)' }}/>
                      <div style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', letterSpacing: .5 }}>{d.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats affiliés */}
            {(stats.empStats || []).length > 0 && (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Performance affiliés</div>
                {stats.empStats.map(e => (
                  <div key={e.id} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,80px)', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{e.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted2)' }}>{e.code}</div>
                    </div>
                    {[['Clics', e.clicks], ['Conv.', e.conversions], ['Comm.', (e.commissionsDues || 0) + '€']].map(([l, v]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: -1 }}>{v}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: .5 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AFFILIÉS ── */}
        {tab === 'employees' && (
          <div className="db-fade">
            <div style={{ marginBottom: 28 }}>
              <div className="label" style={{ marginBottom: 8 }}>Réseau</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>Affiliés</h1>
            </div>

            {/* Formulaire ajout */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Ajouter un affilié</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
                {[
                  { key: 'name', label: 'Prénom', ph: 'Johan' },
                  { key: 'code', label: 'Code unique', ph: 'JoJo4' },
                ].map(f => (
                  <div key={f.key} style={{ background: 'var(--ink)', padding: '14px 16px' }}>
                    <label style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 14, padding: '6px 0', width: '100%', outline: 'none' }}
                      placeholder={f.ph} value={newEmp[f.key]} onChange={e => setNewEmp({...newEmp, [f.key]: e.target.value})}/>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 1 }}>
                <label style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Webhook Discord (optionnel)</label>
                <input style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 13, padding: '6px 0', width: '100%', outline: 'none' }}
                  placeholder="https://discord.com/api/webhooks/…" value={newEmp.webhook} onChange={e => setNewEmp({...newEmp, webhook: e.target.value})}/>
              </div>
              <button onClick={addEmployee} className="btn-primary" style={{ width: '100%', marginTop: 1, fontSize: 12, padding: '14px', letterSpacing: 2 }}>
                + AJOUTER L&apos;AFFILIÉ
              </button>
            </div>

            {/* Liste */}
            <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              {employees.length} affilié{employees.length > 1 ? 's' : ''}
            </div>
            {employees.length === 0 ? (
              <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '40px', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--muted2)' }}>
                Aucun affilié ajouté
              </div>
            ) : employees.map(e => (
              <div key={e.id} style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 2 }}>{e.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted2)', background: 'var(--s3)', padding: '2px 8px' }}>{e.code}</span>
                      <span style={{ fontSize: 10, color: e.webhook ? 'var(--success2)' : 'var(--muted)' }}>
                        {e.webhook ? '● Discord actif' : '○ Pas de webhook'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyLink(e.code)} className="btn-ghost" style={{ fontSize: 10, padding: '6px 12px' }}>Copier lien</button>
                    <button onClick={() => deleteEmployee(e.id)} style={{ background: 'none', border: '1px solid rgba(200,57,43,.3)', borderRadius: 2, color: 'var(--red2)', cursor: 'pointer', fontSize: 10, padding: '6px 12px', transition: 'all .15s' }}>Supprimer</button>
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', background: 'var(--s3)', padding: '8px 12px', wordBreak: 'break-all' }}>
                  {window.location.origin}/?ref={e.code}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {tab === 'commissions' && (
          <div className="db-fade">
            <div style={{ marginBottom: 28 }}>
              <div className="label" style={{ marginBottom: 8 }}>Finance</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>Commissions</h1>
            </div>

            <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>En attente</div>
            {commissions.filter(c => !c.paid).length === 0 ? (
              <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '32px', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--muted2)', marginBottom: 24 }}>
                Aucune commission en attente
              </div>
            ) : commissions.filter(c => !c.paid).map(c => (
              <div key={c.id} className="row-hover" style={{ background: 'var(--ink)', border: '1px solid var(--gold-border)', padding: '16px 20px', marginBottom: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{c.employee.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{c.type === 'first' ? 'Premier paiement' : 'Récurrent'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 24, color: 'var(--gold2)', letterSpacing: -1 }}>{c.amount}€</span>
                  <button onClick={() => markPaid(c.id)} className="btn-gold" style={{ fontSize: 11, padding: '8px 16px', letterSpacing: 1.5 }}>
                    PAYER ✓
                  </button>
                </div>
              </div>
            ))}

            <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', margin: '24px 0 12px' }}>Historique</div>
            {commissions.filter(c => c.paid).length === 0 ? (
              <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--muted)' }}>
                Aucun paiement effectué
              </div>
            ) : commissions.filter(c => c.paid).map(c => (
              <div key={c.id} className="row-hover" style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '12px 20px', marginBottom: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: .6 }}>
                <div style={{ fontSize: 13, color: 'var(--muted2)' }}>{c.employee.name} · {c.type === 'first' ? 'Premier' : 'Récurrent'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: -1 }}>{c.amount}€</span>
                  <span style={{ fontSize: 10, color: 'var(--success2)' }}>✓ Payé</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACCÈS ELITE ── */}
        {tab === 'access' && <AccessTab showToast={showToast}/>}

        {/* ── PARAMÈTRES ── */}
        {tab === 'settings' && <SettingsTab showToast={showToast}/>}

      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// ACCESS TAB
// ─────────────────────────────────────────────────────────
function AccessTab({ showToast }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const grantElite = async () => {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/admin/grant-elite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) { showToast(data.message); setEmail('') }
    else showToast('Erreur : ' + (data.error || 'Inconnue'))
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ marginBottom: 8 }}>Gestion</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>Accès Elite gratuit</h1>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', padding: '24px', marginBottom: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(201,168,76,.03),transparent)', pointerEvents: 'none' }}/>
        <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7, marginBottom: 20 }}>
          Activez le plan Elite gratuitement pour un utilisateur. Il doit d&apos;abord avoir créé un compte sur le site.
        </div>
        <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 1 }}>
          <label style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Adresse e-mail</label>
          <input
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 14, padding: '6px 0', width: '100%', outline: 'none' }}
            type="email" placeholder="email@exemple.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && grantElite()}/>
        </div>
        <button onClick={grantElite} disabled={loading || !email} className="btn-gold"
          style={{ width: '100%', marginTop: 1, fontSize: 12, padding: '14px', letterSpacing: 2, opacity: (loading || !email) ? .5 : 1 }}>
          {loading ? 'ACTIVATION…' : '⚡ ACTIVER ELITE GRATUITEMENT'}
        </button>
      </div>

      <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '20px 24px', marginTop: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Comment ça marche</div>
        {[
          "L'utilisateur crée un compte normalement sur le site",
          "Vous entrez son email ici et cliquez sur Activer",
          "Son compte passe instantanément en Elite sans paiement",
          "L'accès Elite est permanent jusqu'à révocation manuelle via Supabase",
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 14, color: 'var(--gold3)', flexShrink: 0 }}>{i + 1}.</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────────────────
function SettingsTab({ showToast }) {
  const [form, setForm] = useState({ commissionFirst: '6', commissionRecurring: '2', stripePrice: '5.99', adminWebhook: '', stripeLinkWeekly: '', stripeLinkMonthly: '', stripeLinkPack5: '', stripeLinkPack10: '', stripeLinkRep50: '', stripeLinkRep500: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.settings) setForm(f => ({ ...f, commissionFirst: String(data.settings.commissionFirst || 6), commissionRecurring: String(data.settings.commissionRecurring || 2), stripePrice: String(data.settings.stripePrice || 5.99), adminWebhook: data.settings.adminWebhook || '' }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    showToast(data.success ? 'Paramètres sauvegardés ✓' : 'Erreur sauvegarde')
  }

  const SECTIONS = [
    { title: 'Commissions affiliés', fields: [
      { key: 'commissionFirst', label: 'Commission 1er paiement (€)', type: 'number' },
      { key: 'commissionRecurring', label: 'Commission récurrente (€)', type: 'number' },
    ]},
    { title: 'Prix', fields: [
      { key: 'stripePrice', label: 'Prix abonnement hebdo (€)', type: 'number' },
    ]},
    { title: 'Liens Stripe — Abonnements', fields: [
      { key: 'stripeLinkWeekly', label: 'Lien abonnement hebdo (5,99€/sem)', ph: 'https://buy.stripe.com/…' },
      { key: 'stripeLinkMonthly', label: 'Lien abonnement mensuel (optionnel)', ph: 'https://buy.stripe.com/…' },
    ]},
    { title: 'Liens Stripe — Packs annonces', fields: [
      { key: 'stripeLinkPack5', label: 'Pack 5 annonces (9,99€)', ph: 'https://buy.stripe.com/…' },
      { key: 'stripeLinkPack10', label: 'Pack 10 annonces (17,99€)', ph: 'https://buy.stripe.com/…' },
    ]},
    { title: 'Liens Stripe — Packs réponses', fields: [
      { key: 'stripeLinkRep50', label: 'Pack 50 réponses (14,99€)', ph: 'https://buy.stripe.com/…' },
      { key: 'stripeLinkRep500', label: 'Pack 500 réponses (39,99€)', ph: 'https://buy.stripe.com/…' },
    ]},
    { title: 'Notifications', fields: [
      { key: 'adminWebhook', label: 'Webhook Discord admin', ph: 'https://discord.com/api/webhooks/…' },
    ]},
  ]

  if (loading) return <div style={{ fontSize: 13, color: 'var(--muted2)', padding: 20 }}>Chargement…</div>

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ marginBottom: 8 }}>Configuration</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: -.5 }}>Paramètres</h1>
      </div>

      {SECTIONS.map(section => (
        <div key={section.title} style={{ marginBottom: 1 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold-border)', padding: '0' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--gold3)', letterSpacing: 2, textTransform: 'uppercase' }}>
              {section.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: section.fields.length === 1 ? '1fr' : '1fr 1fr', gap: 0 }}>
              {section.fields.map(f => (
                <div key={f.key} style={{ padding: '16px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: .8, display: 'block', marginBottom: 8 }}>{f.label}</label>
                  <input
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 14, padding: '6px 0', width: '100%', outline: 'none', transition: 'border-color .2s' }}
                    type={f.type || 'text'}
                    placeholder={f.ph || ''}
                    value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    onFocus={e => e.target.style.borderBottomColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderBottomColor = 'var(--border2)'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button onClick={save} disabled={saving} className="btn-gold"
        style={{ width: '100%', marginTop: 16, fontSize: 13, padding: '16px', letterSpacing: 2, opacity: saving ? .6 : 1 }}>
        {saving ? 'SAUVEGARDE…' : '◈ SAUVEGARDER LES PARAMÈTRES'}
      </button>
    </div>
  )
}
