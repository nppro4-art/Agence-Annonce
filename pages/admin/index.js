import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'


function SettingsTab({ card, inp, secTitle, showToast }) {
  const [form, setForm] = useState({
    commissionFirst: '6',
    commissionRecurring: '2',
    stripePrice: '5.99',
    adminWebhook: '',
    stripeLinkWeekly: '',
    stripeLinkMonthly: '',
    stripeLinkPack5: '',
    stripeLinkPack10: '',
    stripeLinkRep20: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.settings) {
        setForm(f => ({
          ...f,
          commissionFirst: String(data.settings.commissionFirst || 6),
          commissionRecurring: String(data.settings.commissionRecurring || 2),
          stripePrice: String(data.settings.stripePrice || 5.99),
          adminWebhook: data.settings.adminWebhook || '',
        }))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) showToast('Paramètres sauvegardés !')
    else showToast('Erreur lors de la sauvegarde')
  }

  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }

  if (loading) return <div style={{ fontSize: 13, color: 'var(--muted2)', padding: 20 }}>Chargement...</div>

  return (
    <div>
      <div style={secTitle}>COMMISSIONS</div>
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Commission 1er paiement (€)</label>
            <input style={inp} type="number" step="0.5" value={form.commissionFirst} onChange={e => setForm({...form, commissionFirst: e.target.value})}/>
          </div>
          <div>
            <label style={lbl}>Commission récurrente (€)</label>
            <input style={inp} type="number" step="0.5" value={form.commissionRecurring} onChange={e => setForm({...form, commissionRecurring: e.target.value})}/>
          </div>
        </div>
      </div>

      <div style={secTitle}>PRIX & ABONNEMENTS</div>
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Prix abonnement hebdo (€/semaine)</label>
            <input style={inp} type="number" step="0.01" value={form.stripePrice} onChange={e => setForm({...form, stripePrice: e.target.value})}/>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Lien Stripe — Abonnement hebdomadaire (5,99€/sem)</label>
          <input style={inp} placeholder="https://buy.stripe.com/..." value={form.stripeLinkWeekly} onChange={e => setForm({...form, stripeLinkWeekly: e.target.value})}/>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Lien Stripe — Abonnement mensuel (19,99€/mois)</label>
          <input style={inp} placeholder="https://buy.stripe.com/..." value={form.stripeLinkMonthly} onChange={e => setForm({...form, stripeLinkMonthly: e.target.value})}/>
        </div>
      </div>

      <div style={secTitle}>LIENS STRIPE — PACKS</div>
      <div style={card}>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Pack 5 annonces (7,99€)</label>
          <input style={inp} placeholder="https://buy.stripe.com/..." value={form.stripeLinkPack5} onChange={e => setForm({...form, stripeLinkPack5: e.target.value})}/>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Pack 10 annonces (13,99€)</label>
          <input style={inp} placeholder="https://buy.stripe.com/..." value={form.stripeLinkPack10} onChange={e => setForm({...form, stripeLinkPack10: e.target.value})}/>
        </div>
        <div>
          <label style={lbl}>Pack 20 réponses (9,99€)</label>
          <input style={inp} placeholder="https://buy.stripe.com/..." value={form.stripeLinkRep20} onChange={e => setForm({...form, stripeLinkRep20: e.target.value})}/>
        </div>
      </div>

      <div style={secTitle}>NOTIFICATIONS</div>
      <div style={card}>
        <div>
          <label style={lbl}>Webhook Discord admin (global)</label>
          <input style={inp} placeholder="https://discord.com/api/webhooks/..." value={form.adminWebhook} onChange={e => setForm({...form, adminWebhook: e.target.value})}/>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ width: '100%', background: saving ? 'var(--s4)' : 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '14px', marginTop: 4, transition: 'all .2s' }}>
        {saving ? 'SAUVEGARDE EN COURS...' : '💾 SAUVEGARDER LES PARAMÈTRES'}
      </button>
    </div>
  )
}

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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.code) return
    await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp)
    })
    setNewEmp({ name: '', code: '', email: '', webhook: '' })
    loadData()
    showToast(newEmp.name + ' ajouté !')
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet affilié ?')) return
    await fetch('/api/admin/employees?id=' + id, { method: 'DELETE' })
    loadData()
    showToast('Affilié supprimé')
  }

  const markPaid = async (id) => {
    await fetch('/api/admin/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] })
    })
    loadData()
    showToast('Commission marquée payée')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const copyLink = (code) => {
    const url = window.location.origin + '/?ref=' + code
    navigator.clipboard.writeText(url)
    showToast('Lien copié !')
  }

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const inp = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%' }
  const tabStyle = (active) => ({ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--white)' : 'var(--muted2)', cursor: 'pointer', borderBottom: active ? '2px solid var(--red)' : '2px solid transparent', whiteSpace: 'nowrap' })
  const secTitle = { fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 12 }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 14, color: 'var(--muted2)' }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--s1)', border: '1px solid var(--success)', borderRadius: 10, padding: '10px 18px', fontSize: 13, color: 'var(--success)', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* NAV */}
      <nav style={{ background: 'var(--s1)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>
          Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
          <span style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'DM Sans', fontWeight: 400, marginLeft: 8 }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>
          Déconnexion
        </button>
      </nav>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--s2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }}>
        {[['overview','📊 Vue globale'],['employees','👥 Affiliés'],['commissions','💸 Commissions'],['settings','⚙️ Paramètres']].map(([id, label]) => (
          <div key={id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* VUE GLOBALE */}
        {tab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                ['👥', 'Utilisateurs', stats.users, 'Total inscrits'],
                ['✅', 'Abonnés Elite', stats.proUsers, 'Actifs'],
                ['💰', 'CA Brut', (stats.CABrut || 0).toFixed(2) + '€', 'Ce mois'],
                ['📈', 'Bénéfice net', (stats.beneficeNet || 0).toFixed(2) + '€', 'Après commissions'],
                ['💸', 'Commissions', (stats.commTotal || 0) + '€', 'Dues aux affiliés'],
                ['📝', 'Annonces', stats.annonces, 'Générées total'],
              ].map(([icon, label, value, sub]) => (
                <div key={label} style={card}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: -1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Graphique */}
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted2)', marginBottom: 14 }}>Ventes par jour (7 derniers jours)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {(stats.days || []).map((d, i) => {
                  const max = Math.max(...(stats.days || []).map(x => x.ventes), 1)
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: 'var(--red)', borderRadius: '4px 4px 0 0', height: Math.max(4, (d.ventes / max) * 70), opacity: .8 }}></div>
                      <div style={{ fontSize: 8, color: 'var(--muted)', textAlign: 'center' }}>{d.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats affiliés */}
            <div style={secTitle}>PERFORMANCE AFFILIÉS</div>
            {(stats.empStats || []).length === 0 && (
              <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 24 }}>Aucun affilié ajouté</div>
            )}
            {(stats.empStats || []).map(e => (
              <div key={e.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 16 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'monospace', background: 'var(--s2)', padding: '3px 8px', borderRadius: 4 }}>{e.code}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[['Clics', e.clicks], ['Conversions', e.conversions], ['Comm. dues', (e.commissionsDues || 0) + '€']].map(([l, v]) => (
                    <div key={l} style={{ textAlign: 'center', background: 'var(--s2)', borderRadius: 8, padding: '8px 4px' }}>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>{v}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AFFILIÉS */}
        {tab === 'employees' && (
          <div>
            <div style={secTitle}>AJOUTER UN AFFILIÉ</div>
            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Prénom</label>
                  <input style={inp} placeholder="Johan" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})}/>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Code unique</label>
                  <input style={inp} placeholder="JoJo4" value={newEmp.code} onChange={e => setNewEmp({...newEmp, code: e.target.value})}/>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Webhook Discord (optionnel)</label>
                <input style={inp} placeholder="https://discord.com/api/webhooks/..." value={newEmp.webhook} onChange={e => setNewEmp({...newEmp, webhook: e.target.value})}/>
              </div>
              <button onClick={addEmployee} style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '12px' }}>
                + AJOUTER L&apos;AFFILIÉ
              </button>
            </div>

            <div style={secTitle}>MES AFFILIÉS ({employees.length})</div>
            {employees.length === 0 && (
              <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 24 }}>Aucun affilié ajouté</div>
            )}
            {employees.map(e => (
              <div key={e.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 2 }}>{e.webhook ? '🟢 Webhook configuré' : '🔴 Pas de webhook'}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--s2)', padding: '4px 10px', borderRadius: 6 }}>{e.code}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', background: 'var(--s2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {typeof window !== 'undefined' ? window.location.origin : 'https://tonsite.com'}/?ref={e.code}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => copyLink(e.code)} style={{ flex: 1, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '7px' }}>📋 Copier le lien</button>
                  <button onClick={() => deleteEmployee(e.id)} style={{ flex: 1, background: 'var(--s2)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 11, padding: '7px' }}>🗑️ Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMMISSIONS */}
        {tab === 'commissions' && (
          <div>
            <div style={secTitle}>COMMISSIONS EN ATTENTE</div>
            {commissions.filter(c => !c.paid).length === 0 && (
              <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 24 }}>Aucune commission en attente</div>
            )}
            {commissions.filter(c => !c.paid).map(c => (
              <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 15 }}>{c.employee.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{c.type === 'first' ? 'Premier mois' : 'Récurrent'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--success)' }}>{c.amount}€</div>
                  <button onClick={() => markPaid(c.id)} style={{ background: 'rgba(0,217,126,.1)', border: '1px solid rgba(0,217,126,.3)', borderRadius: 8, color: 'var(--success)', cursor: 'pointer', fontSize: 11, padding: '6px 10px' }}>
                    ✓ Payé
                  </button>
                </div>
              </div>
            ))}

            <div style={{ ...secTitle, marginTop: 20 }}>HISTORIQUE</div>
            {commissions.filter(c => c.paid).length === 0 && (
              <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 24 }}>Aucune commission payée</div>
            )}
            {commissions.filter(c => c.paid).slice(0, 10).map(c => (
              <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: .6 }}>
                <div>
                  <div style={{ fontSize: 13 }}>{c.employee.name} · {c.type === 'first' ? 'Premier mois' : 'Récurrent'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 18 }}>{c.amount}€</div>
                  <span style={{ fontSize: 10, color: 'var(--success)' }}>✓ Payé</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <SettingsTab card={card} inp={inp} secTitle={secTitle} showToast={showToast} />
        )}

      </div>
    </div>
  )
}
