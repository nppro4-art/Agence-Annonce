import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// ── Helpers ──────────────────────────────────────────────
const PLAN_NAMES = { premium:'Premium', expert:'Expert', business:'Business', starter:'Starter', pro:'Business', free:'Gratuit' }
const PLAN_PRICES = { premium:'—', expert:'12,99', business:'5,99', starter:'3,99', free:'0' }

function ParisClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--cream)',letterSpacing:2,lineHeight:1}}>{time}</div>
      <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:6,letterSpacing:2,color:'var(--muted)',textTransform:'uppercase',marginTop:1}}>Paris</div>
    </div>
  )
}

function NightSky() {
  const stars = Array.from({length:40},(_,i)=>({id:i,size:Math.random()*2+1,x:Math.random()*100,y:Math.random()*100,dur:Math.random()*3+2,delay:Math.random()*4,op:Math.random()*.5+.2}))
  return (
    <div style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
      <style>{`@keyframes twinkle{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}@keyframes moonGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(180,200,255,.4))}50%{filter:drop-shadow(0 0 14px rgba(180,200,255,.8))}}@keyframes nebulaPulse{0%,100%{opacity:.5}50%{opacity:.9}}.a-star{position:fixed;border-radius:50%;pointer-events:none;z-index:0;animation:twinkle var(--dur) ease-in-out var(--delay) infinite}`}</style>
      {stars.map(s=><div key={s.id} className="a-star" style={{width:s.size+'px',height:s.size+'px',left:s.x+'%',top:s.y+'%',background:`rgba(180,200,255,${s.op})`,['--dur']:s.dur+'s',['--delay']:s.delay+'s'}}/>)}
      <div style={{position:'fixed',top:'6%',right:'10%',fontSize:28,animation:'moonGlow 4s ease-in-out infinite',pointerEvents:'none',zIndex:0,transform:'rotate(180deg)'}}>🌙</div>
      <div style={{position:'fixed',top:'-15%',right:'-5%',width:'50vw',height:'50vw',background:'radial-gradient(circle,rgba(40,80,160,.15) 0%,transparent 70%)',pointerEvents:'none',zIndex:0,borderRadius:'50%',animation:'nebulaPulse 12s ease-in-out infinite'}}/>
      <div style={{position:'fixed',bottom:'-10%',left:'-5%',width:'40vw',height:'40vw',background:'radial-gradient(circle,rgba(30,60,140,.1) 0%,transparent 70%)',pointerEvents:'none',zIndex:0,borderRadius:'50%',animation:'nebulaPulse 16s ease-in-out infinite reverse'}}/>
    </div>
  )
}

