import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [counts, setCounts] = useState({ annonces: 0, reponses: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref })
      }).catch(() => {})
    }

    const targets = { annonces: 1247, reponses: 3582 }
    const duration = 2400
    const steps = 80
    let step = 0
    const timer = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 4)
      setCounts({
        annonces: Math.floor(targets.annonces * ease),
        reponses: Math.floor(targets.reponses * ease)
      })
      if (step >= steps) clearInterval(timer)
    }, duration / steps)

    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouse)
    return () => { clearInterval(timer); window.removeEventListener('mousemove', handleMouse) }
  }, [router.query])

  const testimonials = [
    { quote: "Vendu en 48h au lieu de 3 semaines.", name: "Thomas R.", city: "Lyon", item: "BMW Serie 3" },
    { quote: "12 contacts en un jour grace a l'annonce generee.", name: "Sarah M.", city: "Paris", item: "iPhone 15 Pro" },
    { quote: "La reponse IA a sauve ma vente face a un acheteur agressif.", name: "Marc D.", city: "Bordeaux", item: "Canape Roche Bobois" },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
        .fade-up{animation:fadeUp .7s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.22s;opacity:0}.d3{animation-delay:.34s;opacity:0}.d4{animation-delay:.46s;opacity:0}.d5{animation-delay:.58s;opacity:0}.d6{animation-delay:.7s;opacity:0}
        .gold-text{color:#c9a84c;animation:goldpulse 3s ease-in-out infinite}
        @keyframes goldpulse{0%,100%{color:#c9a84c}50%{color:#e8c878}}
        .ac{transition:all .25s;cursor:pointer}.ac:hover{background:var(--s2)!important}
        .cta-btn{transition:all .2s}.cta-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
        .tp{transition:all .15s}.tp:hover{border-color:rgba(201,168,76,.3)!important}
        @media(max-width:768px){
          .cursor-glow{display:none!important}
          .cnt-float{display:none!important}
          .hero-sec{padding:48px 20px 40px!important}
          .hero-title{font-size:40px!important;line-height:1.05!important}
          .hero-sub{font-size:14px!important}
          .cta-row{flex-direction:column!important}
          .cta-row a,.cta-row button{width:100%!important;text-align:center!important}
          .nav-desktop{display:none!important}
          .nav-mobile{display:flex!important}
          .ag{grid-template-columns:1fr!important;background:var(--black)!important;gap:10px!important}
          .tg{grid-template-columns:1fr!important;background:var(--black)!important;gap:10px!important}
          .sec-pad{padding:48px 20px!important}
          .footer-row{flex-direction:column!important;text-align:center!important;gap:14px!important}
        }
        @media(min-width:769px){.nav-mobile{display:none!important}}
      `}</style>

      {/* CURSOR GLOW */}
      <div className="cursor-glow" style={{ position:'fixed',pointerEvents:'none',zIndex:1,left:mousePos.x-200,top:mousePos.y-200,width:400,height:400,background:'radial-gradient(circle,rgba(201,168,76,.04) 0%,transparent 65%)',transition:'left .08s,top .08s' }} />

      {/* NAV */}
      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:64 }}>
        <div style={{ display:'flex',alignItems:'center',gap:0 }}>
          <div style={{ display:'flex',flexDirection:'column' }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:20,letterSpacing:3,lineHeight:1,color:'var(--white)' }}>AGENCE D&apos;</span>
            <span style={{ fontFamily:'var(--font-label)',fontSize:20,letterSpacing:3,lineHeight:1,color:'var(--red)' }}>ANNONCE</span>
          </div>
          <div style={{ width:1,height:28,background:'var(--border2)',margin:'0 16px' }} />
          <span style={{ fontFamily:'var(--font-display)',fontSize:11,fontStyle:'italic',color:'var(--gold3)',letterSpacing:1 }}>Propulse par IA</span>
        </div>
        <div className="nav-desktop" style={{ display:'flex',gap:32,alignItems:'center' }}>
          <Link href="/pricing" className="nav-link">Tarifs</Link>
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
        <div style={{ position:'absolute',bottom:0,left:-80,width:400,height:400,background:'radial-gradient(ellipse,rgba(200,57,43,.05) 0%,transparent 65%)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',left:0,top:80,width:1,height:'60%',background:'linear-gradient(180deg,transparent,var(--gold-border),transparent)' }} />

        <div style={{ maxWidth:780,position:'relative',zIndex:1 }}>
          <div className="fade-up d1" style={{ display:'inline-flex',alignItems:'center',gap:10,marginBottom:28 }}>
            <div style={{ width:6,height:6,background:'var(--gold)',borderRadius:'50%',animation:'pulse 2s infinite' }} />
            <span className="label" style={{ fontSize:10 }}>Intelligence artificielle · Vente entre particuliers</span>
          </div>

          <h1 className="fade-up d2 hero-title" style={{ fontFamily:'var(--font-display)',fontWeight:300,fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:8 }}>
            Vends plus vite
          </h1>
          <h1 className="fade-up d3 hero-title gold-text" style={{ fontFamily:'var(--font-display)',fontWeight:700,fontStyle:'italic',fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:8 }}>
            avec l&apos;IA qui vend
          </h1>
          <h1 className="fade-up d3 hero-title" style={{ fontFamily:'var(--font-display)',fontWeight:300,fontSize:'clamp(44px,7vw,82px)',lineHeight:1.0,letterSpacing:-1,marginBottom:36,color:'var(--muted3)' }}>
            a ta place.
          </h1>

          <p className="fade-up d4 hero-sub" style={{ fontSize:16,color:'var(--muted2)',lineHeight:1.8,marginBottom:44,maxWidth:520 }}>
            Annonces professionnelles, reponses acheteurs, estimation de prix.
            Resultat en <span style={{ color:'var(--cream)',fontStyle:'italic' }}>15 secondes</span>.
          </p>

          <div className="fade-up d5 cta-row" style={{ display:'flex',gap:14,alignItems:'center',flexWrap:'wrap',marginBottom:56 }}>
            <Link href="/auth/register?plan=business">
              <button className="btn-gold cta-btn" style={{ fontSize:13,padding:'16px 36px' }}>Commencer — 5,99 EUR/sem</button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost cta-btn">Voir les tarifs</button>
            </Link>
          </div>

          <div className="fade-up d6" style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {['Annulable a tout moment','Paiement Stripe','Resultat en 15s','Sans engagement'].map(t => (
              <span key={t} className="tp" style={{ fontSize:11,color:'var(--muted2)',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,padding:'4px 10px',letterSpacing:.3 }}>+ {t}</span>
            ))}
          </div>
        </div>

        {/* Compteurs DESKTOP */}
        <div className="cnt-float fade-up d6" style={{ position:'absolute',right:40,top:120,display:'flex',flexDirection:'column',gap:16 }}>
          {[
            { val:'+'+counts.annonces.toLocaleString('fr-FR'),label:'annonces\ngenerees' },
            { val:'+'+counts.reponses.toLocaleString('fr-FR'),label:'reponses\ncreees' },
            { val:'2x',label:'plus vite\nvendu' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'16px 20px',minWidth:140,position:'relative',overflow:'hidden' }}>
              <div style={{ position:'absolute',top:0,left:0,width:2,height:'100%',background:'linear-gradient(180deg,transparent,var(--gold),transparent)' }} />
              <div style={{ fontFamily:'var(--font-label)',fontSize:28,color:'var(--gold2)',letterSpacing:-1,lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:10,color:'var(--muted2)',marginTop:4,whiteSpace:'pre-line',lineHeight:1.4 }}>{s.label}</div>
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
            Trois outils.<br/>
            <span style={{ fontStyle:'italic',color:'var(--muted3)',fontWeight:300 }}>Un seul abonnement.</span>
          </h2>
        </div>
        <div className="ag" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
          {[
            { num:'01',title:"Creer une annonce",badge:'Abonne',desc:"L'IA redige un titre accrocheur, une description complete et les points forts qui vendent.",href:'/auth/register' },
            { num:'02',title:"Repondre a un acheteur",badge:'Abonne',desc:"Collez le message recu. L'IA vous donne la reponse parfaite avec conseil de negociation.",href:'/auth/register' },
            { num:'03',title:"Estimer le prix",badge:'Gratuit',desc:"Obtenez une fourchette de prix basee sur le marche francais actuel. 3 estimations gratuites.",href:'/pricing' },
          ].map((a,i) => (
            <div key={i} className="ac" onClick={() => router.push(a.href)} style={{ background:'var(--ink)',padding:'40px 32px',position:'relative',overflow:'hidden' }}>
              <div style={{ position:'absolute',top:20,right:24,fontFamily:'var(--font-label)',fontSize:64,color:'var(--border2)',lineHeight:1,userSelect:'none' }}>{a.num}</div>
              <div style={{ marginBottom:12 }}>
                <span className={a.badge==='Abonne'?'badge badge-gold':'badge badge-green'}>{a.badge==='Abonne'?'♛ ':''}{a.badge}</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-display)',fontSize:24,fontWeight:600,letterSpacing:-.3,marginBottom:12,lineHeight:1.2 }}>{a.title}</h3>
              <p style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.75 }}>{a.desc}</p>
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:1,background:a.badge==='Abonne'?'linear-gradient(90deg,transparent,var(--gold-border),transparent)':'linear-gradient(90deg,transparent,rgba(45,122,79,.3),transparent)' }} />
            </div>
          ))}
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="sec-pad" style={{ background:'var(--s1)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',padding:'80px 32px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:52 }}>
            <div className="label" style={{ marginBottom:12 }}>Resultats concrets</div>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(28px,4vw,44px)',fontWeight:400,letterSpacing:-.5 }}>Ce qu&apos;ils en disent</h2>
          </div>
          <div className="tg" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
            {testimonials.map((t,i) => (
              <div key={i} style={{ background:'var(--ink)',padding:'32px 28px',position:'relative' }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:64,color:'var(--gold-border)',lineHeight:.8,marginBottom:16 }}>&ldquo;</div>
                <p style={{ fontFamily:'var(--font-display)',fontSize:18,fontStyle:'italic',fontWeight:300,lineHeight:1.65,marginBottom:24,color:'var(--cream)' }}>{t.quote}</p>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:32,height:32,background:'var(--s3)',border:'1px solid var(--gold-border)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-label)',fontSize:14,color:'var(--gold2)',flexShrink:0 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize:12,fontWeight:600,color:'var(--white)' }}>{t.name} · {t.city}</div>
                    <div style={{ fontSize:11,color:'var(--muted2)' }}>{t.item}</div>
                  </div>
                </div>
                <div style={{ position:'absolute',top:0,left:0,width:1,height:'100%',background:'linear-gradient(180deg,transparent,var(--gold-border),transparent)' }} />
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
          Pret a vendre<br/>
          <span style={{ fontWeight:700,fontStyle:'italic' }} className="gold-text">plus vite et mieux ?</span>
        </h2>
        <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.8,marginBottom:40,maxWidth:480,margin:'0 auto 40px' }}>
          Rejoignez +1 247 vendeurs qui utilisent l&apos;IA pour vendre 2x plus vite.
        </p>
        <Link href="/auth/register?plan=business">
          <button className="btn-gold cta-btn" style={{ fontSize:14,padding:'18px 48px',letterSpacing:2 }}>COMMENCER MAINTENANT</button>
        </Link>
        <div style={{ marginTop:16,fontSize:12,color:'var(--muted)' }}>5,99 EUR/semaine · Annulable a tout moment · Non remboursable</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--border)',padding:'28px 32px' }}>
        <div className="footer-row" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:3,color:'var(--muted2)' }}>A.<span style={{ color:'var(--red)' }}>A</span></div>
          <div style={{ display:'flex',gap:24 }}>
            {[['Tarifs','/pricing'],['Connexion','/auth/login'],["S'inscrire",'/auth/register']].map(([label,href]) => (
              <Link key={label} href={href} className="nav-link" style={{ fontSize:12 }}>{label}</Link>
            ))}
          </div>
          <div style={{ fontSize:11,color:'var(--muted)' }}>annonza.business</div>
        </div>
      </footer>
    </div>
  )
}
