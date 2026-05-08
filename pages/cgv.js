import Link from 'next/link'

export default function CGV() {
  const articles = [
    { num:'1', title:'Objet', content:"Annonza propose un service d'assistance base sur l'intelligence artificielle permettant d'optimiser des annonces, generer des reponses et estimer des prix." },
    { num:'2', title:'Acces au service', content:'Le service est accessible apres paiement via abonnement ou achat de credits.' },
    { num:'3', title:'Abonnement', content:"Les abonnements sont automatiquement renouveles a chaque periode (hebdomadaire selon l'offre choisie)." },
    { num:'4', title:'Resiliation', content:"L'utilisateur peut resilier a tout moment depuis son espace client. La resiliation prend effet a la fin de la periode en cours. Aucun remboursement ne sera effectue pour la periode deja payee." },
    { num:'5', title:'Paiement', content:'Les paiements sont securises via Stripe. Les donnees bancaires ne sont jamais stockees sur nos serveurs.' },
    { num:'6', title:'Responsabilite', content:"Annonza fournit des outils d'aide a la vente. Les resultats (vente, prix, negociation) ne sont pas garantis. L'utilisateur reste seul responsable de ses annonces et de ses transactions." },
    { num:'7', title:'Remboursement', content:"Aucun remboursement n'est effectue apres validation du paiement car la prestation est livree immediatement sous forme numerique." },
    { num:'8', title:'Donnees', content:'Les donnees sont utilisees uniquement pour le fonctionnement du service et ne sont pas revendues a des tiers.' },
  ]

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--white)',fontFamily:'var(--font-ui)' }}>
      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span></Link>
        <Link href="/" style={{ fontSize:12,color:'var(--muted2)' }}>← Retour</Link>
      </nav>
      <div style={{ maxWidth:720,margin:'0 auto',padding:'60px 24px 100px' }}>
        <div className="label" style={{ marginBottom:16 }}>Documents contractuels</div>
        <h1 style={{ fontFamily:'var(--font-display)',fontSize:40,fontWeight:400,letterSpacing:-.5,marginBottom:8 }}>Conditions Generales de Vente</h1>
        <p style={{ fontSize:13,color:'var(--muted2)',marginBottom:40 }}>Annonza — Derniere mise a jour : mai 2026</p>
        {articles.map(a => (
          <div key={a.num} style={{ marginBottom:28, paddingBottom:28, borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:10,color:'var(--cream)' }}>
              <span style={{ color:'var(--gold3)',marginRight:8 }}>{a.num}.</span>{a.title}
            </h2>
            <p style={{ fontSize:14,color:'var(--muted2)',lineHeight:1.8 }}>{a.content}</p>
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