const S = {
  card: {background:'rgba(255,255,255,.025)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'20px 22px',marginBottom:12},
  inp: {background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'#f0ece4',fontSize:13,padding:'10px 14px',width:'100%',outline:'none',transition:'all .2s',fontFamily:'DM Sans,sans-serif'},
  lbl: {fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:'2px',textTransform:'uppercase',display:'block',marginBottom:8},
}

export default function Admin() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [commissions, setCommissions] = useState([])
  const [avis, setAvis] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [newEmp, setNewEmp] = useState({name:'',code:'',email:'',webhook:''})
  // Recherche + profil utilisateur
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [userTab, setUserTab] = useState('stats')

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      if (data.user.role !== 'admin') { router.push('/dashboard'); return }
      loadAll()
    })
  }, [])

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats').then(r=>r.json()),
      fetch('/api/admin/employees').then(r=>r.json()),
      fetch('/api/admin/commissions').then(r=>r.json()),
      fetch('/api/admin/avis').then(r=>r.json()).catch(()=>({avis:[]})),
    ]).then(([s,e,c,av]) => {
      setStats(s)
      setEmployees(e.employees||[])
      setCommissions(c.commissions||[])
      setAvis(av.avis||[])
      setUsers(s.recentUsers||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }
  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  // Charger détail utilisateur
  const loadUserDetail = async (userId) => {
    try {
      const res = await fetch(`/api/admin/user-detail?id=${userId}`)
      const data = await res.json()
      setUserDetail(data)
    } catch(e) { showToast('Erreur chargement profil','error') }
  }

  const openUser = (u) => {
    setSelectedUser(u)
    setUserTab('stats')
    setUserDetail(null)
    loadUserDetail(u.id)
  }

  const changePlan = async (userId, planKey) => {
    const res = await fetch('/api/admin/user-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,planKey})})
    const data = await res.json()
    if (data.success) { showToast('Plan mis à jour'); loadUserDetail(userId); loadAll() }
    else showToast('Erreur: '+data.error,'error')
  }

  const deleteUser = async (userId) => {
    if (!confirm('Supprimer définitivement cet utilisateur ? Cette action est irréversible.')) return
    const res = await fetch('/api/admin/user-delete',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId})})
    const data = await res.json()
    if (data.success) { showToast('Utilisateur supprimé'); setSelectedUser(null); loadAll() }
    else showToast('Erreur: '+data.error,'error')
  }

  const markPaid = async (id) => {
    await fetch('/api/admin/commissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[id]})})
    loadAll(); showToast('Commission payée ✓')
  }

  const moderateAvis = async (id, action) => {
    await fetch('/api/admin/avis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})})
    loadAll(); showToast(action==='approve'?'Avis publié !':'Avis rejeté')
  }

  const copyLink = (code) => { navigator.clipboard.writeText((typeof window!=='undefined'?window.location.origin:'')+'/?ref='+code); showToast('Lien copié !') }
  const addEmployee = async () => {
    if (!newEmp.name||!newEmp.code) return
    const res = await fetch('/api/admin/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newEmp)})
    const data = await res.json()
    if (data.error) { showToast('Erreur: '+data.error,'error'); return }
    setNewEmp({name:'',code:'',email:'',webhook:''}); loadAll(); showToast(newEmp.name+' ajouté !')
  }
  const deleteEmployee = async (id) => {
    if (!confirm('Supprimer cet affilié ?')) return
    await fetch('/api/admin/employees?id='+id,{method:'DELETE'})
    loadAll(); showToast('Affilié supprimé')
  }
  const grantAccess = async (email) => {
    const res = await fetch('/api/admin/grant-elite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
    const data = await res.json()
    if (data.success) showToast(data.message)
    else showToast('Erreur: '+(data.error||'Inconnue'),'error')
  }

  // Filtrer utilisateurs par recherche
  const filteredUsers = (stats?.recentUsers||[]).filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.email||'').toLowerCase().includes(q) ||
           (u.name||'').toLowerCase().includes(q) ||
           (u.clientCode||'').toString().includes(q)
  })

  const TABS = [
    {id:'overview',label:'Vue globale',icon:'◈'},
    {id:'users',label:'Utilisateurs',icon:'◎'},
    {id:'employees',label:'Affiliés',icon:'◇'},
    {id:'commissions',label:'Commissions',icon:'✦'},
    {id:'avis',label:'Avis',icon:'★'},
    {id:'access',label:'Premium',icon:'∞'},
    {id:'settings',label:'Paramètres',icon:'⚙'},
  ]

  const pendingAvis = avis.filter(a=>a.statut==='pending').length

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#080a0f',gap:16}}>
      <NightSky />
      <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:16,letterSpacing:4,color:'#c9a84c',zIndex:1}}>ADMINISTRATION</div>
      <div style={{width:24,height:24,border:'1.5px solid rgba(201,168,76,.2)',borderTopColor:'#c9a84c',borderRadius:'50%',animation:'spin .8s linear infinite',zIndex:1}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080a0f',color:'#f0ece4',fontFamily:'DM Sans,sans-serif'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .a-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .hover-row{transition:background .15s;cursor:pointer}.hover-row:hover{background:rgba(201,168,76,.04)!important}
        .a-tab{transition:all .2s;position:relative;border:none;background:none;cursor:pointer}
        .a-tab::after{content:'';position:absolute;bottom:0;left:50%;right:50%;height:1.5px;background:#c9a84c;transition:all .25s}
        .a-tab:hover{color:#f0ece4!important}
        .a-tab:hover::after{left:10%;right:10%}
        .a-tab.active{color:#c9a84c!important}
        .a-tab.active::after{left:0;right:0}
        .a-sidebar{position:fixed;left:0;top:0;bottom:0;width:60px;background:#0d1525;border-right:1px solid rgba(201,168,76,.1);z-index:200;display:flex;flex-direction:column;transition:width .28s cubic-bezier(.16,1,.3,1);overflow:hidden}
        .a-sidebar:hover{width:210px}
        .a-sidebar-logo{display:flex;align-items:center;gap:14px;padding:0 18px;height:58px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap}
        .a-sidebar-item{display:flex;align-items:center;gap:16px;padding:0 18px;height:44px;cursor:pointer;border:none;background:transparent;color:rgba(106,120,152,.9);transition:all .2s;white-space:nowrap;border-left:2px solid transparent;flex-shrink:0;width:100%;text-align:left}
        .a-sidebar-item:hover{color:#f0ece4;background:rgba(255,255,255,.04)}
        .a-sidebar-item.active{color:#c9a84c;background:rgba(201,168,76,.07);border-left-color:#c9a84c}
        .a-sidebar-icon{font-size:18px;flex-shrink:0;width:24px;text-align:center;line-height:1}
        .a-sidebar-label{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1.5px;opacity:0;transition:opacity .2s .05s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .a-sidebar:hover .a-sidebar-label{opacity:1}
        .a-layout{margin-left:60px;min-height:100vh;display:flex;flex-direction:column}
        .a-topbar{position:sticky;top:0;z-index:100;height:48px;background:rgba(8,10,15,.97);border-bottom:1px solid rgba(255,255,255,.05);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:space-between;padding:0 24px;gap:12px;position:relative}
        .a-main{max-width:1200px;padding:32px 24px 80px}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(201,168,76,.2);border-radius:2px}
        select{background:#0a1020!important;color:#f0ece4!important}
        select option{background:#0a1020!important;color:#f0ece4!important}
        @media(max-width:768px){
          .a-sidebar{top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;height:52px!important;flex-direction:row!important;border-right:none!important;border-top:1px solid rgba(201,168,76,.1)!important;padding:0!important;overflow-x:auto}
          .a-sidebar:hover{width:100%!important}
          .a-sidebar-logo{display:none!important}
          .a-sidebar-item{height:52px!important;padding:0 4px!important;flex-direction:column!important;gap:2px!important;min-width:44px;flex:1;justify-content:center;border-left:none!important;border-top:2px solid transparent!important}
          .a-sidebar-item.active{border-top-color:#c9a84c!important;border-left-color:transparent!important}
          .a-sidebar-label{opacity:1!important;font-size:7px!important;transition:none!important;text-align:center}
          .a-layout{margin-left:0!important;margin-bottom:52px!important}
          .a-main{padding:14px 12px!important}
        }
      `}</style>

      <NightSky />

      {/* Toast */}
      {toast && <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:'rgba(8,10,15,.98)',border:'1px solid',borderColor:toast.type==='error'?'rgba(200,57,43,.4)':'rgba(201,168,76,.3)',borderRadius:8,padding:'11px 22px',fontSize:13,color:toast.type==='error'?'#e05a4a':'#c9a84c',zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 8px 32px rgba(0,0,0,.7)'}}>{toast.type==='error'?'✕':'✦'} {toast.msg}</div>}

      {/* Modal profil utilisateur */}
      {selectedUser && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(6px)'}} onClick={()=>setSelectedUser(null)}>
          <div style={{background:'#0c0e18',border:'1px solid rgba(201,168,76,.2)',borderRadius:14,width:'100%',maxWidth:700,maxHeight:'85vh',overflow:'hidden',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            {/* Header modal */}
            <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.05))',border:'1px solid rgba(201,168,76,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cormorant Garamond,serif',fontSize:18,color:'#c9a84c'}}>
                  {(selectedUser.name||selectedUser.email)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:17,fontWeight:500}}>{selectedUser.name||'Sans nom'}</div>
                  <div style={{fontSize:11,color:'rgba(106,120,152,.9)',fontFamily:'monospace'}}>{selectedUser.email}</div>
                </div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'rgba(106,120,152,.6)',background:'rgba(255,255,255,.04)',padding:'3px 10px',borderRadius:4}}>#{selectedUser.clientCode||'------'}</div>
              </div>
              <button onClick={()=>setSelectedUser(null)} style={{background:'rgba(255,255,255,.06)',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',color:'rgba(106,120,152,.9)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* Tabs modal */}
            <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
              {[['stats','📊 Statistiques'],['params','⚙ Paramètres']].map(([id,label])=>(
                <button key={id} onClick={()=>setUserTab(id)}
                  style={{flex:1,background:userTab===id?'rgba(201,168,76,.07)':'transparent',border:'none',borderBottom:userTab===id?'2px solid #c9a84c':'2px solid transparent',color:userTab===id?'#c9a84c':'rgba(106,120,152,.9)',cursor:'pointer',fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:1.5,padding:'12px',transition:'all .2s'}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Contenu modal */}
            <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
              {!userDetail ? (
                <div style={{textAlign:'center',padding:40,color:'rgba(106,120,152,.9)'}}>
                  <div style={{width:20,height:20,border:'1.5px solid rgba(201,168,76,.2)',borderTopColor:'#c9a84c',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 12px'}}/>
                  Chargement...
                </div>
              ) : userTab==='stats' ? (
                <div>
                  {/* KPIs */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
                    {[
                      ['Annonces',userDetail.totalAnnonces||0,'✍'],
                      ['Réponses',userDetail.totalReponses||0,'◎'],
                      ['Estimations',userDetail.totalEstimations||0,'⚖'],
                      ['Chatbots',userDetail.totalChatbots||0,'◇'],
                    ].map(([l,v,icon])=>(
                      <div key={l} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:8,padding:'14px',textAlign:'center'}}>
                        <div style={{fontSize:16,marginBottom:6}}>{icon}</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:22,color:'#f0ece4',letterSpacing:-1,marginBottom:2}}>{v}</div>
                        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:8,color:'rgba(106,120,152,.9)',letterSpacing:1.5}}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Infos compte */}
                  <div style={{...S.card,marginBottom:12}}>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:12}}>INFORMATIONS COMPTE</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      {[
                        ['Plan actuel',PLAN_NAMES[userDetail.planKey||'free']],
                        ['Statut',userDetail.subStatus==='active'?'● Abonné actif':'○ Inactif'],
                        ['Inscrit le',userDetail.createdAt?new Date(userDetail.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'—'],
                        ['Dernière connexion',userDetail.lastLogin?new Date(userDetail.lastLogin).toLocaleDateString('fr-FR',{day:'numeric',month:'long'}):'—'],
                        ['Code client','#'+( userDetail.clientCode||'------')],
                        ['Dépenses totales',(userDetail.totalSpent||0)+' €'],
                        ['Source',userDetail.refBy?'Parrainage ('+userDetail.refBy+')':'Direct'],
                        ['2FA',userDetail.twoFAEnabled?'Activée':'Désactivée'],
                      ].map(([l,v])=>(
                        <div key={l} style={{background:'rgba(255,255,255,.02)',borderRadius:6,padding:'10px 12px'}}>
                          <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:8,color:'rgba(106,120,152,.7)',letterSpacing:1.5,marginBottom:4}}>{l}</div>
                          <div style={{fontSize:12,color:v.startsWith('●')?'#2d7a4f':v.startsWith('○')?'rgba(106,120,152,.9)':'#f0ece4'}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dernières annonces */}
                  {userDetail.annonces?.length > 0 && (
                    <div style={S.card}>
                      <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:12}}>DERNIÈRES ANNONCES</div>
                      {userDetail.annonces.slice(0,5).map((a,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:i<4?'1px solid rgba(255,255,255,.04)':'none',gap:8}}>
                          <div>
                            <div style={{fontSize:12,color:'#f0ece4',marginBottom:1}}>{a.titre||'Sans titre'}</div>
                            <div style={{fontSize:10,color:'rgba(106,120,152,.9)'}}>{a.type} · {a.createdAt?new Date(a.createdAt).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</div>
                          </div>
                          <span style={{fontSize:9,color:'rgba(106,120,152,.7)',background:'rgba(255,255,255,.04)',padding:'2px 8px',borderRadius:10,textTransform:'uppercase',letterSpacing:1,flexShrink:0}}>{a.type}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Achats */}
                  {userDetail.purchases?.length > 0 && (
                    <div style={{...S.card,marginTop:12}}>
                      <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:12}}>HISTORIQUE ACHATS</div>
                      {userDetail.purchases.map((p,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:i<userDetail.purchases.length-1?'1px solid rgba(255,255,255,.04)':'none'}}>
                          <div>
                            <div style={{fontSize:12,color:'#f0ece4'}}>{p.packName||p.type}</div>
                            <div style={{fontSize:10,color:'rgba(106,120,152,.9)'}}>{p.createdAt?new Date(p.createdAt).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</div>
                          </div>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'#c9a84c'}}>{p.amount||'—'} €</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Onglet Paramètres */
                <div>
                  <div style={S.card}>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:14}}>CHANGER LE PLAN</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:8}}>
                      {[['free','Gratuit','0 €'],['starter','Starter','3,99 €/sem'],['business','Business','5,99 €/sem'],['expert','Expert','12,99 €/sem'],['premium','Premium','Gratuit (admin)']].map(([key,name,price])=>(
                        <button key={key} onClick={()=>changePlan(selectedUser.id,key)}
                          style={{background:userDetail?.planKey===key?'rgba(201,168,76,.12)':'rgba(255,255,255,.03)',border:'1px solid',borderColor:userDetail?.planKey===key?'rgba(201,168,76,.4)':'rgba(255,255,255,.07)',borderRadius:8,padding:'12px',cursor:'pointer',textAlign:'left',transition:'all .2s'}}>
                          <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,color:userDetail?.planKey===key?'#c9a84c':'#f0ece4',letterSpacing:1,marginBottom:3}}>{name} {userDetail?.planKey===key?'← actuel':''}</div>
                          <div style={{fontSize:11,color:'rgba(106,120,152,.9)'}}>{price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{...S.card,border:'1px solid rgba(200,57,43,.2)',marginTop:12}}>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'#e05a4a',letterSpacing:2,marginBottom:10}}>ZONE DANGEREUSE</div>
                    <div style={{fontSize:12,color:'rgba(106,120,152,.9)',marginBottom:16,lineHeight:1.6}}>
                      La suppression est <strong style={{color:'#f0ece4'}}>irréversible</strong>. Toutes les annonces, réponses, chatbots et données de cet utilisateur seront définitivement supprimés.
                    </div>
                    <button onClick={()=>deleteUser(selectedUser.id)}
                      style={{background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.3)',borderRadius:6,color:'#e05a4a',cursor:'pointer',fontSize:11,padding:'10px 20px',transition:'all .2s',fontFamily:'Bebas Neue,sans-serif',letterSpacing:1.5}}>
                      SUPPRIMER CET UTILISATEUR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <nav className="a-sidebar">
        <div className="a-sidebar-logo">
          <Link href="/" style={{fontFamily:'Bebas Neue,sans-serif',fontSize:15,letterSpacing:4,color:'#f0ece4',textDecoration:'none',flexShrink:0}}>
            A.<span style={{color:'#c8392b'}}>A</span>
          </Link>
          <span className="a-sidebar-label" style={{fontFamily:'Cormorant Garamond,serif',fontSize:13,fontWeight:300,color:'rgba(106,120,152,.9)',letterSpacing:1}}>Admin</span>
        </div>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={'a-sidebar-item'+(tab===t.id?' active':'')}>
            <span className="a-sidebar-icon">{t.icon}</span>
            <span className="a-sidebar-label" style={{position:'relative'}}>
              {t.label}
              {t.id==='avis'&&pendingAvis>0&&<span style={{position:'absolute',top:-2,right:-8,background:'#c8392b',color:'white',borderRadius:'50%',width:14,height:14,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center'}}>{pendingAvis}</span>}
            </span>
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={logout} className="a-sidebar-item" style={{color:'rgba(106,120,152,.9)'}}>
          <span className="a-sidebar-icon">↪</span>
          <span className="a-sidebar-label" style={{fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:1.5}}>Quitter</span>
        </button>
      </nav>

      {/* Layout */}
      <div className="a-layout">
        {/* Topbar */}
        <div className="a-topbar">
          <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,letterSpacing:3,color:'rgba(106,120,152,.9)'}}>ADMINISTRATION · ANNONZA</div>
          <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)'}}><ParisClock /></div>
          <button onClick={logout} style={{background:'none',border:'1px solid rgba(255,255,255,.06)',borderRadius:3,color:'rgba(106,120,152,.9)',cursor:'pointer',fontSize:10,padding:'5px 12px'}}>↪ Quitter</button>
        </div>

        {/* Main */}
        <main className="a-main">

          {/* ── VUE GLOBALE ── */}
          {tab==='overview' && stats && (
            <div className="a-fade">
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>TABLEAU DE BORD</div>
                <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Vue globale</h1>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                {[
                  {label:'Utilisateurs',val:stats.users,sub:'inscrits total',color:'#f0ece4',icon:'◎'},
                  {label:'Abonnés actifs',val:stats.proUsers,sub:'plans payants',color:'#c9a84c',icon:'✦'},
                  {label:'CA semaine',val:(stats.CAWeek||0)+' €',sub:'revenus bruts',color:'#c9a84c',icon:'↑'},
                  {label:'Bénéfice net',val:(stats.beneficeNet||0)+' €',sub:'après commissions',color:'#2d7a4f',icon:'◈'},
                ].map((k,i)=>(
                  <div key={i} style={{...S.card,marginBottom:0,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:12,right:14,fontSize:18,opacity:.08}}>{k.icon}</div>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:10}}>{k.label.toUpperCase()}</div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:4,color:k.color}}>{k.val}</div>
                    <div style={{fontSize:11,color:'rgba(106,120,152,.9)'}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Objectif */}
              <div style={{...S.card,border:'1px solid rgba(201,168,76,.2)',background:'linear-gradient(135deg,rgba(201,168,76,.05),rgba(201,168,76,.01))',marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
                  <div>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,letterSpacing:2.5,color:'#a8843c',marginBottom:4}}>OBJECTIF 2026</div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:500}}>1 000 clients actifs</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,letterSpacing:-2,color:'#c9a84c',lineHeight:1}}>{stats.users}<span style={{fontSize:14,color:'rgba(106,120,152,.9)',letterSpacing:0}}> / 1000</span></div>
                    <div style={{fontSize:11,color:'rgba(106,120,152,.9)',marginTop:2}}>{Math.round(((stats.users||0)/1000)*100)}% atteint</div>
                  </div>
                </div>
                <div style={{background:'rgba(255,255,255,.06)',borderRadius:4,height:6,overflow:'hidden'}}>
                  <div style={{width:Math.min(((stats.users||0)/1000)*100,100)+'%',height:'100%',background:'linear-gradient(90deg,#a8843c,#c9a84c)',borderRadius:4}}/>
                </div>
              </div>

              {/* Derniers inscrits */}
              {stats.recentUsers?.length > 0 && (
                <div style={S.card}>
                  <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:16}}>DERNIERS INSCRITS</div>
                  {stats.recentUsers.slice(0,8).map((u,i)=>(
                    <div key={i} className="hover-row" onClick={()=>openUser(u)} style={{display:'grid',gridTemplateColumns:'1fr 90px 80px',gap:12,padding:'11px 8px',borderBottom:i<7?'1px solid rgba(255,255,255,.04)':'none',alignItems:'center',borderRadius:4}}>
                      <div>
                        <div style={{fontSize:13,color:'#f0ece4',fontWeight:500}}>{u.email}</div>
                        <div style={{fontSize:10,color:'rgba(106,120,152,.9)',marginTop:2}}>{u.name||'—'} · #{u.clientCode||'——'} · {new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                      </div>
                      <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,color:u.plan==='pro'||u.planKey==='business'||u.planKey==='expert'?'#c9a84c':'rgba(106,120,152,.9)',letterSpacing:1}}>{(u.planKey||'FREE').toUpperCase()}</div>
                      <div style={{fontSize:11,color:u.subStatus==='active'?'#2d7a4f':'rgba(106,120,152,.7)'}}>{u.subStatus==='active'?'● Actif':'○'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── UTILISATEURS ── */}
          {tab==='users' && (
            <div className="a-fade">
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>GESTION</div>
                <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Utilisateurs</h1>
              </div>

              {/* Barre de recherche */}
              <div style={{position:'relative',marginBottom:20}}>
                <input
                  style={{...S.inp,paddingLeft:40,fontSize:14}}
                  placeholder="Rechercher par nom, email ou code client (6 chiffres)..."
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                />
                <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:16,color:'rgba(106,120,152,.6)',pointerEvents:'none'}}>🔍</span>
                {search && <button onClick={()=>setSearch('')} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(106,120,152,.6)',cursor:'pointer',fontSize:16}}>✕</button>}
              </div>

              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                {[['Total inscrits',stats?.users,'#f0ece4'],['Abonnés actifs',stats?.proUsers,'#c9a84c'],['Plan gratuit',stats?.freeUsers,'rgba(106,120,152,.9)']].map(([l,v,c])=>(
                  <div key={l} style={{...S.card,marginBottom:0,textAlign:'center'}}>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:8}}>{l.toUpperCase()}</div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,letterSpacing:-2,color:c}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Liste filtrée */}
              <div style={S.card}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,marginBottom:16}}>
                  {search ? `${filteredUsers.length} résultat(s) pour "${search}"` : `${stats?.recentUsers?.length||0} UTILISATEURS`}
                </div>
                {filteredUsers.length===0 ? (
                  <div style={{textAlign:'center',padding:24,color:'rgba(106,120,152,.7)',fontStyle:'italic'}}>Aucun utilisateur trouvé</div>
                ) : filteredUsers.map((u,i)=>(
                  <div key={i} className="hover-row" onClick={()=>openUser(u)}
                    style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px',gap:12,padding:'12px 8px',borderBottom:i<filteredUsers.length-1?'1px solid rgba(255,255,255,.04)':'none',alignItems:'center',borderRadius:4}}>
                    <div>
                      <div style={{fontSize:13,color:'#f0ece4',fontWeight:500}}>{u.email}</div>
                      <div style={{fontSize:10,color:'rgba(106,120,152,.9)',marginTop:2}}>{u.name||'Sans nom'} · #{u.clientCode||'——'} · {new Date(u.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,color:u.planKey==='business'||u.planKey==='expert'||u.planKey==='premium'?'#c9a84c':'rgba(106,120,152,.9)',letterSpacing:1}}>{(u.planKey||'FREE').toUpperCase()}</div>
                    <div style={{fontSize:11,color:u.subStatus==='active'?'#2d7a4f':'rgba(106,120,152,.7)'}}>{u.subStatus==='active'?'● Actif':'○ Inactif'}</div>
                    <div style={{fontSize:11,color:'rgba(201,168,76,.6)',textAlign:'right'}}>Voir →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AFFILIÉS ── */}
          {tab==='employees' && (
            <div className="a-fade">
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>RÉSEAU</div>
                <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Affiliés</h1>
              </div>
              <div style={{...S.card,border:'1px solid rgba(201,168,76,.15)',marginBottom:20}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'#a8843c',letterSpacing:2,marginBottom:14}}>AJOUTER UN AFFILIÉ</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  {[{key:'name',label:'Prénom',ph:'Johan'},{key:'code',label:'Code unique',ph:'JOHAN1'},{key:'email',label:'Email (optionnel)',ph:'email@...'},{key:'webhook',label:'Webhook Discord',ph:'https://discord.com/...'}].map(f=>(
                    <div key={f.key}>
                      <label style={S.lbl}>{f.label}</label>
                      <input style={S.inp} placeholder={f.ph} value={newEmp[f.key]} onChange={e=>setNewEmp({...newEmp,[f.key]:e.target.value})}/>
                    </div>
                  ))}
                </div>
                <button onClick={addEmployee} style={{width:'100%',background:'linear-gradient(135deg,#a8843c,#c9a84c)',border:'none',borderRadius:6,color:'#030303',cursor:'pointer',fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:2,padding:'12px'}}>+ AJOUTER</button>
              </div>
              {employees.map(e=>(
                <div key={e.id} style={{...S.card}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                    <div>
                      <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:500,marginBottom:4}}>{e.name}</div>
                      <span style={{fontFamily:'monospace',fontSize:11,color:'#a8843c',background:'rgba(201,168,76,.06)',border:'1px solid rgba(201,168,76,.1)',padding:'2px 10px',borderRadius:3}}>{e.code}</span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>copyLink(e.code)} style={{background:'transparent',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,color:'rgba(106,120,152,.9)',cursor:'pointer',fontSize:11,padding:'7px 14px'}}>Copier lien</button>
                      <button onClick={()=>deleteEmployee(e.id)} style={{background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',borderRadius:6,color:'#e05a4a',cursor:'pointer',fontSize:11,padding:'7px 14px'}}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── COMMISSIONS ── */}
          {tab==='commissions' && (
            <div className="a-fade">
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>FINANCE</div>
                <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Commissions</h1>
              </div>
              {commissions.filter(c=>!c.paid).map(c=>(
                <div key={c.id} style={{...S.card,border:'1px solid rgba(201,168,76,.15)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,fontWeight:500,marginBottom:3}}>{c.employee?.name}</div>
                    <div style={{fontSize:11,color:'rgba(106,120,152,.9)'}}>{c.type==='first'?'1er paiement':'Renouvellement'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                    <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'#c9a84c'}}>{c.amount} €</span>
                    <button onClick={()=>markPaid(c.id)} style={{background:'linear-gradient(135deg,#a8843c,#c9a84c)',border:'none',borderRadius:6,color:'#030303',cursor:'pointer',fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:1.5,padding:'8px 16px'}}>PAYER ✓</button>
                  </div>
                </div>
              ))}
              {commissions.filter(c=>!c.paid).length===0&&<div style={{...S.card,textAlign:'center',fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',color:'rgba(106,120,152,.9)'}}>Aucune commission en attente</div>}
              {commissions.filter(c=>c.paid).length>0&&(
                <>
                  <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'rgba(106,120,152,.9)',letterSpacing:2,margin:'24px 0 12px'}}>HISTORIQUE PAYÉ</div>
                  {commissions.filter(c=>c.paid).map(c=>(
                    <div key={c.id} style={{...S.card,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,opacity:.5,marginBottom:8}}>
                      <div style={{fontSize:13,color:'rgba(106,120,152,.9)'}}>{c.employee?.name} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'rgba(106,120,152,.7)'}}>{c.amount} €</span>
                        <span style={{fontSize:10,color:'#2d7a4f'}}>✓ Payé</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── AVIS ── */}
          {tab==='avis' && (
            <div className="a-fade">
              <div style={{marginBottom:28}}>
                <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>MODÉRATION</div>
                <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Avis clients</h1>
              </div>
              {['pending','approved','rejected'].map(statut=>{
                const filtered = avis.filter(a=>a.statut===statut)
                if (filtered.length===0) return null
                return (
                  <div key={statut} style={{marginBottom:24}}>
                    <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:statut==='pending'?'#e0a020':statut==='approved'?'#2d7a4f':'rgba(106,120,152,.7)',letterSpacing:2,marginBottom:12}}>
                      {statut==='pending'?'EN ATTENTE':statut==='approved'?'PUBLIÉS':'REJETÉS'} ({filtered.length})
                    </div>
                    {filtered.map(a=>(
                      <div key={a.id} style={{...S.card,borderLeft:'2px solid',borderLeftColor:statut==='pending'?'#e0a020':statut==='approved'?'#2d7a4f':'rgba(255,255,255,.08)'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                              <span style={{color:'#c9a84c',fontSize:14,letterSpacing:2}}>{'★'.repeat(a.note)}</span>
                              <span style={{fontFamily:'Bebas Neue,sans-serif',fontSize:12,color:'#f0ece4'}}>{a.nom}</span>
                              {a.ville&&<span style={{fontSize:11,color:'rgba(106,120,152,.9)'}}>· {a.ville}</span>}
                            </div>
                            <div style={{fontSize:13,color:'#f0ece4',lineHeight:1.7,fontStyle:'italic'}}>"{a.commentaire}"</div>
                            <div style={{fontSize:10,color:'rgba(106,120,152,.7)',marginTop:6}}>{new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                          </div>
                          {statut==='pending'&&(
                            <div style={{display:'flex',gap:8,flexShrink:0}}>
                              <button onClick={()=>moderateAvis(a.id,'approve')} style={{background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:6,color:'#2d7a4f',cursor:'pointer',fontSize:10,padding:'7px 14px'}}>✓ Publier</button>
                              <button onClick={()=>moderateAvis(a.id,'reject')} style={{background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',borderRadius:6,color:'#e05a4a',cursor:'pointer',fontSize:10,padding:'7px 14px'}}>✕ Rejeter</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
              {avis.length===0&&<div style={{...S.card,textAlign:'center',fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',color:'rgba(106,120,152,.9)',padding:40}}>Aucun avis reçu</div>}
            </div>
          )}

          {/* ── PREMIUM ── */}
          {tab==='access' && <AccessTab showToast={showToast} />}

          {/* ── PARAMÈTRES ── */}
          {tab==='settings' && <SettingsTab showToast={showToast} />}

        </main>
      </div>
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
    <div className="a-fade">
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>ACCÈS</div>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Accès Premium</h1>
      </div>
      <div style={{background:'linear-gradient(135deg,rgba(201,168,76,.06),rgba(201,168,76,.02))',border:'1px solid rgba(201,168,76,.2)',borderRadius:12,padding:'24px',marginBottom:16}}>
        <div style={{fontSize:13,color:'rgba(106,120,152,.9)',lineHeight:1.7,marginBottom:20}}>Activez un accès <strong style={{color:'#c9a84c'}}>Premium illimité</strong> pour un utilisateur.</div>
        <label style={S.lbl}>Adresse e-mail</label>
        <input style={{...S.inp,marginBottom:12}} type="email" placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&grant()}/>
        <button onClick={grant} disabled={loading||!email} style={{width:'100%',background:'linear-gradient(135deg,#a8843c,#c9a84c)',border:'none',borderRadius:6,color:'#030303',cursor:'pointer',fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:2,padding:'13px',opacity:(loading||!email)?0.5:1}}>
          {loading?'ACTIVATION...':'∞ ACTIVER ACCÈS PREMIUM'}
        </button>
      </div>
    </div>
  )
}

function SettingsTab({ showToast }) {
  const [form, setForm] = useState({commissionFirst:'6',commissionStarter:'0.50',commissionBusiness:'1.50',commissionExpert:'2.50',adminWebhook:'',discordWebhookAvis:''})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(()=>{
    fetch('/api/admin/settings').then(r=>r.json()).then(data=>{
      if (data.settings) setForm(f=>({...f,...Object.fromEntries(Object.entries(data.settings).map(([k,v])=>[k,String(v||'')]))}))
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[])
  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const data = await res.json()
    setSaving(false)
    showToast(data.success?'Paramètres sauvegardés ✓':'Erreur sauvegarde',data.success?'success':'error')
  }
  if (loading) return <div style={{color:'rgba(106,120,152,.9)',padding:20}}>Chargement...</div>
  return (
    <div className="a-fade">
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'rgba(106,120,152,.9)',marginBottom:8}}>CONFIGURATION</div>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:400,letterSpacing:-.5}}>Paramètres</h1>
      </div>
      {[
        {title:'Commissions affiliés',fields:[{key:'commissionFirst',label:'1er paiement (€ fixe)',ph:'6'},{key:'commissionStarter',label:'Starter (€/sem)',ph:'0.50'},{key:'commissionBusiness',label:'Business (€/sem)',ph:'1.50'},{key:'commissionExpert',label:'Expert (€/sem)',ph:'2.50'}]},
        {title:'Webhooks Discord',fields:[{key:'adminWebhook',label:'Webhook ventes/général',ph:'https://discord.com/api/webhooks/...'},{key:'discordWebhookAvis',label:'Webhook avis clients',ph:'https://discord.com/api/webhooks/...'}]},
      ].map(section=>(
        <div key={section.title} style={{background:'rgba(255,255,255,.025)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,marginBottom:12,overflow:'hidden'}}>
          <div style={{padding:'12px 22px',borderBottom:'1px solid rgba(255,255,255,.04)',fontFamily:'Bebas Neue,sans-serif',fontSize:9,color:'#a8843c',letterSpacing:2.5}}>{section.title.toUpperCase()}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'16px 22px'}}>
            {section.fields.map(f=>(
              <div key={f.key}>
                <label style={S.lbl}>{f.label}</label>
                <input style={S.inp} placeholder={f.ph} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={save} disabled={saving} style={{width:'100%',marginTop:8,background:'linear-gradient(135deg,#a8843c,#c9a84c)',border:'none',borderRadius:6,color:'#030303',cursor:'pointer',fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:2,padding:'14px',opacity:saving?0.6:1}}>
        {saving?'SAUVEGARDE...':'SAUVEGARDER'}
      </button>
    </div>
  )
}
