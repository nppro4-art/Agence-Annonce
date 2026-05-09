import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Admin() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [commissions, setCommissions] = useState([])
  const [newEmp, setNewEmp] = useState({ name:'',code:'',email:'',webhook:'' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      if (data.user.role !== 'admin') { router.push('/dashboard'); return }
      loadData()
    })
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats').then(r=>r.json()),
      fetch('/api/admin/employees').then(r=>r.json()),
      fetch('/api/admin/commissions').then(r=>r.json()),
    ]).then(([s,e,c]) => {
      setStats(s)
      setEmployees(e.employees||[])
      setCommissions(c.commissions||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2500) }
  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const addEmployee = async () => {
    if (!newEmp.name||!newEmp.code) return
    const res = await fetch('/api/admin/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newEmp)})
    const data = await res.json()
    if (data.error) { showToast('Erreur: '+data.error); return }
    setNewEmp({name:'',code:'',email:'',webhook:''})
    loadData(); showToast(newEmp.name+' ajoute !')
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet affilie et toutes ses commissions ?')) return
    const res = await fetch('/api/admin/employees?id='+id,{method:'DELETE'})
    const data = await res.json()
    if (data.error) { showToast('Erreur: '+data.error); return }
    loadData(); showToast('Affilie supprime')
  }

  const markPaid = async (id) => {
    await fetch('/api/admin/commissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[id]})})
    loadData(); showToast('Commission payee ✓')
  }

  const copyLink = (code) => {
    navigator.clipboard.writeText(window.location.origin+'/?ref='+code)
    showToast('Lien copie !')
  }

  const TABS = [
    {id:'overview',label:'Vue globale'},
    {id:'users',label:'Utilisateurs'},
    {id:'employees',label:'Affilies'},
    {id:'commissions',label:'Commissions'},
    {id:'access',label:'Acces Premium'},
    {id:'settings',label:'Parametres'},
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--black)' }}>
      <div style={{ width:32,height:32,border:'2px solid var(--border2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .tab-btn{transition:all .2s;border-bottom:2px solid transparent}
        .tab-btn:hover{color:var(--cream)!important}
        .tab-btn.active{color:var(--gold2)!important;border-bottom-color:var(--gold)!important}
        .hover-row{transition:background .15s}.hover-row:hover{background:var(--s2)!important}
        input:focus{border-bottom-color:var(--gold)!important;outline:none}
      `}</style>

      {toast && (
        <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'10px 20px',fontSize:13,color:'var(--gold2)',zIndex:9999,whiteSpace:'nowrap',boxShadow:'var(--shadow-gold)' }}>
          ✦ {toast}
        </div>
      )}

      <header style={{ background:'rgba(3,3,3,.95)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ width:'100%',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>A.<span style={{ color:'var(--red)' }}>A</span></span>
            <div style={{ width:1,height:18,background:'var(--border2)' }} />
            <span style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--muted2)' }}>ADMINISTRATION</span>
          </div>
          <nav style={{ display:'flex',flex:1,height:'100%',alignItems:'stretch',justifyContent:'center' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'tab-btn'+(tab===t.id?' active':'')}
                style={{ background:'none',border:'none',borderBottom:'2px solid transparent',color:tab===t.id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,padding:'0 14px',whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={logout} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:11,padding:'6px 12px' }}>Quitter</button>
        </div>
      </header>

      <main style={{ maxWidth:1100,margin:'0 auto',padding:'32px 24px 80px' }}>

        {/* VUE GLOBALE */}
        {tab === 'overview' && stats && (
          <div className="db-fade">
            <div style={{ marginBottom:24 }}>
              <div className="label" style={{ marginBottom:8 }}>Tableau de bord</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Vue globale</h1>
            </div>

            {/* KPIs principaux */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
              {[
                { label:'Utilisateurs',val:stats.users,sub:'inscrits total',color:'var(--cream)' },
                { label:'Abonnes actifs',val:stats.proUsers,sub:'plans payants',color:'var(--gold2)' },
                { label:'CA semaine',val:(stats.CAWeek||0)+'EUR',sub:'revenus bruts',color:'var(--gold2)' },
                { label:'Benefice net',val:(stats.beneficeNet||0)+'EUR',sub:'apres commissions',color:'var(--success2)' },
              ].map((k,i) => (
                <div key={i} style={{ background:'var(--ink)',padding:'20px 24px' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:10 }}>{k.label}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:4,color:k.color }}>{k.val}</div>
                  <div style={{ fontSize:11,color:'var(--muted)' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Stats contenu */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
              {[
                { label:'Annonces totales',val:stats.annonces },
                { label:'Reponses totales',val:stats.reponses },
                { label:'Annonces semaine',val:stats.annoncesWeek },
                { label:'Reponses semaine',val:stats.reponsesWeek },
                { label:'Annonces depuis mai',val:stats.annoncesSince },
                { label:'Reponses depuis mai',val:stats.reponsesSince },
                { label:'Nouveaux cette semaine',val:stats.newUsersWeek },
                { label:'Nouveaux ce mois',val:stats.newUsersMonth },
              ].map((k,i) => (
                <div key={i} style={{ background:'var(--s1)',padding:'14px 20px' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:.8,textTransform:'uppercase',marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:22,letterSpacing:-1,lineHeight:1 }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Objectif mensuel */}
            <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'20px 24px',marginBottom:1 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2,color:'var(--gold3)',marginBottom:4 }}>OBJECTIF 2026</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600 }}>1 000 clients actifs</div>
                </div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:32,color:'var(--gold2)',letterSpacing:-2 }}>
                  {stats.users}<span style={{ fontSize:13,color:'var(--muted2)',letterSpacing:0 }}> / 1 000</span>
                </div>
              </div>
              <div style={{ background:'var(--s3)',borderRadius:2,height:8,overflow:'hidden' }}>
                <div style={{ width:Math.min(((stats.users||0)/1000)*100,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width 1.5s' }} />
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'var(--muted2)' }}>
                <span>{Math.round(((stats.users||0)/1000)*100)}% atteint</span>
                <span>{1000-(stats.users||0)} restants</span>
              </div>
            </div>

            {/* Graphique 7 jours */}
            {stats.days && (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'24px',marginBottom:1 }}>
                <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:20 }}>Abonnements — 7 derniers jours</div>
                <div style={{ display:'flex',alignItems:'flex-end',gap:8,height:80 }}>
                  {stats.days.map((d,i) => {
                    const max = Math.max(...stats.days.map(x=>x.ventes),1)
                    const h = Math.max(3,(d.ventes/max)*72)
                    return (
                      <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                        <div style={{ fontSize:10,color:d.ventes>0?'var(--gold2)':'var(--muted)',fontFamily:'var(--font-label)' }}>{d.ventes>0?d.ventes:''}</div>
                        <div style={{ width:'100%',height:h,background:d.ventes>0?'linear-gradient(180deg,var(--gold2),var(--gold3))':'var(--s3)',borderRadius:'2px 2px 0 0',transition:'height .6s' }} />
                        <div style={{ fontSize:9,color:'var(--muted)',textAlign:'center',letterSpacing:.5 }}>{d.date}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Commissions dues */}
            {parseFloat(stats.commTotal) > 0 && (
              <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'14px 20px',marginBottom:1 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span style={{ fontSize:13,color:'var(--muted2)' }}>Commissions affilies en attente</span>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:22,color:'var(--gold2)',letterSpacing:-1 }}>{stats.commTotal} EUR</span>
                </div>
              </div>
            )}

            {/* Derniers inscrits */}
            {stats.recentUsers && stats.recentUsers.length > 0 && (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'20px 24px' }}>
                <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>Derniers inscrits</div>
                {stats.recentUsers.map((u,i) => (
                  <div key={i} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr 80px 80px 100px',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)',alignItems:'center',fontSize:13 }}>
                    <div>
                      <div style={{ color:'var(--cream)',fontWeight:500 }}>{u.email}</div>
                      <div style={{ fontSize:10,color:'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-label)',fontSize:11,color:u.plan==='pro'?'var(--gold2)':'var(--muted2)',letterSpacing:1 }}>{u.planKey?.toUpperCase()||'FREE'}</div>
                    <div style={{ fontSize:11,color:u.subStatus==='active'?'var(--success2)':'var(--muted)' }}>{u.subStatus==='active'?'● Actif':'○ Inactif'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats affilies */}
            {stats.empStats && stats.empStats.length > 0 && (
              <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginTop:1 }}>
                <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:16 }}>Performance affilies</div>
                {stats.empStats.map(e => (
                  <div key={e.id} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr repeat(3,80px)',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)',alignItems:'center' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:600 }}>{e.name}</div>
                      <div style={{ fontFamily:'monospace',fontSize:10,color:'var(--muted2)' }}>{e.code}</div>
                    </div>
                    {[['Clics',e.clicks],['Conv.',e.conversions],['Comm.',e.commissionsDues+'EUR']].map(([l,v]) => (
                      <div key={l} style={{ textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-label)',fontSize:18,letterSpacing:-1 }}>{v}</div>
                        <div style={{ fontSize:9,color:'var(--muted2)',letterSpacing:.5 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UTILISATEURS */}
        {tab === 'users' && stats && (
          <div className="db-fade">
            <div style={{ marginBottom:24 }}>
              <div className="label" style={{ marginBottom:8 }}>Gestion</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Utilisateurs</h1>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:16 }}>
              {[
                ['Total inscrits',stats.users,'var(--cream)'],
                ['Abonnes actifs',stats.proUsers,'var(--gold2)'],
                ['Gratuit',stats.freeUsers,'var(--muted2)'],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background:'var(--ink)',padding:'20px' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>{l}</div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:32,color:c,letterSpacing:-2,lineHeight:1 }}>{v}</div>
                </div>
              ))}
            </div>
            {stats.recentUsers && stats.recentUsers.length > 0 && (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'20px 24px' }}>
                <div style={{ fontSize:11,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:14 }}>Tous les utilisateurs recents</div>
                {stats.recentUsers.map((u,i) => (
                  <div key={i} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr 80px 80px',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)',alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{u.email}</div>
                      <div style={{ fontSize:10,color:'var(--muted)' }}>{u.name||'Pas de nom'} · {new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-label)',fontSize:11,color:u.plan==='pro'?'var(--gold2)':'var(--muted2)',letterSpacing:1,textAlign:'center' }}>{(u.planKey||'FREE').toUpperCase()}</div>
                    <div style={{ fontSize:11,color:u.subStatus==='active'?'var(--success2)':'var(--muted)',textAlign:'center' }}>{u.subStatus==='active'?'Actif':'Inactif'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AFFILIES */}
        {tab === 'employees' && (
          <div className="db-fade">
            <div style={{ marginBottom:24 }}>
              <div className="label" style={{ marginBottom:8 }}>Reseau</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Affilies</h1>
            </div>

            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:24 }}>
              <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>Ajouter un affilie</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
                {[
                  {key:'name',label:'Prenom',ph:'Johan'},
                  {key:'code',label:'Code unique',ph:'JOHAN1'},
                  {key:'email',label:'Email (optionnel)',ph:'email@...'},
                  {key:'webhook',label:'Webhook Discord (optionnel)',ph:'https://discord.com/api/webhooks/...'},
                ].map(f => (
                  <div key={f.key} style={{ background:'var(--ink)',padding:'14px 16px' }}>
                    <label style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6 }}>{f.label}</label>
                    <input style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',transition:'border-color .2s' }}
                      placeholder={f.ph} value={newEmp[f.key]} onChange={e => setNewEmp({...newEmp,[f.key]:e.target.value})} />
                  </div>
                ))}
              </div>
              <button onClick={addEmployee} className="btn-primary" style={{ width:'100%',marginTop:1,fontSize:12,padding:'14px',letterSpacing:2 }}>
                + AJOUTER L&apos;AFFILIE
              </button>
            </div>

            <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:12 }}>{employees.length} affilie(s)</div>
            {employees.length === 0 ? (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'40px',textAlign:'center',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)' }}>Aucun affilie ajoute</div>
            ) : employees.map(e => (
              <div key={e.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:1 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:2 }}>{e.name}</div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontFamily:'monospace',fontSize:11,color:'var(--muted2)',background:'var(--s3)',padding:'2px 8px' }}>{e.code}</span>
                      {e.email && <span style={{ fontSize:10,color:'var(--muted)' }}>{e.email}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={() => copyLink(e.code)} className="btn-ghost" style={{ fontSize:10,padding:'6px 12px' }}>Copier lien</button>
                    <button onClick={() => deleteEmployee(e.id)} style={{ background:'none',border:'1px solid rgba(200,57,43,.3)',borderRadius:2,color:'var(--red2)',cursor:'pointer',fontSize:10,padding:'6px 12px',transition:'all .15s' }}>Supprimer</button>
                  </div>
                </div>
                <div style={{ fontFamily:'monospace',fontSize:10,color:'var(--muted)',background:'var(--s3)',padding:'8px 12px',wordBreak:'break-all',marginTop:10 }}>
                  {typeof window!=='undefined'?window.location.origin:''}/?ref={e.code}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMMISSIONS */}
        {tab === 'commissions' && (
          <div className="db-fade">
            <div style={{ marginBottom:24 }}>
              <div className="label" style={{ marginBottom:8 }}>Finance</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Commissions</h1>
            </div>
            <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:12 }}>En attente</div>
            {commissions.filter(c=>!c.paid).length === 0 ? (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'32px',textAlign:'center',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)',marginBottom:24 }}>Aucune commission en attente</div>
            ) : commissions.filter(c=>!c.paid).map(c => (
              <div key={c.id} className="hover-row" style={{ background:'var(--ink)',border:'1px solid var(--gold-border)',padding:'16px 20px',marginBottom:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:600,marginBottom:2 }}>{c.employee.name}</div>
                  <div style={{ fontSize:11,color:'var(--muted2)' }}>{c.type==='first'?'Premier paiement':'Renouvellement'} · Plan {c.planKey||'?'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:24,color:'var(--gold2)',letterSpacing:-1 }}>{c.amount} EUR</span>
                  <button onClick={() => markPaid(c.id)} className="btn-gold" style={{ fontSize:11,padding:'8px 16px',letterSpacing:1.5,color:'#030303' }}>PAYER ✓</button>
                </div>
              </div>
            ))}
            <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',margin:'24px 0 12px' }}>Historique</div>
            {commissions.filter(c=>c.paid).length === 0 ? (
              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'24px',textAlign:'center',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted)' }}>Aucun paiement effectue</div>
            ) : commissions.filter(c=>c.paid).map(c => (
              <div key={c.id} className="hover-row" style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'12px 20px',marginBottom:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,opacity:.6 }}>
                <div style={{ fontSize:13,color:'var(--muted2)' }}>{c.employee.name} · {c.type==='first'?'1er':''} · Plan {c.planKey||'?'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:-1 }}>{c.amount} EUR</span>
                  <span style={{ fontSize:10,color:'var(--success2)' }}>✓ Paye</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACCES PREMIUM */}
        {tab === 'access' && <AccessTab showToast={showToast} />}

        {/* PARAMETRES */}
        {tab === 'settings' && <SettingsTab showToast={showToast} />}
      </main>
    </div>
  )
}

function AccessTab({ showToast }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const grant = async () => {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/admin/grant-elite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
    const data = await res.json()
    setLoading(false)
    if (data.success) { showToast(data.message); setEmail('') }
    else showToast('Erreur: '+(data.error||'Inconnue'))
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}>
        <div className="label" style={{ marginBottom:8 }}>Gestion</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Acces Premium gratuit</h1>
      </div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'24px',marginBottom:1 }}>
        <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.7,marginBottom:20 }}>
          Activez un acces <strong style={{ color:'var(--gold2)' }}>Premium illimite</strong> (∞ annonces, ∞ reponses) pour un utilisateur. Il doit avoir cree un compte au prealable.
        </div>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 16px',marginBottom:1 }}>
          <label style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:8 }}>Adresse e-mail</label>
          <input style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none' }}
            type="email" placeholder="email@exemple.com" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter'&&grant()} />
        </div>
        <button onClick={grant} disabled={loading||!email} className="btn-gold"
          style={{ width:'100%',marginTop:1,fontSize:12,padding:'14px',letterSpacing:2,opacity:(loading||!email)?.5:1,color:'#030303' }}>
          {loading ? 'ACTIVATION...' : '∞ ACTIVER ACCES PREMIUM'}
        </button>
      </div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'20px 24px',marginTop:1 }}>
        <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>Ce que Premium inclut</div>
        {['∞ annonces par semaine','∞ reponses acheteurs par semaine','Estimations illimitees','Acces a toutes les fonctionnalites','Badge Premium dans le tableau de bord'].map((f,i) => (
          <div key={i} style={{ display:'flex',gap:10,fontSize:13,color:'var(--muted2)',marginBottom:8 }}>
            <span style={{ color:'var(--gold3)' }}>∞</span>{f}
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab({ showToast }) {
  const [form, setForm] = useState({
    commissionFirst:'6',commissionRecurring:'2',
    commissionStarter:'0.50',commissionBusiness:'1.50',commissionExpert:'2.50',
    adminWebhook:'',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r=>r.json()).then(data => {
      if (data.settings) setForm(f => ({
        ...f,
        commissionFirst: String(data.settings.commissionFirst||6),
        commissionRecurring: String(data.settings.commissionRecurring||2),
        commissionStarter: String(data.settings.commissionStarter||0.50),
        commissionBusiness: String(data.settings.commissionBusiness||1.50),
        commissionExpert: String(data.settings.commissionExpert||2.50),
        adminWebhook: data.settings.adminWebhook||'',
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    setSaving(false)
    showToast(data.success?'Parametres sauvegardes ✓':'Erreur sauvegarde')
  }

  if (loading) return <div style={{ fontSize:13,color:'var(--muted2)',padding:20 }}>Chargement...</div>

  const SECTIONS = [
    { title:'Commission premier paiement (EUR)', fields:[{key:'commissionFirst',label:'Montant fixe 1er paiement',ph:'6'}] },
    { title:'Commissions hebdomadaires par plan', fields:[
      {key:'commissionStarter',label:'Starter (EUR/sem)',ph:'0.50'},
      {key:'commissionBusiness',label:'Business (EUR/sem)',ph:'1.50'},
      {key:'commissionExpert',label:'Expert (EUR/sem)',ph:'2.50'},
    ]},
    { title:'Notifications', fields:[{key:'adminWebhook',label:'Webhook Discord admin',ph:'https://discord.com/api/webhooks/...'}] },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}>
        <div className="label" style={{ marginBottom:8 }}>Configuration</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Parametres</h1>
      </div>
      {SECTIONS.map(section => (
        <div key={section.title} style={{ marginBottom:1 }}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderTop:'2px solid var(--gold-border)' }}>
            <div style={{ padding:'12px 20px',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--gold3)',letterSpacing:2,textTransform:'uppercase' }}>{section.title}</div>
            <div style={{ display:'grid',gridTemplateColumns:section.fields.length===1?'1fr':'1fr 1fr 1fr',gap:0 }}>
              {section.fields.map(f => (
                <div key={f.key} style={{ padding:'16px 20px',borderRight:'1px solid var(--border)' }}>
                  <label style={{ fontSize:10,color:'var(--muted2)',letterSpacing:.8,display:'block',marginBottom:8 }}>{f.label}</label>
                  <input style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',transition:'border-color .2s' }}
                    placeholder={f.ph} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                    onFocus={e=>e.target.style.borderBottomColor='var(--gold)'}
                    onBlur={e=>e.target.style.borderBottomColor='var(--border2)'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button onClick={save} disabled={saving} className="btn-gold"
        style={{ width:'100%',marginTop:16,fontSize:13,padding:'16px',letterSpacing:2,opacity:saving?.6:1,color:'#030303' }}>
        {saving ? 'SAUVEGARDE...' : 'SAUVEGARDER LES PARAMETRES'}
      </button>
    </div>
  )
}
