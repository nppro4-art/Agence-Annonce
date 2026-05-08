import Link from 'next/link'

export default function MentionsLegales() {
  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--white)',fontFamily:'var(--font-ui)' }}>
      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span></Link>
        <Link href="/" style={{ fontSize:12,color:'var(--muted2)' }}>← Retour</Link>
      </nav>
      <div style={{ maxWidth:720,margin:'0 auto',padding:'60px 24px 100px' }}>
        <div className="label" style={{ marginBottom:16 }}>Informations legales</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:40,fontWeight:400,letterSpacing:-.5,marginBottom:40 }}>Mentions legales</h1>
        {[
          { title:'Editeur du site', content:`Nom de l'entreprise : Annonza\nResponsable : Noah\nAdresse : 201 route Mornaz Haut Vaulx, 74150\nEmail : np.pro4@gmail.com\nStatut : Micro-entrepreneur (en cours de creation)\nSIRET : en cours d'attribution` },
          { title:'Hebergeur', content:`Vercel Inc.\n440 N Barranca Ave #4133\nCovina, CA 91723\nEtats-Unis\nhttps://vercel.com` },
          { title:'Propriete intellectuelle', content:'Le contenu de ce site (textes, images, design) est la propriete exclusive d\'Annonza. Toute reproduction est interdite sans autorisation.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom:32 }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,marginBottom:10,color:'var(--gold2)' }}>{s.title}</h2>
            <div style={{ fontSize:14,color:'var(--muted2)',lineHeight:1.8,whiteSpace:'pre-line',background:'var(--s1)',border:'1px solid var(--border)',padding:'16px 20px',borderLeft:'2px solid var(--gold-border)' }}>{s.content}</div>
          </div>
        ))}
      </div>
      <LegalFooter />
    </div>
  )
}

function LegalFooter() {
  return (
    <footer style={{ borderTop:'1px solid var(--border)',padding:'20px 32px',display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center' }}>
      {[['Accueil','/'],['CGV','/cgv'],['Confidentialite','/confidentialite'],['Mentions legales','/mentions-legales'],['A propos','/a-propos']].map(([l,h]) => (
        <Link key={l} href={h} style={{ fontSize:12,color:'var(--muted2)' }}>{l}</Link>
      ))}
    </footer>
  )
}
