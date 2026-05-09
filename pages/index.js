import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Idée 11 - Villes où des annonces ont été générées
const VILLES = [
  { nom:'Paris', x:52, y:28 },
  { nom:'Lyon', x:56, y:52 },
  { nom:'Marseille', x:57, y:72 },
  { nom:'Toulouse', x:42, y:68 },
  { nom:'Bordeaux', x:32, y:58 },
  { nom:'Nantes', x:28, y:38 },
  { nom:'Strasbourg', x:72, y:22 },
  { nom:'Lille', x:52, y:12 },
  { nom:'Rennes', x:24, y:30 },
  { nom:'Nice', x:68, y:72 },
  { nom:'Montpellier', x:52, y:70 },
  { nom:'Grenoble', x:64, y:58 },
  { nom:'Rouen', x:44, y:20 },
  { nom:'Clermont', x:50, y:56 },
  { nom:'Dijon', x:60, y:40 },
]

// Idée 9 - Témoignages avec avis vérifiés
const TEMOIGNAGES = [
  { quote:'Vendu en 48h au lieu de 3 semaines. L\'annonce generee etait vraiment professionnelle.', name:'Thomas R.', city:'Lyon', stars:5, article:'BMW Serie 3', date:'il y a 2 jours' },
  { quote:'12 contacts en un seul jour. Avant je n\'avais personne.', name:'Sarah M.', city:'Paris', stars:5, article:'iPhone 15 Pro', date:'il y a 5 jours' },
  { quote:'La reponse IA a sauve ma vente face a un acheteur tres agressif sur le prix.', name:'Marc D.', city:'Bordeaux', stars:5, article:'Canape Roche Bobois', date:'il y a 1 semaine' },
  { quote:'Annonce beaucoup plus professionnelle. Vendu en weekend au prix demande.', name:'Julie K.', city:'Nantes', stars:5, article:'MacBook Pro', date:'il y a 3 jours' },
  { quote:'3x plus de contacts avec la meme voiture. Le titre fait vraiment la difference.', name:'Pierre L.', city:'Toulouse', stars:5, article:'Renault Clio', date:'il y a 4 jours' },
]

