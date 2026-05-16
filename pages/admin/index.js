import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const S = {
  card: { background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px',marginBottom:12 },
  lbl: { fontSize:9,color:'var(--muted2)',letterSpacing:'2px',textTransform:'uppercase',display:'block',marginBottom:8,fontFamily:'var(--font-label)' },
  inp: { background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:3,color:'var(--white)',fontSize:13,padding:'10px 14px',width:'100%',outline:'none',transition:'all .2s',fontFamily:'var(--font-ui)' },
}

export default function Admin() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [commissions, setCommissions] = useState([])
  const [avis, setAvis] = useState([])
  const [newEmp, setNewEmp] = useState({ name:'',code:'',email:'',webhook:'' })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

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
      fetch('/api/admin/avis').then(r=>r.json()).catch(()=>({ avis:[] })),
    ]).then(([s,e,c,av]) => {
      setStats(s)
      setEmployees(e.employees||[])
      setCommissions(c.commissions||[])
      setAvis(av.avis||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const addEmployee = async () => {
    if (!newEmp.name||!newEmp.code) return
    const res = await fetch('/api/admin/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newEmp)})
    const data = await res.json()
    if (data.error) { showToast('Erreur: '+data.error,'error'); return }
    setNewEmp({name:'',code:'',email:'',webhook:''})
    loadData(); showToast(newEmp.name+' ajouté !')
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet affilié ?')) return
    const res = await fetch('/api/admin/employees?id='+id,{method:'DELETE'})
    const data = await res.json()
    if (data.error) { showToast('Erreur: '+data.error,'error'); return }
    loadData(); showToast('Affilié supprimé')
  }

  const markPaid = async (id) => {
    await fetch('/api/admin/commissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[id]})})
    loadData(); showToast('Commission payée ✓')
  }

  const moderateAvis = async (id, action) => {
    const res = await fetch('/api/admin/avis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})})
    const data = await res.json()
    if (data.success) { loadData(); showToast(action==='approve'?'Avis publié !':'Avis rejeté') }
  }

  const copyLink = (code) => {
    navigator.clipboard.writeText((typeof window!=='undefined'?window.location.origin:'')+'/?ref='+code)
    showToast('Lien copié !')
  }

  const TABS = [
    { id:'overview', label:'Vue globale', icon:'◈' },
    { id:'users', label:'Utilisateurs', icon:'◎' },
    { id:'employees', label:'Affiliés', icon:'◇' },
    { id:'commissions', label:'Commissions', icon:'✦' },
    { id:'avis', label:'Avis', icon:'★' },
    { id:'access', label:'Premium', icon:'∞' },
    { id:'settings', label:'Paramètres', icon:'⚙' },
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--black)',gap:16 }}>
      <div style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:4,color:'var(--gold2)' }}>ADMINISTRATION</div>
      <div style={{ width:24,height:24,border:'1.5px solid rgba(201,168,76,.2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const pendingAvis = avis.filter(a => a.statut === 'pending').length

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--cream)',fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .tab-btn{transition:all .2s;position:relative}
        .tab-btn::after{content:'';position:absolute;bottom:0;left:50%;right:50%;height:1px;background:var(--gold);transition:all .25s}
        .tab-btn:hover{color:var(--cream)!important}
        .tab-btn:hover::after{left:10%;right:10%}
        .tab-btn.active{color:var(--gold2)!important}
        .tab-btn.active::after{left:0;right:0}
        .hover-row{transition:background .15s}.hover-row:hover{background:rgba(201,168,76,.03)!important}
        input:focus,textarea:focus{border-color:var(--gold-border)!important;outline:none}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:'var(--s1)',border:'1px solid',borderColor:toast.type==='error'?'rgba(200,57,43,.3)':'var(--gold-border)',borderRadius:4,padding:'11px 22px',fontSize:13,color:toast.type==='error'?'var(--red2)':'var(--gold2)',zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 8px 32px rgba(0,0,0,.6)',animation:'slideIn .25s ease' }}>
          {toast.type==='error'?'✕':'✦'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background:'rgba(17,10,10,.97)',borderBottom:'1px solid rgba(201,168,76,.12)',backdropFilter:'blur(24px)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:14,flexShrink:0 }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:15,letterSpacing:4 }}>A.<span style={{ color:'var(--red)' }}>A</span></span>
            <div style={{ width:1,height:16,background:'var(--border2)' }} />
            <span style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--muted2)' }}>ADMIN</span>
          </div>
          <nav style={{ display:'flex',flex:1,height:'100%',alignItems:'stretch',justifyContent:'center',overflow:'hidden' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'tab-btn'+(tab===t.id?' active':'')}
                style={{ background:'none',border:'none',color:tab===t.id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:10,letterSpacing:1.5,padding:'0 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',position:'relative' }}>
                {t.label}
                {t.id==='avis'&&pendingAvis>0&&<span style={{ background:'var(--red)',color:'white',borderRadius:'50%',width:14,height:14,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',top:10,right:4 }}>{pendingAvis}</span>}
              </button>
            ))}
          </nav>
          <button onClick={logout} style={{ background:'none',border:'1px solid rgba(255,255,255,.06)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:10,padding:'6px 12px',flexShrink:0,transition:'all .2s' }}>↪</button>
        </div>
      </header>

      <main style={{ maxWidth:1200,margin:'0 auto',padding:'36px 24px 100px' }}>

        {/* VUE GLOBALE */}
        {tab==='overview' && stats && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>TABLEAU DE BORD</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Vue globale</h1>
            </div>

            {/* KPIs */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
              {[
                { label:'Utilisateurs',val:stats.users,sub:'inscrits total',color:'var(--cream)',icon:'◎' },
                { label:'Abonnés actifs',val:stats.proUsers,sub:'plans payants',color:'var(--gold2)',icon:'✦' },
                { label:'CA semaine',val:(stats.CAWeek||0)+' €',sub:'revenus bruts',color:'var(--gold2)',icon:'↑' },
                { label:'Bénéfice net',val:(stats.beneficeNet||0)+' €',sub:'après commissions',color:'var(--success2)',icon:'◈' },
              ].map((k,i) => (
                <div key={i} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px',position:'relative',overflow:'hidden' }}>
                  <div style={{ position:'absolute',top:12,right:14,fontSize:18,opacity:.08 }}>{k.icon}</div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:10 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:4,color:k.color }}>{k.val}</div>
                  <div style={{ fontSize:11,color:'var(--muted)' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Stats contenu */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20 }}>
              {[
                ['Annonces totales',stats.annonces],
                ['Réponses totales',stats.reponses],
                ['Annonces semaine',stats.annoncesWeek],
                ['Réponses semaine',stats.reponsesWeek],
                ['Nouveaux semaine',stats.newUsersWeek],
                ['Nouveaux mois',stats.newUsersMonth],
                ['Gratuits',stats.freeUsers],
                ['Comm. dues',stats.commTotal+' €'],
              ].map(([l,v]) => (
                <div key={l} style={{ background:'rgba(255,255,255,.02)',border:'1px solid var(--border)',borderRadius:3,padding:'14px 16px' }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:8,color:'var(--muted)',letterSpacing:1.5,marginBottom:6 }}>{l.toUpperCase()}</div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:22,letterSpacing:-1,color:'var(--cream)' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Objectif */}
            <div style={{ ...S.card,border:'1px solid rgba(201,168,76,.2)',background:'linear-gradient(135deg,rgba(201,168,76,.05),rgba(201,168,76,.01))',marginBottom:20 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:2.5,color:'var(--gold3)',marginBottom:4 }}>OBJECTIF 2026</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:500 }}>1 000 clients actifs</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:34,fontWeight:300,letterSpacing:-2,color:'var(--gold2)',lineHeight:1 }}>{stats.users}<span style={{ fontSize:14,color:'var(--muted2)',letterSpacing:0 }}> / 1000</span></div>
                  <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{Math.round(((stats.users||0)/1000)*100)}% atteint</div>
                </div>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)',borderRadius:4,height:6,overflow:'hidden' }}>
                <div style={{ width:Math.min(((stats.users||0)/1000)*100,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',borderRadius:4,transition:'width 1.5s' }} />
              </div>
            </div>

            {/* Graphique 7 jours */}
            {stats.days && (
              <div style={{ ...S.card,marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:20 }}>ABONNEMENTS — 7 DERNIERS JOURS</div>
                <div style={{ display:'flex',alignItems:'flex-end',gap:8,height:90 }}>
                  {stats.days.map((d,i) => {
                    const max = Math.max(...stats.days.map(x=>x.ventes),1)
                    const h = Math.max(4,(d.ventes/max)*78)
                    return (
                      <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                        <div style={{ fontFamily:'var(--font-label)',fontSize:10,color:d.ventes>0?'var(--gold2)':'transparent' }}>{d.ventes}</div>
                        <div style={{ width:'100%',height:h,background:d.ventes>0?'linear-gradient(180deg,var(--gold2),var(--gold3))':'rgba(255,255,255,.05)',borderRadius:'3px 3px 0 0',transition:'height .6s' }} />
                        <div style={{ fontSize:9,color:'var(--muted)',letterSpacing:.5 }}>{d.date}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Derniers inscrits */}
            {stats.recentUsers?.length > 0 && (
              <div style={S.card}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:16 }}>DERNIERS INSCRITS</div>
                {stats.recentUsers.map((u,i) => (
                  <div key={i} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr 90px 80px 90px',gap:12,padding:'11px 0',borderBottom:i<stats.recentUsers.length-1?'1px solid rgba(255,255,255,.04)':'none',alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{u.email}</div>
                      <div style={{ fontSize:10,color:'var(--muted)',marginTop:2 }}>{u.name||'—'} · {new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-label)',fontSize:10,color:u.plan==='pro'?'var(--gold2)':'var(--muted2)',letterSpacing:1 }}>{(u.planKey||'FREE').toUpperCase()}</div>
                    <div style={{ fontSize:11,color:u.subStatus==='active'?'var(--success2)':'var(--muted)' }}>{u.subStatus==='active'?'● Actif':'○ Inactif'}</div>
                    <div style={{ fontSize:10,color:'var(--muted2)' }}>{u.refBy?'Ref: '+u.refBy:'Direct'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Perf affiliés */}
            {stats.empStats?.length > 0 && (
              <div style={{ ...S.card,marginTop:12 }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:16 }}>PERFORMANCE AFFILIÉS</div>
                {stats.empStats.map(e => (
                  <div key={e.id} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr repeat(3,90px)',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.04)',alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:14,fontWeight:500 }}>{e.name}</div>
                      <div style={{ fontFamily:'monospace',fontSize:10,color:'var(--muted2)',marginTop:2 }}>{e.code}</div>
                    </div>
                    {[['Clics',e.clicks],['Conversions',e.conversions],['Comm. dues',e.commissionsDues+'€']].map(([l,v]) => (
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
        {tab==='users' && stats && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>GESTION</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Utilisateurs</h1>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20 }}>
              {[['Total inscrits',stats.users,'var(--cream)'],['Abonnés actifs',stats.proUsers,'var(--gold2)'],['Plan gratuit',stats.freeUsers,'var(--muted2)']].map(([l,v,c]) => (
                <div key={l} style={{ ...S.card,marginBottom:0,textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:8 }}>{l.toUpperCase()}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:32,fontWeight:300,letterSpacing:-2,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            {stats.recentUsers?.length > 0 && (
              <div style={S.card}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:16 }}>LISTE UTILISATEURS</div>
                {stats.recentUsers.map((u,i) => (
                  <div key={i} className="hover-row" style={{ display:'grid',gridTemplateColumns:'1fr 100px 80px',gap:12,padding:'12px 0',borderBottom:i<stats.recentUsers.length-1?'1px solid rgba(255,255,255,.04)':'none',alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{u.email}</div>
                      <div style={{ fontSize:10,color:'var(--muted)',marginTop:2 }}>{u.name||'Sans nom'} · {new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <div style={{ fontFamily:'var(--font-label)',fontSize:10,color:u.plan==='pro'?'var(--gold2)':'var(--muted2)',letterSpacing:1 }}>{(u.planKey||'FREE').toUpperCase()}</div>
                    <div style={{ fontSize:11,color:u.subStatus==='active'?'var(--success2)':'var(--muted)',textAlign:'right' }}>{u.subStatus==='active'?'● Actif':'○'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AFFILIES */}
        {tab==='employees' && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>RÉSEAU</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Affiliés</h1>
            </div>
            <div style={{ ...S.card,border:'1px solid rgba(201,168,76,.15)',marginBottom:20 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--gold3)',letterSpacing:2,marginBottom:16 }}>AJOUTER UN AFFILIÉ</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
                {[{key:'name',label:'Prénom',ph:'Johan'},{key:'code',label:'Code unique',ph:'JOHAN1'},{key:'email',label:'Email (optionnel)',ph:'email@...'},{key:'webhook',label:'Webhook Discord',ph:'https://discord.com/...'}].map(f => (
                  <div key={f.key}>
                    <label style={S.lbl}>{f.label}</label>
                    <input style={S.inp} placeholder={f.ph} value={newEmp[f.key]} onChange={e=>setNewEmp({...newEmp,[f.key]:e.target.value})} />
                  </div>
                ))}
              </div>
              <button onClick={addEmployee} className="btn-gold" style={{ width:'100%',fontSize:11,padding:'13px',letterSpacing:2,color:'#110a0a' }}>+ AJOUTER L&apos;AFFILIÉ</button>
            </div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:12 }}>{employees.length} AFFILIÉ(S)</div>
            {employees.length===0 ? (
              <div style={{ ...S.card,textAlign:'center',padding:'40px',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)' }}>Aucun affilié ajouté</div>
            ) : employees.map(e => (
              <div key={e.id} style={{ ...S.card }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:500,marginBottom:4 }}>{e.name}</div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontFamily:'monospace',fontSize:11,color:'var(--gold3)',background:'rgba(201,168,76,.06)',border:'1px solid rgba(201,168,76,.1)',padding:'2px 10px',borderRadius:3 }}>{e.code}</span>
                      {e.email&&<span style={{ fontSize:11,color:'var(--muted2)' }}>{e.email}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={()=>copyLink(e.code)} className="btn-ghost" style={{ fontSize:10,padding:'7px 14px' }}>Copier lien</button>
                    <button onClick={()=>deleteEmployee(e.id)} style={{ background:'none',border:'1px solid rgba(200,57,43,.25)',borderRadius:3,color:'var(--red2)',cursor:'pointer',fontSize:10,padding:'7px 14px',transition:'all .15s' }}>Supprimer</button>
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',borderRadius:3,padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'var(--muted2)',wordBreak:'break-all' }}>
                  {typeof window!=='undefined'?window.location.origin:''}/?ref={e.code}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COMMISSIONS */}
        {tab==='commissions' && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>FINANCE</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Commissions</h1>
            </div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:12 }}>EN ATTENTE</div>
            {commissions.filter(c=>!c.paid).length===0 ? (
              <div style={{ ...S.card,textAlign:'center',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)',marginBottom:20 }}>Aucune commission en attente</div>
            ) : commissions.filter(c=>!c.paid).map(c => (
              <div key={c.id} className="hover-row" style={{ ...S.card,border:'1px solid rgba(201,168,76,.15)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:500,marginBottom:3 }}>{c.employee.name}</div>
                  <div style={{ fontSize:11,color:'var(--muted2)' }}>{c.type==='first'?'1er paiement':'Renouvellement'} · Plan {c.planKey||'?'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:14,flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:300,color:'var(--gold2)' }}>{c.amount} €</span>
                  <button onClick={()=>markPaid(c.id)} className="btn-gold" style={{ fontSize:10,padding:'8px 16px',letterSpacing:1.5,color:'#110a0a' }}>PAYER ✓</button>
                </div>
              </div>
            ))}
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,margin:'24px 0 12px' }}>HISTORIQUE</div>
            {commissions.filter(c=>c.paid).map(c => (
              <div key={c.id} className="hover-row" style={{ ...S.card,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,opacity:.55 }}>
                <div style={{ fontSize:13,color:'var(--muted2)' }}>{c.employee.name} · {c.type==='first'?'1er':'Rec.'} · Plan {c.planKey||'?'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-display)',fontSize:16,color:'var(--muted3)' }}>{c.amount} €</span>
                  <span style={{ fontSize:10,color:'var(--success2)' }}>✓ Payé</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AVIS */}
        {tab==='avis' && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>MODÉRATION</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Avis clients</h1>
            </div>
            {['pending','approved','rejected'].map(statut => {
              const filtered = avis.filter(a=>a.statut===statut)
              if (filtered.length===0) return null
              return (
                <div key={statut} style={{ marginBottom:24 }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:statut==='pending'?'var(--warning)':statut==='approved'?'var(--success2)':'var(--muted)',letterSpacing:2,marginBottom:12 }}>
                    {statut==='pending'?'EN ATTENTE':statut==='approved'?'PUBLIÉS':'REJETÉS'} ({filtered.length})
                  </div>
                  {filtered.map(a => (
                    <div key={a.id} style={{ ...S.card,borderLeft:'2px solid',borderLeftColor:statut==='pending'?'var(--warning)':statut==='approved'?'var(--success2)':'rgba(255,255,255,.08)' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                            <span style={{ color:'var(--gold2)',fontSize:14,letterSpacing:2 }}>{'★'.repeat(a.note)}</span>
                            <span style={{ fontFamily:'var(--font-label)',fontSize:12,color:'var(--cream)' }}>{a.nom}</span>
                            {a.ville&&<span style={{ fontSize:11,color:'var(--muted2)' }}>· {a.ville}</span>}
                            {a.article&&<span style={{ fontSize:11,color:'var(--muted2)' }}>· {a.article}</span>}
                          </div>
                          <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.7,fontStyle:'italic' }}>&ldquo;{a.commentaire}&rdquo;</div>
                          {a.email&&<div style={{ fontSize:10,color:'var(--muted)',marginTop:6 }}>{a.email}</div>}
                          <div style={{ fontSize:10,color:'var(--muted)',marginTop:4 }}>{new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                        </div>
                        {statut==='pending' && (
                          <div style={{ display:'flex',gap:8,flexShrink:0 }}>
                            <button onClick={()=>moderateAvis(a.id,'approve')} style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,color:'var(--success2)',cursor:'pointer',fontSize:10,padding:'7px 14px',transition:'all .2s' }}>✓ Publier</button>
                            <button onClick={()=>moderateAvis(a.id,'reject')} style={{ background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',borderRadius:3,color:'var(--red2)',cursor:'pointer',fontSize:10,padding:'7px 14px',transition:'all .2s' }}>✕ Rejeter</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            {avis.length===0&&<div style={{ ...S.card,textAlign:'center',fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)',padding:'40px' }}>Aucun avis reçu pour le moment</div>}
          </div>
        )}

        {tab==='access' && <AccessTab showToast={showToast} />}
        {tab==='settings' && <SettingsTab showToast={showToast} />}
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
    else showToast('Erreur: '+(data.error||'Inconnue'),'error')
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>ACCÈS</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Accès Premium</h1>
      </div>
      <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,.06),rgba(201,168,76,.02))',border:'1px solid rgba(201,168,76,.2)',borderRadius:4,padding:'24px',marginBottom:16 }}>
        <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.7,marginBottom:20 }}>
          Activez un accès <strong style={{ color:'var(--gold2)' }}>Premium illimité</strong> pour un utilisateur. Il doit avoir créé un compte au préalable.
        </div>
        <label style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,display:'block',marginBottom:8 }}>ADRESSE E-MAIL</label>
        <input style={{ background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:3,color:'var(--white)',fontSize:13,padding:'11px 14px',width:'100%',outline:'none',marginBottom:12,transition:'border-color .2s' }}
          type="email" placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&grant()} />
        <button onClick={grant} disabled={loading||!email} className="btn-gold"
          style={{ width:'100%',fontSize:11,padding:'13px',letterSpacing:2,opacity:(loading||!email)?0.5:1,color:'#110a0a' }}>
          {loading?'ACTIVATION...':'∞ ACTIVER ACCÈS PREMIUM'}
        </button>
      </div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px' }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:14 }}>INCLUS DANS PREMIUM</div>
        {['Annonces illimitées','Réponses illimitées','Estimations illimitées','Chatbot 500 msg/jour','Toutes les fonctionnalités','Badge Premium dans le dashboard'].map((f,i)=>(
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
    adminWebhook:'',discordWebhookAvis:'',
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
    }).catch(()=>setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    setSaving(false)
    showToast(data.success?'Paramètres sauvegardés ✓':'Erreur sauvegarde', data.success?'success':'error')
  }

  if (loading) return <div style={{ color:'var(--muted2)',padding:20 }}>Chargement...</div>

  const SECTIONS = [
    {
      title:'Commissions affiliés',
      fields:[
        {key:'commissionFirst',label:'1er paiement (EUR fixe)',ph:'6'},
        {key:'commissionStarter',label:'Starter (EUR/sem)',ph:'0.50'},
        {key:'commissionBusiness',label:'Business (EUR/sem)',ph:'1.50'},
        {key:'commissionExpert',label:'Expert (EUR/sem)',ph:'2.50'},
      ]
    },
    {
      title:'Notifications Discord',
      fields:[
        {key:'adminWebhook',label:'Webhook ventes/général',ph:'https://discord.com/api/webhooks/...'},
        {key:'discordWebhookAvis',label:'Webhook avis clients',ph:'https://discord.com/api/webhooks/...'},
      ]
    },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>CONFIGURATION</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>Paramètres</h1>
      </div>
      {SECTIONS.map(section => (
        <div key={section.title} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,marginBottom:12,overflow:'hidden' }}>
          <div style={{ padding:'12px 22px',borderBottom:'1px solid rgba(255,255,255,.04)',fontFamily:'var(--font-label)',fontSize:9,color:'var(--gold3)',letterSpacing:2.5 }}>
            {section.title.toUpperCase()}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:section.fields.length<=2?'1fr 1fr':'1fr 1fr',gap:1,background:'rgba(255,255,255,.03)',padding:'16px 22px',rowGap:12 }}>
            {section.fields.map(f => (
              <div key={f.key}>
                <label style={{ fontFamily:'var(--font-label)',fontSize:8,color:'var(--muted2)',letterSpacing:2,display:'block',marginBottom:7 }}>{f.label.toUpperCase()}</label>
                <input style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:3,color:'var(--white)',fontSize:13,padding:'9px 12px',width:'100%',outline:'none',transition:'border-color .2s',fontFamily:'var(--font-ui)' }}
                  placeholder={f.ph} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={save} disabled={saving} className="btn-gold"
        style={{ width:'100%',marginTop:8,fontSize:11,padding:'14px',letterSpacing:2,opacity:saving?0.6:1,color:'#110a0a' }}>
        {saving?'SAUVEGARDE...':'SAUVEGARDER LES PARAMÈTRES'}
      </button>
    </div>
  )
}
