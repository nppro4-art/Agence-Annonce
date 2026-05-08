import Link from 'next/link'

export default function Confidentialite() {
  const sections = [
    { num:'1', title:'Donnees collectees', content:'Nous collectons les informations suivantes :\n- Adresse email\n- Informations liees au compte (nom, mot de passe chiffre)\n- Donnees d\'utilisation du service (annonces generees, reponses, estimations)\n- Donnees de paiement (gerees par Stripe, non stockees chez nous)' },
    { num:'2', title:'Utilisation', content:'Les donnees sont utilisees uniquement pour :\n- Fournir le service\n- Ameliorer l\'experience utilisateur\n- Assurer la securite du compte\n- Communiquer avec vous sur votre abonnement' },
    { num:'3', title:'Partage', content:'Aucune donnee personnelle n\'est vendue a des tiers. Certaines donnees peuvent etre traitees par des services tiers de confiance (Stripe pour les paiements, Vercel pour l\'hebergement, Anthropic pour l\'IA).' },
    { num:'4', title:'Securite', content:'Les donnees sont protegees par des mesures de securite appropriees. Les mots de passe sont chiffres (bcrypt). Les communications sont securisees via HTTPS.' },
    { num:'5', title:'Vos droits', content:'Vous disposez d\'un droit d\'acces, de modification et de suppression de vos donnees.\nPour exercer ces droits, contactez-nous : np.pro4@gmail.com\nNous repondrons dans un delai de 30 jours.' },
    { num:'6', title:'Cookies', content:'Le site utilise uniquement un cookie de session pour maintenir votre connexion. Aucun cookie publicitaire ou de tracking n\'est utilise.' },
  ]

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--white)',fontFamily:'var(--font-ui)' }}>
      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span></Link>
        <Link href="/" style={{ fontSize:12,color:'var(--muted2)' }}>← Retour</Link>
      </nav>
      <div style={{ maxWidth:720,margin:'0 auto',padding:'60px 24px 100px' }}>
        <div className="label" style={{ marginBottom:16 }}>Vos donnees</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:40,fontWeight:400,letterSpacing:-.5,marginBottom:8 }}>Politique de confidentialite</h1>
        <p style={{ fontSize:13,color:'var(--muted2)',marginBottom:40 }}>Annonza — Derniere mise a jour : mai 2026</p>
        {sections.map(s => (
          <div key={s.num} style={{ marginBottom:28,paddingBottom:28,borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:10,color:'var(--cream)' }}>
              <span style={{ color:'var(--gold3)',marginRight:8 }}>{s.num}.</span>{s.title}
            </h2>
            <p style={{ fontSize:14,color:'var(--muted2)',lineHeight:1.8,whiteSpace:'pre-line' }}>{s.content}</p>
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
