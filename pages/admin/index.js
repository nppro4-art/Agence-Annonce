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

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user || data.user.role !== 'admin') { router.push('/auth/login'); return }
      loadStats()
    })
  }, [])

  const loadStats = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
      fetch('/api/admin/commissions').then(r => r.json()),
    ]).then(([s, e, c]) => {
      setStats(s); setEmployees(e.employees || []); setCommissions(c.commissions || [])
      setLoading(false)
    })
  }

  const addEmployee = async () => {
    if (!newEmp.name || !newEmp.code) return
    await fetch('/api/admin/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp)
    })
    setNewEmp({ name: '', code: '', email: '', webhook: '' })
    loadStats()
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return
    await fetch('/api/admin/employees?id=' + id, { method: 'DELETE' })
    loadStats()
  }

  const markPaid = async (ids) => {
    await fetch('/api/admin/commissions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    loadStats()
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const nav = { background: 'var(--s1)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }
  const tabs = { display: 'flex', gap: 2, background: 'var(--s2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }
  const tabStyle = (active) => ({ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--white)' : 'var(--muted2)', cursor: 'pointer', borderBottom: active ? '2px solid var(--red)' : '2px solid transparent', whiteSpace: 'nowrap' })
  const container = { maxWidth: 900, margin: '0 auto', padding: '20px 16px 80px' }
  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const inp = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%' }
  const secTitle = { fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 14, color: 'var(--muted2)' }}>Chargement...</div>

  return (
    <div>
      <nav style={nav}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>
          Agence d'<span style={{ color: 'var(--red)' }}>Annonce</span> <span style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'DM Sans', fontWeight: 400 }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>Déconnexion</button>
      </nav>

      <div style={tabs}>
        {[['overview','📊 Vue globale'],['employees','👥 Employés'],['commissions','💸 Commissions'],['settings','⚙️ Paramètres']].map(([id, label]) => (
          <div key={id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      <div style={container}>
        {/* VUE GLOBALE */}
        {tab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                ['👥', 'Utilisateurs', stats.users, 'Total inscrits'],
                ['✅', 'Abonnés Pro', stats.proUsers, 'Actifs ce mois'],
                ['💰', 'CA Brut', stats.CABrut?.toFixed(2) + '€', 'Ce mois'],
                ['📈', 'Bénéfice net', stats.beneficeNet?.toFixed(2) + '€', 'Après commissions'],
                ['💸', 'Commissions', stats.commTotal + '€', 'Dues aux employés'],
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

            {/* Graphique ventes */}
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted2)', marginBottom: 14 }}>Ventes par jour (7 derniers jours)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {(stats.days || []).map((d, i) => {
                  const max = Math.max(...stats.days.map(x => x.ventes), 1)
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: 'var(--red)', borderRadius: '4px 4px 0 0', height: Math.max(4, (d.ventes / max) * 70), opacity: .8 }}></div>
                      <div style={{ fontSize: 8, color: 'var(--muted)', textAlign: 'center' }}>{d.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats employés */}
            <div style={{ ...secTitle }}>PERFORMANCE EMPLOYÉS</div>
            {(stats.empStats || []).map(e => (
              <div key={e.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 16 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'monospace', background: 'var(--s2)', padding: '3px 8px', borderRadius: 4 }}>{e.code}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[['Clics', e.clicks],['Conversions', e.conversions],['Comm. dues', e.commissionsDues + '€']].map(([l,v]) => (
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

        {/* EMPLOYÉS */}
        {tab === 'employees' && (
          <div>
            <div style={{ ...secTitle }}>AJOUTER UN EMPLOYÉ</div>
            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Prénom</label><input style={inp} placeholder="Johan" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})}/></div>
                <div><label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Code unique</label><input style={inp} placeholder="JoJo4" value={newEmp.code} onChange={e => setNewEmp({...newEmp, code: e.target.value})}/></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Webhook Discord</label><input style={inp} placeholder="https://discord.com/api/webhooks/..." value={newEmp.webhook} onChange={e => setNewEmp({...newEmp, webhook: e.target.value})}/></div>
              <button onClick={addEmployee} style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '12px' }}>+ AJOUTER</button>
            </div>

            <div style={secTitle}>MES EMPLOYÉS ({employees.length})</div>
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
                  {process.env.NEXT_PUBLIC_URL || 'https://tonsite.com'}/?ref={e.code}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigator.clipboard.writeText((process.env.NEXT_PUBLIC_URL || '') + '/?ref=' + e.code)} style={{ flex: 1, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '7px' }}>📋 Copier le lien</button>
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
                  <button onClick={() => markPaid([c.id])} style={{ background: 'rgba(0,217,126,.1)', border: '1px solid rgba(0,217,126,.3)', borderRadius: 8, color: 'var(--success)', cursor: 'pointer', fontSize: 11, padding: '6px 10px' }}>✓ Marquer payé</button>
                </div>
              </div>
            ))}

            <div style={{ ...secTitle, marginTop: 20 }}>HISTORIQUE</div>
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
          <div>
            <div style={secTitle}>PARAMÈTRES GÉNÉRAUX</div>
            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Commission 1er mois (€)', '6'],['Commission récurrente (€)', '2'],['Prix abonnement (€)', '19.99'],['Email admin', 'admin@exemple.com']].map(([label, placeholder]) => (
                  <div key={label}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input style={inp} placeholder={placeholder}/>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 14, background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '12px' }}>
                SAUVEGARDER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
