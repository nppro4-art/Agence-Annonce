import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// ─── CONSTANTES PLANS ─────────────────────────────────────
const PLAN_LIMITS = {
  premium:  { annonces: Infinity, reponses: Infinity },
  expert:   { annonces: 40,  reponses: 250 },
  business: { annonces: 15,  reponses: 60  },
  starter:  { annonces: 5,   reponses: 20  },
  pro:      { annonces: 15,  reponses: 60  },
  free:     { annonces: 0,   reponses: 0   },
}
const PLAN_NAMES = { premium:'Premium', expert:'Expert', business:'Business', starter:'Starter', pro:'Business', free:'Gratuit' }
const PLAN_PRICES = { premium:'—', expert:'9,99', business:'5,99', starter:'3,99', pro:'5,99', free:'0' }

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({ annonces: 0, reponses: 0 })
  const [credits, setCredits] = useState({ annonces: { remaining: 0 }, reponses: { remaining: 0 } })
  const [purchases, setPurchases] = useState([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
    }).catch(() => router.push('/auth/login'))

    Promise.all([
      fetch('/api/dashboard/annonces').then(r => r.json()),
      fetch('/api/dashboard/reponses').then(r => r.json()),
      fetch('/api/dashboard/credits').then(r => r.json()),
    ]).then(([a, r, c]) => {
      setUsage({ annonces: a.annonces?.length || 0, reponses: r.reponses?.length || 0 })
      if (c.credits) setCredits(c.credits)
      if (c.purchases) setPurchases(c.purchases)
    }).catch(() => {})
  }, [])

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/') }

  const subscribe = async (planKey = 'business') => {
    const res = await fetch('/api/stripe/create-subscription', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Erreur: ' + (data.error || 'Inconnue'))
  }

  const cancelSubscription = async () => {
    if (!confirm('Confirmer annulation ? Vous gardez acces jusqu\'a fin de periode payee.')) return
    setCancelLoading(true)
    const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' })
    const data = await res.json()
    setCancelLoading(false)
    if (data.success) { setCancelDone(true); setShowSubModal(false) }
    else alert('Erreur: ' + (data.error || 'Inconnue'))
  }

  const planKey = user?.planKey || user?.plan || 'free'
  const isPro = user?.plan === 'pro' && user?.subStatus === 'active'
  const isPremium = planKey === 'premium'
  const isSubscribed = isPro || isPremium
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free
  const annoncesLeft = limits.annonces === Infinity ? '∞' : Math.max(0, limits.annonces - usage.annonces)
  const reponsesLeft = limits.reponses === Infinity ? '∞' : Math.max(0, limits.reponses - usage.reponses)

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--black)' }}>
      <div style={{ width:32,height:32,border:'2px solid var(--border2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const TABS = [
    { id:'home',label:'Accueil' },
    { id:'annonce',label:'Annonce' },
    { id:'reponse',label:'Repondre' },
    { id:'estimation',label:'Estimer' },
    { id:'historique',label:'Historique' },
    { id:'tarifs',label:'Tarifs' },
    { id:'profil',label:'Profil' },
  ]

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',display:'flex',flexDirection:'column' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}
        .tab-btn{transition:all .2s;border-bottom:2px solid transparent;white-space:nowrap}
        .tab-btn:hover{color:var(--cream)!important}
        .tab-btn.active{color:var(--gold2)!important;border-bottom-color:var(--gold)!important}
        .act-tile{transition:all .25s;cursor:pointer}
        .act-tile:hover{background:var(--s2)!important;transform:translateY(-2px)}
        .copy-btn:hover{border-color:var(--gold-border)!important;color:var(--gold2)!important}
        .hover-row:hover{background:var(--s2)!important}
        @media(max-width:768px){
          .tab-btn{font-size:10px!important;padding:0 7px!important}
          .db-grid2{grid-template-columns:1fr!important}
          .db-grid3{grid-template-columns:1fr 1fr!important}
          .db-header{padding:0 12px!important}
          .db-main{padding:16px 12px 80px!important}
        }
      `}</style>

      {/* MODAL ABONNEMENT */}
      {showSubModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}
          onClick={() => setShowSubModal(false)}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:4,padding:'32px 28px',width:'100%',maxWidth:460,position:'relative',animation:'slideIn .3s cubic-bezier(.16,1,.3,1)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSubModal(false)} style={{ position:'absolute',top:14,right:16,background:'none',border:'none',color:'var(--muted2)',cursor:'pointer',fontSize:20 }}>×</button>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--gold3)',marginBottom:10 }}>MON ABONNEMENT</div>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:600,marginBottom:20 }}>Plan {PLAN_NAMES[planKey]}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:20 }}>
              {[
                ['Plan', PLAN_NAMES[planKey]],
                ['Prix', PLAN_PRICES[planKey] + (planKey !== 'free' && planKey !== 'premium' ? ' EUR/sem' : '')],
                ['Statut', cancelDone ? 'Annulation planifiee' : 'Actif'],
                ['Renouvellement', '7 jours'],
                ['Annonces', limits.annonces === Infinity ? '∞' : limits.annonces + '/sem'],
                ['Reponses', limits.reponses === Infinity ? '∞' : limits.reponses + '/sem'],
              ].map(([l,v]) => (
                <div key={l} style={{ background:'var(--ink)',padding:'12px 16px' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',borderRadius:3,padding:'12px 16px',marginBottom:16,fontSize:12,color:'var(--muted2)',lineHeight:1.65 }}>
              En cas d&apos;annulation, vous conservez l&apos;acces jusqu&apos;a la fin de la periode payee. Aucun remboursement.
            </div>
            {cancelDone ? (
              <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'12px',fontSize:13,color:'var(--success2)',textAlign:'center' }}>
                Annulation confirmee. Acces maintenu jusqu&apos;a fin de periode.
              </div>
            ) : (
              <button onClick={cancelSubscription} disabled={cancelLoading}
                style={{ width:'100%',background:'none',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,color:'var(--red2)',cursor:'pointer',fontSize:12,padding:'12px',opacity:cancelLoading?.6:1 }}>
                {cancelLoading ? 'Annulation...' : 'Arreter le prelevement automatique'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEADER PLEINE LARGEUR */}
      <header style={{ background:'rgba(3,3,3,.96)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ width:'100%',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between' }} className="db-header">
          <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:15,letterSpacing:3,color:'var(--white)',flexShrink:0,marginRight:20 }}>
            A.<span style={{ color:'var(--red)' }}>A</span>
          </Link>

          {/* TABS PLEINE LARGEUR */}
          <nav style={{ display:'flex',flex:1,height:'100%',alignItems:'stretch',overflow:'hidden' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'tab-btn' + (tab === t.id ? ' active' : '')}
                style={{ background:'none',border:'none',borderBottom:'2px solid transparent',color:tab===t.id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,padding:'0 16px',flex:1,maxWidth:120 }}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Credits + actions */}
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0,marginLeft:12 }}>
            {isSubscribed && (
              <>
                <div style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:2,padding:'3px 8px',fontSize:10,color:'var(--muted2)',whiteSpace:'nowrap' }}>
                  ✍ <span style={{ color:'var(--gold2)',fontWeight:700 }}>{annoncesLeft}</span>
                </div>
                <div style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:2,padding:'3px 8px',fontSize:10,color:'var(--muted2)',whiteSpace:'nowrap' }}>
                  ◎ <span style={{ color:'var(--gold2)',fontWeight:700 }}>{reponsesLeft}</span>
                </div>
              </>
            )}
            {!isSubscribed && credits.annonces.remaining > 0 && (
              <div style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:2,padding:'3px 8px',fontSize:10,color:'var(--warning)',whiteSpace:'nowrap' }}>
                ✍ {credits.annonces.remaining} credits
              </div>
            )}
            {isSubscribed ? (
              <span style={{ fontFamily:'var(--font-label)',fontSize:8,letterSpacing:2,color:'var(--gold2)',background:'rgba(201,168,76,.08)',border:'1px solid var(--gold-border)',borderRadius:2,padding:'3px 8px',whiteSpace:'nowrap',cursor:'pointer' }}
                onClick={() => setShowSubModal(true)}>
                ♛ {isPremium ? 'PREMIUM' : 'SUBSCRIBER'}
              </span>
            ) : (
              <button onClick={() => subscribe('business')} className="btn-primary" style={{ fontSize:11,padding:'7px 12px',letterSpacing:1,whiteSpace:'nowrap' }}>
                S&apos;abonner
              </button>
            )}
            <button onClick={logout} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:11,padding:'6px 10px',whiteSpace:'nowrap' }}>
              Quitter
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU */}
      <main className="db-main" style={{ flex:1,maxWidth:920,margin:'0 auto',width:'100%',padding:'32px 24px 80px' }}>

        {/* ── ACCUEIL ── */}
        {tab === 'home' && (
          <div className="db-fade">
            <div style={{ marginBottom:28 }}>
              <div className="label" style={{ marginBottom:8 }}>Espace personnel</div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(24px,4vw,38px)',fontWeight:400,letterSpacing:-.5 }}>
                Bonjour, <span style={{ fontStyle:'italic',fontWeight:600 }}>{user.name || user.email.split('@')[0]}</span>
              </h1>
            </div>

            {/* Status bar */}
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:isSubscribed?'var(--gold)':'var(--muted)',animation:isSubscribed?'pulse 2s infinite':'none' }} />
                <span style={{ fontSize:13,color:'var(--muted3)' }}>
                  Plan <strong style={{ color:isSubscribed?'var(--gold2)':'var(--muted2)',fontFamily:'var(--font-label)',letterSpacing:1 }}>
                    {PLAN_NAMES[planKey].toUpperCase()}
                  </strong>
                  {isSubscribed && planKey !== 'premium' && <span style={{ marginLeft:8,fontSize:11,color:'var(--muted)' }}>{PLAN_PRICES[planKey]} EUR/sem</span>}
                </span>
              </div>
              {isSubscribed ? (
                <button onClick={() => setShowSubModal(true)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>
                  Mon abonnement
                </button>
              ) : (
                <button onClick={() => subscribe('business')} className="btn-gold" style={{ fontSize:11,padding:'8px 18px',letterSpacing:1.5,color:'#030303' }}>
                  S&apos;ABONNER
                </button>
              )}
            </div>

            {/* 3 Actions */}
            <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:20 }}>
              {[
                { title:'Creer',sub:'une annonce',tab:'annonce',pro:true },
                { title:'Repondre',sub:'a un acheteur',tab:'reponse',pro:true },
                { title:'Estimer',sub:'le prix',tab:'estimation',pro:false },
              ].map(a => (
                <div key={a.tab} className="act-tile" onClick={() => setTab(a.tab)}
                  style={{ background:'var(--ink)',padding:'24px 16px',textAlign:'center',position:'relative' }}>
                  <div style={{ position:'absolute',top:8,right:10,fontFamily:'var(--font-label)',fontSize:7,letterSpacing:1.5,color:a.pro?'var(--gold3)':'var(--success2)' }}>
                    {a.pro ? '♛ Subscriber Only' : 'Gratuit'}
                  </div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,lineHeight:1 }}>{a.title}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontStyle:'italic',fontWeight:300,color:'var(--muted2)',marginTop:3 }}>{a.sub}</div>
                </div>
              ))}
            </div>

            {/* Utilisation */}
            <div className="db-grid2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:20 }}>
              {[
                { label:'Annonces',val:usage.annonces,limit:limits.annonces,color:'var(--gold)',isPack:!isSubscribed,packRemaining:credits.annonces.remaining },
                { label:'Reponses',val:usage.reponses,limit:limits.reponses,color:'var(--red)',isPack:!isSubscribed,packRemaining:credits.reponses.remaining },
              ].map(s => {
                const lim = s.limit === Infinity ? 999999 : s.limit
                const pct = lim > 0 ? Math.min((s.val/lim)*100,100) : 0
                return (
                  <div key={s.label} style={{ background:'var(--ink)',padding:'20px 24px' }}>
                    <div style={{ fontSize:11,color:'var(--muted2)',letterSpacing:.5,marginBottom:10,textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:10 }}>
                      {s.isPack
                        ? <span style={{ color:s.packRemaining<=2?'var(--red2)':'var(--cream)' }}>{s.packRemaining}</span>
                        : <span>{s.val}<span style={{ fontSize:13,color:'var(--muted2)',fontStyle:'italic' }}>/{s.limit===Infinity?'∞':s.limit}</span></span>}
                    </div>
                    <div style={{ background:'var(--s3)',borderRadius:1,height:2,overflow:'hidden' }}>
                      <div style={{ width:pct+'%',height:'100%',background:pct>80?'var(--red)':s.color,transition:'width 1.2s' }} />
                    </div>
                    <div style={{ fontSize:10,color:'var(--muted)',marginTop:6 }}>
                      {s.isPack
                        ? (s.packRemaining===0?'Aucun credit - achetez un pack':s.packRemaining+' restant(s)')
                        : 'Cette semaine · '+( s.limit===Infinity ? '∞' : Math.max(0,s.limit-s.val))+' restantes'}
                    </div>
                  </div>
                )
              })}
            </div>

            {!isSubscribed && (
              <div style={{ border:'1px solid var(--gold-border)',borderRadius:3,padding:'20px 24px',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(201,168,76,.04),transparent)',pointerEvents:'none' }} />
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:4 }}>Passez a un abonnement</div>
                    <div style={{ fontSize:13,color:'var(--muted2)' }}>Starter 3,99€ · Business 5,99€ · Expert 9,99€</div>
                  </div>
                  <button onClick={() => setTab('tarifs')} className="btn-gold" style={{ fontSize:11,padding:'12px 24px',letterSpacing:2,flexShrink:0,color:'#030303' }}>
                    VOIR LES TARIFS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'annonce' && <AnnonceTab isSubscribed={isSubscribed} planKey={planKey} credits={credits} subscribe={subscribe} onUsed={() => setUsage(u=>({...u,annonces:u.annonces+1}))} />}
        {tab === 'reponse' && <ReponseTab isSubscribed={isSubscribed} subscribe={subscribe} onUsed={() => setUsage(u=>({...u,reponses:u.reponses+1}))} />}
        {tab === 'estimation' && <EstimationTab />}
        {tab === 'historique' && <HistoriqueTab />}
        {tab === 'tarifs' && <TarifsTab isSubscribed={isSubscribed} planKey={planKey} subscribe={subscribe} showSubModal={() => setShowSubModal(true)} />}
        {tab === 'profil' && <ProfilTab user={user} isSubscribed={isSubscribed} isPremium={isPremium} planKey={planKey} subscribe={subscribe} openSubModal={() => setShowSubModal(true)} usage={usage} credits={credits} purchases={purchases} limits={limits} />}
      </main>
    </div>
  )
}

// ─── SHARED ───────────────────────────────────────────────
const S = {
  inp: { background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',transition:'border-color .2s' },
  lbl: { fontSize:10,fontWeight:600,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:7 },
  cell: (w) => ({ background:'var(--ink)',padding:'16px 20px',gridColumn:w?'1/-1':'auto' }),
}

function LockOverlay({ subscribe }) {
  return (
    <div style={{ position:'sticky',bottom:24,left:0,right:0,zIndex:50,display:'flex',justifyContent:'center',marginTop:16 }}>
      <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:4,padding:'20px 28px',maxWidth:420,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,.7)' }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:2,color:'var(--gold3)',marginBottom:8 }}>SUBSCRIBER ONLY</div>
        <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:8 }}>Abonnement requis</div>
        <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:16,lineHeight:1.6 }}>
          Abonnez-vous a partir de 3,99 EUR/semaine ou achetez un pack d&apos;annonces.
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14 }}>
          {[['Starter','3,99'],['Business','5,99'],['Expert','9,99']].map(([plan,price]) => (
            <button key={plan} onClick={() => subscribe(plan.toLowerCase())}
              style={{ background:'var(--s2)',border:'1px solid var(--border)',borderRadius:3,color:'var(--cream)',cursor:'pointer',fontSize:11,padding:'8px 4px',transition:'all .15s' }}>
              <div style={{ fontSize:9,color:'var(--muted2)',marginBottom:2 }}>{plan}</div>
              <div style={{ fontFamily:'var(--font-label)',color:'var(--gold2)',fontSize:13 }}>{price}€</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── FORMULAIRE ANNONCE DYNAMIQUE PAR CATÉGORIE ───────────
const CATEGORIES = {
  Voiture: [
    { key:'marque',label:'Marque',ph:'BMW, Renault, Toyota...' },
    { key:'modele',label:'Modele',ph:'Serie 3, Clio, Yaris...' },
    { key:'annee',label:'Annee',ph:'2019',type:'number' },
    { key:'kilometrage',label:'Kilometrage (km)',ph:'75000',type:'number' },
    { key:'carburant',label:'Carburant',type:'select',opts:['Essence','Diesel','Hybride','Hybride rechargeable','Electrique','GPL'] },
    { key:'boite',label:'Boite',type:'select',opts:['Manuelle','Automatique','Semi-automatique'] },
    { key:'couleur',label:'Couleur',ph:'Noir, Blanc, Gris...' },
    { key:'puissance',label:'Puissance (CV)',ph:'120',type:'number' },
    { key:'nbPortes',label:'Nb de portes',type:'select',opts:['2','3','4','5'] },
    { key:'etat',label:'Etat general',type:'select',opts:['Excellent','Tres bon','Bon','Correct','A reparer'] },
    { key:'ct',label:'Controle technique',type:'select',opts:['Valide','A refaire','Non applicable'] },
    { key:'nbProprietaires',label:'Nb de proprietaires',ph:'1',type:'number' },
    { key:'options',label:'Options / equipements',ph:'GPS, Camera, Toit ouvrant...',wide:true },
    { key:'defauts',label:'Defauts connus',ph:'Rayure, bosses, voyants...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'8500',type:'number' },
    { key:'negociable',label:'Negociable',type:'select',opts:['Oui','Non','Legerement'] },
    { key:'ville',label:'Ville',ph:'Lyon, Paris...' },
    { key:'urgence',label:'Urgence de vente',type:'urgence' },
  ],
  Telephone: [
    { key:'marque',label:'Marque',ph:'Apple, Samsung, Xiaomi...' },
    { key:'modele',label:'Modele',ph:'iPhone 15 Pro, Galaxy S24...' },
    { key:'stockage',label:'Stockage',type:'select',opts:['32 Go','64 Go','128 Go','256 Go','512 Go','1 To'] },
    { key:'couleur',label:'Couleur',ph:'Noir, Blanc, Bleu...' },
    { key:'etat',label:'Etat',type:'select',opts:['Neuf','Comme neuf','Tres bon','Bon','Acceptable'] },
    { key:'batterie',label:'Sante batterie',ph:'94%' },
    { key:'debloque',label:'Debloque',type:'select',opts:['Oui - tous operateurs','Non - operateur specifique'] },
    { key:'accessoires',label:'Accessoires inclus',ph:'Boite, chargeur, coques...',wide:true },
    { key:'defauts',label:'Defauts',ph:'Rayures, traces...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'450',type:'number' },
    { key:'negociable',label:'Negociable',type:'select',opts:['Oui','Non'] },
    { key:'ville',label:'Ville',ph:'Paris, Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  Informatique: [
    { key:'type',label:'Type',type:'select',opts:['Ordinateur portable','PC fixe','Tablette','Ecran','Imprimante','Autre'] },
    { key:'marque',label:'Marque',ph:'Apple, Dell, HP, Asus...' },
    { key:'modele',label:'Modele',ph:'MacBook Pro 14, XPS 15...' },
    { key:'processeur',label:'Processeur',ph:'M3 Pro, Intel i7, Ryzen 5...' },
    { key:'ram',label:'RAM',type:'select',opts:['4 Go','8 Go','16 Go','32 Go','64 Go'] },
    { key:'stockage',label:'Stockage',ph:'512 Go SSD...' },
    { key:'ecran',label:'Taille ecran',ph:'14 pouces...' },
    { key:'etat',label:'Etat',type:'select',opts:['Comme neuf','Tres bon','Bon','Acceptable'] },
    { key:'batterie',label:'Sante batterie',ph:'92 cycles...' },
    { key:'accessories',label:'Accessoires',ph:'Chargeur, housse, souris...',wide:true },
    { key:'defauts',label:'Defauts',ph:'Rayures, touches...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'800',type:'number' },
    { key:'ville',label:'Ville',ph:'Paris, Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  Mobilier: [
    { key:'type',label:'Type de meuble',ph:'Canape, Table, Armoire...' },
    { key:'marque',label:'Marque / Style',ph:'Ikea, Maisons du Monde, Artisanal...' },
    { key:'couleur',label:'Couleur / Matiere',ph:'Blanc, Bois naturel, Tissu gris...' },
    { key:'dimensions',label:'Dimensions (L x H x P cm)',ph:'180 x 90 x 45',wide:true },
    { key:'etat',label:'Etat',type:'select',opts:['Comme neuf','Tres bon','Bon','Quelques traces'] },
    { key:'annee',label:'Annee achat approximative',ph:'2020' },
    { key:'montage',label:'Demontable / livraison possible',type:'select',opts:['Demontable','Non demontable','Livraison possible'] },
    { key:'defauts',label:'Defauts / traces',ph:'Rayure sur le dessus...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'150',type:'number' },
    { key:'negociable',label:'Negociable',type:'select',opts:['Oui','Non'] },
    { key:'ville',label:'Ville',ph:'Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  Electromenager: [
    { key:'type',label:'Type',ph:'Lave-linge, Frigo, Four...' },
    { key:'marque',label:'Marque',ph:'Bosch, Samsung, Whirlpool...' },
    { key:'modele',label:'Modele',ph:'WAN24264FR...' },
    { key:'annee',label:'Annee',ph:'2021',type:'number' },
    { key:'capacite',label:'Capacite / Puissance',ph:'7 kg, 200L, 900W...' },
    { key:'etat',label:'Etat',type:'select',opts:['Excellent','Bon','Fonctionnel'] },
    { key:'defauts',label:'Defauts / historique',ph:'Petite rayure, toujours bien entretenu...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'200',type:'number' },
    { key:'ville',label:'Ville',ph:'Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  Vetements: [
    { key:'type',label:'Type',ph:'Veste, Manteau, Robe...' },
    { key:'marque',label:'Marque',ph:'Zara, H&M, Nike...' },
    { key:'taille',label:'Taille',ph:'M, 42, 10 ans...' },
    { key:'couleur',label:'Couleur',ph:'Noir, Bleu marine...' },
    { key:'etat',label:'Etat',type:'select',opts:['Neuf avec etiquette','Comme neuf','Tres bon','Bon'] },
    { key:'nbPortes',label:'Nombre de fois porte',ph:'2-3 fois, Rarement...' },
    { key:'defauts',label:'Defauts',ph:'Aucun, petite tache...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'25',type:'number' },
    { key:'ville',label:'Ville',ph:'Paris...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  'Jeux video': [
    { key:'console',label:'Console / Plateforme',type:'select',opts:['PS5','PS4','Xbox Series','Xbox One','Nintendo Switch','PC','Autre'] },
    { key:'type',label:'Type',type:'select',opts:['Jeu','Console','Accessoire','Pack complet'] },
    { key:'titre',label:'Titre / Nom',ph:'FIFA 24, Zelda, PS5 Digital...' },
    { key:'etat',label:'Etat',type:'select',opts:['Neuf sous blister','Comme neuf','Tres bon','Bon'] },
    { key:'boite',label:'Boite / Notice incluse',type:'select',opts:['Oui complet','Jeu seul','Boite abimee'] },
    { key:'prix',label:'Prix (EUR)',ph:'25',type:'number' },
    { key:'ville',label:'Ville',ph:'Lyon...' },
  ],
  Sport: [
    { key:'type',label:'Type / Sport',ph:'Velo, Raquette, Tapis de course...' },
    { key:'marque',label:'Marque',ph:'Decathlon, Nike, Specialized...' },
    { key:'taille',label:'Taille / Pointure',ph:'M, 42, taille 54...' },
    { key:'etat',label:'Etat',type:'select',opts:['Comme neuf','Tres bon','Bon','Usure normale'] },
    { key:'frequence',label:'Frequence utilisation',ph:'Rarement utilise, regulier...',wide:true },
    { key:'accessoires',label:'Accessoires inclus',ph:'Casque, pompe, cadenas...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'80',type:'number' },
    { key:'ville',label:'Ville',ph:'Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
  Autre: [
    { key:'type',label:'Type / Description courte',ph:'Decrivez en quelques mots...' },
    { key:'marque',label:'Marque / Fabricant',ph:'(si applicable)' },
    { key:'modele',label:'Modele / Reference',ph:'(si applicable)' },
    { key:'annee',label:'Annee',ph:'(si applicable)',type:'number' },
    { key:'etat',label:'Etat',type:'select',opts:['Neuf','Comme neuf','Tres bon','Bon','Correct'] },
    { key:'description',label:'Description complete',ph:'Decrivez votre article en detail...',wide:true },
    { key:'defauts',label:'Defauts / imperfections',ph:'Aucun, rayure...',wide:true },
    { key:'prix',label:'Prix (EUR)',ph:'50',type:'number' },
    { key:'negociable',label:'Negociable',type:'select',opts:['Oui','Non'] },
    { key:'ville',label:'Ville',ph:'Lyon...' },
    { key:'urgence',label:'Urgence',type:'urgence' },
  ],
}

const CATEGORY_LIST = Object.keys(CATEGORIES)

function AnnonceTab({ isSubscribed, planKey, credits, subscribe, onUsed }) {
  const [categorie, setCategorie] = useState('')
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [badResult, setBadResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fields = categorie ? CATEGORIES[categorie] : []
  const filled = Object.values(form).filter(v => v && v !== 'Non').length
  const total = Math.max(fields.length, 1)
  const pct = Math.round((filled / total) * 100)

  const hasAccess = isSubscribed || credits.annonces.remaining > 0

  const generate = async () => {
    if (!categorie) { alert('Choisissez une categorie'); return }
    if (!form.prix && !form.titre && !form.type) { alert('Remplissez au moins le prix et quelques infos'); return }
    setLoading(true)
    const specs = 'Categorie: ' + categorie + '\n' + Object.entries(form).filter(([,v])=>v).map(([k,v])=>k+': '+v).join('\n')
    const res = await fetch('/api/ai/annonce', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ specs, lang:'fr', urgence:form.urgence||'normal', type:categorie, inputData:form })
    })
    const data = await res.json()
    setResult(data)
    // Générer version nulle pour comparaison
    if (data.annonce) {
      setBadResult({
        titre: form.marque && form.modele ? form.marque+' '+form.modele+' a vendre' : 'Article a vendre',
        description: 'Je vends cet article. Il est en bon etat. Prix: '+(form.prix||'?')+' EUR. Contactez-moi.',
        score: Math.floor(Math.random()*20)+15
      })
    }
    setLoading(false)
    if (!data.error) onUsed()
  }

  if (!hasAccess) return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Outil IA</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Creer une annonce</h2>
      </div>
      {/* Apercu grise */}
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
          {CATEGORY_LIST.slice(0,6).map(c => (
            <div key={c} style={{ background:'var(--ink)',padding:'14px',textAlign:'center',fontSize:12,color:'var(--muted2)' }}>{c}</div>
          ))}
        </div>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:20,height:120 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Outil IA</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Creer une annonce</h2>
      </div>

      {/* Sélection catégorie */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
        <div style={S.lbl}>Categorie de l&apos;article *</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:6,marginTop:8 }}>
          {CATEGORY_LIST.map(c => (
            <button key={c} onClick={() => { setCategorie(c); setForm({}) }}
              style={{ background:categorie===c?'rgba(201,168,76,.12)':'var(--ink)',border:'1px solid',borderColor:categorie===c?'var(--gold)':'var(--border)',borderRadius:3,color:categorie===c?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'8px 6px',transition:'all .15s',fontWeight:categorie===c?600:400 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Barre progression */}
      {categorie && (
        <>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'10px 20px',marginBottom:1,display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                <span style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>Formulaire</span>
                <span style={{ fontSize:11,color:'var(--gold2)',fontWeight:600 }}>{pct}%</span>
              </div>
              <div style={{ background:'var(--s3)',borderRadius:1,height:2 }}>
                <div style={{ width:pct+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width .4s' }} />
              </div>
            </div>
            <div style={{ fontSize:10,color:'var(--muted)',flexShrink:0 }}>Plus vous remplissez = meilleure annonce</div>
          </div>

          {/* Champs dynamiques */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
            {fields.map(f => (
              <div key={f.key} style={{ ...S.cell(f.wide) }}>
                <label style={S.lbl}>{f.label}</label>
                {f.type === 'select' ? (
                  <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }}
                    value={form[f.key]||''} onChange={e => setForm({...form,[f.key]:e.target.value})}>
                    <option value="">Selectionner</option>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' || f.wide ? (
                  <textarea style={{ ...S.inp,resize:'vertical',minHeight:56,lineHeight:1.6 }}
                    placeholder={f.ph} value={form[f.key]||''} onChange={e => setForm({...form,[f.key]:e.target.value})} />
                ) : f.type === 'urgence' ? (
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginTop:4 }}>
                    {[['normal','Normal'],['rapide','Rapide'],['optimise','Max prix']].map(([v,l]) => (
                      <div key={v} onClick={() => setForm({...form,urgence:v})}
                        style={{ background:form.urgence===v?'rgba(201,168,76,.08)':'var(--s2)',borderBottom:form.urgence===v?'2px solid var(--gold)':'2px solid transparent',padding:'8px',textAlign:'center',fontSize:11,color:form.urgence===v?'var(--gold2)':'var(--muted2)',cursor:'pointer',transition:'all .15s' }}>
                        {l}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input style={S.inp} type={f.type||'text'} placeholder={f.ph}
                    value={form[f.key]||''} onChange={e => setForm({...form,[f.key]:e.target.value})} />
                )}
              </div>
            ))}
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary"
            style={{ width:'100%',fontSize:13,padding:'16px',opacity:loading?.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:1 }}>
            {loading ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</> : '⚡ GENERER MON ANNONCE'}
          </button>
        </>
      )}

      {/* Résultats */}
      {result && !result.error && (
        <div style={{ marginTop:20 }}>
          {/* Comparaison */}
          {badResult && (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:16 }}>
              <div style={{ background:'rgba(200,57,43,.06)',padding:'16px 20px',borderTop:'2px solid var(--red)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <span style={{ fontSize:10,color:'var(--red2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce faible</span>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:22,color:'var(--red2)' }}>{badResult.score}/100</span>
                </div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,marginBottom:6,color:'var(--muted3)' }}>{badResult.titre}</div>
                <div style={{ fontSize:12,color:'var(--muted)',lineHeight:1.6 }}>{badResult.description}</div>
              </div>
              <div style={{ background:'rgba(45,122,79,.06)',padding:'16px 20px',borderTop:'2px solid var(--success2)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <span style={{ fontSize:10,color:'var(--success2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce optimisee</span>
                  <span style={{ fontFamily:'var(--font-label)',fontSize:22,color:'var(--success2)' }}>{result.score?.score||85}/100</span>
                </div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:600,marginBottom:6 }}>{result.annonce?.titre||'Titre genere'}</div>
                <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.6 }}>{(result.annonce?.description||'').slice(0,120)}...</div>
              </div>
            </div>
          )}

          {/* Score */}
          {result.score && (
            <div style={{ display:'flex',alignItems:'center',gap:16,background:'var(--s1)',border:'1px solid var(--border)',padding:'14px 20px',marginBottom:1 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:38,letterSpacing:-2,color:result.score.score>=70?'var(--gold2)':result.score.score>=50?'var(--warning)':'var(--red2)',lineHeight:1 }}>
                {result.score.score}
              </div>
              <div>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)',marginBottom:4 }}>Score qualite — {result.score.grade}</div>
                {result.score.suggestions?.slice(0,2).map((s,i) => <div key={i} style={{ fontSize:11,color:'var(--muted2)' }}>→ {s}</div>)}
              </div>
            </div>
          )}

          {result.annonce?.titre && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'16px 20px',marginBottom:1 }}>
              <div style={S.lbl}>Titre</div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,lineHeight:1.4 }}>{result.annonce.titre}</div>
            </div>
          )}
          {[['Description',result.annonce?.description],['Points forts',result.annonce?.pointsForts],['Transparence',result.annonce?.defauts],['Prix conseille',result.annonce?.prixConseil]].filter(([,v])=>v).map(([label,val]) => (
            <div key={label} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
              <div style={S.lbl}>{label}</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--red)',padding:'16px 20px',marginBottom:1 }}>
              <div style={S.lbl}>Version courte — Facebook / SMS</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.8,fontStyle:'italic',whiteSpace:'pre-wrap' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={() => { navigator.clipboard.writeText(result.raw||''); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
            style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'12px',marginTop:1 }}>
            {copied ? 'Copie !' : 'Copier l\'annonce complete'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── RÉPONSE TAB ──────────────────────────────────────────
function ReponseTab({ isSubscribed, subscribe, onUsed }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [annonces, setAnnonces] = useState([])
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isSubscribed) {
      fetch('/api/dashboard/annonces').then(r=>r.json()).then(d => setAnnonces(d.annonces||[])).catch(()=>{})
    }
  }, [isSubscribed])

  if (!isSubscribed) return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Outil IA</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Repondre a un acheteur</h2>
      </div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',height:120,marginBottom:1 }} />
        <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',height:80 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const generate = async () => {
    if (!message) return
    setLoading(true)
    const ctx = selectedAnnonce
      ? 'Annonce concerne: ' + selectedAnnonce.titre + '\n' + contexte
      : contexte
    const res = await fetch('/api/ai/reponse', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message, contexte: ctx })
    })
    const data = await res.json()
    setResult(data); setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Outil IA</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Repondre a un acheteur</h2>
      </div>

      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
        <label style={S.lbl}>Message recu *</label>
        <textarea style={{ ...S.inp,minHeight:100,resize:'vertical',lineHeight:1.7 }}
          placeholder="Collez le message de l'acheteur ici..." value={message} onChange={e => setMessage(e.target.value)} />
      </div>

      {/* Contexte + sélection annonce */}
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Contexte (optionnel)</label>
          <button onClick={() => setShowSearch(!showSearch)}
            style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'4px 10px',letterSpacing:.5 }}>
            {showSearch ? 'Masquer' : '+ Lier une annonce'}
          </button>
        </div>

        {showSearch && annonces.length > 0 && (
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:10,maxHeight:180,overflowY:'auto' }}>
            {annonces.map(a => (
              <div key={a.id} onClick={() => { setSelectedAnnonce(a); setShowSearch(false); setContexte('Annonce: '+a.titre) }}
                className="hover-row"
                style={{ padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}

        {selectedAnnonce && (
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'6px 12px',marginBottom:8,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>✦</span>
            <span style={{ color:'var(--cream)' }}>{selectedAnnonce.titre}</span>
            <button onClick={() => { setSelectedAnnonce(null); setContexte('') }}
              style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',marginLeft:'auto',fontSize:14 }}>×</button>
          </div>
        )}

        <textarea style={{ ...S.inp,minHeight:60,resize:'vertical',lineHeight:1.7 }}
          placeholder="Prix demande, etat, infos utiles..." value={contexte} onChange={e => setContexte(e.target.value)} />
      </div>

      <button onClick={generate} disabled={loading||!message} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'16px',opacity:(loading||!message)?.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</> : 'GENERER LA REPONSE'}
      </button>

      {result?.reponse && (
        <div style={{ marginTop:20 }}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'20px',marginBottom:1 }}>
            <div style={S.lbl}>Reponse prete a copier</div>
            <div style={{ fontSize:14,color:'var(--cream)',lineHeight:1.85,whiteSpace:'pre-wrap' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion && (
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--red)',padding:'16px 20px',marginBottom:1 }}>
              <div style={S.lbl}>Conseil de negociation</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.7,fontStyle:'italic' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={() => { navigator.clipboard.writeText(result.reponse.reponsePrete); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
            style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'12px',marginTop:1 }}>
            {copied ? 'Copie !' : 'Copier la reponse'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ESTIMATION TAB ───────────────────────────────────────
function EstimationTab() {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ specs })
    })
    const data = await res.json()
    if (data.error && data.upgrade) { alert(data.message); setLoading(false); return }
    setResult(data); setLoading(false)
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Outil gratuit</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Estimer le prix</h2>
      </div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
        <label style={S.lbl}>Decrivez votre article</label>
        <textarea style={{ ...S.inp,minHeight:120,resize:'vertical',lineHeight:1.7 }}
          placeholder="Ex: iPhone 15 Pro 256Go noir, tres bon etat, batterie 94%, avec boite..." value={specs} onChange={e => setSpecs(e.target.value)} />
        <div style={{ fontSize:10,color:'var(--muted)',marginTop:6 }}>3 estimations gratuites par jour</div>
      </div>
      <button onClick={estimate} disabled={loading||!specs} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'16px',opacity:(loading||!specs)?.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Analyse...</> : 'ESTIMER LE PRIX'}
      </button>
      {result && !result.error && (
        <div style={{ marginTop:20 }}>
          <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
            {[['Basse',result.low,'var(--red2)'],['Moyenne',result.mid,'var(--gold2)'],['Haute',result.high,'var(--success2)']].map(([label,val,color]) => (
              <div key={label} style={{ background:'var(--ink)',padding:'24px 20px',textAlign:'center' }}>
                <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:10 }}>{label}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:600,color,letterSpacing:-1 }}>{Number(val).toLocaleString('fr-FR')} EUR</div>
              </div>
            ))}
          </div>
          {result.note && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'14px 20px',marginTop:1 }}>
              <div style={{ fontSize:12,color:'var(--muted2)',fontStyle:'italic',lineHeight:1.65 }}>{result.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HISTORIQUE TAB ───────────────────────────────────────
function HistoriqueTab() {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('annonces')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/annonces').then(r=>r.json()),
      fetch('/api/dashboard/reponses').then(r=>r.json()),
    ]).then(([a,r]) => { setAnnonces(a.annonces||[]); setReponses(r.reponses||[]); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Mes creations</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Historique</h2>
      </div>
      <div style={{ display:'flex',gap:1,background:'var(--border)',marginBottom:14 }}>
        {[['annonces','Annonces ('+annonces.length+')'],['reponses','Reponses ('+reponses.length+')']].map(([id,label]) => (
          <button key={id} onClick={() => setSection(id)}
            style={{ flex:1,background:section===id?'var(--s1)':'var(--ink)',border:'none',borderBottom:section===id?'2px solid var(--gold)':'2px solid transparent',color:section===id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:500,padding:'12px',transition:'all .15s' }}>
            {label}
          </button>
        ))}
      </div>
      {loading && <div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}
      {section === 'annonces' && !loading && (
        annonces.length === 0
          ? <div style={{ textAlign:'center',padding:40,color:'var(--muted2)',fontFamily:'var(--font-display)',fontStyle:'italic' }}>Aucune annonce generee</div>
          : annonces.map(a => (
            <div key={a.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
              <div style={{ padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,cursor:'pointer' }}
                onClick={() => setExpanded(expanded===a.id?null:a.id)}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.titre||'Sans titre'}</div>
                  <div style={{ fontSize:11,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                  {a.scoreGrade && <span style={{ fontFamily:'var(--font-label)',fontSize:18,color:a.score>=70?'var(--gold2)':'var(--muted2)' }}>{a.score}</span>}
                  <span style={{ fontSize:12,color:'var(--muted)',transition:'transform .2s',transform:expanded===a.id?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
                </div>
              </div>
              {expanded === a.id && (
                <div style={{ borderTop:'1px solid var(--border)',padding:'14px 20px',background:'var(--s1)' }}>
                  {a.description && <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.75,marginBottom:10,whiteSpace:'pre-wrap' }}>{a.description}</div>}
                  {a.pointsForts && <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic' }}>{a.pointsForts}</div>}
                </div>
              )}
            </div>
          ))
      )}
      {section === 'reponses' && !loading && (
        reponses.length === 0
          ? <div style={{ textAlign:'center',padding:40,color:'var(--muted2)',fontFamily:'var(--font-display)',fontStyle:'italic' }}>Aucune reponse generee</div>
          : reponses.map(r => (
            <div key={r.id} style={{ background:'var(--ink)',border:'1px solid var(--border)',marginBottom:1 }}>
              <div style={{ padding:'14px 20px',cursor:'pointer' }} onClick={() => setExpanded(expanded===r.id?null:r.id)}>
                <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:4 }}>Message: &ldquo;{r.messageAcheteur.slice(0,70)}&rdquo;</div>
                <div style={{ fontSize:11,color:'var(--muted)',display:'flex',justifyContent:'space-between' }}>
                  <span>{new Date(r.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</span>
                  <span style={{ color:'var(--gold3)' }}>{expanded===r.id?'Masquer ▲':'Voir la reponse ▾'}</span>
                </div>
              </div>
              {expanded === r.id && (
                <div style={{ borderTop:'1px solid var(--border)',padding:'14px 20px',background:'var(--s1)' }}>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{r.reponsePrete}</div>
                  {r.suggestion && <div style={{ marginTop:10,fontSize:12,color:'var(--muted2)',fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:10 }}>{r.suggestion}</div>}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  )
}

// ─── TARIFS TAB ───────────────────────────────────────────
function TarifsTab({ isSubscribed, planKey, subscribe, showSubModal }) {
  const PLANS = [
    { key:'starter', name:'Starter', price:'3,99', annonces:5, reponses:20, features:['5 annonces/semaine','20 reponses/semaine','Estimation de prix','Score qualite'] },
    { key:'business', name:'Business', price:'5,99', annonces:15, reponses:60, features:['15 annonces/semaine','60 reponses/semaine','Tout le Starter','Parrainage','Conseiller IA'], recommended:true },
    { key:'expert', name:'Expert', price:'9,99', annonces:40, reponses:250, features:['40 annonces/semaine','250 reponses/semaine','Tout le Business','Priorite support'] },
  ]
  const PACKS = [
    { name:'5 annonces',price:'9,99 EUR',unit:'2,00 EUR/ann.',link:process.env.NEXT_PUBLIC_STRIPE_PACK5||'' },
    { name:'10 annonces',price:'17,99 EUR',unit:'1,80 EUR/ann.',link:process.env.NEXT_PUBLIC_STRIPE_PACK10||'' },
    { name:'50 reponses',price:'14,99 EUR',unit:'0,30 EUR/rep.',link:process.env.NEXT_PUBLIC_STRIPE_REP50||'' },
    { name:'500 reponses',price:'39,99 EUR',unit:'0,08 EUR/rep.',link:process.env.NEXT_PUBLIC_STRIPE_REP500||'' },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Offres</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Tarifs</h2>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:16 }}>
        {PLANS.map(plan => {
          const isCurrentPlan = planKey === plan.key || (planKey === 'pro' && plan.key === 'business')
          return (
            <div key={plan.key} style={{ background:plan.recommended?'var(--s1)':'var(--ink)',padding:'24px 20px',position:'relative',borderTop:plan.recommended?'2px solid var(--gold)':'2px solid transparent' }}>
              {plan.recommended && (
                <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%) translateY(-50%)',background:'var(--gold)',color:'#030303',fontFamily:'var(--font-label)',fontSize:8,letterSpacing:2,padding:'3px 10px',whiteSpace:'nowrap' }}>RECOMMANDE</div>
              )}
              <div style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:2,marginBottom:4 }}>{plan.name}</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:32,color:plan.recommended?'var(--gold2)':'var(--cream)',letterSpacing:-2,lineHeight:1,marginBottom:3 }}>{plan.price}<span style={{ fontSize:12,color:'var(--muted2)',letterSpacing:0 }}> EUR/sem</span></div>
              <div style={{ marginBottom:16,marginTop:12 }}>
                {plan.features.map(f => <div key={f} style={{ fontSize:11,color:'var(--muted2)',marginBottom:6,display:'flex',alignItems:'center',gap:6 }}><span style={{ color:plan.recommended?'var(--gold3)':'var(--muted)' }}>+</span>{f}</div>)}
              </div>
              {isCurrentPlan && isSubscribed ? (
                <button onClick={showSubModal} style={{ width:'100%',background:'rgba(201,168,76,.1)',border:'1px solid var(--gold-border)',borderRadius:2,color:'var(--gold2)',cursor:'pointer',fontSize:11,padding:'10px',letterSpacing:1 }}>
                  Plan actif — Gerer
                </button>
              ) : (
                <button onClick={() => subscribe(plan.key)}
                  style={{ width:'100%',background:plan.recommended?'linear-gradient(135deg,var(--gold3),var(--gold2))':'none',border:plan.recommended?'none':'1px solid var(--border2)',borderRadius:2,color:plan.recommended?'#030303':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:1.5,padding:'11px',transition:'all .2s' }}>
                  {isSubscribed ? 'Changer pour ' + plan.name : 'Choisir ' + plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding:'12px 0',textAlign:'center' }}>
        <span style={{ fontSize:11,color:'var(--muted)',letterSpacing:2,textTransform:'uppercase' }}>ou packs a l&apos;unite</span>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)' }}>
        {PACKS.map(p => (
          <div key={p.name} style={{ background:'var(--ink)',padding:20 }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:600,marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:14 }}>{p.unit} · Paiement unique</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10 }}>
              <span style={{ fontFamily:'var(--font-label)',fontSize:20,color:'var(--muted3)',letterSpacing:-1 }}>{p.price}</span>
              <button onClick={() => p.link?window.open(p.link,'_blank'):alert('Lien non configure')}
                className="btn-ghost" style={{ fontSize:11,padding:'7px 16px' }}>Acheter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PROFIL TAB ───────────────────────────────────────────
function ProfilTab({ user, isSubscribed, isPremium, planKey, subscribe, openSubModal, usage, credits, purchases, limits }) {
  return (
    <div className="db-fade">
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Mon compte</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:400,letterSpacing:-.5 }}>Profil</h2>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }} className="db-grid2">
        <div style={{ background:'var(--ink)',padding:'20px 24px' }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>Compte</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,marginBottom:2 }}>{user.name||'Sans nom'}</div>
          <div style={{ fontSize:12,color:'var(--muted2)' }}>{user.email}</div>
        </div>
        <div style={{ background:'var(--ink)',padding:'20px 24px' }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>Plan actuel</div>
          <div style={{ fontFamily:'var(--font-label)',fontSize:22,letterSpacing:2,color:isSubscribed?'var(--gold2)':'var(--muted2)',marginBottom:2 }}>
            {PLAN_NAMES[planKey].toUpperCase()}
          </div>
          <div style={{ fontSize:11,color:'var(--muted)' }}>
            {isSubscribed && !isPremium ? PLAN_PRICES[planKey]+' EUR/semaine' : isPremium ? 'Acces Premium' : 'Gratuit'}
          </div>
        </div>
      </div>

      {/* Limites */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
        {[
          { val:usage.annonces, label:'Annonces', sub:'cette semaine' },
          { val:usage.reponses, label:'Reponses', sub:'cette semaine' },
          { val:limits.annonces===Infinity?'∞':limits.annonces, label:'Limite', sub:'annonces/sem' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--s1)',padding:'18px',textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:300,letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>{s.label}</div>
            <div style={{ fontSize:9,color:'var(--muted)',marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Abonnement */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:1 }}>
        <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:12 }}>Abonnement</div>
        {isSubscribed ? (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:14,color:'var(--cream)',marginBottom:3 }}>
                Plan {PLAN_NAMES[planKey]} actif{!isPremium ? ' · '+PLAN_PRICES[planKey]+' EUR/semaine' : ''}
              </div>
              {!isPremium && <div style={{ fontSize:11,color:'var(--muted)' }}>Annulable a tout moment · Non remboursable</div>}
            </div>
            {!isPremium && <button onClick={openSubModal} className="btn-ghost" style={{ fontSize:11 }}>Gerer</button>}
          </div>
        ) : (
          <div>
            <div style={{ fontSize:13,color:'var(--muted2)',marginBottom:12 }}>Plan gratuit · Abonnez-vous pour acceder aux annonces et reponses</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
              {[['starter','Starter','3,99'],['business','Business','5,99'],['expert','Expert','9,99']].map(([key,name,price]) => (
                <button key={key} onClick={() => subscribe(key)}
                  style={{ background:key==='business'?'linear-gradient(135deg,var(--gold3),var(--gold2))':'var(--s2)',border:'1px solid var(--border)',borderRadius:3,color:key==='business'?'#030303':'var(--muted2)',cursor:'pointer',padding:'10px 6px',fontSize:11,transition:'all .15s' }}>
                  <div style={{ fontWeight:600,marginBottom:2 }}>{name}</div>
                  <div style={{ fontSize:12 }}>{price} EUR/sem</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parrainage */}
      {isSubscribed && !isPremium && <ReferralSection />}

      {/* Comment ça marche parrainage */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:1 }}>
        <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:12 }}>Comment fonctionne le parrainage ?</div>
        {[
          '1. Copiez votre lien de parrainage personnel ci-dessus.',
          '2. Envoyez-le a un ami qui veut vendre ses affaires.',
          '3. Si votre ami prend au minimum le plan Starter, vous recevez automatiquement 1 semaine gratuite Business.',
          '4. Votre ami beneficie aussi d\'une reduction a son inscription.',
          'Note : Si vous avez ete recrute par un affilie, sa commission est preservee sur les futurs clients que vous parrainez.',
        ].map((s,i) => (
          <div key={i} style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,marginBottom:6,paddingLeft:i<4?0:0 }}>{s}</div>
        ))}
      </div>

      {/* Historique achats */}
      {purchases && purchases.length > 0 && (
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginTop:1 }}>
          <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>Historique des achats</div>
          {purchases.map(p => (
            <div key={p.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',gap:10 }}>
              <div>
                <div style={{ fontSize:13,color:'var(--cream)' }}>{p.packName}</div>
                <div style={{ fontSize:11,color:'var(--muted2)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:16,color:'var(--gold2)' }}>{p.amount} EUR</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{p.quantity} {p.packType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── REFERRAL ─────────────────────────────────────────────
function ReferralSection() {
  const [code, setCode] = useState(null)
  const [stats, setStats] = useState({ total:0, active:0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral/generate').then(r=>r.json()).then(data => {
      if (data.code) { setCode(data.code); if(data.stats) setStats(data.stats) }
    }).catch(() => {})
  }, [])

  if (!code) return null
  const link = (typeof window!=='undefined'?window.location.origin:'') + '/?ref=' + code

  return (
    <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:1 }}>
      <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>Mon lien de parrainage</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:12 }}>
        <div style={{ background:'var(--ink)',padding:'12px 16px',textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:24,color:'var(--gold2)',letterSpacing:-1 }}>{stats.total}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Amis parraines</div>
        </div>
        <div style={{ background:'var(--ink)',padding:'12px 16px',textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:24,color:'var(--success2)',letterSpacing:-1 }}>{stats.active}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Actifs en ce moment</div>
        </div>
      </div>
      <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'10px 14px',fontFamily:'monospace',fontSize:11,color:'var(--muted2)',wordBreak:'break-all',marginBottom:10 }}>{link}</div>
      <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
        className="btn-ghost" style={{ width:'100%',fontSize:11,color:copied?'var(--gold2)':'var(--muted2)',borderColor:copied?'var(--gold-border)':'var(--border2)' }}>
        {copied ? 'Lien copie !' : 'Copier mon lien de parrainage'}
      </button>
    </div>
  )
}
