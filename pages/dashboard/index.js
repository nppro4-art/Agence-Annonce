import { useState, useEffect } from 'react'
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
    { id:'outils',label:'Outils' },
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
          /* Header */
          .db-header{padding:0 10px!important}
          .tab-btn{font-size:9px!important;padding:0 5px!important;flex:1!important;text-align:center!important}
          /* Credits dans header - cacher sur mobile */
          .db-credits{display:none!important}
          /* Main */
          .db-main{padding:16px 12px 100px!important}
          /* Grilles */
          .db-grid2{grid-template-columns:1fr!important}
          .db-grid3{grid-template-columns:1fr 1fr!important}
          /* Actions accueil */
          .db-actions{grid-template-columns:1fr!important}
          /* Formulaire */
          .db-form-grid{grid-template-columns:1fr!important}
          /* Modal */
          .db-modal-inner{padding:24px 16px!important}
          /* Outils - 1 colonne sur mobile */
          .db-tools-grid{grid-template-columns:1fr!important}
          /* Titre dashboard */
          .db-welcome-title{font-size:24px!important}
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
            <div className="db-credits" style={{ display:'flex',gap:6 }}>
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
            </div>
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
            <div className="db-grid3" className='db-actions' style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:20 }}>
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
        {tab === 'outils'     && <OutilsTab isSubscribed={isSubscribed} subscribe={subscribe} />}
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
    { key:'marque', label:'Marque', ph:'BMW, Renault, Peugeot...' },
    { key:'modele', label:'Modele', ph:'Serie 3, Clio, 308...' },
    { key:'version', label:'Version / Finition', ph:'M Sport, GT Line...' },
    { key:'annee', label:'Annee', ph:'2019', type:'number' },
    { key:'kilometrage', label:'Kilometrage (km)', ph:'75000', type:'number' },
    { key:'carburant', label:'Carburant', type:'select', opts:['Essence','Diesel','Hybride','Hybride rechargeable','Electrique','GPL'] },
    { key:'boite', label:'Boite de vitesse', type:'select', opts:['Manuelle 5v','Manuelle 6v','Automatique','Semi-automatique'] },
    { key:'couleur', label:'Couleur exterieure', ph:'Noir metallise, Blanc nacre...' },
    { key:'couleurInt', label:'Couleur interieure', ph:'Noir, Beige, Cuir brun...' },
    { key:'puissance', label:'Puissance (CV)', ph:'120', type:'number' },
    { key:'cylindree', label:'Cylindree (cm3)', ph:'1598', type:'number' },
    { key:'conso', label:'Consommation (L/100)', ph:'5.8' },
    { key:'co2', label:'Emissions CO2 (g/km)', ph:'112' },
    { key:'nbPortes', label:'Nombre de portes', type:'select', opts:['2','3','4','5'] },
    { key:'nbPlaces', label:'Nombre de places', type:'select', opts:['2','4','5','7','9'] },
    { key:'carrosserie', label:'Type de carrosserie', type:'select', opts:['Berline','Break','SUV','Citadine','Coupe','Cabriolet','Monospace','Utilitaire'] },
    { key:'etat', label:'Etat general', type:'select', opts:['Excellent - comme neuf','Tres bon etat','Bon etat','Etat correct','A reparer'] },
    { key:'nbProprio', label:'Nb de proprietaires', ph:'1', type:'number' },
    { key:'premiereMain', label:'Premiere main', type:'select', opts:['Oui','Non','Ne sait pas'] },
    { key:'ct', label:'Controle technique', type:'select', opts:['Valide','A refaire sous 2 mois','Non presente','Non applicable'] },
    { key:'dateCT', label:'Date du CT', ph:'03/2024' },
    { key:'carnet', label:'Carnet entretien', type:'select', opts:['Complet et a jour','Partiel','Absent'] },
    { key:'dernierEntretien', label:'Dernier entretien', ph:'Vidange + filtres a 70 000 km...', wide:true },
    { key:'pneus', label:'Etat des pneus', type:'select', opts:['Neufs','Bonne epaisseur','Usure normale','A changer'] },
    { key:'freins', label:'Etat des freins', type:'select', opts:['Neufs','Bon etat','Usure normale','A surveiller'] },
    { key:'courroie', label:'Courroie de distribution', type:'select', opts:['Changee recemment','A faire','Chaine - pas de courroie'] },
    { key:'options', label:'Options et equipements', ph:'GPS, Camera recul, Toit ouvrant, Sieges chauffants...', wide:true },
    { key:'defauts', label:'Defauts et imperfections', ph:'Rayure aile avant, trace pare-choc, voyant...', wide:true },
    { key:'travauxFaits', label:'Travaux effectues recemment', ph:'Embrayage neuf a 65 000 km, batterie 2023...', wide:true },
    { key:'travauxAFaire', label:'Travaux a prevoir', ph:'Pneus arriere bientot, vidange dans 5000 km...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'8500', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui - prix a debattre','Legerement','Non - prix ferme'] },
    { key:'prixMin', label:'Prix minimum accepte (confidentiel)', ph:'7800', type:'number' },
    { key:'ville', label:'Ville', ph:'Lyon, Paris...' },
    { key:'dispo', label:'Disponibilite', type:'select', opts:['Immediate','Sous 1 semaine','Semaine uniquement','Week-end uniquement','Sur RDV'] },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - frais acheteur','Oui - inclus','A discuter'] },
    { key:'paiement', label:'Mode de paiement accepte', type:'select', opts:['Especes','Virement bancaire','Cheque de banque','Tous modes'] },
    { key:'raisonVente', label:'Raison de la vente', ph:'Achat vehicule neuf, demenagement...' },
    { key:'urgence', label:'Urgence de vente', type:'urgence' },
  ],

  Telephone: [
    { key:'marque', label:'Marque', ph:'Apple, Samsung, Xiaomi...' },
    { key:'modele', label:'Modele', ph:'iPhone 15 Pro, Galaxy S24...' },
    { key:'couleur', label:'Couleur', ph:'Noir titane, Blanc, Violet...' },
    { key:'stockage', label:'Stockage', type:'select', opts:['32 Go','64 Go','128 Go','256 Go','512 Go','1 To'] },
    { key:'ram', label:'RAM', ph:'8 Go, 12 Go...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous blister','Comme neuf','Tres bon','Bon etat','Etat correct'] },
    { key:'batterie', label:'Sante batterie', ph:'94%' },
    { key:'cycles', label:'Nb cycles batterie', ph:'120 cycles' },
    { key:'debloque', label:'Debloque tous operateurs', type:'select', opts:['Oui - tous operateurs','Non - Orange','Non - SFR','Non - Bouygues','Non - Free'] },
    { key:'imei', label:'IMEI disponible', type:'select', opts:['Oui - sur demande','Non'] },
    { key:'faceId', label:'Face ID / Touch ID', type:'select', opts:['Fonctionne parfaitement','Probleme mineur','Ne fonctionne plus','Non applicable'] },
    { key:'etatEcran', label:'Etat ecran', type:'select', opts:['Parfait','Micro-rayures','Rayures legeres','Fissure ou cassure'] },
    { key:'etatDos', label:'Etat du dos', type:'select', opts:['Parfait','Micro-rayures','Rayures visibles','Fissure'] },
    { key:'cameras', label:'Etat cameras', type:'select', opts:['Toutes parfaites','Legere buee','Probleme sur une','Plusieurs defectueuses'] },
    { key:'hautParleur', label:'Haut-parleur et micro', type:'select', opts:['Parfaits','Probleme leger','Defectueux'] },
    { key:'connecteur', label:'Connecteur de charge', type:'select', opts:['Parfait','Parfois capricieux','Defectueux'] },
    { key:'accessoires', label:'Accessoires inclus', ph:'Boite origine, chargeur, cable, coques...', wide:true },
    { key:'reparations', label:'Reparations effectuees', ph:'Ecran change 2023, batterie remplacee...', wide:true },
    { key:'defauts', label:'Autres defauts', ph:'Petit impact bas telephone, marque vitre arriere...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non - prix ferme'] },
    { key:'ville', label:'Ville', ph:'Paris, Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - Mondial Relay','Oui - Colissimo','Oui - tous','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Informatique: [
    { key:'type', label:'Type', type:'select', opts:['Ordinateur portable','PC fixe','Tablette','Ecran','Imprimante','Clavier/Souris','Composant PC','Disque dur SSD','Autre'] },
    { key:'marque', label:'Marque', ph:'Apple, Dell, HP, Asus, Lenovo...' },
    { key:'modele', label:'Modele', ph:'MacBook Pro 14 M3, XPS 15 9520...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2022', type:'number' },
    { key:'processeur', label:'Processeur', ph:'Apple M3 Pro, Intel i7-12700H, Ryzen 9...' },
    { key:'ram', label:'RAM', type:'select', opts:['4 Go','8 Go','16 Go','18 Go','24 Go','32 Go','48 Go','64 Go'] },
    { key:'stockage', label:'Stockage', ph:'512 Go SSD NVMe, 1 To SSD...' },
    { key:'gpu', label:'Carte graphique', ph:'RTX 4060, RX 7600, Intel Iris Xe...' },
    { key:'ecranTaille', label:'Taille ecran', ph:'14 pouces, 27 pouces...' },
    { key:'ecranRes', label:'Resolution ecran', ph:'2560x1600 Retina, 4K UHD...' },
    { key:'ecranHz', label:'Taux rafraichissement', ph:'60 Hz, 120 Hz, 165 Hz...' },
    { key:'autonomie', label:'Autonomie reelle', ph:'8-10h bureautique...' },
    { key:'batterie', label:'Sante batterie / cycles', ph:'94%, 120 cycles...' },
    { key:'os', label:'Systeme exploitation', type:'select', opts:['macOS Sonoma','macOS Ventura','Windows 11','Windows 10','Linux','Chrome OS','Aucun'] },
    { key:'etat', label:'Etat general', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat','Etat correct','Pour pieces'] },
    { key:'etatEcran', label:'Etat ecran', type:'select', opts:['Parfait','Micro-rayures','Pixels morts','Fissure'] },
    { key:'etatClavier', label:'Etat clavier', type:'select', opts:['Parfait','Touches normales','Quelques touches capricieuses','Defectueux'] },
    { key:'ports', label:'Ports disponibles', ph:'2x USB-C Thunderbolt, HDMI, SD, USB-A...' },
    { key:'accessoires', label:'Accessoires inclus', ph:'Chargeur origine, housse, souris, dock...' },
    { key:'logiciels', label:'Logiciels inclus', ph:'Office 2021, Adobe CC, Final Cut Pro...' },
    { key:'defauts', label:'Defauts et remarques', ph:'Petite marque couvercle, charniere legerement...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'800', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'1400', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris, Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - emballe soin','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Mobilier: [
    { key:'type', label:'Type de meuble', ph:'Canape, Table basse, Armoire, Lit, Bureau...' },
    { key:'marque', label:'Marque / Fabricant', ph:'Ikea, Maisons du Monde, Roche Bobois...' },
    { key:'modele', label:'Modele / Reference', ph:'KALLAX, EKTORP, sur-mesure...' },
    { key:'couleur', label:'Couleur principale', ph:'Blanc, Chene naturel, Gris anthracite...' },
    { key:'matiere', label:'Matiere principale', type:'select', opts:['Bois massif','Bois MDF','Agglomere','Metal','Verre','Tissu','Cuir','Velours','Rotin','Marbre','Autre'] },
    { key:'matiereSecondaire', label:'Matiere secondaire', ph:'Pieds metal noir, plateau verre...' },
    { key:'longueur', label:'Longueur (cm)', ph:'180', type:'number' },
    { key:'largeur', label:'Largeur / Profondeur (cm)', ph:'90', type:'number' },
    { key:'hauteur', label:'Hauteur (cm)', ph:'75', type:'number' },
    { key:'places', label:'Nb places (si canape)', type:'select', opts:['1 place','2 places','3 places','4 places','Angle / L','Convertible'] },
    { key:'convertible', label:'Convertible en lit', type:'select', opts:['Non','Oui - clic-clac','Oui - avec coffre','Oui - meridienne'] },
    { key:'rangements', label:'Rangements integres', type:'select', opts:['Aucun','Tiroirs','Portes','Etageres','Coffre'] },
    { key:'anneeAchat', label:'Annee achat approximative', ph:'2021' },
    { key:'etat', label:'Etat', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat','Etat correct','Necessite nettoyage'] },
    { key:'defauts', label:'Defauts et imperfections', ph:'Petite rayure plateau, trace accoudoir...', wide:true },
    { key:'demontable', label:'Demontable', type:'select', opts:['Oui - facile','Partiellement','Non - un seul bloc'] },
    { key:'instructions', label:'Instructions de montage', type:'select', opts:['Oui disponibles','Non'] },
    { key:'poids', label:'Poids estime (kg)', ph:'35', type:'number' },
    { key:'prix', label:'Prix demande (EUR)', ph:'150', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'aideChargement', label:'Aide au chargement', type:'select', opts:['Oui je peux aider','Non'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Electromenager: [
    { key:'type', label:'Type appareil', ph:'Lave-linge, Frigo, Four, Lave-vaisselle...' },
    { key:'marque', label:'Marque', ph:'Bosch, Samsung, Whirlpool, Miele...' },
    { key:'modele', label:'Reference modele', ph:'WAN24264FR...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2020', type:'number' },
    { key:'capacite', label:'Capacite', ph:'7 kg, 200L, 60 cm...' },
    { key:'classeEnergie', label:'Classe energetique', type:'select', opts:['A+++','A++','A+','A','B','C','D','E','F','G'] },
    { key:'conso', label:'Consommation annuelle (kWh)', ph:'150 kWh' },
    { key:'dimensions', label:'Dimensions (L x H x P cm)', ph:'60 x 85 x 55' },
    { key:'couleur', label:'Couleur', type:'select', opts:['Blanc','Inox','Noir','Gris anthracite','Autre'] },
    { key:'etat', label:'Etat', type:'select', opts:['Excellent - comme neuf','Tres bon etat','Bon etat','Quelques traces cosmetiques','Necessite reparation'] },
    { key:'fonctionnement', label:'Fonctionnement', type:'select', opts:['Parfait - aucun probleme','Quelques defauts mineurs','Fonctionne mais reparation conseillee'] },
    { key:'nbProgrammes', label:'Nombre de programmes', ph:'15 programmes' },
    { key:'niveauSonore', label:'Niveau sonore (dB)', ph:'49 dB' },
    { key:'garantie', label:'Garantie restante', type:'select', opts:['Sous garantie constructeur','Sous garantie revendeur','Plus de garantie'] },
    { key:'dateGarantie', label:'Date fin garantie', ph:'06/2025' },
    { key:'entretien', label:'Entretien effectue', ph:'Detartrage regulier, joint remplace 2023...', wide:true },
    { key:'defauts', label:'Defauts ou pannes historiques', ph:'Trace legere rouille tambour, joint a surveiller...', wide:true },
    { key:'accessoires', label:'Accessoires inclus', ph:'Tuyaux, grilles, bacs, livret garantie...' },
    { key:'facture', label:'Facture disponible', type:'select', opts:['Oui','Non'] },
    { key:'prix', label:'Prix demande (EUR)', ph:'200', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'600', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - frais acheteur','Oui - inclus'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Vetements: [
    { key:'type', label:'Type de vetement', ph:'Veste, Manteau, Robe, Pantalon, Sneakers...' },
    { key:'marque', label:'Marque', ph:'Zara, H&M, Nike, Gucci...' },
    { key:'collection', label:'Collection / Saison', ph:'Hiver 2023, Ete 2022...' },
    { key:'taille', label:'Taille', ph:'M, 42, 10 ans, EU 42...' },
    { key:'couleur', label:'Couleur', ph:'Noir, Bleu marine, Ecru...' },
    { key:'matiere', label:'Composition / Matiere', ph:'100% coton, 80% laine 20% cachemire...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf avec etiquette','Neuf sans etiquette','Comme neuf - porte 1-2 fois','Tres bon etat','Bon etat - legere usure','Etat correct'] },
    { key:'nbPortes', label:'Nb de fois porte', ph:'2-3 fois, rarement...' },
    { key:'defauts', label:'Defauts visibles', ph:'Aucun, petite pilling, decoloration legere...', wide:true },
    { key:'entretien', label:'Instructions entretien', ph:'Lavage 30 degres, nettoyage a sec...' },
    { key:'coupe', label:'Longueur / Coupe', ph:'Regular, Slim, Oversized, Cropped...' },
    { key:'pointure', label:'Pointure (si chaussures)', ph:'42 EU / 8.5 US' },
    { key:'accessoires', label:'Accessoires inclus', ph:'Ceinture, sac protection, etiquette...' },
    { key:'prix', label:'Prix demande (EUR)', ph:'25', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'80', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - Mondial Relay','Oui - Colissimo','Oui - tous','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  'Jeux video': [
    { key:'type', label:'Type', type:'select', opts:['Jeu video','Console','Manette / Accessoire','Pack complet','Carte cadeau'] },
    { key:'console', label:'Plateforme', type:'select', opts:['PlayStation 5','PlayStation 4','PlayStation 3','Xbox Series X/S','Xbox One','Nintendo Switch','Nintendo Switch Lite','PC','Retro / Autre'] },
    { key:'titre', label:'Titre / Nom', ph:'FIFA 24, Zelda Tears of the Kingdom...' },
    { key:'region', label:'Region', type:'select', opts:['FR / Europe PAL','USA NTSC','Japon','Multi-region'] },
    { key:'version', label:'Version', type:'select', opts:['Version physique - boite','Version numerique - code','Edition speciale / Collector','Premiere impression'] },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous blister','Comme neuf','Tres bon etat','Bon etat','Etat correct'] },
    { key:'boite', label:'Boite et notice', type:'select', opts:['Complet - boite + notice + jeu','Jeu seul','Boite seule','Boite abimee mais complete'] },
    { key:'dlc', label:'DLC inclus', ph:'Season pass, DLC 1 et 2, skin exclusif...', wide:true },
    { key:'nbJeux', label:'Nb de jeux (si lot)', ph:'5 jeux inclus...' },
    { key:'manettes', label:'Manettes incluses (si console)', ph:'2 manettes, 1 charge-play...' },
    { key:'defauts', label:'Defauts / Problemes', ph:'Aucun, rayure sur boite, disque parfait...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'25', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - emballe soin','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Sport: [
    { key:'type', label:'Type de materiel', ph:'Velo de route, Raquette tennis, Tapis de course...' },
    { key:'marque', label:'Marque', ph:'Decathlon, Specialized, Nike, Technogym...' },
    { key:'modele', label:'Modele', ph:'BTwin 540, Babolat Pure Drive...' },
    { key:'anneeAchat', label:'Annee achat', ph:'2021' },
    { key:'taille', label:'Taille / Cadre', ph:'M, 42, cadre 54cm...' },
    { key:'etat', label:'Etat', type:'select', opts:['Comme neuf','Tres bon etat','Bon etat - usure normale','Etat correct','Necessite entretien'] },
    { key:'frequence', label:'Frequence utilisation', type:'select', opts:['Jamais ou presque','Quelques fois par an','1 fois par mois','1 fois par semaine','Plusieurs fois par semaine'] },
    { key:'niveau', label:'Niveau pratique vise', type:'select', opts:['Debutant','Intermediaire','Avance','Competiteur'] },
    { key:'poids', label:'Poids (kg)', ph:'8.5', type:'number' },
    { key:'specs', label:'Specifications techniques', ph:'Shimano 105 11v, fourche carbone, freins disque...', wide:true },
    { key:'entretien', label:'Entretien et reparations', ph:'Revision complete 2023, chaine neuve...', wide:true },
    { key:'defauts', label:'Defauts et usures', ph:'Rayures cadre, grips uses, pneu avant a surveiller...', wide:true },
    { key:'accessoires', label:'Accessoires inclus', ph:'Casque, pompe, cadenas, sacoche, ordinateur bord...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'80', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'350', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui - emballe soin','Oui - selon transporteur'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Bijoux: [
    { key:'type', label:'Type', ph:'Bague, Collier, Bracelet, Montre, Boucles oreilles...' },
    { key:'marque', label:'Marque / Createur', ph:'Cartier, Pandora, Daniel Wellington...' },
    { key:'matiere', label:'Matiere principale', type:'select', opts:['Or 18 carats','Or 14 carats','Or rose','Or blanc','Argent 925','Argent plaque','Acier inoxydable','Platine','Plaque or','Bijou fantaisie'] },
    { key:'pierres', label:'Pierres / Ornements', ph:'Diamant 0.5ct, Saphir, Perle naturelle...' },
    { key:'poids', label:'Poids (grammes)', ph:'5.2', type:'number' },
    { key:'taille', label:'Taille / Tour de doigt', ph:'54, 18cm longueur, 40cm chaine...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf sous ecrin','Comme neuf - jamais porte','Tres bon etat','Bon etat','Quelques traces usure'] },
    { key:'defauts', label:'Defauts', ph:'Aucun, petite egratignure fermoir...', wide:true },
    { key:'certificat', label:'Certificat authenticite', type:'select', opts:['Oui - inclus','Non'] },
    { key:'facture', label:'Facture achat', type:'select', opts:['Disponible','Non disponible'] },
    { key:'ecrin', label:'Ecrin / Boite origine', type:'select', opts:['Oui','Non'] },
    { key:'gravure', label:'Gravure / Personnalisation', ph:'Aucune, initiales AB...', wide:true },
    { key:'prix', label:'Prix demande (EUR)', ph:'120', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui - lettre recommandee','Non - main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],

  Autre: [
    { key:'type', label:'Type / Description courte', ph:'Aspirateur robot, Livre rare, Instrument musique...' },
    { key:'marque', label:'Marque / Fabricant', ph:'(si applicable)' },
    { key:'modele', label:'Modele / Reference', ph:'(si applicable)' },
    { key:'anneeAchat', label:'Annee achat', ph:'(si applicable)', type:'number' },
    { key:'couleur', label:'Couleur', ph:'(si applicable)' },
    { key:'dimensions', label:'Dimensions ou caracteristiques', ph:'30x20x15 cm, 2.5 kg...' },
    { key:'etat', label:'Etat', type:'select', opts:['Neuf','Comme neuf','Tres bon etat','Bon etat','Etat correct','Pour pieces'] },
    { key:'description', label:'Description complete', ph:'Decrivez en detail votre article, son usage, ses caracteristiques...', wide:true },
    { key:'defauts', label:'Defauts et imperfections', ph:'Aucun, petite trace, notice manquante...', wide:true },
    { key:'accessoires', label:'Accessoires et elements inclus', ph:'Chargeur, boite, manuel, telecommande...', wide:true },
    { key:'garantie', label:'Garantie restante', ph:'Aucune, 6 mois constructeur...' },
    { key:'facture', label:'Facture disponible', type:'select', opts:['Oui','Non'] },
    { key:'prix', label:'Prix demande (EUR)', ph:'50', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (EUR)', ph:'(si connu)' },
    { key:'negociable', label:'Prix negociable', type:'select', opts:['Oui','Legerement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Non','Oui - selon taille','Oui - tous transporteurs'] },
    { key:'raisonVente', label:'Raison de la vente', ph:'Plus utilise, upgrade, cadeau non desire...' },
    { key:'urgence', label:'Urgence', type:'urgence' },
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
    try {
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
          if (!data.error) onUsed()
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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
          <div className='db-form-grid' style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
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
    if (!isSubscribed) return
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d => setAnnonces(d.annonces||[])).catch(()=>{})
  }, []) // [] = une seule fois au montage

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
    try {
      const ctx = selectedAnnonce
        ? 'Annonce concerne: ' + selectedAnnonce.titre + '\n' + contexte
        : contexte
      const res = await fetch('/api/ai/reponse', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message, contexte: ctx, annonceId: selectedAnnonce?.id || null })
      })
      const data = await res.json()
      if (data.error) {
        setResult({ error: data.error, message: data.message || data.error })
      } else {
        setResult(data)
        onUsed()
      }
    } catch(e) {
      setResult({ error: 'Erreur reseau: ' + e.message })
    } finally {
      setLoading(false)
    }
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

      {result?.error && (
        <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,padding:'14px 20px',marginTop:16,fontSize:13,color:'var(--red2)' }}>
          Erreur : {result.message || result.error}
        </div>
      )}
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


// ─── OUTILS TAB ───────────────────────────────────────────
// Idees 12, 13, 14, 15, 16, 17, 18
function OutilsTab({ isSubscribed, subscribe }) {
  const [activeTool, setActiveTool] = useState(null)

  // Idee 13 - Generateur de titre seul
  const [titreSpecs, setTitreSpecs] = useState('')
  const [titres, setTitres] = useState([])
  const [titreLoading, setTitreLoading] = useState(false)

  // Idee 14 - Detecteur prix abusif
  const [prixArticle, setPrixArticle] = useState('')
  const [prixDemande, setPrixDemande] = useState('')
  const [prixResult, setPrixResult] = useState(null)
  const [prixLoading, setPrixLoading] = useState(false)

  // Idee 16 - Mode vente flash
  const [flashSpecs, setFlashSpecs] = useState('')
  const [flashResult, setFlashResult] = useState(null)
  const [flashLoading, setFlashLoading] = useState(false)

  // Idee 17 - Checklist
  const [checklist, setChecklist] = useState({
    photos: false, prix: false, description: false,
    disponible: false, contact: false, ct: false,
  })

  // Idee 18 - Traduction
  const [annonceText, setAnnonceText] = useState('')
  const [tradLang, setTradLang] = useState('en')
  const [tradResult, setTradResult] = useState('')
  const [tradLoading, setTradLoading] = useState(false)

  const genTitres = async () => {
    if (!titreSpecs) return
    setTitreLoading(true)
    try {
      const res = await fetch('/api/ai/titres', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs: titreSpecs })
      })
      const data = await res.json()
      setTitres(data.titres || [])
    } catch(e) {}
    setTitreLoading(false)
  }

  const checkPrix = async () => {
    if (!prixArticle || !prixDemande) return
    setPrixLoading(true)
    try {
      const res = await fetch('/api/ai/estimation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs: prixArticle })
      })
      const data = await res.json()
      const prix = parseFloat(prixDemande)
      const mid = data.mid || 0
      const diff = mid > 0 ? ((prix - mid) / mid) * 100 : 0
      setPrixResult({ ...data, prixDemande: prix, diff: Math.round(diff) })
    } catch(e) {}
    setPrixLoading(false)
  }

  const genFlash = async () => {
    if (!flashSpecs) return
    setFlashLoading(true)
    try {
      const res = await fetch('/api/ai/annonce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs: flashSpecs, urgence: 'rapide', type: 'flash', inputData: {} })
      })
      const data = await res.json()
      setFlashResult(data)
    } catch(e) {}
    setFlashLoading(false)
  }

  const tradLangs = { en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien', nl: 'Neerlandais' }

  const genTrad = async () => {
    if (!annonceText) return
    setTradLoading(true)
    try {
      const res = await fetch('/api/ai/annonce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs: 'Traduis cette annonce en ' + tradLangs[tradLang] + ': ' + annonceText, lang: tradLang, urgence: 'normal', type: 'traduction', inputData: {} })
      })
      const data = await res.json()
      setTradResult(data.raw || '')
    } catch(e) {}
    setTradLoading(false)
  }

  const checklistItems = [
    { key: "photos", label: "J ai au moins 5 photos claires (lumiere naturelle)" },
    { key: "prix", label: "Mon prix correspond au marche (utiliser l estimateur)" },
    { key: 'description', label: 'Ma description repond aux questions habituelles des acheteurs' },
    { key: 'disponible', label: 'Mes coordonnees et disponibilites sont claires' },
    { key: "contact", label: "J ai precise si je fais de la livraison / envoi" },
    { key: 'ct', label: 'Tous les documents importants sont mentionnes (CT, facture...)' },
  ]
  const checklistScore = Object.values(checklist).filter(Boolean).length
  const checklistTotal = checklistItems.length

  const TOOLS = [
    { id: 'titre', icon: '✍', label: 'Generateur de titre', desc: 'Obtenez 5 titres optimises pour maximiser les clics', badge: 'Gratuit' },
    { id: 'prix', icon: '💰', label: 'Detecteur prix abusif', desc: 'Verifiez si votre prix est dans le marche ou trop eleve', badge: 'Gratuit' },
    { id: 'flash', icon: '⚡', label: 'Mode vente flash', desc: 'Annonce ultra-agressive pour vendre en moins de 48h', badge: isSubscribed ? 'Abonne' : 'Subscriber Only' },
    { id: 'checklist', icon: '✓', label: 'Checklist avant publication', desc: 'Verifiez que votre annonce est prete a etre publiee', badge: 'Gratuit' },
    { id: 'traduction', icon: '🌍', label: 'Traduction annonce', desc: 'Traduisez votre annonce en anglais, espagnol, allemand...', badge: isSubscribed ? 'Abonne' : 'Subscriber Only' },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Boite a outils</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Outils supplementaires</h2>
      </div>

      {/* Liste des outils */}
      <div className='db-tools-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 16 }}>
        {TOOLS.map(tool => (
          <div key={tool.id} onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            style={{ background: activeTool === tool.id ? 'var(--s2)' : 'var(--ink)', padding: '20px', cursor: 'pointer', transition: 'all .2s', borderTop: activeTool === tool.id ? '2px solid var(--gold)' : '2px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{tool.icon}</span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 8, letterSpacing: 1.5, color: tool.badge === 'Gratuit' ? 'var(--success2)' : 'var(--gold3)', background: tool.badge === 'Gratuit' ? 'rgba(45,122,79,.1)' : 'rgba(201,168,76,.1)', border: '1px solid', borderColor: tool.badge === 'Gratuit' ? 'rgba(45,122,79,.2)' : 'rgba(201,168,76,.2)', borderRadius: 2, padding: '2px 6px' }}>
                {tool.badge}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{tool.label}</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>{tool.desc}</div>
          </div>
        ))}
      </div>

      {/* Outil actif */}

      {/* Idee 13 - Generateur titres */}
      {activeTool === 'titre' && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px', marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Generateur de titres optimises</div>
          <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }}
            placeholder="Decrivez votre article en quelques mots: BMW 320d 2019, 75 000 km, diesel, bon etat..."
            value={titreSpecs} onChange={e => setTitreSpecs(e.target.value)} />
          <button onClick={genTitres} disabled={titreLoading || !titreSpecs} className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '12px', opacity: (titreLoading || !titreSpecs) ? .5 : 1 }}>
            {titreLoading ? 'Generation...' : 'GENERER 5 TITRES'}
          </button>
          {titres.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {titres.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ink)', border: '1px solid var(--border)', padding: '10px 14px', marginBottom: 4, gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--cream)' }}>{t}</div>
                  <button onClick={() => navigator.clipboard.writeText(t)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted2)', cursor: 'pointer', fontSize: 10, padding: '4px 8px', flexShrink: 0 }}>Copier</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Idee 14 - Detecteur prix */}
      {activeTool === 'prix' && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px', marginBottom: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Detecteur de prix abusif</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 8 }}>
            <div style={{ background: 'var(--ink)', padding: '14px' }}>
              <label style={S.lbl}>Votre article</label>
              <input style={S.inp} placeholder="BMW 320d 2019, 75 000 km..." value={prixArticle} onChange={e => setPrixArticle(e.target.value)} />
            </div>
            <div style={{ background: 'var(--ink)', padding: '14px' }}>
              <label style={S.lbl}>Votre prix demande (EUR)</label>
              <input style={S.inp} type="number" placeholder="12000" value={prixDemande} onChange={e => setPrixDemande(e.target.value)} />
            </div>
          </div>
          <button onClick={checkPrix} disabled={prixLoading || !prixArticle || !prixDemande} className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '12px', opacity: (prixLoading || !prixArticle || !prixDemande) ? .5 : 1 }}>
            {prixLoading ? 'Analyse...' : 'ANALYSER MON PRIX'}
          </button>
          {prixResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{ background: prixResult.diff > 30 ? 'rgba(200,57,43,.08)' : prixResult.diff > 15 ? 'rgba(255,165,0,.08)' : 'rgba(45,122,79,.08)', border: '1px solid', borderColor: prixResult.diff > 30 ? 'rgba(200,57,43,.3)' : prixResult.diff > 15 ? 'rgba(255,165,0,.3)' : 'rgba(45,122,79,.3)', padding: '16px', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 28, color: prixResult.diff > 30 ? 'var(--red2)' : prixResult.diff > 15 ? 'var(--warning)' : 'var(--success2)', letterSpacing: -1, marginBottom: 8 }}>
                  {prixResult.diff > 0 ? '+' : ''}{prixResult.diff}% {prixResult.diff > 30 ? '⚠️ TROP CHER' : prixResult.diff > 15 ? '⚡ Un peu eleve' : '✓ Prix correct'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>
                  Prix du marche : <strong style={{ color: 'var(--cream)' }}>{prixResult.low} - {prixResult.high} EUR</strong> (moyenne {prixResult.mid} EUR)<br />
                  Votre prix : <strong style={{ color: 'var(--cream)' }}>{prixResult.prixDemande} EUR</strong>
                  {prixResult.diff > 15 && <><br />Conseil : Baisser a <strong style={{ color: 'var(--gold2)' }}>{Math.round(prixResult.mid * 1.05)} EUR</strong> pour vendre plus vite</>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Idee 16 - Mode flash */}
      {activeTool === 'flash' && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px', marginBottom: 1 }}>
          {!isSubscribed ? (
            <LockOverlay subscribe={subscribe} />
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mode vente flash</div>
              <div style={{ fontSize: 12, color: 'var(--gold3)', marginBottom: 12, lineHeight: 1.6 }}>
                ⚡ Prix attractif, urgence maximale, disponibilite immediate. Pour vendre en moins de 48h.
              </div>
              <textarea style={{ ...S.inp, minHeight: 80, resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }}
                placeholder="Decrivez votre article + prix actuel + prix minimum accepte..."
                value={flashSpecs} onChange={e => setFlashSpecs(e.target.value)} />
              <button onClick={genFlash} disabled={flashLoading || !flashSpecs} className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '12px', opacity: (flashLoading || !flashSpecs) ? .5 : 1 }}>
                {flashLoading ? 'Generation...' : '⚡ GENERER ANNONCE FLASH'}
              </button>
              {flashResult?.annonce && (
                <div style={{ marginTop: 12, background: 'var(--ink)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{flashResult.annonce.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{flashResult.annonce.description}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Idee 17 - Checklist */}
      {activeTool === 'checklist' && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px', marginBottom: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1 }}>Checklist avant publication</div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 24, color: checklistScore === checklistTotal ? 'var(--success2)' : 'var(--gold2)', letterSpacing: -1 }}>
              {checklistScore}/{checklistTotal}
            </div>
          </div>
          <div style={{ background: 'var(--s3)', borderRadius: 1, height: 4, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ width: (checklistScore/checklistTotal*100)+'%', height: '100%', background: checklistScore === checklistTotal ? 'var(--success2)' : 'linear-gradient(90deg,var(--gold3),var(--gold2))', transition: 'width .4s' }} />
          </div>
          {checklistItems.map(item => (
            <div key={item.key} onClick={() => setChecklist(c => ({...c, [item.key]: !c[item.key]}))}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 3, border: '1px solid', borderColor: checklist[item.key] ? 'var(--gold)' : 'var(--border2)', background: checklist[item.key] ? 'rgba(201,168,76,.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s', fontSize: 12, color: 'var(--gold2)' }}>
                {checklist[item.key] ? '✓' : ''}
              </div>
              <div style={{ fontSize: 13, color: checklist[item.key] ? 'var(--muted2)' : 'var(--cream)', textDecoration: checklist[item.key] ? 'line-through' : 'none', lineHeight: 1.5 }}>{item.label}</div>
            </div>
          ))}
          {checklistScore === checklistTotal && (
            <div style={{ marginTop: 14, background: 'rgba(45,122,79,.1)', border: '1px solid rgba(45,122,79,.3)', borderRadius: 3, padding: '12px', fontSize: 13, color: 'var(--success2)', textAlign: 'center' }}>
              ✓ Votre annonce est prete a etre publiee !
            </div>
          )}
        </div>
      )}

      {/* Idee 18 - Traduction */}
      {activeTool === 'traduction' && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px', marginBottom: 1 }}>
          {!isSubscribed ? (
            <LockOverlay subscribe={subscribe} />
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Traduction annonce</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {Object.entries(tradLangs).map(([code, nom]) => (
                  <button key={code} onClick={() => setTradLang(code)}
                    style={{ background: tradLang === code ? 'rgba(201,168,76,.1)' : 'var(--ink)', border: '1px solid', borderColor: tradLang === code ? 'var(--gold)' : 'var(--border)', borderRadius: 2, color: tradLang === code ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '6px 14px', transition: 'all .15s' }}>
                    {nom}
                  </button>
                ))}
              </div>
              <textarea style={{ ...S.inp, minHeight: 100, resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }}
                placeholder="Collez votre annonce en francais ici..."
                value={annonceText} onChange={e => setAnnonceText(e.target.value)} />
              <button onClick={genTrad} disabled={tradLoading || !annonceText} className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '12px', opacity: (tradLoading || !annonceText) ? .5 : 1 }}>
                {tradLoading ? 'Traduction...' : 'TRADUIRE EN ' + (tradLangs[tradLang]||'').toUpperCase()}
              </button>
              {tradResult && (
                <div style={{ marginTop: 12, background: 'var(--ink)', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', padding: '16px' }}>
                  <div style={S.lbl}>Annonce traduite - {tradLangs[tradLang]}</div>
                  <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{tradResult}</div>
                  <button onClick={() => navigator.clipboard.writeText(tradResult)} style={{ marginTop: 10, background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '6px 14px' }}>Copier</button>
                </div>
              )}
            </>
          )}
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