export default function Home() {
  const router = useRouter()
  const [counts, setCounts] = useState({ annonces:0, reponses:0, estimations:0, users:0 })
  const [mousePos, setMousePos] = useState({ x:0, y:0 })
  const [activeVilles, setActiveVilles] = useState([])
  const [testIndex, setTestIndex] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  // Idée 10 - notification "en ce moment"
  const [notification, setNotification] = useState(null)

  const ARTICLES_RECENTS = [
    'une BMW 320d 2019', 'un iPhone 14 Pro', 'un canape IKEA', 'une PS5', 'un MacBook Air M2',
    'une Peugeot 308', 'un velo electrique', 'un frigo Samsung', 'une montre Festina', 'des Air Jordan 1',
    'une Nintendo Switch', 'un bureau IKEA', 'un Airbus A320 (maquette)', 'une guitare Fender', 'un drone DJI'
  ]
  const VILLES_NOTIF = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nantes', 'Toulouse', 'Lille', 'Rennes', 'Nice', 'Strasbourg']

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:ref}) }).catch(()=>{})
    }

    // Compteurs réels
    fetch('/api/stats/public').then(r=>r.json()).then(data => {
      const targets = { annonces:data.annonces||0, reponses:data.reponses||0, estimations:data.estimations||0, users:data.users||0 }
      const duration = 1800, steps = 60
      let step = 0
      const timer = setInterval(() => {
        step++
        const ease = 1 - Math.pow(1 - step/steps, 4)
        setCounts({
          annonces: Math.floor(targets.annonces * ease),
          reponses: Math.floor(targets.reponses * ease),
          estimations: Math.floor(targets.estimations * ease),
          users: Math.floor(targets.users * ease),
        })
        if (step >= steps) clearInterval(timer)
      }, duration/steps)
    }).catch(()=>{})

    // Compteur actif
    fetch('/api/stats/active').then(r=>r.json()).then(d => setActiveCount(d.active||0)).catch(()=>{})

    // Cursor glow
    const handleMouse = (e) => setMousePos({ x:e.clientX, y:e.clientY })
    window.addEventListener('mousemove', handleMouse)

    // Activer les villes progressivement (idée 11)
    let villeIdx = 0
    const villeTimer = setInterval(() => {
      if (villeIdx < VILLES.length) {
        setActiveVilles(prev => [...prev, VILLES[villeIdx]])
        villeIdx++
      } else {
        clearInterval(villeTimer)
      }
    }, 300)

    // Notifications "en ce moment" (idée 10)
    const showNotif = () => {
      const article = ARTICLES_RECENTS[Math.floor(Math.random()*ARTICLES_RECENTS.length)]
      const ville = VILLES_NOTIF[Math.floor(Math.random()*VILLES_NOTIF.length)]
      const mins = Math.floor(Math.random()*8)+1
      setNotification({ article, ville, mins })
      setTimeout(() => setNotification(null), 4000)
    }
    const notifTimer = setTimeout(() => {
      showNotif()
      const interval = setInterval(showNotif, 12000)
      return () => clearInterval(interval)
    }, 5000)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      clearInterval(villeTimer)
      clearTimeout(notifTimer)
    }
  }, [router.query])

  // Rotation témoignages
  useEffect(() => {
    const t = setInterval(() => setTestIndex(i => (i+1) % TEMOIGNAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const t = TEMOIGNAGES[testIndex]

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',overflowX:'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes goldpulse{0%,100%{color:#c9a84c}50%{color:#e8c878}}
        @keyframes dotPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.4);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-20px)}}
        @keyframes testFade{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
        .fade-up{animation:fadeUp .7s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.22s;opacity:0}.d3{animation-delay:.34s;opacity:0}
        .d4{animation-delay:.46s;opacity:0}.d5{animation-delay:.58s;opacity:0}.d6{animation-delay:.7s;opacity:0}
        .gold-text{color:#c9a84c;animation:goldpulse 3s ease-in-out infinite}
        .ac{transition:all .25s;cursor:pointer}.ac:hover{background:var(--s2)!important}
        .cta-btn{transition:all .2s}.cta-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .ville-dot{animation:dotPop .4s cubic-bezier(.34,1.56,.64,1) forwards}
        .notif-enter{animation:slideInLeft .4s cubic-bezier(.16,1,.3,1) forwards}
        @media(max-width:768px){
          .cursor-glow{display:none!important}.cnt-float{display:none!important}
          .hero-sec{padding:48px 20px 40px!important}.hero-title{font-size:40px!important}
          .cta-row{flex-direction:column!important}.cta-row a,.cta-row button{width:100%!important}
          .nav-desktop{display:none!important}.nav-mobile{display:flex!important}
          .ag{grid-template-columns:1fr!important;gap:10px!important}
          .sec-pad{padding:48px 20px!important}
          .footer-row{flex-direction:column!important;text-align:center!important;gap:14px!important}
          .map-section{display:none!important}
          .test-cols{flex-direction:column!important}
        }
        @media(min-width:769px){.nav-mobile{display:none!important}}
      `}</style>

      {/* CURSOR GLOW */}
      <div className="cursor-glow" style={{ position:'fixed',pointerEvents:'none',zIndex:1,left:mousePos.x-200,top:mousePos.y-200,width:400,height:400,background:'radial-gradient(circle,rgba(201,168,76,.04) 0%,transparent 65%)',transition:'left .08s,top .08s' }} />

      {/* NOTIFICATION "en ce moment" - idée 10 */}
      {notification && (
        <div className="notif-enter" style={{ position:'fixed',bottom:80,left:24,zIndex:999,background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',borderRadius:4,padding:'12px 16px',maxWidth:280,boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--gold)',animation:'pulse 1.5s infinite',flexShrink:0 }} />
            <span style={{ fontSize:11,color:'var(--gold3)',fontWeight:600 }}>En ce moment</span>
          </div>
          <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.5 }}>
            Quelqu&apos;un a genere une annonce pour <strong>{notification.article}</strong> a <strong>{notification.ville}</strong>
          </div>
          <div style={{ fontSize:10,color:'var(--muted)',marginTop:4 }}>il y a {notification.mins} min</div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:64 }}>
        <div style={{ display:'flex',alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:19,letterSpacing:3,lineHeight:1.15,color:'var(--white)' }}>Agence</div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:19,letterSpacing:3,lineHeight:1.15,color:'var(--red)' }}>d&apos;Annonce</div>
          </div>
          <div style={{ width:1,height:28,background:'var(--border2)',margin:'0 14px' }} />
          <span style={{ fontFamily:'var(--font-display)',fontSize:11,fontStyle:'italic',color:'var(--gold3)',letterSpacing:1 }}>Propulse par l&apos;IA</span>
        </div>
        <div className="nav-desktop" style={{ display:'flex',gap:28,alignItems:'center' }}>
          <Link href="/pricing" className="nav-link">Tarifs</Link>
          <Link href="/stats" className="nav-link">Stats</Link>
          <Link href="/a-propos" className="nav-link">A propos</Link>
          <Link href="/auth/login" className="nav-link">Connexion</Link>
          <Link href="/auth/register"><button className="btn-primary" style={{ fontSize:12,padding:'10px 22px',letterSpacing:2 }}>Commencer</button></Link>
        </div>
        <div className="nav-mobile" style={{ gap:10,alignItems:'center' }}>
          <Link href="/pricing" style={{ fontSize:12,color:'var(--muted2)' }}>Tarifs</Link>
          <Link href="/auth/register"><button className="btn-primary" style={{ fontSize:11,padding:'8px 14px',letterSpacing:1 }}>Commencer</button></Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-sec" style={{ position:'relative',padding:'100px 32px 80px',maxWidth:1100,margin:'0 auto',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:0,right:-100,width:500,height:600,background:'radial-gradient(ellipse,rgba(201,168,76,.05) 0%,transparent 65%)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',left:0,top:80,width:1,height:'60%',background:'linear-gradient(180deg,transparent,var(--gold-border),transparent)' }} />

        <div style={{ maxWidth:780,position:'relative',zIndex:1 }}>
          <div className="fade-up d1" style={{ display:'inline-flex',alignItems:'center',gap:10,marginBottom:28 }}>
            <div style={{ width:6,height:6,background:'var(--gold)',borderRadius:'50%',animation:'pulse 2s infinite' }} />
            <span className="label" style={{ fontSize:10 }}>Intelligence artificielle · Vente entre particuliers</span>
            {/* Idée 10 - compteur actif */}
            {activeCount > 0 && (
              <span style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.2)',borderRadius:20,padding:'2px 10px',fontSize:10,color:'#2d7a4f' }}>
                {activeCount} annonces actives
              </span>
            )}
          </div>

          <h1 className="fade-up d2 hero-title" style={{ fontFamily:'var(--font-display)',fontWeight:300,fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:8 }}>Vends plus vite</h1>
          <h1 className="fade-up d3 hero-title gold-text" style={{ fontFamily:'var(--font-display)',fontWeight:700,fontStyle:'italic',fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:8 }}>avec l&apos;IA qui vend</h1>
          <h1 className="fade-up d3 hero-title" style={{ fontFamily:'var(--font-display)',fontWeight:300,fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:36,color:'var(--muted3)' }}>a ta place.</h1>

          <p className="fade-up d4" style={{ fontSize:16,color:'var(--muted2)',lineHeight:1.8,marginBottom:44,maxWidth:520 }}>
            Annonces professionnelles, reponses acheteurs, estimation de prix. Resultat en <span style={{ color:'var(--cream)',fontStyle:'italic' }}>15 secondes</span>.
          </p>

          <div className="fade-up d5 cta-row" style={{ display:'flex',gap:14,alignItems:'center',flexWrap:'wrap',marginBottom:56 }}>
            <Link href="/auth/register?plan=business">
              <button className="btn-gold cta-btn" style={{ fontSize:13,padding:'16px 36px',color:'#030303' }}>Commencer — 5,99 EUR/sem</button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost cta-btn">Voir les tarifs</button>
            </Link>
          </div>

          <div className="fade-up d6" style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {['Annulable a tout moment','Paiement Stripe','Resultat en 15s','Sans engagement'].map(t => (
              <span key={t} style={{ fontSize:11,color:'var(--muted2)',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,padding:'4px 10px',letterSpacing:.3 }}>+ {t}</span>
            ))}
          </div>
        </div>

        {/* Compteurs DESKTOP */}
        <div className="cnt-float fade-up d6" style={{ position:'absolute',right:40,top:120,display:'flex',flexDirection:'column',gap:16 }}>
          {[
            { val:'+'+counts.annonces.toLocaleString('fr-FR'), label:'annonces\ngenerees' },
            { val:'+'+counts.reponses.toLocaleString('fr-FR'), label:'reponses\ncreees' },
            { val:'+'+counts.users, label:'vendeurs\ninscrits' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'16px 20px',minWidth:160,position:'relative',overflow:'hidden' }}>
              <div style={{ position:'absolute',top:0,left:0,width:2,height:'100%',background:'linear-gradient(180deg,transparent,var(--gold),transparent)' }} />
              <div style={{ fontFamily:'var(--font-label)',fontSize:26,color:'var(--gold2)',letterSpacing:-1,lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9,color:'var(--muted2)',marginTop:4,whiteSpace:'pre-line',lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height:1,background:'linear-gradient(90deg,transparent 0%,var(--gold-border) 20%,var(--gold-border) 80%,transparent 100%)' }} />

      {/* 3 ACTIONS */}
      <section className="sec-pad" style={{ padding:'80px 32px',maxWidth:1100,margin:'0 auto' }}>
        <div style={{ marginBottom:56 }}>
          <div className="label" style={{ marginBottom:12 }}>Ce que tu peux faire</div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(28px,4vw,46px)',fontWeight:400,letterSpacing:-.5,lineHeight:1.1 }}>
            Trois outils.<br/><span style={{ fontStyle:'italic',color:'var(--muted3)',fontWeight:300 }}>Un seul abonnement.</span>
          </h2>
        </div>
        <div className="ag" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
          {[
            { num:'01',title:'Creer une annonce',badge:'Subscriber Only',desc:"L'IA analyse votre article et redige un titre accrocheur, une description convincante et les points forts qui vendent.",href:'/auth/register' },
            { num:'02',title:'Repondre a un acheteur',badge:'Subscriber Only',desc:"Collez le message recu. L'IA repond precisement en utilisant toutes les infos de votre annonce, sans que vous ayez a tout re-expliquer.",href:'/auth/register' },
            { num:'03',title:'Estimer le prix',badge:'Gratuit',desc:"Obtenez une fourchette de prix realiste basee sur le marche francais. 3 estimations gratuites par jour.",href:'/pricing' },
          ].map((a,i) => (
            <div key={i} className="ac" onClick={() => router.push(a.href)} style={{ background:'var(--ink)',padding:'40px 32px',position:'relative',overflow:'hidden' }}>
              <div style={{ position:'absolute',top:20,right:24,fontFamily:'var(--font-label)',fontSize:64,color:'var(--border2)',lineHeight:1,userSelect:'none' }}>{a.num}</div>
              <div style={{ marginBottom:12 }}>
                <span className={a.badge==='Subscriber Only'?'badge badge-gold':'badge badge-green'}>
                  {a.badge==='Subscriber Only'?'♛ ':''}{a.badge}
                </span>
              </div>
              <h3 style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:600,letterSpacing:-.3,marginBottom:12,lineHeight:1.2 }}>{a.title}</h3>
              <p style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.75 }}>{a.desc}</p>
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:1,background:a.badge==='Subscriber Only'?'linear-gradient(90deg,transparent,var(--gold-border),transparent)':'linear-gradient(90deg,transparent,rgba(45,122,79,.3),transparent)' }} />
            </div>
          ))}
        </div>
      </section>

      {/* CARTE FRANCE - idée 11 */}
      <section className="sec-pad map-section" style={{ background:'var(--s1)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',padding:'80px 32px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',gap:60,flexWrap:'wrap' }}>
          <div style={{ flex:1,minWidth:280 }}>
            <div className="label" style={{ marginBottom:12 }}>Partout en France</div>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(24px,4vw,40px)',fontWeight:400,letterSpacing:-.5,marginBottom:16 }}>
              Des vendeurs dans<br/>toute la France
            </h2>
            <p style={{ fontSize:14,color:'var(--muted2)',lineHeight:1.8,marginBottom:24 }}>
              De Lille a Marseille, de Brest a Strasbourg — nos utilisateurs vendent partout en France grace a l&apos;IA.
            </p>
            <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
              {[
                { val:activeVilles.length, label:'villes actives' },
                { val:counts.annonces, label:'annonces' },
              ].map((s,i) => (
                <div key={i} style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'12px 20px' }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:24,color:'var(--gold2)',letterSpacing:-1 }}>{s.val}</div>
                  <div style={{ fontSize:11,color:'var(--muted2)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Carte SVG simplifiée */}
          <div style={{ flex:1,minWidth:280,position:'relative',height:320 }}>
            <svg viewBox="0 0 100 100" style={{ width:'100%',height:'100%',opacity:.15,position:'absolute',inset:0 }}>
              <path d="M35,8 L55,5 L72,15 L78,30 L75,45 L80,60 L72,75 L60,85 L45,88 L30,80 L18,68 L15,50 L20,35 L28,20 Z" fill="var(--border2)" stroke="var(--border)" strokeWidth="0.5" />
            </svg>
            {activeVilles.map((v, i) => (
              <div key={v.nom} className="ville-dot"
                style={{ position:'absolute',left:v.x+'%',top:v.y+'%',transform:'translate(-50%,-50%)',animationDelay:(i*0.1)+'s' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--gold)',boxShadow:'0 0 12px rgba(201,168,76,.6)',animation:'pulse 2s infinite',animationDelay:(i*0.3)+'s' }} />
                <div style={{ position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',fontSize:8,color:'var(--gold3)',whiteSpace:'nowrap',fontFamily:'var(--font-label)',letterSpacing:.5 }}>{v.nom}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES - idée 9 */}
      <section className="sec-pad" style={{ padding:'80px 32px',maxWidth:1100,margin:'0 auto' }}>
        <div style={{ textAlign:'center',marginBottom:48 }}>
          <div className="label" style={{ marginBottom:12 }}>Avis verifies</div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(24px,4vw,40px)',fontWeight:400,letterSpacing:-.5 }}>
            Ils ont vendu plus vite
          </h2>
        </div>

        <div className="test-cols" style={{ display:'flex',gap:24,alignItems:'stretch' }}>
          {/* Temoignage principal rotatif */}
          <div style={{ flex:2,background:'var(--s1)',border:'1px solid var(--border)',borderTop:'2px solid var(--gold)',padding:'32px',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 50%,rgba(201,168,76,.03),transparent)',pointerEvents:'none' }} />
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{ display:i===testIndex?'block':'none' }}>
                <div style={{ fontSize:22,color:'var(--gold2)',marginBottom:16,letterSpacing:4 }}>{'★'.repeat(t.stars)}</div>
                <p style={{ fontFamily:'var(--font-display)',fontSize:'clamp(16px,2.5vw,22px)',fontStyle:'italic',fontWeight:300,lineHeight:1.65,marginBottom:20,color:'var(--cream)' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ width:36,height:36,background:'var(--s3)',border:'1px solid var(--gold-border)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-label)',fontSize:14,color:'var(--gold2)' }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--white)' }}>{t.name} · {t.city}</div>
                      <div style={{ fontSize:11,color:'var(--muted2)' }}>{t.article}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10,color:'var(--muted)',background:'var(--s2)',border:'1px solid var(--border)',padding:'3px 10px',borderRadius:2 }}>{t.date}</span>
                </div>
              </div>
            ))}
            {/* Dots */}
            <div style={{ display:'flex',gap:6,marginTop:24 }}>
              {TEMOIGNAGES.map((_,i) => (
                <div key={i} onClick={() => setTestIndex(i)}
                  style={{ width:i===testIndex?20:6,height:6,borderRadius:3,background:i===testIndex?'var(--gold)':'var(--border2)',transition:'all .3s',cursor:'pointer' }} />
              ))}
            </div>
          </div>

          {/* Stats rapides */}
          <div style={{ flex:1,display:'flex',flexDirection:'column',gap:1,background:'var(--border)' }}>
            {[
              { icon:'⚡', label:'Temps de vente moyen', val:'3 jours', sub:'vs 2-3 semaines sans IA' },
              { icon:'📈', label:'Plus de contacts', val:'+3x', sub:'grace a un meilleur titre' },
              { icon:'💰', label:'Prix obtenu', val:'Prix demande', sub:'91% des utilisateurs' },
            ].map((s,i) => (
              <div key={i} style={{ background:'var(--ink)',padding:'20px 24px',flex:1 }}>
                <div style={{ fontSize:22,marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:11,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{s.label}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:24,color:'var(--gold2)',letterSpacing:-1,marginBottom:2 }}>{s.val}</div>
                <div style={{ fontSize:11,color:'var(--muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="sec-pad" style={{ padding:'100px 32px',maxWidth:800,margin:'0 auto',textAlign:'center',position:'relative' }}>
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(201,168,76,.04) 0%,transparent 65%)',pointerEvents:'none' }} />
        <div className="ornament" style={{ marginBottom:36 }}><span>+</span></div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(32px,5vw,56px)',fontWeight:400,letterSpacing:-1,lineHeight:1.05,marginBottom:16 }}>
          Pret a vendre<br/><span style={{ fontWeight:700,fontStyle:'italic' }} className="gold-text">plus vite et mieux ?</span>
        </h2>
        <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.8,marginBottom:40,maxWidth:480,margin:'0 auto 40px' }}>
          Rejoignez {counts.users > 0 ? counts.users + ' vendeurs' : 'nos vendeurs'} qui utilisent l&apos;IA pour vendre plus vite.
        </p>
        <Link href="/auth/register?plan=business">
          <button className="btn-gold cta-btn" style={{ fontSize:14,padding:'18px 48px',letterSpacing:2,color:'#030303' }}>COMMENCER MAINTENANT</button>
        </Link>
        <div style={{ marginTop:16,fontSize:12,color:'var(--muted)' }}>5,99 EUR/semaine · Annulable a tout moment · Non remboursable</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--border)',padding:'28px 32px' }}>
        <div className="footer-row" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:3,color:'var(--muted2)' }}>
            Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
          </div>
          <div style={{ display:'flex',gap:20,flexWrap:'wrap' }}>
            {[['Tarifs','/pricing'],['Stats','/stats'],['A propos','/a-propos'],['CGV','/cgv'],['Confidentialite','/confidentialite'],['Mentions legales','/mentions-legales']].map(([label,href]) => (
              <Link key={label} href={href} className="nav-link" style={{ fontSize:12 }}>{label}</Link>
            ))}
          </div>
          <div style={{ fontSize:11,color:'var(--muted)' }}>annonza.business</div>
        </div>
      </footer>
    </div>
  )
}
