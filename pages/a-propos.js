import Link from 'next/link'

export default function APropos() {
  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--white)',fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.2s;opacity:0}.d3{animation-delay:.3s;opacity:0}.d4{animation-delay:.4s;opacity:0}
      `}</style>

      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span></Link>
        <div style={{ display:'flex',gap:16,alignItems:'center' }}>
          <Link href="/pricing" style={{ fontSize:12,color:'var(--muted2)' }}>Tarifs</Link>
          <Link href="/auth/register"><button className="btn-primary" style={{ fontSize:11,padding:'8px 16px',letterSpacing:1.5 }}>Commencer</button></Link>
        </div>
      </nav>

      <div style={{ maxWidth:800,margin:'0 auto',padding:'80px 24px 100px' }}>

        {/* Hero */}
        <div className="fade-up d1" style={{ marginBottom:60 }}>
          <div className="label" style={{ marginBottom:16 }}>Notre histoire</div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(36px,6vw,60px)',fontWeight:400,letterSpacing:-1,lineHeight:1.05,marginBottom:20 }}>
            On a cree l&apos;outil<br/>
            <span style={{ fontStyle:'italic',fontWeight:700,color:'#c9a84c' }}>qu&apos;on aurait voulu avoir.</span>
          </h1>
          <p style={{ fontSize:16,color:'var(--muted2)',lineHeight:1.85,maxWidth:600 }}>
            Annonza est ne d&apos;un constat simple : vendre sur LeBonCoin, Facebook Marketplace ou Vinted prend du temps, demande du savoir-faire, et les resultats sont souvent decevants. Une mauvaise annonce, une mauvaise reponse a un acheteur, un prix mal estime — et la vente rate.
          </p>
        </div>

        <div style={{ height:1,background:'linear-gradient(90deg,transparent,var(--gold-border),transparent)',marginBottom:60 }} />

        {/* Mission */}
        <div className="fade-up d2" style={{ marginBottom:60 }}>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5,marginBottom:16 }}>Notre mission</h2>
          <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.85,marginBottom:16 }}>
            Permettre a n&apos;importe qui de vendre comme un professionnel — sans experience, sans competences redactionnelles, en moins de 30 secondes.
          </p>
          <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.85 }}>
            On utilise les modeles d&apos;IA les plus avances (Claude d&apos;Anthropic) pour generer des annonces percutantes, des reponses strategiques et des estimations de prix precises. Le tout dans une interface simple, rapide et accessible sur tous les appareils.
          </p>
        </div>

        {/* Valeurs */}
        <div className="fade-up d3" style={{ marginBottom:60 }}>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5,marginBottom:24 }}>Ce en quoi on croit</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:1,background:'var(--border)' }}>
            {[
              { icon:'⚡', title:'Simplicite avant tout', desc:'Un outil puissant doit etre simple. Aucune formation requise.' },
              { icon:'🎯', title:'Resultats concrets', desc:'On ne vend pas du vent. Nos utilisateurs vendent plus vite.' },
              { icon:'🔒', title:'Confiance totale', desc:'Vos donnees restent les votres. Jamais revendues.' },
              { icon:'♻️', title:'Amelioration continue', desc:'On ecoute nos utilisateurs et on s\'ameliore chaque semaine.' },
            ].map(v => (
              <div key={v.title} style={{ background:'var(--ink)',padding:'28px 24px' }}>
                <div style={{ fontSize:28,marginBottom:12 }}>{v.icon}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:600,marginBottom:8 }}>{v.title}</div>
                <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.65 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipe */}
        <div className="fade-up d4" style={{ marginBottom:60 }}>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.5,marginBottom:16 }}>Qui sommes-nous</h2>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'2px solid var(--gold)',padding:'24px 28px' }}>
            <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.85,marginBottom:12 }}>
              Annonza est un projet fonde par Noah, etudiant passione de technologie base en France. Convaincu que l&apos;intelligence artificielle peut rendre la vie quotidienne plus simple, il a cree Annonza pour que chaque particulier puisse beneficier d&apos;un assistant de vente professionnel dans sa poche.
            </p>
            <p style={{ fontSize:15,color:'var(--muted2)',lineHeight:1.85 }}>
              Le projet est en cours de lancement et evolue rapidement grace aux retours de ses premiers utilisateurs. Chaque fonctionnalite est pensee pour un usage reel, par de vraies personnes qui veulent vendre leurs affaires sans se prendre la tete.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center',padding:'40px',background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:4 }}>
          <h3 style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:400,marginBottom:12 }}>Pret a vendre plus vite ?</h3>
          <p style={{ fontSize:14,color:'var(--muted2)',marginBottom:24 }}>Rejoignez des maintenant et obtenez votre premiere annonce en 15 secondes.</p>
          <Link href="/auth/register">
            <button className="btn-gold" style={{ fontSize:13,padding:'14px 36px',letterSpacing:2 }}>COMMENCER GRATUITEMENT</button>
          </Link>
        </div>

      </div>

      <footer style={{ borderTop:'1px solid var(--border)',padding:'20px 32px',display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center' }}>
        {[['Accueil','/'],['CGV','/cgv'],['Confidentialite','/confidentialite'],['Mentions legales','/mentions-legales'],['A propos','/a-propos']].map(([l,h]) => (
          <Link key={l} href={h} style={{ fontSize:12,color:'var(--muted2)' }}>{l}</Link>
        ))}
      </footer>
    </div>
  )
}
