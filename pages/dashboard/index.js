import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const PLAN_LIMITS = {
  premium:  { annonces: Infinity, reponses: Infinity },
  expert:   { annonces: Infinity, reponses: Infinity },
  business: { annonces: 30, reponses: 100 },
  starter:  { annonces: 10, reponses: 30  },
  pro:      { annonces: 30, reponses: 100 },
  free:     { annonces: 0,  reponses: 0   },
}

const PLAN_FEATURES = {
  premium:  { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:true, arnaque:true, plateformes:true },
  expert:   { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:true, arnaque:true, plateformes:true },
  business: { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:false, arnaque:true, plateformes:true },
  starter:  { analyser:false, chatbot:false, ventes:false, flash:false, traduction:false, lot:false, arnaque:false, plateformes:false },
  pro:      { analyser:true, chatbot:true, ventes:true, flash:true, traduction:true, lot:false, arnaque:true, plateformes:true },
  free:     { analyser:false, chatbot:false, ventes:false, flash:false, traduction:false, lot:false, arnaque:false, plateformes:false },
}

function canAccessFeature(planKey, feature) {
  return !!(PLAN_FEATURES[planKey] || PLAN_FEATURES.free)[feature]
}
const PLAN_NAMES = { premium:'Premium', expert:'Expert', business:'Business', starter:'Starter', pro:'Business', free:'Gratuit' }
const PLAN_PRICES = { premium:'—', expert:'12,99', business:'5,99', starter:'3,99', pro:'5,99', free:'0' }
const PLAN_CHATBOT = { premium:500, expert:200, business:50, starter:0, pro:50, free:0 }

const CATEGORIES = {
  'Véhicules 🚗': [
    { key:'typeVehicule', label:'Type de véhicule', type:'select', opts:['Voiture','Moto / Scooter','Camping-car / Van','Utilitaire','Bateau','Quad / Buggy','Autre'] },
    { key:'marque', label:'Marque', ph:'BMW, Renault, Yamaha...' },
    { key:'modele', label:'Modèle', ph:'Série 3, MT-07, Kangoo...' },
    { key:'version', label:'Version / Finition', ph:'M Sport, GT Line...' },
    { key:'annee', label:'Année', ph:'2019', type:'number' },
    { key:'kilometrage', label:'Kilométrage (km)', ph:'75000', type:'number' },
    { key:'carburant', label:'Carburant', type:'select', opts:['Essence','Diesel','Hybride','Hybride rechargeable','Électrique','GPL','Sans objet'] },
    { key:'boite', label:'Boîte de vitesse', type:'select', opts:['Manuelle','Automatique','Semi-automatique','Sans objet'] },
    { key:'couleur', label:'Couleur', ph:'Noir métallisé, Blanc nacré...' },
    { key:'puissance', label:'Puissance (CV)', ph:'120', type:'number' },
    { key:'carrosserie', label:'Type de carrosserie', type:'select', opts:['Berline','Break','SUV','Citadine','Coupé','Cabriolet','Monospace','Utilitaire','Moto','Scooter','Camping-car','Autre'] },
    { key:'etat', label:'État général', type:'select', opts:['Excellent — comme neuf','Très bon état','Bon état','État correct','À réparer'] },
    { key:'nbProprio', label:'Nombre de propriétaires', ph:'1', type:'number' },
    { key:'ct', label:'Contrôle technique', type:'select', opts:['Valide','À refaire sous 2 mois','Non présenté','Non applicable'] },
    { key:'dateCT', label:'Date du CT', ph:'03/2024' },
    { key:'carnet', label:'Carnet entretien', type:'select', opts:['Complet et à jour','Partiel','Absent'] },
    { key:'dernierEntretien', label:'Dernier entretien', ph:'Vidange + filtres à 70 000 km...', wide:true },
    { key:'options', label:'Options et équipements', ph:'GPS, Caméra recul, Toit ouvrant, Sièges chauffants...', wide:true },
    { key:'defauts', label:'Défauts et imperfections', ph:'Rayure aile avant, trace pare-choc...', wide:true },
    { key:'travauxFaits', label:'Travaux effectués', ph:'Embrayage neuf à 65 000 km...', wide:true },
    { key:'travauxAFaire', label:'Travaux à prévoir', ph:'Pneus arrière bientôt...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'8500', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui — prix à débattre','Légèrement','Non — prix ferme'] },
    { key:'prixMin', label:'Prix minimum accepté (confidentiel)', ph:'7800', type:'number' },
    { key:'ville', label:'Ville', ph:'Lyon, Paris...' },
    { key:'paiement', label:'Paiement accepté', type:'select', opts:['Espèces','Virement bancaire','Chèque de banque','Tous modes'] },
    { key:'urgence', label:'Urgence de vente', type:'urgence' },
  ],
  'Informatique & Téléphones 💻': [
    { key:'type', label:'Type', type:'select', opts:['Smartphone','Tablette','Ordinateur portable','PC fixe','Écran','Console de jeu','Composant PC','Imprimante','Accessoire','Autre'] },
    { key:'marque', label:'Marque', ph:'Apple, Samsung, Dell, Sony...' },
    { key:'modele', label:'Modèle', ph:'iPhone 15 Pro, MacBook Pro M3, PS5...' },
    { key:'stockage', label:'Stockage', type:'select', opts:['32 Go','64 Go','128 Go','256 Go','512 Go','1 To','2 To','Autre'] },
    { key:'ram', label:'RAM', ph:'8 Go, 16 Go, 32 Go...' },
    { key:'processeur', label:'Processeur', ph:'Apple M3, Intel i7, Ryzen 9...' },
    { key:'gpu', label:'Carte graphique', ph:'RTX 4060, RX 7600... (si applicable)' },
    { key:'os', label:'Système', type:'select', opts:['iOS / iPadOS','macOS','Windows 11','Windows 10','Android','Linux','Aucun'] },
    { key:'etat', label:'État', type:'select', opts:['Neuf sous blister','Comme neuf','Très bon état','Bon état','État correct','Pour pièces'] },
    { key:'batterie', label:'Santé batterie', ph:'94%, 120 cycles...' },
    { key:'etatEcran', label:'État écran', type:'select', opts:['Parfait','Micro-rayures','Rayures légères','Fissure'] },
    { key:'debloque', label:'Débloqué tous opérateurs', type:'select', opts:['Oui','Non','Sans objet'] },
    { key:'accessoires', label:'Accessoires inclus', ph:'Boîte, chargeur, câble, housse...', wide:true },
    { key:'defauts', label:'Défauts', ph:'Petit impact, marque au dos...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'450', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (€)', ph:'1200', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris, Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui — Mondial Relay','Oui — Colissimo','Oui — tous','Non — main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Gaming 🎮': [
    { key:'type', label:'Type', type:'select', opts:['Jeu vidéo','Console','Manette / Accessoire','Pack complet','Carte cadeau','PC Gamer'] },
    { key:'plateforme', label:'Plateforme', type:'select', opts:['PlayStation 5','PlayStation 4','PlayStation 3','Xbox Series X/S','Xbox One','Nintendo Switch','Nintendo Switch Lite','PC','Rétro / Autre'] },
    { key:'titre', label:'Titre / Nom', ph:'FIFA 24, Zelda, Call of Duty...' },
    { key:'etat', label:'État', type:'select', opts:['Neuf sous blister','Comme neuf','Très bon état','Bon état','État correct'] },
    { key:'version', label:'Version', type:'select', opts:['Physique — boîte','Numérique — code','Édition Collector'] },
    { key:'completude', label:'Complétude', type:'select', opts:['Complet — boîte + notice + jeu','Jeu seul','Boîte seule'] },
    { key:'dlc', label:'DLC inclus', ph:'Season pass, DLC 1 et 2...', wide:true },
    { key:'defauts', label:'Défauts', ph:'Aucun, rayure sur boîte...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'25', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui — emballé soin','Non — main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Maison & Déco 🏠': [
    { key:'type', label:'Type', type:'select', opts:['Meuble','Canapé / Fauteuil','Lit / Literie','Table / Chaises','Rangement','Décoration','Luminaire','Linge de maison','Cuisine / Vaisselle','Jardin','Autre'] },
    { key:'marque', label:'Marque / Fabricant', ph:'IKEA, Maisons du Monde...' },
    { key:'modele', label:'Modèle / Référence', ph:'KALLAX, EKTORP...' },
    { key:'couleur', label:'Couleur', ph:'Blanc, Chêne, Gris anthracite...' },
    { key:'matiere', label:'Matière', type:'select', opts:['Bois massif','Bois MDF','Métal','Verre','Tissu','Cuir','Velours','Rotin','Marbre','Plastique','Autre'] },
    { key:'dimensions', label:'Dimensions (cm)', ph:'180 x 90 x 75 cm...' },
    { key:'etat', label:'État', type:'select', opts:['Comme neuf','Très bon état','Bon état','État correct','Nécessite nettoyage'] },
    { key:'defauts', label:'Défauts', ph:'Petite rayure plateau, trace accoudoir...', wide:true },
    { key:'demontable', label:'Démontable', type:'select', opts:['Oui — facile','Partiellement','Non — un seul bloc'] },
    { key:'prix', label:'Prix demandé (€)', ph:'150', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (€)', ph:'450', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Électroménager 🔌': [
    { key:'type', label:'Type', ph:'Lave-linge, Frigo, Four, Lave-vaisselle, Aspirateur...' },
    { key:'marque', label:'Marque', ph:'Bosch, Samsung, Whirlpool, Dyson...' },
    { key:'modele', label:'Référence modèle', ph:'WAN24264FR...' },
    { key:'anneeAchat', label:'Année achat', ph:'2020', type:'number' },
    { key:'capacite', label:'Capacité', ph:'7 kg, 200L, 60 cm...' },
    { key:'classeEnergie', label:'Classe énergétique', type:'select', opts:['A+++','A++','A+','A','B','C','D','E','F','G'] },
    { key:'etat', label:'État', type:'select', opts:['Excellent — comme neuf','Très bon état','Bon état','Quelques traces cosmétiques','Nécessite réparation'] },
    { key:'fonctionnement', label:'Fonctionnement', type:'select', opts:['Parfait — aucun problème','Quelques défauts mineurs','Réparation conseillée'] },
    { key:'garantie', label:'Garantie restante', type:'select', opts:['Sous garantie constructeur','Sous garantie revendeur','Plus de garantie'] },
    { key:'defauts', label:'Défauts / Pannes historiques', ph:'Trace légère rouille, joint à surveiller...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'200', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (€)', ph:'600', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'livraison', label:'Livraison possible', type:'select', opts:['Non','Oui — frais acheteur','Oui — inclus'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Mode & Accessoires 👗': [
    { key:'type', label:'Type', type:'select', opts:['Vêtement homme','Vêtement femme','Vêtement enfant','Chaussures','Sac / Maroquinerie','Bijou / Montre','Accessoire mode','Autre'] },
    { key:'marque', label:'Marque', ph:'Zara, Nike, Gucci, Louis Vuitton...' },
    { key:'taille', label:'Taille / Pointure', ph:'M, 42, EU 42, 10 ans...' },
    { key:'couleur', label:'Couleur', ph:'Noir, Bleu marine, Beige...' },
    { key:'matiere', label:'Matière', ph:'100% coton, cuir véritable...' },
    { key:'etat', label:'État', type:'select', opts:['Neuf avec étiquette','Neuf sans étiquette','Comme neuf','Très bon état','Bon état','État correct'] },
    { key:'defauts', label:'Défauts visibles', ph:'Aucun, légère décoloration...', wide:true },
    { key:'accessoires', label:'Inclus', ph:'Boîte, sac, étiquette...' },
    { key:'prix', label:'Prix demandé (€)', ph:'25', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (€)', ph:'80', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui — Mondial Relay','Oui — Colissimo','Non — main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Sport & Loisirs ⚽': [
    { key:'type', label:'Type', type:'select', opts:['Vélo / Trottinette','Fitness / Musculation','Sports de raquette','Sports de glisse','Sports collectifs','Chasse / Pêche','Camping / Randonnée','Sports nautiques','Autre'] },
    { key:'marque', label:'Marque', ph:'Decathlon, Specialized, Babolat...' },
    { key:'modele', label:'Modèle', ph:'BTwin 540, Babolat Pure Drive...' },
    { key:'taille', label:'Taille / Cadre', ph:'M, cadre 54cm...' },
    { key:'etat', label:'État', type:'select', opts:['Comme neuf','Très bon état','Bon état','État correct','Nécessite entretien'] },
    { key:'specs', label:'Spécifications techniques', ph:'Shimano 105 11v, fourche carbone...', wide:true },
    { key:'accessoires', label:'Accessoires inclus', ph:'Casque, pompe, cadenas...', wide:true },
    { key:'defauts', label:'Défauts / Usures', ph:'Rayures cadre, grips usés...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'80', type:'number' },
    { key:'prixAchat', label:'Prix achat initial (€)', ph:'350', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Culture & Collection 📚': [
    { key:'type', label:'Type', type:'select', opts:['Livre','BD / Manga','CD / Vinyle','DVD / Blu-ray','Instrument de musique','Carte / Figurine','Collection','Autre'] },
    { key:'titre', label:'Titre / Nom', ph:'Harry Potter, One Piece tome 1...' },
    { key:'auteur', label:'Auteur / Artiste', ph:'J.K. Rowling, Eiichiro Oda...' },
    { key:'etat', label:'État', type:'select', opts:['Neuf','Comme neuf','Très bon état','Bon état','État correct'] },
    { key:'edition', label:'Édition / Rareté', ph:'1ère édition, édition limitée...' },
    { key:'defauts', label:'Défauts', ph:'Légère marque de lecture...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'10', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Non'] },
    { key:'ville', label:'Ville', ph:'Paris...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui — lettre suivie','Oui — Colissimo','Non — main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Animaux 🐾': [
    { key:'type', label:'Type', type:'select', opts:['Accessoire animal','Alimentation','Cage / Habitat','Jouet','Laisse / Harnais','Vêtement animal','Soins / Hygiène','Autre'] },
    { key:'animal', label:'Pour quel animal', type:'select', opts:['Chien','Chat','Rongeur','Oiseau','Reptile','Poisson','Autre'] },
    { key:'marque', label:'Marque', ph:'Royal Canin, Kong, Zolux...' },
    { key:'etat', label:'État', type:'select', opts:['Neuf','Comme neuf','Très bon état','Bon état','État correct'] },
    { key:'defauts', label:'Défauts', ph:'Légère usure, petite trace...', wide:true },
    { key:'prix', label:'Prix demandé (€)', ph:'15', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Oui','Non — main propre'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
  'Autre 📦': [
    { key:'type', label:'Type / Description courte', ph:'Aspirateur robot, Livre rare, Instrument musique...' },
    { key:'marque', label:'Marque / Fabricant', ph:'(si applicable)' },
    { key:'etat', label:'État', type:'select', opts:['Neuf','Comme neuf','Très bon état','Bon état','État correct','Pour pièces'] },
    { key:'description', label:'Description complète', ph:'Décrivez votre article, son usage, ses caractéristiques...', wide:true },
    { key:'defauts', label:'Défauts', ph:'Aucun, petite trace, notice manquante...', wide:true },
    { key:'accessoires', label:'Inclus', ph:'Chargeur, boîte, manuel, télécommande...' },
    { key:'prix', label:'Prix demandé (€)', ph:'50', type:'number' },
    { key:'negociable', label:'Prix négociable', type:'select', opts:['Oui','Légèrement','Non'] },
    { key:'ville', label:'Ville', ph:'Lyon...' },
    { key:'envoi', label:'Envoi possible', type:'select', opts:['Non','Oui — selon taille','Oui — tous transporteurs'] },
    { key:'urgence', label:'Urgence', type:'urgence' },
  ],
}

const CATEGORY_LIST = Object.keys(CATEGORIES)

const S = {
  inp: { background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:3,color:'var(--white)',fontSize:13,padding:'10px 14px',width:'100%',outline:'none',transition:'all .2s',fontFamily:'DM Sans, sans-serif' },
  lbl: { fontSize:9,fontWeight:400,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:'2px',display:'block',marginBottom:8,fontFamily:'var(--font-label)' },
  card: { background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px',marginBottom:12 },
  section: { marginBottom:28 },
}

function LockOverlay({ subscribe }) {
  return (
    <div style={{ position:'sticky',bottom:24,left:0,right:0,zIndex:50,display:'flex',justifyContent:'center',marginTop:20 }}>
      <div style={{ background:'rgba(8,10,15,.95)',backdropFilter:'blur(20px)',border:'1px solid rgba(201,168,76,.2)',borderRadius:8,padding:'28px 32px',maxWidth:440,width:'100%',textAlign:'center',boxShadow:'0 24px 60px rgba(8,10,15,.8),0 0 0 1px rgba(201,168,76,.05)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(201,168,76,.08)',border:'1px solid rgba(201,168,76,.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:18 }}>🔒</div>
        <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--gold3)',marginBottom:8,textTransform:'uppercase' }}>Abonnement requis</div>
        <div style={{ fontFamily:'Cormorant Garamond',fontSize:22,fontWeight:500,marginBottom:8 }}>Fonctionnalité premium</div>
        <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:20,lineHeight:1.7 }}>
          Débloquez cette fonctionnalité à partir de 3,99 EUR/semaine.
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
          {[['Starter','3,99'],['Business','5,99'],['Expert','12,99']].map(([plan,price],i) => (
            <button key={plan} onClick={() => subscribe(plan.toLowerCase())}
              style={{ background:i===1?'linear-gradient(135deg,var(--gold3),var(--gold2))':'rgba(255,255,255,.04)',border:'1px solid',borderColor:i===1?'transparent':'rgba(255,255,255,.08)',borderRadius:4,color:i===1?'#030303':'var(--cream)',cursor:'pointer',fontSize:11,padding:'10px 6px',transition:'all .2s' }}>
              <div style={{ fontSize:9,color:i===1?'rgba(0,0,0,.6)':'var(--muted2)',marginBottom:3,letterSpacing:1 }}>{plan.toUpperCase()}</div>
              <div style={{ fontFamily:'DM Mono, monospace',fontSize:14,fontWeight:600 }}>{price}€</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')
  const [guideOpen, setGuideOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({ annonces:0, reponses:0 })
  const [annonces, setAnnonces] = useState([])
  const [credits, setCredits] = useState({ annonces:{ remaining:0 }, reponses:{ remaining:0 } })
  const [purchases, setPurchases] = useState([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
    }).catch(() => router.push('/auth/login'))
    Promise.all([
      fetch('/api/dashboard/annonces').then(r=>r.json()),
      fetch('/api/dashboard/reponses').then(r=>r.json()),
      fetch('/api/dashboard/credits').then(r=>r.json()),
    ]).then(([a,r,c]) => {
      setUsage({ annonces:a.annonces?.length||0, reponses:r.reponses?.length||0 })
      if (c.credits) setCredits(c.credits)
      if (c.purchases) setPurchases(c.purchases)
    }).catch(()=>{})

    // Charger les annonces pour les sélecteurs
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d => {
      setAnnonces(d.annonces||[])
    }).catch(()=>{})
  }, [])

  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const subscribe = async (planKey='business') => {
    const res = await fetch('/api/stripe/create-subscription',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Erreur: '+(data.error||'Inconnue'))
  }

  const cancelSubscription = async () => {
    if (!confirm('Confirmer annulation ? Acces maintenu jusqu\'a fin de periode.')) return
    setCancelLoading(true)
    const res = await fetch('/api/stripe/cancel-subscription',{method:'POST'})
    const data = await res.json()
    setCancelLoading(false)
    if (data.success) { setCancelDone(true); setShowSubModal(false) }
    else alert('Erreur: '+(data.error||'Inconnue'))
  }

  const planKey = user?.planKey || user?.plan || 'free'
  const isPremium = planKey === 'premium'
  const isSubscribed = (user?.plan==='pro' && user?.subStatus==='active') || isPremium
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free
  const annoncesLeft = limits.annonces===Infinity ? '∞' : Math.max(0,limits.annonces-usage.annonces)
  const reponsesLeft = limits.reponses===Infinity ? '∞' : Math.max(0,limits.reponses-usage.reponses)

  const TABS = [
    {id:'home',     label:'Accueil',      icon:'⌂'},
    {id:'annonce',  label:'Annonce',      icon:'✍'},
    {id:'reponse',  label:'Répondre',     icon:'◎'},
    {id:'estimation',label:'Estimer',     icon:'⚖'},
    {id:'analyser', label:'Analyser',     icon:'◈'},
    {id:'ventes',   label:'Mes ventes',   icon:'↑'},
    {id:'chatbots', label:'Chatbots',     icon:'◇'},
    {id:'outils',   label:'Outils',       icon:'⚙'},
    {id:'historique',label:'Historique',  icon:'◷'},
    {id:'tarifs',   label:'Tarifs',       icon:'✦'},
    {id:'profil',   label:'Profil',       icon:'◉'},
  ]

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#080a0f',gap:16 }}>
      <div style={{ fontFamily:'Cormorant Garamond',fontSize:28,fontWeight:300,letterSpacing:4,color:'var(--gold2)' }}>Annonza</div>
      <div style={{ width:24,height:24,border:'1.5px solid rgba(201,168,76,.2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'#080a0f',fontFamily:'var(--font-ui)' }}>
      <style>{`
        /* ── ANIMATIONS ─────────────────── */
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes nebulaPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
        @keyframes orbit{from{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)}to{transform:rotate(360deg) translateX(var(--r)) rotate(-360deg)}}
        @keyframes orbitReverse{from{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)}to{transform:rotate(-360deg) translateX(var(--r)) rotate(360deg)}}
        @keyframes twinkle{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes moonGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(180,200,255,.4))}50%{filter:drop-shadow(0 0 14px rgba(180,200,255,.8))}}
        .star{position:fixed;border-radius:50%;animation:twinkle var(--dur,3s) ease-in-out var(--delay,0s) infinite;pointer-events:none;z-index:0}
        .moon{position:fixed;font-size:28px;animation:moonGlow 4s ease-in-out infinite,orbit 120s linear infinite;pointer-events:none;z-index:0;--r:40vw}
        .db-layout,.sidebar,.db-main,.card,.sec-title,.sec-label{position:relative;z-index:1}
        .db-fade{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) forwards}
        .db-slide{animation:fadeIn .35s ease forwards}

        /* ── SIDEBAR ─────────────────────── */
        .sidebar{
          position:fixed;left:0;top:0;bottom:0;
          width:60px;
          background:#0d1525;
          border-right:1px solid rgba(201,168,76,.1);
          z-index:200;
          display:flex;flex-direction:column;
          transition:width .28s cubic-bezier(.16,1,.3,1);
          overflow:hidden;
          box-shadow:4px 0 20px rgba(0,0,0,.4);
        }
        .sidebar:hover{width:220px}
        .sidebar-logo{
          display:flex;align-items:center;gap:14px;
          padding:0 18px;height:58px;
          flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05);
          white-space:nowrap;
        }
        .sidebar-item{
          display:flex;align-items:center;gap:16px;
          padding:0 18px;height:44px;
          cursor:pointer;border:none;background:transparent;
          color:var(--muted);
          transition:all .2s;
          white-space:nowrap;
          border-left:2px solid transparent;
          flex-shrink:0;width:100%;text-align:left;
          -webkit-tap-highlight-color:transparent;
        }
        .sidebar-item:hover{color:var(--cream);background:rgba(255,255,255,.04)}
        .sidebar-item.active{color:var(--gold2);background:rgba(201,168,76,.07);border-left-color:var(--gold)}
        .sidebar-icon{font-size:18px;flex-shrink:0;width:24px;text-align:center;line-height:1}
        .sidebar-label{
          font-family:'Bebas Neue',sans-serif;
          font-size:13px;letter-spacing:1.5px;
          opacity:0;transition:opacity .2s .05s;
          overflow:hidden;text-overflow:ellipsis;
        }
        .sidebar:hover .sidebar-label{opacity:1}

        /* ── LAYOUT ──────────────────────── */
        .db-layout{margin-left:60px;min-height:100vh;display:flex;flex-direction:column}
        .db-topbar{justify-content:space-between;
          position:sticky;top:0;z-index:100;height:50px;
          background:rgba(8,10,15,.95);border-bottom:1px solid rgba(255,255,255,.05);
          backdrop-filter:blur(20px);
          display:flex;align-items:center;justify-content:flex-end;
          padding:0 24px;gap:10px;
        }
        .db-main{flex:1;max-width:920px;padding:32px 24px 100px}

        /* ── INPUTS ──────────────────────── */
        .db-inp{
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          border-radius:6px;color:var(--white);font-size:13px;padding:10px 14px;
          width:100%;outline:none;transition:all .2s;font-family:var(--font-ui);
        }
        .db-inp:focus{border-color:rgba(201,168,76,.35);background:rgba(255,255,255,.06)}
        .db-inp::placeholder{color:var(--muted)}
        select.db-inp{appearance:none;cursor:pointer}
        textarea.db-inp{resize:vertical;line-height:1.6}

        /* ── BOUTONS ─────────────────────── */
        .btn-gold-db{
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          background:linear-gradient(135deg,#a8843c,#c9a84c);border:none;border-radius:6px;
          color:#030303;cursor:pointer;font-family:'Bebas Neue',sans-serif;
          font-size:13px;letter-spacing:2px;padding:13px 22px;
          transition:all .2s;-webkit-tap-highlight-color:transparent;
        }
        .btn-gold-db:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .btn-gold-db:active{transform:translateY(0)}
        .btn-gold-db:disabled{opacity:.4;cursor:not-allowed;transform:none;filter:none}
        .btn-ghost-db{
          display:inline-flex;align-items:center;justify-content:center;
          background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:6px;
          color:var(--muted2);cursor:pointer;font-family:var(--font-ui);
          font-size:12px;padding:9px 16px;transition:all .2s;
        }
        .btn-ghost-db:hover{border-color:rgba(201,168,76,.25);color:var(--gold2)}
        .btn-danger{
          display:inline-flex;align-items:center;justify-content:center;
          background:rgba(200,57,43,.08);border:1px solid rgba(200,57,43,.2);border-radius:6px;
          color:var(--red2);cursor:pointer;font-family:var(--font-ui);
          font-size:12px;padding:9px 16px;transition:all .2s;
        }
        .btn-danger:hover{background:rgba(200,57,43,.15);border-color:rgba(200,57,43,.4)}

        /* ── TYPOGRAPHY ──────────────────── */
        .sec-label{font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:var(--muted2);text-transform:uppercase;margin-bottom:6px;display:block}
        .sec-title{font-family:'Cormorant Garamond',serif;font-size:clamp(26px,4vw,36px);font-weight:300;letter-spacing:-.5px;line-height:1.1}
        .gold-shimmer{background:linear-gradient(135deg,#a8843c,#c9a84c,#e8d48a,#c9a84c);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite}

        /* ── CARDS ───────────────────────── */
        .card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px 22px}
        .card-gold{background:linear-gradient(135deg,rgba(201,168,76,.07),rgba(201,168,76,.02));border-color:rgba(201,168,76,.2)!important}
        .card-hover{transition:all .2s}
        .card-hover:hover{background:rgba(255,255,255,.04)!important;border-color:rgba(255,255,255,.12)!important;transform:translateY(-2px)}

        /* ── PROGRESS ────────────────────── */
        .progress-bar{background:rgba(255,255,255,.06);border-radius:4px;height:4px;overflow:hidden}
        .progress-fill{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.16,1,.3,1)}

        /* ── MISC ────────────────────────── */
        .hover-row{transition:background .15s}.hover-row:hover{background:rgba(201,168,76,.03)!important}
        .copy-btn{transition:all .2s}.copy-btn:hover{border-color:rgba(201,168,76,.3)!important;color:var(--gold2)!important}
        .tool-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:18px;cursor:pointer;transition:all .25s}
        .tool-card:hover{background:rgba(201,168,76,.05);border-color:rgba(201,168,76,.2);transform:translateY(-2px)}
        .tool-card.active{background:rgba(201,168,76,.08);border-color:rgba(201,168,76,.3)}
        .tool-card.locked{opacity:.35;cursor:not-allowed}
        .tool-card.locked:hover{transform:none;background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.07)}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.2);border-radius:2px}
        select{background:#0a1020!important;color:#f0ece4!important}
        select option{background:#0a1020!important;color:#f0ece4!important}
        select option:checked{background:rgba(201,168,76,.15)!important;color:#c9a84c!important}

        /* ── MOBILE ──────────────────────── */
        @media(max-width:768px){
          .star{display:none}
          .moon{font-size:18px!important;top:2%!important;right:3%!important}
          .sidebar{top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;height:56px!important;flex-direction:row!important;border-right:none!important;border-top:1px solid rgba(201,168,76,.1)!important;padding:0!important;overflow-x:auto;overflow-y:hidden;box-shadow:0 -4px 20px rgba(0,0,0,.4)!important}
          .sidebar:hover{width:100%!important}
          .sidebar-logo{display:none!important}
          .sidebar-item{height:56px!important;padding:0 4px!important;flex-direction:column!important;gap:2px!important;min-width:44px;flex:1;justify-content:center;border-left:none!important;border-top:2px solid transparent!important;border-radius:0}
          .sidebar-item.active{border-top-color:var(--gold)!important;border-left-color:transparent!important;background:rgba(201,168,76,.06)!important}
          .sidebar-label{opacity:1!important;font-size:7px!important;letter-spacing:0!important;transition:none!important;text-align:center;max-width:48px;overflow:hidden;text-overflow:ellipsis}
          .sidebar-icon{font-size:14px!important;width:auto!important}
          .db-layout{margin-left:0!important;margin-bottom:56px!important}
          .db-topbar{padding:0 10px!important;gap:6px!important;height:44px!important}
          .cpt-group{gap:8px!important}
          .db-main{padding:14px 12px 16px!important;max-width:100%!important}
          .db-grid2{grid-template-columns:1fr!important}
          .db-grid3{grid-template-columns:1fr 1fr!important}
          .db-actions{grid-template-columns:1fr!important}
          .db-form-grid{grid-template-columns:1fr!important}
          .db-tools-grid{grid-template-columns:1fr 1fr!important}
          .db-plans-grid{grid-template-columns:1fr!important}
          .db-inp{font-size:16px!important}
          .cat-grid{grid-template-columns:repeat(auto-fill,minmax(90px,1fr))!important;gap:6px!important}
          .guide-scroll{max-width:95vw!important}
          button[title*="Guide"]{bottom:66px!important;right:12px!important;width:38px!important;height:38px!important}
          .card,.tool-card{border-radius:10px!important}
        }
        @media(max-width:420px){
          .db-grid3{grid-template-columns:1fr!important}
          .db-tools-grid{grid-template-columns:1fr 1fr!important}
          .sidebar-label{display:none!important}
          .sidebar-item{min-width:36px!important}
          .db-actions{grid-template-columns:1fr!important}
        }
        @media(max-width:768px) and (orientation:landscape){
          .sidebar{height:48px!important}
          .sidebar-item{height:48px!important}
          .db-layout{margin-bottom:48px!important}
        }`}</style>

      {/* ── SIDEBAR ─────────────────────────────── */}
      <nav className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/" style={{ fontFamily:'Bebas Neue, var(--font-label)',fontSize:16,letterSpacing:4,color:'var(--white)',textDecoration:'none',flexShrink:0 }}>
            A.<span style={{ color:'var(--red)' }}>A</span>
          </Link>
          <span className="sidebar-label" style={{ fontFamily:'Cormorant Garamond,serif',fontSize:14,fontWeight:300,color:'var(--muted2)',letterSpacing:1 }}>Annonza</span>
        </div>

        {/* Items */}
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={'sidebar-item'+(tab===t.id?' active':'')}>
            <span className="sidebar-icon">{t.icon}</span>
            <span className="sidebar-label">{t.label}</span>
          </button>
        ))}

        <div style={{ flex:1 }} />

        {/* Logout */}
        <button onClick={logout} className="sidebar-item" style={{ color:'var(--muted)' }}>
          <span className="sidebar-icon">↪</span>
          <span className="sidebar-label" style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:12,letterSpacing:1.5 }}>Quitter</span>
        </button>
      </nav>

      {/* ── LAYOUT PRINCIPAL ─────────────────────── */}
      <div className="db-layout">

        {/* Topbar */}
        <div className="db-topbar" style={{ justifyContent:'space-between' }}>
          {/* Compteur global */}
          <div className="cpt-group" style={{ display:'flex',alignItems:'center',gap:16 }}>
            {[
              {val:(usage.annonces||0)+(usage.reponses||0),label:'Actions totales',icon:'◈'},
              {val:usage.annonces||0,label:'Annonces',icon:'✍'},
              {val:usage.reponses||0,label:'Réponses',icon:'◎'},
            ].map(s=>(
              <div key={s.label} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ fontSize:11,color:'var(--muted)' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily:'DM Mono,monospace',fontSize:13,color:'var(--cream)',lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:7,letterSpacing:1.5,color:'var(--muted)',textTransform:'uppercase' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Badge abonnement + upgrade */}
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {isSubscribed ? (
              <div style={{ display:'flex',alignItems:'center',gap:0,borderRadius:6,overflow:'hidden',border:'1px solid rgba(201,168,76,.2)' }}>
                <div onClick={()=>setShowSubModal(true)}
                  style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(201,168,76,.07)',padding:'5px 12px',cursor:'pointer' }}>
                  <div style={{ width:5,height:5,borderRadius:'50%',background:'var(--gold2)',animation:'pulse 2s infinite' }} />
                  <span style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:9,letterSpacing:1.5,color:'var(--gold2)' }}>
                    {isPremium?'PREMIUM':PLAN_NAMES[planKey].toUpperCase()}
                  </span>
                </div>
                {!isPremium && (
                  <button onClick={()=>{ const next = planKey==='starter'?'business':'expert'; subscribe(next) }}
                    style={{ background:'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.08))',border:'none',borderLeft:'1px solid rgba(201,168,76,.2)',color:'var(--gold2)',cursor:'pointer',padding:'5px 10px',fontSize:14,lineHeight:1,display:'flex',alignItems:'center' }}
                    title={planKey==='starter'?'Passer à Business':'Passer à Expert'}>
                    ↑
                  </button>
                )}
              </div>
            ) : (
              <button onClick={()=>subscribe('business')} className="btn-gold-db" style={{ fontSize:10,padding:'7px 14px',letterSpacing:1.5 }}>
                S&apos;abonner
              </button>
            )}
          </div>
        </div>

        {/* Contenu */}
        <main className="db-main">

      <NightSky />
      {/* Bouton guide flottant */}
      <button onClick={()=>setGuideOpen(!guideOpen)}
        style={{ position:'fixed',bottom:24,right:24,zIndex:400,width:44,height:44,borderRadius:'50%',background:guideOpen?'linear-gradient(135deg,#a8843c,#c9a84c)':'rgba(8,10,15,.95)',border:'1px solid',borderColor:guideOpen?'transparent':'rgba(201,168,76,.3)',color:guideOpen?'#030303':'var(--gold2)',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(0,0,0,.5)',transition:'all .2s',fontWeight:700 }}
        title="Guide de l\'outil">
        {guideOpen ? '✕' : '?'}
      </button>
      {guideOpen && <GuidePanel tab={tab} onClose={()=>setGuideOpen(false)} />}

      {showSubModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(8,10,15,.9)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(8px)' }}
          onClick={()=>setShowSubModal(false)}>
          <div className="modal-enter" style={{ background:'#080a0f',border:'1px solid rgba(201,168,76,.2)',borderRadius:8,padding:'32px 28px',width:'100%',maxWidth:440,position:'relative',boxShadow:'0 32px 80px rgba(8,10,15,.8)' }}
            onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowSubModal(false)} style={{ position:'absolute',top:16,right:18,background:'rgba(255,255,255,.06)',border:'none',borderRadius:'50%',color:'var(--muted2)',cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>×</button>
            <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--gold3)',marginBottom:10,textTransform:'uppercase' }}>Mon abonnement</div>
            <h3 style={{ fontFamily:'Cormorant Garamond',fontSize:28,fontWeight:400,marginBottom:20 }}>Plan {PLAN_NAMES[planKey]}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18 }}>
              {[
                ['Plan',PLAN_NAMES[planKey]],
                ['Prix',PLAN_PRICES[planKey]+(planKey!=='free'&&planKey!=='premium'?' EUR/sem':'')],
                ['Statut',cancelDone?'Annulation planifiee':'Actif'],
                ['Annonces',limits.annonces===Infinity?'∞':limits.annonces+'/sem'],
                ['Reponses',limits.reponses===Infinity?'∞':limits.reponses+'/sem'],
                ['Renouvellement','7 jours'],
              ].map(([l,v])=>(
                <div key={l} style={{ background:'var(--ink)',padding:'10px 14px' }}>
                  <div style={{ fontSize:9,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            {cancelDone ? (
              <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'12px',fontSize:13,color:'var(--success2)',textAlign:'center' }}>
                Annulation confirmee. Acces maintenu jusqu\'a fin de periode.
              </div>
            ) : (
              <button onClick={cancelSubscription} disabled={cancelLoading}
                style={{ width:'100%',background:'none',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,color:'var(--red2)',cursor:'pointer',fontSize:12,padding:'11px',opacity:cancelLoading?0.6:1 }}>
                {cancelLoading?'Annulation...':'Arreter le prelevement automatique'}
              </button>
            )}
          </div>
        </div>
      )}

      



        {tab==='home' && (
          <div className="db-fade">
            <LaunchBanner />

            {/* Hero salutation */}
            <div style={{ marginBottom:32,paddingBottom:28,borderBottom:'1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',textTransform:'uppercase',marginBottom:10 }}>Tableau de bord</div>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:'clamp(28px,5vw,44px)',fontWeight:300,letterSpacing:-.5,lineHeight:1.1,marginBottom:6 }}>
                Bonjour,{' '}
                <span style={{ fontStyle:'italic',fontWeight:600,background:'linear-gradient(135deg,var(--gold3),var(--gold2),var(--cream))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                  {user.name||user.email.split('@')[0]}
                </span>
              </h1>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:isSubscribed?'var(--gold)':'var(--muted3)',animation:isSubscribed?'pulse 2s infinite':'none' }} />
                <span style={{ fontSize:12,color:'var(--muted2)',letterSpacing:.5 }}>
                  Plan{' '}
                  <span style={{ color:isSubscribed?'var(--gold2)':'var(--muted2)',fontFamily:'DM Mono, monospace',fontSize:11 }}>{PLAN_NAMES[planKey]}</span>
                  {isSubscribed&&planKey!=='premium'&&<span style={{ color:'var(--muted)',marginLeft:6 }}>· {PLAN_PRICES[planKey]} EUR/sem</span>}
                </span>
                {isSubscribed
                  ? <button onClick={()=>setShowSubModal(true)} style={{ marginLeft:4,background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0,textDecoration:'underline',textUnderlineOffset:2 }}>gérer</button>
                  : <button onClick={()=>subscribe('business')} style={{ marginLeft:4,background:'none',border:'none',color:'var(--gold3)',cursor:'pointer',fontSize:10,padding:0,textDecoration:'underline',textUnderlineOffset:2 }}>s'abonner</button>
                }
              </div>
            </div>

            {/* Score vendeur */}
            <ScoreVendeur usage={usage} />

            {/* Actions principales */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',textTransform:'uppercase',marginBottom:14 }}>Actions rapides</div>
              <div className="db-actions" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:28 }}>
                {[
                  {title:'Créer',sub:'une annonce',t:'annonce',icon:'✍',desc:'Générez une annonce complète en 15 secondes'},
                  {title:'Répondre',sub:'à un acheteur',t:'reponse',icon:'◎',desc:'Réponse prête en 5 secondes'},
                  {title:'Estimer',sub:'le prix',t:'estimation',icon:'⚖',desc:'Fourchette de marché instantanée'},
                ].map((a,i)=>(
                  <div key={a.t} onClick={()=>setTab(a.t)}
                    style={{ position:'relative',overflow:'hidden',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,padding:'22px 18px',cursor:'pointer',transition:'all .25s cubic-bezier(.16,1,.3,1)',userSelect:'none' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(201,168,76,.07)';e.currentTarget.style.borderColor='rgba(201,168,76,.25)';e.currentTarget.style.transform='translateY(-3px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.03)';e.currentTarget.style.borderColor='rgba(255,255,255,.08)';e.currentTarget.style.transform='translateY(0)'}}>
                    {/* Gradient déco */}
                    <div style={{ position:'absolute',top:0,right:0,width:80,height:80,background:'radial-gradient(circle at 100% 0%,rgba(201,168,76,.08),transparent 70%)',pointerEvents:'none' }} />
                    {/* Numéro */}
                    <div style={{ fontFamily:'DM Mono,monospace',fontSize:9,color:'rgba(201,168,76,.3)',letterSpacing:2,marginBottom:14 }}>0{i+1}</div>
                    {/* Icône */}
                    <div style={{ fontSize:24,marginBottom:12,lineHeight:1 }}>{a.icon}</div>
                    {/* Titre */}
                    <div style={{ fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:500,color:'var(--cream)',lineHeight:1,marginBottom:4 }}>{a.title}</div>
                    <div style={{ fontFamily:'Cormorant Garamond,serif',fontSize:13,fontStyle:'italic',color:'var(--muted2)',marginBottom:10 }}>{a.sub}</div>
                    {/* Desc */}
                    <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',lineHeight:1.5 }}>{a.desc}</div>
                    {/* Flèche */}
                    <div style={{ position:'absolute',bottom:16,right:16,fontSize:14,color:'rgba(201,168,76,.25)' }}>→</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats utilisation */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',textTransform:'uppercase',marginBottom:14 }}>Utilisation cette semaine</div>
              <div className="db-grid2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28 }}>
                {[
                  {label:'Annonces',val:usage.annonces,limit:limits.annonces,color:'var(--gold)',icon:'✍',packRemaining:credits.annonces.remaining},
                  {label:'Réponses',val:usage.reponses,limit:limits.reponses,color:'var(--red)',icon:'◎',packRemaining:credits.reponses.remaining},
                ].map(s=>{
                  const lim = s.limit===Infinity?999999:s.limit
                  const pct = lim>0?Math.min((s.val/lim)*100,100):0
                  const remaining = s.limit===Infinity?'∞':Math.max(0,s.limit-s.val)
                  return (
                    <div key={s.label} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px',position:'relative',overflow:'hidden' }}>
                      <div style={{ position:'absolute',top:0,right:0,width:80,height:80,background:`radial-gradient(circle at 100% 0%,${s.color}10,transparent 70%)`,pointerEvents:'none' }} />
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                        <span style={{ fontSize:10,letterSpacing:1.5,color:'var(--muted)',textTransform:'uppercase',fontFamily:'var(--font-label)' }}>{s.label}</span>
                        <span style={{ fontSize:16 }}>{s.icon}</span>
                      </div>
                      <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:12 }}>
                        <span style={{ fontFamily:'DM Mono, monospace',fontSize:32,fontWeight:500,color:'var(--cream)',letterSpacing:-1,lineHeight:1 }}>
                          {isSubscribed?s.val:s.packRemaining}
                        </span>
                        {isSubscribed && (
                          <span style={{ fontFamily:'DM Mono',fontSize:13,color:'var(--muted2)' }}>
                            /{s.limit===Infinity?'∞':s.limit}
                          </span>
                        )}
                      </div>
                      <div style={{ background:'rgba(255,255,255,.06)',borderRadius:1,height:2,overflow:'hidden',marginBottom:8 }}>
                        <div className="progress-fill" style={{ width:pct+'%',height:'100%',background:`linear-gradient(90deg,${s.color}80,${s.color})`,borderRadius:1 }} />
                      </div>
                      <div style={{ fontSize:10,color:'var(--muted)',fontFamily:'var(--font-ui)' }}>
                        {isSubscribed
                          ? (s.limit===Infinity?'Illimité':remaining+' restante'+(remaining!==1?'s':""))
                          : (s.packRemaining===0?'Aucun crédit':s.packRemaining+' crédit(s)')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTA abonnement si non abonné */}
            {!isSubscribed && (
              <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,.06) 0%,rgba(201,168,76,.02) 100%)',border:'1px solid rgba(201,168,76,.2)',borderRadius:4,padding:'24px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond',fontSize:20,fontWeight:500,marginBottom:4 }}>Débloquez toutes les fonctionnalités</div>
                  <div style={{ fontSize:12,color:'var(--muted2)' }}>Starter 3,99 € · Business 5,99 € · Expert 12,99 €/semaine</div>
                </div>
                <button onClick={()=>setTab('tarifs')} style={{ background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:2,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px 24px',flexShrink:0,whiteSpace:'nowrap' }}>
                  VOIR LES TARIFS
                </button>
              </div>
            )}
          </div>
        )}

        {tab==='analyser' && <AnalyserTab isSubscribed={isSubscribed} subscribe={subscribe} hasAccess={canAccessFeature(planKey,'analyser')} annonces={annonces} />}
        {tab==='ventes' && <VentesTab isSubscribed={isSubscribed} subscribe={subscribe} hasAccess={canAccessFeature(planKey,'ventes')} annonces={annonces} />}
        {tab==='chatbots' && <ChatBotsTab />}
        {tab==='annonce' && <AnnonceTab isSubscribed={isSubscribed} planKey={planKey} credits={credits} subscribe={subscribe} onUsed={()=>setUsage(u=>({...u,annonces:u.annonces+1}))} />}
        {tab==='reponse' && <ReponseTab isSubscribed={isSubscribed} subscribe={subscribe} onUsed={()=>setUsage(u=>({...u,reponses:u.reponses+1}))} />}
        {tab==='estimation' && <EstimationTab annonces={annonces} />}
        {tab==='outils' && <OutilsTab isSubscribed={isSubscribed} subscribe={subscribe} planKey={planKey} />}
        {tab==='historique' && <HistoriqueTab />}
        {tab==='tarifs' && <TarifsTab isSubscribed={isSubscribed} planKey={planKey} subscribe={subscribe} openSubModal={()=>setShowSubModal(true)} />}
        {tab==='profil' && <ProfilTab user={user} isSubscribed={isSubscribed} isPremium={isPremium} planKey={planKey} subscribe={subscribe} openSubModal={()=>setShowSubModal(true)} usage={usage} credits={credits} purchases={purchases} limits={limits} />}
        </main>
      </div>{/* fin db-layout */}
    </div>
  )
}

function AnnonceTab({ isSubscribed, credits, subscribe, onUsed }) {
  const [categorie, setCategorie] = useState('')
  const [form, setForm] = useState({})
  const [result, setResult] = useState(null)
  const [badResult, setBadResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fields = categorie ? CATEGORIES[categorie] : []
  const filled = Object.values(form).filter(v=>v&&v!=='Non').length
  const pct = Math.round((filled/Math.max(fields.length,1))*100)
  const hasAccess = isSubscribed || credits.annonces.remaining>0

  const generate = async () => {
    if (!categorie) { alert('Choisissez une categorie'); return }
    setLoading(true)
    try {
      const specs = 'Categorie: '+categorie+'\n'+Object.entries(form).filter(([,v])=>v).map(([k,v])=>k+': '+v).join('\n')
      const res = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs,lang:'fr',urgence:form.urgence||'normal',type:categorie,inputData:form})})
      const data = await res.json()
      setResult(data)
      if (data.annonce) setBadResult({ titre:form.marque&&form.modele?form.marque+' '+form.modele+' a vendre':'Article a vendre', description:'Je vends cet article. Il est en bon etat. Prix: '+(form.prix||'?')+' EUR.', score:Math.floor(Math.random()*20)+15 })
      if (!data.error) onUsed()
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (!hasAccess) return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Outil IA</span><h2 className="sec-title">Créer une annonce</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:8 }}>
          {CATEGORY_LIST.slice(0,6).map(c=>(<div key={c} style={{ background:'var(--ink)',padding:'12px',textAlign:'center',fontSize:12,color:'var(--muted2)' }}>{c}</div>))}
        </div>
        <div style={{ background:'var(--ink)',height:100,marginBottom:8 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Outil IA</span><h2 className="sec-title">Créer une annonce</h2></div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:8 }}>
        <div style={S.lbl}>Categorie *</div>
        <div className="cat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8,marginTop:8 }}>
          {CATEGORY_LIST.map((c,i)=>(
            <button key={c} onClick={()=>{setCategorie(c);setForm({})}}
              style={{ background:categorie===c?'rgba(201,168,76,.1)':'rgba(255,255,255,.02)',border:'1px solid',borderColor:categorie===c?'rgba(201,168,76,.3)':'rgba(255,255,255,.07)',borderRadius:10,color:categorie===c?'var(--gold2)':'var(--muted2)',cursor:'pointer',padding:'12px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:5,transition:'all .2s',animationDelay:(i*.03)+'s' }}>
              <span style={{ fontSize:22 }}>{c.split(' ').pop()}</span>
              <span style={{ fontSize:10,letterSpacing:.3,textAlign:'center',lineHeight:1.3 }}>{c.split(' ').slice(0,-1).join(' ')}</span>
            </button>
          ))}
        </div>
      </div>
      {categorie&&(
        <>
          <div style={{ background:'rgba(201,168,76,.04)',border:'1px solid rgba(201,168,76,.1)',borderRadius:3,padding:'10px 18px',marginBottom:8,display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                <span style={{ fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:2,fontFamily:'var(--font-label)' }}>Complétion du formulaire</span>
                <span style={{ fontFamily:'DM Mono, monospace',fontSize:13,color:pct>70?'var(--gold2)':'var(--muted2)',fontWeight:500 }}>{pct}%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)',borderRadius:4,height:4,overflow:'hidden' }}>
                <div className="progress-fill" style={{ width:pct+'%',height:'100%',background:`linear-gradient(90deg,${pct<40?'var(--red)':pct<70?'#e8a843':'var(--gold3)'},${pct<40?'var(--red2)':pct<70?'var(--gold)':'var(--gold2)'}`,borderRadius:4 }} />
              </div>
            </div>
            <div style={{ fontSize:10,color:'var(--muted)',flexShrink:0,fontStyle:'italic' }}>Plus = meilleure annonce</div>
          </div>
          <div className="db-form-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            {fields.map(f=>(
              <div key={f.key} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'16px 20px',gridColumn:f.wide?'1/-1':'auto' }}>
                <label style={S.lbl}>{f.label}</label>
                {f.type==='select'
                  ? <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})}>
                      <option value="">Selectionner</option>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : f.wide
                    ? <textarea style={{ ...S.inp,resize:'vertical',minHeight:52,lineHeight:1.6 }} placeholder={f.ph} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                    : f.type==='urgence'
                      ? <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:4 }}>
                          {[['normal','Normal'],['rapide','Rapide'],['optimise','Max prix']].map(([v,l])=>(
                            <div key={v} onClick={()=>setForm({...form,urgence:v})}
                              style={{ background:form.urgence===v?'rgba(201,168,76,.08)':'var(--s2)',borderBottom:form.urgence===v?'2px solid var(--gold)':'2px solid transparent',padding:'7px',textAlign:'center',fontSize:11,color:form.urgence===v?'var(--gold2)':'var(--muted2)',cursor:'pointer' }}>
                              {l}
                            </div>
                          ))}
                        </div>
                      : <input style={S.inp} type={f.type||'text'} placeholder={f.ph} value={form[f.key]||''} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                }
              </div>
            ))}
          </div>
          <button onClick={generate} disabled={loading} className="btn-gold-db" style={{ width:'100%',opacity:loading?0.6:1,marginBottom:8 }}>
            {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</>:'GENERER MON ANNONCE'}
          </button>
        </>
      )}
      {result&&!result.error&&(
        <div style={{ marginTop:16 }}>
          {badResult&&(
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
              <div style={{ background:'rgba(200,57,43,.06)',padding:'14px 18px',borderTop:'2px solid var(--red)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:10,color:'var(--red2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce faible</span>
                  <span style={{ fontFamily:'DM Mono, monospace',fontSize:20,color:'var(--red2)' }}>{badResult.score}/100</span>
                </div>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:5,color:'var(--muted3)' }}>{badResult.titre}</div>
                <div style={{ fontSize:12,color:'var(--muted)',lineHeight:1.6 }}>{badResult.description}</div>
              </div>
              <div style={{ background:'rgba(45,122,79,.06)',padding:'14px 18px',borderTop:'2px solid var(--success2)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:10,color:'var(--success2)',textTransform:'uppercase',letterSpacing:1 }}>Annonce optimisee</span>
                  <span style={{ fontFamily:'DM Mono, monospace',fontSize:20,color:'var(--success2)' }}>{result.score?.score||85}/100</span>
                </div>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:5 }}>{result.annonce?.titre||'Titre genere'}</div>
                <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.6 }}>{(result.annonce?.description||'').slice(0,100)}...</div>
              </div>
            </div>
          )}
          {result.annonce?.titre&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'2px solid var(--gold)',borderRadius:4,padding:'18px 22px',marginBottom:8 }}>
              <div style={S.lbl}>Titre</div>
              <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:17,fontWeight:600,lineHeight:1.4 }}>{result.annonce.titre}</div>
            </div>
          )}
          {[['Description',result.annonce?.description],['Points forts',result.annonce?.pointsForts],['Transparence',result.annonce?.defauts],['Prix conseille',result.annonce?.prixConseil]].filter(([,v])=>v).map(([label,val])=>(
            <div key={label} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 18px',marginBottom:8 }}>
              <div style={S.lbl}>{label}</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'2px solid var(--red)',borderRadius:4,padding:'18px 22px',marginBottom:8 }}>
              <div style={S.lbl}>Version courte - Facebook / SMS</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.8,fontStyle:'italic',whiteSpace:'pre-wrap' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.raw||'');setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,letterSpacing:1,padding:'12px',marginTop:8,transition:'all .2s' }}>
            {copied?'Copie !':"Copier l'annonce complete"}
          </button>
        </div>
      )}
    </div>
  )
}

function ReponseTab({ isSubscribed, subscribe, onUsed }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [annonces, setAnnonces] = useState([])
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    if (!isSubscribed) return
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d=>setAnnonces(d.annonces||[])).catch(()=>{})
  },[])

  if (!isSubscribed) return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Outil IA</span><h2 className="sec-title">Répondre à un acheteur</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'16px',height:100,marginBottom:8 }} />
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'16px',height:70 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const generate = async () => {
    if (!message) return
    setLoading(true)
    try {
      const ctx = selectedAnnonce ? 'Annonce: '+selectedAnnonce.titre+'\n'+contexte : contexte
      const res = await fetch('/api/ai/reponse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,contexte:ctx,annonceId:selectedAnnonce?.id||null})})
      const data = await res.json()
      if (data.error) setResult({error:data.error,message:data.message||data.error})
      else { setResult(data); onUsed() }
    } catch(e) { setResult({error:'Erreur reseau: '+e.message}) }
    finally { setLoading(false) }
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Outil IA</span><h2 className="sec-title">Répondre à un acheteur</h2></div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 18px',marginBottom:8 }}>
        <label style={S.lbl}>Message recu *</label>
        <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.7 }} placeholder="Collez ici le message de l acheteur..." value={message} onChange={e=>setMessage(e.target.value)} />
      </div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 18px',marginBottom:8 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Lier une annonce (optionnel)</label>
          <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
            {showSearch?'Masquer':'+ Lier'}
          </button>
        </div>
        {showSearch&&annonces.length>0&&(
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:160,overflowY:'auto' }}>
            {annonces.map(a=>(
              <div key={a.id} onClick={()=>{setSelectedAnnonce(a);setShowSearch(false);setContexte('Annonce: '+a.titre)}} className="hover-row"
                style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce&&(
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>v</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setContexte('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:50,resize:'vertical',lineHeight:1.7 }} placeholder="Ou decrivez le contexte..." value={contexte} onChange={e=>setContexte(e.target.value)} />
      </div>
      <button onClick={generate} disabled={loading||!message} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||!message)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Generation...</>:'GENERER LA REPONSE'}
      </button>
      {result?.error&&(
        <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.3)',borderRadius:3,padding:'12px 18px',marginTop:14,fontSize:13,color:'var(--red2)' }}>
          Erreur: {result.message||result.error}
        </div>
      )}
      {result?.reponse&&(
        <div style={{ marginTop:16 }}>
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'18px',marginBottom:8 }}>
            <div style={S.lbl}>Reponse prete a copier</div>
            <div style={{ fontSize:14,color:'var(--cream)',lineHeight:1.85,whiteSpace:'pre-wrap' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'2px solid var(--red)',borderRadius:4,padding:'18px 22px',marginBottom:8 }}>
              <div style={S.lbl}>Conseil de negociation</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.7,fontStyle:'italic' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.reponse.reponsePrete);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,letterSpacing:1,padding:'12px',marginTop:8,transition:'all .2s' }}>
            {copied?'Copie !':'Copier la reponse'}
          </button>
        </div>
      )}
    </div>
  )
}

function EstimationTab({ annonces = [] }) {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs})})
    const data = await res.json()
    if (data.error&&data.upgrade) { alert(data.message); setLoading(false); return }
    setResult(data); setLoading(false)
  }
  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Estimation</span><h2 className="sec-title">Estimer le prix</h2></div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 18px',marginBottom:8 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Decrivez votre article</label>
          {annonces.length>0 && (
            <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
              {showSearch?'Masquer':'+ Lier une annonce'}
            </button>
          )}
        </div>
        {showSearch && annonces.length>0 && (
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:150,overflowY:'auto' }}>
            {annonces.filter(a=>a.type!=='estimation').map(a=>(
              <div key={a.id} onClick={()=>{ setSelectedAnnonce(a); setSpecs(Object.entries(a.inputData||{}).filter(([,v])=>v).map(([k,v])=>k+': '+v).join(', ')); setShowSearch(false) }}
                className="hover-row" style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce && (
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>✦</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setSpecs('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:110,resize:'vertical',lineHeight:1.7 }} placeholder="Ex: iPhone 15 Pro 256Go noir, tres bon etat, batterie 94%, avec boite..." value={specs} onChange={e=>setSpecs(e.target.value)} />
        <div style={{ fontSize:10,color:'var(--muted)',marginTop:5 }}>3 estimations gratuites par jour</div>
      </div>
      <button onClick={estimate} disabled={loading||!specs} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||!specs)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Analyse...</>:'ESTIMER LE PRIX'}
      </button>
      {result&&!result.error&&(
        <div style={{ marginTop:16 }}>
          <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
            {[['Basse',result.low,'var(--red2)'],['Moyenne',result.mid,'var(--gold2)'],['Haute',result.high,'var(--success2)']].map(([label,val,color])=>(
              <div key={label} style={{ background:'var(--ink)',padding:'22px 18px',textAlign:'center' }}>
                <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8 }}>{label}</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:24,fontWeight:600,color,letterSpacing:-1 }}>{Number(val).toLocaleString('fr-FR')} EUR</div>
              </div>
            ))}
          </div>
          {result.note&&(
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'12px 18px',marginTop:1 }}>
              <div style={{ fontSize:12,color:'var(--muted2)',fontStyle:'italic',lineHeight:1.65 }}>{result.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OutilsTab({ isSubscribed, subscribe, planKey }) {
  const [activeTool, setActiveTool] = useState(null)
  const [titreSpecs, setTitreSpecs] = useState('')
  const [titres, setTitres] = useState([])
  const [titreLoading, setTitreLoading] = useState(false)
  const [prixArticle, setPrixArticle] = useState('')
  const [prixDemande, setPrixDemande] = useState('')
  const [prixResult, setPrixResult] = useState(null)
  const [prixLoading, setPrixLoading] = useState(false)
  const [flashSpecs, setFlashSpecs] = useState('')
  const [flashResult, setFlashResult] = useState(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [checklist, setChecklist] = useState({ photos:false, prix:false, description:false, disponible:false, contact:false, ct:false })
  const [annonceText, setAnnonceText] = useState('')
  const [tradLang, setTradLang] = useState('en')
  const [tradResult, setTradResult] = useState('')
  const [tradLoading, setTradLoading] = useState(false)
  // Arnaque
  const [arnaqueMsg, setArnaqueMsg] = useState('')
  const [arnaqueResult, setArnaqueResult] = useState(null)
  const [arnaqueLoading, setArnaqueLoading] = useState(false)
  // Calendrier
  const [calCat, setCalCat] = useState('')
  const [calArticle, setCalArticle] = useState('')
  const [calResult, setCalResult] = useState(null)
  const [calLoading, setCalLoading] = useState(false)
  // Plateformes
  const [platArticle, setPlatArticle] = useState('')
  const [platPrix, setPlatPrix] = useState('')
  const [platResult, setPlatResult] = useState(null)
  const [platLoading, setPlatLoading] = useState(false)
  // Lot
  const [lotObjets, setLotObjets] = useState([{nom:'',prix:'',etat:''},{nom:'',prix:'',etat:''}])
  const [lotPrix, setLotPrix] = useState('')
  const [lotContexte, setLotContexte] = useState('')
  const [lotResult, setLotResult] = useState(null)
  const [lotLoading, setLotLoading] = useState(false)
  const [lotCopied, setLotCopied] = useState(false)

  const tradLangs = { en:'Anglais', es:'Espagnol', de:'Allemand', it:'Italien', nl:'Neerlandais' }

  const checklistItems = [
    { key:'photos', label:'Au moins 5 photos claires en lumiere naturelle' },
    { key:'prix', label:'Prix correspond au marche (utiliser estimateur)' },
    { key:'description', label:'Description repond aux questions des acheteurs' },
    { key:'disponible', label:'Coordonnees et disponibilites sont claires' },
    { key:'contact', label:'Livraison ou remise en main propre precisee' },
    { key:'ct', label:'Documents importants mentionnes (CT, facture...)' },
  ]
  const checkScore = Object.values(checklist).filter(Boolean).length

  const genTitres = async () => {
    if (!titreSpecs) return
    setTitreLoading(true)
    try { const r = await fetch('/api/ai/titres',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:titreSpecs})}); const d = await r.json(); setTitres(d.titres||[]) } catch(e) {}
    setTitreLoading(false)
  }

  const checkPrix = async () => {
    if (!prixArticle||!prixDemande) return
    setPrixLoading(true)
    try {
      const r = await fetch('/api/ai/estimation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:prixArticle})})
      const d = await r.json()
      const prix = parseFloat(prixDemande)
      const diff = d.mid>0?Math.round(((prix-d.mid)/d.mid)*100):0
      setPrixResult({...d,prixDemande:prix,diff})
    } catch(e) {}
    setPrixLoading(false)
  }

  const genFlash = async () => {
    if (!flashSpecs) return
    setFlashLoading(true)
    try { const r = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:flashSpecs,urgence:'rapide',type:'flash',inputData:{}})}); const d = await r.json(); setFlashResult(d) } catch(e) {}
    setFlashLoading(false)
  }

  const checkArnaque = async () => {
    if (!arnaqueMsg) return
    setArnaqueLoading(true)
    try { const r = await fetch('/api/ai/arnaque',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:arnaqueMsg})}); const d = await r.json(); setArnaqueResult(d) } catch(e) {}
    setArnaqueLoading(false)
  }

  const getCalendrier = async () => {
    if (!calCat) return
    setCalLoading(true)
    try { const r = await fetch('/api/ai/calendrier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({categorie:calCat,article:calArticle})}); const d = await r.json(); setCalResult(d) } catch(e) {}
    setCalLoading(false)
  }

  const getPlateformes = async () => {
    if (!platArticle) return
    setPlatLoading(true)
    try { const r = await fetch('/api/ai/plateformes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({article:platArticle,prix:platPrix})}); const d = await r.json(); setPlatResult(d) } catch(e) {}
    setPlatLoading(false)
  }

  const addLotItem = () => setLotObjets(prev => [...prev, {nom:'',prix:'',etat:''}])
  const removeLotItem = (i) => setLotObjets(prev => prev.filter((_,idx)=>idx!==i))
  const updateLotItem = (i, key, val) => setLotObjets(prev => prev.map((o,idx)=>idx===i?{...o,[key]:val}:o))

  const genLot = async () => {
    const objetsValides = lotObjets.filter(o=>o.nom)
    if (objetsValides.length < 2) return
    setLotLoading(true)
    try { const r = await fetch('/api/ai/lot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({objets:objetsValides,prixTotal:lotPrix,contexte:lotContexte})}); const d = await r.json(); setLotResult(d) } catch(e) {}
    setLotLoading(false)
  }

  const genTrad = async () => {
    if (!annonceText) return
    setTradLoading(true)
    try { const r = await fetch('/api/ai/annonce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({specs:'Traduis cette annonce en '+tradLangs[tradLang]+': '+annonceText,lang:tradLang,urgence:'normal',type:'traduction',inputData:{}})}); const d = await r.json(); setTradResult(d.raw||'') } catch(e) {}
    setTradLoading(false)
  }

  const feats = (PLAN_FEATURES[planKey] || PLAN_FEATURES.free)
  const getBadge = (feat, minPlan) => {
    if (!isSubscribed) return minPlan || 'Starter+'
    if (feats[feat]) return 'Actif'
    return minPlan || 'Plan superieur'
  }

  const TOOLS = [
    {id:'titre',icon:'✍',label:'Generateur de titres',desc:'5 titres optimises en un clic pour maximiser les vues',badge:'Starter+',active:true},
    {id:'prix',icon:'📊',label:'Detecteur prix abusif',desc:'Verifiez si votre prix est aligne avec le marche',badge:'Starter+',active:true},
    {id:'calendrier',icon:'📅',label:'Calendrier optimal',desc:'Quel jour et heure publier pour maximiser les vues',badge:'Starter+',active:true},
    {id:'checklist',icon:'✅',label:'Checklist publication',desc:'6 points a verifier avant de publier',badge:'Starter+',active:true},
    {id:'arnaque',icon:'🚨',label:'Detecteur arnaque',desc:'Analysez un message suspect avant de repondre',badge:'Business+',active:feats.arnaque},
    {id:'plateformes',icon:'🔀',label:'Comparateur plateformes',desc:'LeBonCoin vs Vinted vs Facebook vs eBay',badge:'Business+',active:feats.plateformes},
    {id:'flash',icon:'⚡',label:'Mode vente flash',desc:'Annonce ultra-agressive pour vendre en moins de 48h',badge:'Business+',active:feats.flash},
    {id:'traduction',icon:'🌍',label:'Traduction annonce',desc:'Anglais, Espagnol, Allemand, Italien, Neerlandais',badge:'Business+',active:feats.traduction},
    {id:'lot',icon:'📦',label:'Mode lot',desc:'Vendez plusieurs objets ensemble en une seule annonce',badge:'Expert',active:feats.lot},
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Outils</span><h2 className="sec-title">Boîte à outils</h2></div>
      <div className="db-tools-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
        {TOOLS.map(tool=>(
          <div key={tool.id}
            onClick={()=>tool.active||!isSubscribed?setActiveTool(activeTool===tool.id?null:tool.id):null}
            style={{ background:activeTool===tool.id?'var(--s2)':'var(--ink)',padding:'18px',cursor:tool.active||!isSubscribed?'pointer':'not-allowed',transition:'all .2s',borderTop:activeTool===tool.id?'2px solid var(--gold)':'2px solid transparent',opacity:isSubscribed&&!tool.active?0.5:1 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7 }}>
              <span style={{ fontSize:22 }}>{tool.icon}</span>
              <span style={{ fontFamily:'DM Mono, monospace',fontSize:7,letterSpacing:1.5,
                color:tool.badge==='Starter+'?'var(--success2)':tool.badge==='Actif'?'var(--success2)':'var(--gold3)',
                background:tool.badge==='Starter+'||tool.badge==='Actif'?'rgba(45,122,79,.1)':'rgba(201,168,76,.1)',
                border:'1px solid',
                borderColor:tool.badge==='Starter+'||tool.badge==='Actif'?'rgba(45,122,79,.2)':'rgba(201,168,76,.2)',
                borderRadius:2,padding:'2px 6px' }}>{tool.badge}</span>
            </div>
            <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:14,fontWeight:600,marginBottom:3 }}>{tool.label}</div>
            <div style={{ fontSize:11,color:'var(--muted2)',lineHeight:1.5 }}>{tool.desc}</div>
          </div>
        ))}
      </div>

      {activeTool==='titre'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={S.lbl}>Generateur de titres optimises</div>
          <textarea style={{ ...S.inp,minHeight:65,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Decrivez votre article: BMW 320d 2019, 75 000 km, diesel, bon etat..." value={titreSpecs} onChange={e=>setTitreSpecs(e.target.value)} />
          <button onClick={genTitres} disabled={titreLoading||!titreSpecs} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(titreLoading||!titreSpecs)?0.5:1,transition:'opacity .2s' }}>
            {titreLoading?'Generation...':'GENERER 5 TITRES'}
          </button>
          {titres.length>0&&(
            <div style={{ marginTop:10 }}>
              {titres.map((t,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'9px 12px',marginBottom:3,gap:10 }}>
                  <div style={{ fontSize:13,color:'var(--cream)' }}>{t}</div>
                  <button onClick={()=>navigator.clipboard.writeText(t)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px',flexShrink:0 }}>Copier</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTool==='prix'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={S.lbl}>Detecteur de prix abusif</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre article</label>
              <input style={S.inp} placeholder="BMW 320d 2019, 75 000 km..." value={prixArticle} onChange={e=>setPrixArticle(e.target.value)} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre prix (EUR)</label>
              <input style={S.inp} type="number" placeholder="12000" value={prixDemande} onChange={e=>setPrixDemande(e.target.value)} />
            </div>
          </div>
          <button onClick={checkPrix} disabled={prixLoading||!prixArticle||!prixDemande} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(prixLoading||!prixArticle||!prixDemande)?0.5:1,transition:'opacity .2s' }}>
            {prixLoading?'Analyse...':'ANALYSER MON PRIX'}
          </button>
          {prixResult&&(
            <div style={{ marginTop:10,background:prixResult.diff>30?'rgba(200,57,43,.08)':prixResult.diff>15?'rgba(255,165,0,.08)':'rgba(45,122,79,.08)',border:'1px solid',borderColor:prixResult.diff>30?'rgba(200,57,43,.3)':prixResult.diff>15?'rgba(255,165,0,.3)':'rgba(45,122,79,.3)',padding:'14px' }}>
              <div style={{ fontFamily:'DM Mono, monospace',fontSize:26,color:prixResult.diff>30?'var(--red2)':prixResult.diff>15?'var(--warning)':'var(--success2)',letterSpacing:-1,marginBottom:8 }}>
                {prixResult.diff>0?'+':''}{prixResult.diff}% {prixResult.diff>30?'TROP CHER':prixResult.diff>15?'Un peu eleve':'Prix correct'}
              </div>
              <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7 }}>
                Marche: {prixResult.low} - {prixResult.high} EUR (moy. {prixResult.mid} EUR)<br/>
                Votre prix: {prixResult.prixDemande} EUR
                {prixResult.diff>15&&<><br/>Conseil: baisser a {Math.round(prixResult.mid*1.05)} EUR pour vendre plus vite</>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool==='flash'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={{ fontSize:12,color:'var(--gold3)',marginBottom:10,lineHeight:1.6 }}>Annonce urgente avec prix attractif. Pour vendre en moins de 48h.</div>
              <textarea style={{ ...S.inp,minHeight:75,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Decrivez votre article + prix actuel + prix minimum..." value={flashSpecs} onChange={e=>setFlashSpecs(e.target.value)} />
              <button onClick={genFlash} disabled={flashLoading||!flashSpecs} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(flashLoading||!flashSpecs)?0.5:1,transition:'opacity .2s' }}>
                {flashLoading?'Generation...':'GENERER ANNONCE FLASH'}
              </button>
              {flashResult?.annonce&&(
                <div style={{ marginTop:10,background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'3px solid var(--red)',padding:'14px' }}>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:15,fontWeight:600,marginBottom:7 }}>{flashResult.annonce.titre}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.7,whiteSpace:'pre-wrap' }}>{flashResult.annonce.description}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTool==='checklist'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div style={S.lbl}>Checklist avant publication</div>
            <div style={{ fontFamily:'DM Mono, monospace',fontSize:22,color:checkScore===6?'var(--success2)':'var(--gold2)',letterSpacing:-1 }}>{checkScore}/6</div>
          </div>
          <div style={{ background:'var(--s3)',borderRadius:1,height:4,marginBottom:14,overflow:'hidden' }}>
            <div style={{ width:(checkScore/6*100)+'%',height:'100%',background:checkScore===6?'var(--success2)':'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width .4s' }} />
          </div>
          {checklistItems.map(item=>(
            <div key={item.key} onClick={()=>setChecklist(c=>({...c,[item.key]:!c[item.key]}))}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)',cursor:'pointer' }}>
              <div style={{ width:18,height:18,borderRadius:3,border:'1px solid',borderColor:checklist[item.key]?'var(--gold)':'var(--border2)',background:checklist[item.key]?'rgba(201,168,76,.15)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:'var(--gold2)' }}>
                {checklist[item.key]?'v':''}
              </div>
              <div style={{ fontSize:13,color:checklist[item.key]?'var(--muted2)':'var(--cream)',textDecoration:checklist[item.key]?'line-through':'none',lineHeight:1.5 }}>{item.label}</div>
            </div>
          ))}
          {checkScore===6&&(
            <div style={{ marginTop:12,background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'11px',fontSize:13,color:'var(--success2)',textAlign:'center' }}>
              Votre annonce est prete a etre publiee !
            </div>
          )}
        </div>
      )}

      {activeTool==='arnaque'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={S.lbl}>Detecteur d'arnaque acheteur</div>
          <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:10,lineHeight:1.6 }}>Collez un message suspect. L'IA analyse les signaux d'arnaque connus sur LeBonCoin et Vinted.</div>
          <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.6,marginBottom:8 }}
            placeholder="Collez ici le message de l'acheteur suspect..."
            value={arnaqueMsg} onChange={e=>setArnaqueMsg(e.target.value)} />
          <button onClick={checkArnaque} disabled={arnaqueLoading||!arnaqueMsg} className="btn-primary" style={{ width:'100%',fontSize:12,padding:'11px',opacity:(arnaqueLoading||!arnaqueMsg)?0.5:1 }}>
            {arnaqueLoading?'Analyse...':'ANALYSER CE MESSAGE'}
          </button>
          {arnaqueResult&&(
            <div style={{ marginTop:10,background:arnaqueResult.isArnaque?'rgba(200,57,43,.08)':arnaqueResult.isSuspect?'rgba(255,165,0,.08)':'rgba(45,122,79,.08)',border:'1px solid',borderColor:arnaqueResult.isArnaque?'rgba(200,57,43,.3)':arnaqueResult.isSuspect?'rgba(255,165,0,.3)':'rgba(45,122,79,.3)',padding:'16px' }}>
              <div style={{ fontFamily:'DM Mono, monospace',fontSize:20,color:arnaqueResult.isArnaque?'var(--red2)':arnaqueResult.isSuspect?'var(--warning)':'var(--success2)',letterSpacing:.5,marginBottom:8 }}>
                {arnaqueResult.isArnaque?'ARNAQUE PROBABLE':arnaqueResult.isSuspect?'MESSAGE SUSPECT':'SEMBLE LEGITIME'}
              </div>
              <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:8 }}>{arnaqueResult.explication}</div>
              {arnaqueResult.conseils&&<div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:8,marginTop:8 }}>{arnaqueResult.conseils}</div>}
            </div>
          )}
        </div>
      )}

      {activeTool==='calendrier'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={S.lbl}>Calendrier de publication optimal</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Categorie *</label>
              <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={calCat} onChange={e=>setCalCat(e.target.value)}>
                <option value="">Choisir...</option>
                {['Voiture','Telephone','Informatique','Mobilier','Electromenager','Vetements','Jeux video','Sport','Bijoux','Autre'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Article (optionnel)</label>
              <input style={S.inp} placeholder="iPhone 14, BMW 320d..." value={calArticle} onChange={e=>setCalArticle(e.target.value)} />
            </div>
          </div>
          <button onClick={getCalendrier} disabled={calLoading||!calCat} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(calLoading||!calCat)?0.5:1,transition:'opacity .2s' }}>
            {calLoading?'Analyse...':'TROUVER LE MEILLEUR MOMENT'}
          </button>
          {calResult&&!calResult.error&&(
            <div style={{ marginTop:10 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
                <div style={{ background:'var(--ink)',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Meilleur jour</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:20,fontWeight:600,color:'var(--gold2)' }}>{calResult.meilleurJour}</div>
                </div>
                <div style={{ background:'var(--ink)',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Meilleure heure</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:20,fontWeight:600,color:'var(--gold2)' }}>{calResult.meilleureHeure}</div>
                </div>
              </div>
              {calResult.raison&&<div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px',fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:6 }}>{calResult.raison}</div>}
              {calResult.conseilSaison&&<div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'3px solid var(--gold3)',padding:'12px 14px',fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic' }}>{calResult.conseilSaison}</div>}
              {calResult.scoreMoment&&<div style={{ marginTop:8,fontSize:12,color:'var(--muted2)',textAlign:'center' }}>Publier maintenant : <strong style={{ color:'var(--gold2)' }}>{calResult.scoreMoment}</strong></div>}
            </div>
          )}
        </div>
      )}

      {activeTool==='plateformes'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          <div style={S.lbl}>Comparateur de plateformes</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Votre article *</label>
              <input style={S.inp} placeholder="iPhone 14 Pro 256Go noir..." value={platArticle} onChange={e=>setPlatArticle(e.target.value)} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px' }}>
              <label style={S.lbl}>Prix envisage (EUR)</label>
              <input style={S.inp} type="number" placeholder="450" value={platPrix} onChange={e=>setPlatPrix(e.target.value)} />
            </div>
          </div>
          <button onClick={getPlateformes} disabled={platLoading||!platArticle} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(platLoading||!platArticle)?0.5:1,transition:'opacity .2s' }}>
            {platLoading?'Comparaison...':'COMPARER LES PLATEFORMES'}
          </button>
          {platResult&&!platResult.error&&(
            <div style={{ marginTop:10 }}>
              {platResult.recommandation&&(
                <div style={{ background:'rgba(201,168,76,.08)',border:'1px solid var(--gold-border)',padding:'12px 14px',marginBottom:8,fontSize:13,color:'var(--cream)',lineHeight:1.7 }}>
                  <strong style={{ color:'var(--gold2)' }}>Recommandation :</strong> {platResult.recommandation}
                </div>
              )}
              {[
                ['LeBonCoin',platResult.leboncoin],
                ['Vinted',platResult.vinted],
                ['Facebook Marketplace',platResult.facebook],
                ['eBay',platResult.ebay],
              ].filter(([,v])=>v).map(([nom,texte])=>(
                <div key={nom} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px',marginBottom:4 }}>
                  <div style={{ fontFamily:'DM Mono, monospace',fontSize:12,color:'var(--gold3)',letterSpacing:1,marginBottom:6 }}>{nom}</div>
                  <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,whiteSpace:'pre-line' }}>{texte}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTool==='lot'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={S.lbl}>Mode lot - plusieurs objets</div>
              <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:12,lineHeight:1.6 }}>Minimum 2 objets. Le nom est obligatoire, le prix et l'etat sont optionnels.</div>
              {lotObjets.map((o,i)=>(
                <div key={i} style={{ display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:12,marginBottom:4 }}>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <input style={{ ...S.inp,fontSize:13 }} placeholder={'Objet '+(i+1)+' *'} value={o.nom} onChange={e=>updateLotItem(i,'nom',e.target.value)} />
                  </div>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <input style={{ ...S.inp,fontSize:13 }} type="number" placeholder="Prix" value={o.prix} onChange={e=>updateLotItem(i,'prix',e.target.value)} />
                  </div>
                  <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                    <select style={{ ...S.inp,fontSize:11,appearance:'none' }} value={o.etat} onChange={e=>updateLotItem(i,'etat',e.target.value)}>
                      <option value="">Etat</option>
                      <option>Neuf</option><option>Comme neuf</option><option>Bon etat</option><option>Correct</option>
                    </select>
                  </div>
                  <button onClick={()=>removeLotItem(i)} disabled={lotObjets.length<=2}
                    style={{ background:'var(--ink)',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,opacity:lotObjets.length<=2?0.3:1 }}>x</button>
                </div>
              ))}
              <button onClick={addLotItem} style={{ background:'none',border:'1px dashed var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'8px',width:'100%',marginBottom:10 }}>
                + Ajouter un objet
              </button>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
                <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                  <label style={{ ...S.lbl,fontSize:9 }}>Prix lot propose (EUR)</label>
                  <input style={S.inp} type="number" placeholder="Laisser vide = IA suggere" value={lotPrix} onChange={e=>setLotPrix(e.target.value)} />
                </div>
                <div style={{ background:'var(--ink)',padding:'10px 12px' }}>
                  <label style={{ ...S.lbl,fontSize:9 }}>Contexte</label>
                  <select style={{ ...S.inp,appearance:'none',fontSize:13 }} value={lotContexte} onChange={e=>setLotContexte(e.target.value)}>
                    <option value="">Choisir...</option>
                    <option>Demenagement</option><option>Vide grenier</option><option>Lot coherent</option><option>Collection</option>
                  </select>
                </div>
              </div>
              <button onClick={genLot} disabled={lotLoading||lotObjets.filter(o=>o.nom).length<2} className="btn-primary"
                style={{ width:'100%',fontSize:12,padding:'11px',opacity:(lotLoading||lotObjets.filter(o=>o.nom).length<2)?0.5:1 }}>
                {lotLoading?'Generation...':'GENERER ANNONCE LOT'}
              </button>
              {lotResult&&!lotResult.error&&(
                <div style={{ marginTop:10 }}>
                  {lotResult.titre&&<div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'3px solid var(--gold)',padding:'12px 14px',marginBottom:4 }}>
                    <div style={S.lbl}>Titre</div>
                    <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:16,fontWeight:600 }}>{lotResult.titre}</div>
                  </div>}
                  {[['Description',lotResult.description],['Liste complete',lotResult.liste],['Economie acheteur',lotResult.economie],['Prix lot suggere',lotResult.prixLot]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 14px',marginBottom:4 }}>
                      <div style={S.lbl}>{l}</div>
                      <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,whiteSpace:'pre-wrap' }}>{v}</div>
                    </div>
                  ))}
                  <button onClick={()=>{navigator.clipboard.writeText([lotResult.titre,lotResult.description,lotResult.liste,lotResult.prixLot].filter(Boolean).join('\n\n'));setLotCopied(true);setTimeout(()=>setLotCopied(false),2000)}}
                    style={{ width:'100%',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:2,color:lotCopied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,fontWeight:500,padding:'11px',marginTop:4 }}>
                    {lotCopied?'Copie !':"Copier l'annonce lot"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTool==='traduction'&&(
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px',marginBottom:8 }}>
          {!isSubscribed ? <LockOverlay subscribe={subscribe} /> : (
            <>
              <div style={{ display:'flex',gap:7,marginBottom:10,flexWrap:'wrap' }}>
                {Object.entries(tradLangs).map(([code,nom])=>(
                  <button key={code} onClick={()=>setTradLang(code)}
                    style={{ background:tradLang===code?'rgba(201,168,76,.1)':'var(--ink)',border:'1px solid',borderColor:tradLang===code?'var(--gold)':'var(--border)',borderRadius:2,color:tradLang===code?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>
                    {nom}
                  </button>
                ))}
              </div>
              <textarea style={{ ...S.inp,minHeight:90,resize:'vertical',lineHeight:1.6,marginBottom:8 }} placeholder="Collez votre annonce en francais ici..." value={annonceText} onChange={e=>setAnnonceText(e.target.value)} />
              <button onClick={genTrad} disabled={tradLoading||!annonceText} style={{ width:'100%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',border:'none',borderRadius:3,color:'#030303',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:12,letterSpacing:2,padding:'12px',opacity:(tradLoading||!annonceText)?0.5:1,transition:'opacity .2s' }}>
                {tradLoading?'Traduction...':'TRADUIRE EN '+(tradLangs[tradLang]||'').toUpperCase()}
              </button>
              {tradResult&&(
                <div style={{ marginTop:10,background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'3px solid var(--gold)',padding:'14px' }}>
                  <div style={S.lbl}>Annonce traduite - {tradLangs[tradLang]}</div>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.75,whiteSpace:'pre-wrap' }}>{tradResult}</div>
                  <button onClick={()=>navigator.clipboard.writeText(tradResult)} style={{ marginTop:8,background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'5px 12px' }}>Copier</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function HistoriqueTab() {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('annonces')
  const [expanded, setExpanded] = useState(null)

  useEffect(()=>{
    Promise.all([
      fetch('/api/dashboard/annonces').then(r=>r.json()),
      fetch('/api/dashboard/reponses').then(r=>r.json()),
    ]).then(([a,r])=>{ setAnnonces(a.annonces||[]); setReponses(r.reponses||[]); setLoading(false) }).catch(()=>setLoading(false))
  },[])

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Historique</span><h2 className="sec-title">Mes créations</h2></div>
      <div style={{ display:'flex',gap:12,marginBottom:12 }}>
        {[['annonces','Annonces ('+annonces.length+')'],['reponses','Reponses ('+reponses.length+')']].map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)}
            style={{ flex:1,background:section===id?'var(--s1)':'var(--ink)',border:'none',borderBottom:section===id?'2px solid var(--gold)':'2px solid transparent',color:section===id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'DM Sans, sans-serif',fontSize:12,fontWeight:500,padding:'11px' }}>
            {label}
          </button>
        ))}
      </div>
      {loading&&<div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}
      {section==='annonces'&&!loading&&(
        annonces.length===0
          ? <div style={{ textAlign:'center',padding:36,color:'var(--muted2)',fontFamily:'Cormorant Garamond, serif',fontStyle:'italic' }}>Aucune annonce generee</div>
          : annonces.map(a=>(
            <div key={a.id} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,marginBottom:8 }}>
              <div style={{ padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,cursor:'pointer' }}
                onClick={()=>setExpanded(expanded===a.id?null:a.id)}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'Cormorant Garamond',fontSize:15,fontWeight:500,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.titre||'Sans titre'}</div>
                  <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                    <span style={{ fontSize:9,color:'var(--muted)',background:'rgba(255,255,255,.05)',padding:'2px 7px',borderRadius:10,textTransform:'uppercase',letterSpacing:1 }}>{a.type}</span>
                    <span style={{ fontSize:10,color:'var(--muted2)' }}>{new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
                  </div>
                </div>
                <span style={{ fontSize:10,color:'var(--muted)',flexShrink:0,transform:expanded===a.id?'rotate(180deg)':'rotate(0deg)',transition:'transform .2s',display:'inline-block' }}>▾</span>
              </div>
              {expanded===a.id&&(
                <div style={{ borderTop:'1px solid var(--border)',padding:'12px 18px',background:'var(--s1)' }}>
                  {a.description&&<div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.75,marginBottom:8,whiteSpace:'pre-wrap' }}>{a.description}</div>}
                  {a.pointsForts&&<div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,fontStyle:'italic' }}>{a.pointsForts}</div>}
                </div>
              )}
            </div>
          ))
      )}
      {section==='reponses'&&!loading&&(
        reponses.length===0
          ? <div style={{ textAlign:'center',padding:36,color:'var(--muted2)',fontFamily:'Cormorant Garamond, serif',fontStyle:'italic' }}>Aucune reponse generee</div>
          : reponses.map(r=>(
            <div key={r.id} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,marginBottom:8 }}>
              <div style={{ padding:'12px 18px',cursor:'pointer' }} onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:3 }}>Message: {r.messageAcheteur.slice(0,70)}...</div>
                <div style={{ fontSize:11,color:'var(--muted)',display:'flex',justifyContent:'space-between' }}>
                  <span>{new Date(r.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</span>
                  <span style={{ color:'var(--gold3)' }}>{expanded===r.id?'Masquer':'Voir la reponse'}</span>
                </div>
              </div>
              {expanded===r.id&&(
                <div style={{ borderTop:'1px solid var(--border)',padding:'12px 18px',background:'var(--s1)' }}>
                  <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{r.reponsePrete}</div>
                  {r.suggestion&&<div style={{ marginTop:8,fontSize:12,color:'var(--muted2)',fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:8 }}>{r.suggestion}</div>}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  )
}

function TarifsTab({ isSubscribed, planKey, subscribe, openSubModal }) {
  const PLANS = [
    {key:'starter',name:'Starter',price:'3,99',sub:'L essentiel',color:'#9a9590',features:['10 annonces / semaine','30 réponses acheteurs','Estimation de prix','Générateur de titres','Détecteur prix abusif','Checklist + Calendrier']},
    {key:'business',name:'Business',price:'5,99',sub:'Le plus populaire',color:'#c9a84c',features:['30 annonces / semaine','100 réponses acheteurs','Chatbot vendeur (50 msg/j)','Analyser et améliorer','Détecteur arnaque','Comparateur plateformes','Mode flash + Traduction','Suivi des ventes'],recommended:true},
    {key:'expert',name:'Expert',price:'12,99',sub:'Pour les pros',color:'#d4b568',features:['Annonces illimitées','Réponses illimitées','Chatbot (200 msg/jour)','Mode lot multi-objets','Tout Business inclus','Accès prioritaire nouveautés']},
  ]
  const PACKS = [
    {name:'5 annonces',price:'9,99 €',unit:'2,00 € / annonce'},
    {name:'10 annonces',price:'17,99 €',unit:'1,80 € / annonce'},
    {name:'50 réponses',price:'14,99 €',unit:'0,30 € / réponse'},
    {name:'500 réponses',price:'39,99 €',unit:'0,08 € / réponse'},
  ]
  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Nos offres</span><h2 className="sec-title">Tarifs</h2></div>
      <div className="db-plans-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24 }}>
        {PLANS.map((plan,i)=>{
          const isCurrent = planKey===plan.key||(planKey==='pro'&&plan.key==='business')
          return (
            <div key={plan.key} className={isCurrent?'plan-active':''} style={{ background:plan.recommended?'linear-gradient(160deg,rgba(201,168,76,.07),rgba(201,168,76,.02))':'var(--s1)',border:'1px solid',borderColor:isCurrent?'rgba(201,168,76,.4)':plan.recommended?'rgba(201,168,76,.2)':'var(--border)',borderRadius:6,padding:'24px 20px',position:'relative',animationDelay:(i*.08)+'s' }}>
              {plan.recommended&&<div style={{ position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',color:'#030303',fontFamily:'var(--font-label)',fontSize:8,letterSpacing:2.5,padding:'3px 14px',borderRadius:'0 0 6px 6px',whiteSpace:'nowrap' }}>POPULAIRE</div>}
              <div style={{ fontFamily:'var(--font-label)',fontSize:11,letterSpacing:2.5,color:plan.recommended?'var(--gold3)':'var(--muted)',marginBottom:8,textTransform:'uppercase' }}>{plan.name}</div>
              <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:16 }}>
                <span style={{ fontFamily:'DM Mono, monospace',fontSize:30,fontWeight:500,color:plan.recommended?'var(--gold2)':'var(--cream)',letterSpacing:-1 }}>{plan.price}</span>
                <span style={{ fontSize:11,color:'var(--muted2)' }}>€/sem</span>
              </div>
              <div style={{ height:'1px',background:'rgba(255,255,255,.06)',marginBottom:16 }} />
              <div style={{ marginBottom:20,minHeight:140 }}>
                {plan.features.map(f=>(
                  <div key={f} style={{ fontSize:11,color:'var(--muted2)',marginBottom:7,display:'flex',alignItems:'flex-start',gap:7,lineHeight:1.4 }}>
                    <span style={{ color:plan.recommended?'var(--gold3)':'rgba(255,255,255,.2)',marginTop:1,fontSize:9 }}>✦</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {isCurrent&&isSubscribed
                ? <button onClick={openSubModal} style={{ width:'100%',background:'rgba(201,168,76,.08)',border:'1px solid rgba(201,168,76,.2)',borderRadius:4,color:'var(--gold2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2,padding:'11px',textTransform:'uppercase' }}>Plan actif · Gérer</button>
                : <button onClick={()=>subscribe(plan.key)} style={{ width:'100%',background:plan.recommended?'linear-gradient(135deg,var(--gold3),var(--gold2))':'transparent',border:'1px solid',borderColor:plan.recommended?'transparent':'rgba(255,255,255,.1)',borderRadius:4,color:plan.recommended?'#030303':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2,padding:'11px',textTransform:'uppercase',transition:'all .2s' }}>
                    {isSubscribed?'Changer':'Choisir '+plan.name}
                  </button>
              }
            </div>
          )
        })}
      </div>
      <div style={{ textAlign:'center',padding:'10px 0' }}><span style={{ fontSize:11,color:'var(--muted)',letterSpacing:2,textTransform:'uppercase' }}>ou packs a l\'unite</span></div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        {PACKS.map(p=>(
          <div key={p.name} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px' }}>
            <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:15,fontWeight:600,marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:11,color:'var(--muted2)',marginBottom:12 }}>{p.unit} · Paiement unique</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
              <span style={{ fontFamily:'DM Mono, monospace',fontSize:18,color:'var(--muted3)',letterSpacing:-1 }}>{p.price}</span>
              <button className="btn-ghost" style={{ fontSize:11,padding:'6px 14px' }}>Acheter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfilTab({ user, isSubscribed, isPremium, planKey, subscribe, openSubModal, usage, credits, purchases, limits }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false)
  const [toggling2FA, setToggling2FA] = useState(false)
  const [msg2FA, setMsg2FA] = useState('')
  const [section, setSection] = useState('compte')
  const [prefs, setPrefs] = useState({ notifEmail:true, notifAcheteur:true, langue:'fr', afficherScore:true })
  // Email
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState(null)
  // Password
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  const toggle2FA = async () => {
    setToggling2FA(true)
    try {
      const res = await fetch('/api/auth/toggle-2fa', { method:'POST' })
      const data = await res.json()
      if (data.success) { setTwoFAEnabled(data.enabled); setMsg2FA(data.enabled?'Activée':'Désactivée') }
    } catch(e) {}
    setToggling2FA(false)
    setTimeout(()=>setMsg2FA(''), 3000)
  }

  const updateEmail = async () => {
    if (!newEmail || !emailPassword) return
    setEmailLoading(true); setEmailMsg(null)
    try {
      const res = await fetch('/api/auth/update-email', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ newEmail, password: emailPassword })
      })
      const data = await res.json()
      if (data.success) {
        setEmailMsg({ type:'success', text:'Email de confirmation envoyé à ' + newEmail + '. Cliquez sur le lien pour confirmer.' })
        setNewEmail(''); setEmailPassword('')
      } else {
        setEmailMsg({ type:'error', text: data.error || 'Erreur' })
      }
    } catch(e) { setEmailMsg({ type:'error', text:'Erreur réseau' }) }
    setEmailLoading(false)
  }

  const updatePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) return
    if (newPwd !== confirmPwd) { setPwdMsg({ type:'error', text:'Les mots de passe ne correspondent pas' }); return }
    if (newPwd.length < 8) { setPwdMsg({ type:'error', text:'Minimum 8 caractères' }); return }
    setPwdLoading(true); setPwdMsg(null)
    try {
      const res = await fetch('/api/auth/update-password', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
      })
      const data = await res.json()
      if (data.success) {
        setPwdMsg({ type:'success', text:'Mot de passe modifié avec succès.' })
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      } else {
        setPwdMsg({ type:'error', text: data.error || 'Erreur' })
      }
    } catch(e) { setPwdMsg({ type:'error', text:'Erreur réseau' }) }
    setPwdLoading(false)
  }
  const SECTIONS = [
    { id:'compte',      label:'Compte',       icon:'◉' },
    { id:'securite',    label:'Sécurité',     icon:'🔒' },
    { id:'preferences', label:'Préférences',  icon:'◈' },
    { id:'achats',      label:'Achats',       icon:'✦' },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Mon compte</span><h2 className="sec-title">Profil</h2></div>

      {/* Nav sections en pills */}
      <div style={{ display:'flex',gap:6,marginBottom:24,flexWrap:'wrap' }}>
        {SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)}
            style={{ display:'flex',alignItems:'center',gap:6,background:section===s.id?'rgba(201,168,76,.1)':'rgba(255,255,255,.03)',border:'1px solid',borderColor:section===s.id?'rgba(201,168,76,.3)':'rgba(255,255,255,.07)',borderRadius:20,color:section===s.id?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:12,fontWeight:section===s.id?500:400,padding:'8px 16px',transition:'all .2s',whiteSpace:'nowrap' }}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {/* ── COMPTE ── */}
      {section==='compte' && (
        <div className="db-slide">
          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:20 }}>
              <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.05))',border:'1px solid rgba(201,168,76,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:500,color:'var(--gold2)',flexShrink:0 }}>
                {(user.name||user.email)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:500,marginBottom:2 }}>{user.name||'Sans nom'}</div>
                <div style={{ fontSize:12,color:'var(--muted2)',fontFamily:'DM Mono,monospace' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
              {[{val:usage.annonces,label:'Annonces',sub:'cette semaine'},{val:usage.reponses,label:'Réponses',sub:'cette semaine'},{val:limits.annonces===Infinity?'∞':limits.annonces,label:'Limite',sub:'ann./semaine'}].map(s=>(
                <div key={s.label} style={{ background:'rgba(255,255,255,.03)',borderRadius:8,padding:'14px',textAlign:'center' }}>
                  <div style={{ fontFamily:'DM Mono,monospace',fontSize:22,fontWeight:500,color:'var(--cream)',letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{s.val}</div>
                  <div style={{ fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <span className="sec-label">Abonnement</span>
            {isSubscribed ? (
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'var(--gold2)',animation:'pulse 2s infinite' }} />
                    <span style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:14,color:'var(--gold2)',letterSpacing:1 }}>{PLAN_NAMES[planKey].toUpperCase()}</span>
                    {!isPremium&&<span style={{ fontSize:11,color:'var(--muted)' }}>· {PLAN_PRICES[planKey]} €/sem</span>}
                  </div>
                  {!isPremium&&<div style={{ fontSize:11,color:'var(--muted)' }}>Annulable à tout moment</div>}
                </div>
                {!isPremium&&<button onClick={openSubModal} className="btn-ghost-db" style={{ fontSize:11 }}>Gérer</button>}
              </div>
            ) : (
              <div>
                <div style={{ fontSize:13,color:'var(--muted2)',marginBottom:14,lineHeight:1.6 }}>Aucun abonnement actif.</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
                  {[['starter','Starter','3,99'],['business','Business','5,99'],['expert','Expert','12,99']].map(([key,name,price],i)=>(
                    <button key={key} onClick={()=>subscribe(key)}
                      className={i===1?'btn-gold-db':'btn-ghost-db'}
                      style={{ width:'100%',flexDirection:'column',gap:2,padding:'10px 6px',fontSize:10,letterSpacing:1 }}>
                      <span>{name}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',fontSize:13 }}>{price} €</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isSubscribed&&!isPremium&&<ReferralSection />}
        </div>
      )}

      {/* ── SÉCURITÉ ── */}
      {section==='securite' && (
        <div className="db-slide">
          <div className="card" style={{ marginBottom:12 }}>
            <span className="sec-label">Adresse email</span>
            <div style={{ fontSize:12,color:'var(--muted2)',marginBottom:16,lineHeight:1.6 }}>
              Actuel : <span style={{ color:'var(--cream)',fontFamily:'DM Mono,monospace' }}>{user.email}</span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }} className="db-grid2">
              <div><label style={S.lbl}>Nouvel email *</label><input className="db-inp" type="email" placeholder="nouveau@email.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)} /></div>
              <div><label style={S.lbl}>Mot de passe actuel *</label><input className="db-inp" type="password" placeholder="••••••••" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} /></div>
            </div>
            {emailMsg&&<div style={{ background:emailMsg.type==='success'?'rgba(45,122,79,.08)':'rgba(200,57,43,.08)',border:'1px solid',borderColor:emailMsg.type==='success'?'rgba(45,122,79,.25)':'rgba(200,57,43,.25)',borderRadius:6,padding:'10px 14px',fontSize:12,color:emailMsg.type==='success'?'var(--success2)':'var(--red2)',marginBottom:10 }}>{emailMsg.text}</div>}
            <button onClick={updateEmail} disabled={emailLoading||!newEmail||!emailPassword} className="btn-gold-db" style={{ fontSize:11,letterSpacing:1.5,opacity:(emailLoading||!newEmail||!emailPassword)?0.5:1 }}>
              {emailLoading?'Envoi...' : "Changer l'email"}
            </button>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:8,lineHeight:1.6 }}>Un lien de confirmation sera envoyé à la nouvelle adresse.</div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <span className="sec-label">Mot de passe</span>
            <div style={{ display:'grid',gap:8,marginBottom:12 }}>
              {[{l:'Mot de passe actuel',k:'cur',v:currentPwd,s:setCurrentPwd},{l:'Nouveau mot de passe',k:'new',v:newPwd,s:setNewPwd},{l:'Confirmer',k:'conf',v:confirmPwd,s:setConfirmPwd}].map(f=>(
                <div key={f.k}><label style={S.lbl}>{f.l} *</label><input className="db-inp" type="password" placeholder="••••••••" value={f.v} onChange={e=>f.s(e.target.value)} /></div>
              ))}
            </div>
            {newPwd&&confirmPwd&&newPwd!==confirmPwd&&<div style={{ fontSize:11,color:'var(--red2)',marginBottom:8 }}>Les mots de passe ne correspondent pas</div>}
            {pwdMsg&&<div style={{ background:pwdMsg.type==='success'?'rgba(45,122,79,.08)':'rgba(200,57,43,.08)',border:'1px solid',borderColor:pwdMsg.type==='success'?'rgba(45,122,79,.25)':'rgba(200,57,43,.25)',borderRadius:6,padding:'10px 14px',fontSize:12,color:pwdMsg.type==='success'?'var(--success2)':'var(--red2)',marginBottom:10 }}>{pwdMsg.text}</div>}
            <button onClick={updatePassword} disabled={pwdLoading||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd} className="btn-gold-db" style={{ fontSize:11,letterSpacing:1.5,opacity:(pwdLoading||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd)?0.5:1 }}>
              {pwdLoading?'Modification...':'Modifier le mot de passe'}
            </button>
          </div>

          <div className="card">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
              <div style={{ flex:1 }}>
                <span className="sec-label">Double authentification</span>
                <div style={{ fontSize:13,color:'var(--cream)',marginBottom:4 }}>{twoFAEnabled?'🔒 Activée':'🔓 Désactivée'}</div>
                <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.65 }}>{twoFAEnabled?'Code par email + bouton Refuser à chaque connexion.':'Protège votre compte même si votre mot de passe est compromis.'}</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                {msg2FA&&<span style={{ fontSize:11,color:twoFAEnabled?'var(--success2)':'var(--muted2)' }}>{msg2FA}</span>}
                <button onClick={toggle2FA} disabled={toggling2FA} className={twoFAEnabled?'btn-ghost-db':'btn-gold-db'} style={{ fontSize:10,letterSpacing:1.5,opacity:toggling2FA?0.5:1 }}>
                  {toggling2FA?'...':twoFAEnabled?'Désactiver':'Activer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRÉFÉRENCES ── */}
      {section==='preferences' && (
        <div className="db-slide">
          <div className="card" style={{ marginBottom:12 }}>
            <span className="sec-label">Notifications</span>
            {[{key:'notifEmail',label:'Emails de suivi',desc:'Conseils et nouveautés par email'},{key:'notifAcheteur',label:'Alertes chatbot',desc:'Notifié quand votre assistant reçoit une question'}].map(p=>(
              <div key={p.key} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <div><div style={{ fontSize:13,color:'var(--cream)',marginBottom:2 }}>{p.label}</div><div style={{ fontSize:11,color:'var(--muted2)' }}>{p.desc}</div></div>
                <button onClick={()=>setPrefs(prev=>({...prev,[p.key]:!prev[p.key]}))} style={{ width:44,height:24,borderRadius:12,background:prefs[p.key]?'linear-gradient(135deg,#a8843c,#c9a84c)':'rgba(255,255,255,.07)',border:'none',cursor:'pointer',transition:'all .2s',position:'relative',flexShrink:0 }}>
                  <div style={{ width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:3,transition:'left .2s',left:prefs[p.key]?23:3,boxShadow:'0 1px 4px rgba(0,0,0,.3)' }} />
                </button>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom:12 }}>
            <span className="sec-label">Affichage</span>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0' }}>
              <div><div style={{ fontSize:13,color:'var(--cream)',marginBottom:2 }}>Score vendeur</div><div style={{ fontSize:11,color:'var(--muted2)' }}>Barre de progression sur l&apos;accueil</div></div>
              <button onClick={()=>setPrefs(p=>({...p,afficherScore:!p.afficherScore}))} style={{ width:44,height:24,borderRadius:12,background:prefs.afficherScore?'linear-gradient(135deg,#a8843c,#c9a84c)':'rgba(255,255,255,.07)',border:'none',cursor:'pointer',transition:'all .2s',position:'relative',flexShrink:0 }}>
                <div style={{ width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:3,transition:'left .2s',left:prefs.afficherScore?23:3,boxShadow:'0 1px 4px rgba(0,0,0,.3)' }} />
              </button>
            </div>
          </div>
          <div className="card">
            <span className="sec-label">Langue</span>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:6 }}>
              {[['fr','🇫🇷 Français'],['en','🇬🇧 English'],['es','🇪🇸 Español']].map(([code,label])=>(
                <button key={code} onClick={()=>setPrefs(p=>({...p,langue:code}))} style={{ background:prefs.langue===code?'rgba(201,168,76,.1)':'rgba(255,255,255,.03)',border:'1px solid',borderColor:prefs.langue===code?'rgba(201,168,76,.3)':'rgba(255,255,255,.07)',borderRadius:8,color:prefs.langue===code?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:12,padding:'10px 6px',transition:'all .2s' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:10,fontStyle:'italic' }}>Traduction en cours de développement.</div>
          </div>
        </div>
      )}

      {/* ── ACHATS ── */}
      {section==='achats' && (
        <div className="db-slide">
          {(!purchases||purchases.length===0) ? (
            <div className="card" style={{ textAlign:'center',padding:'48px 24px' }}>
              <div style={{ fontSize:32,marginBottom:12,opacity:.4 }}>🧾</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif',fontSize:18,fontStyle:'italic',marginBottom:6 }}>Aucun achat pour le moment</div>
              <div style={{ fontSize:12,color:'var(--muted)' }}>Vos achats de packs et abonnements apparaîtront ici.</div>
            </div>
          ) : (
            <div className="card">
              <span className="sec-label">Historique des achats</span>
              {purchases.map((p,i)=>(
                <div key={p.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:i<purchases.length-1?'1px solid rgba(255,255,255,.05)':'none',gap:10 }}>
                  <div>
                    <div style={{ fontSize:13,color:'var(--cream)',marginBottom:2 }}>{p.packName}</div>
                    <div style={{ fontSize:11,color:'var(--muted2)',fontFamily:'DM Mono,monospace' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontFamily:'DM Mono,monospace',fontSize:15,color:'var(--gold2)',letterSpacing:.5 }}>{p.amount} €</div>
                    <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>{p.quantity} {p.packType}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ─── ANALYSER TAB (Idée D) ────────────────────────────────
function AnalyserTab({ isSubscribed, subscribe, hasAccess, annonces = [] }) {
  const [annonce, setAnnonce] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedAnnonce, setSelectedAnnonce] = useState(null)

  if (!isSubscribed || !hasAccess) return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Analyse</span><h2 className="sec-title">Analyser et améliorer</h2></div>
      {isSubscribed && !hasAccess && <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'14px 18px',marginBottom:12,fontSize:13,color:'var(--muted2)' }}>Cette fonctionnalite necessite le plan Business ou superieur.</div>}
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:20,height:120,marginBottom:8 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const analyse = async () => {
    if (!annonce || annonce.length < 20) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyser', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ annonce })
      })
      const data = await res.json()
      setResult(data)
    } catch(e) {}
    setLoading(false)
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:16 }}>
        <div className="label" style={{ marginBottom:6 }}>Outil IA</div>
        <h2 style={{ fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,letterSpacing:-.5 }}>Analyser et ameliorer</h2>
        <p style={{ fontSize:13,color:'var(--muted2)',marginTop:6,lineHeight:1.6 }}>Collez votre annonce existante. L'IA la note, identifie les problemes et la reecrit en mieux.</p>
      </div>

      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'14px 18px',marginBottom:8 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
          <label style={{ ...S.lbl,marginBottom:0 }}>Votre annonce actuelle *</label>
          {annonces.length>0 && (
            <button onClick={()=>setShowSearch(!showSearch)} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:10,padding:'3px 8px' }}>
              {showSearch?'Masquer':'+ Importer une annonce'}
            </button>
          )}
        </div>
        {showSearch && (
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:3,marginBottom:8,maxHeight:150,overflowY:'auto' }}>
            {annonces.filter(a=>a.type!=='estimation').map(a=>(
              <div key={a.id} onClick={()=>{ setSelectedAnnonce(a); const txt = [a.titre, a.description, a.pointsForts, a.defauts].filter(Boolean).join('\n\n'); setAnnonce(txt); setShowSearch(false) }}
                className="hover-row" style={{ padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:selectedAnnonce?.id===a.id?'rgba(201,168,76,.06)':'transparent' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)' }}>{a.titre||'Sans titre'}</div>
                <div style={{ fontSize:10,color:'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        )}
        {selectedAnnonce && (
          <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'5px 10px',marginBottom:7,fontSize:11 }}>
            <span style={{ color:'var(--gold2)' }}>✦</span>
            <span style={{ color:'var(--cream)',flex:1 }}>{selectedAnnonce.titre}</span>
            <button onClick={()=>{setSelectedAnnonce(null);setAnnonce('')}} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14 }}>x</button>
          </div>
        )}
        <textarea style={{ ...S.inp,minHeight:160,resize:'vertical',lineHeight:1.7 }}
          placeholder="Collez ici votre annonce LeBonCoin, Vinted ou Facebook Marketplace..."
          value={annonce} onChange={e=>setAnnonce(e.target.value)} />
        <div style={{ fontSize:10,color:'var(--muted)',marginTop:5 }}>{annonce.length} caracteres</div>
      </div>

      <button onClick={analyse} disabled={loading||annonce.length<20} className="btn-primary"
        style={{ width:'100%',fontSize:13,padding:'15px',opacity:(loading||annonce.length<20)?0.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
        {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Analyse...</>:'ANALYSER MON ANNONCE'}
      </button>

      {result && (
        <div style={{ marginTop:16 }}>
          {/* Comparaison scores */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            <div style={{ background:'rgba(200,57,43,.06)',padding:'20px',textAlign:'center',borderTop:'2px solid var(--red)' }}>
              <div style={{ fontSize:10,color:'var(--red2)',textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>Annonce originale</div>
              <div style={{ fontFamily:'DM Mono, monospace',fontSize:42,color:'var(--red2)',letterSpacing:-2,lineHeight:1 }}>{result.scoreOriginal}</div>
              <div style={{ fontSize:11,color:'var(--muted2)',marginTop:4 }}>sur 100</div>
            </div>
            <div style={{ background:'rgba(45,122,79,.06)',padding:'20px',textAlign:'center',borderTop:'2px solid var(--success2)' }}>
              <div style={{ fontSize:10,color:'var(--success2)',textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>Apres optimisation</div>
              <div style={{ fontFamily:'DM Mono, monospace',fontSize:42,color:'var(--success2)',letterSpacing:-2,lineHeight:1 }}>{result.scoreAmeliore}</div>
              <div style={{ fontSize:11,color:'var(--muted2)',marginTop:4 }}>sur 100 (+{result.scoreAmeliore-result.scoreOriginal} pts)</div>
            </div>
          </div>

          {result.problemes && (
            <div style={{ background:'rgba(200,57,43,.06)',border:'1px solid rgba(200,57,43,.2)',padding:'14px 18px',marginBottom:8 }}>
              <div style={S.lbl}>Problemes detectes</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{result.problemes}</div>
            </div>
          )}

          {result.annonceAmelioree && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'16px 18px',marginBottom:8 }}>
              <div style={S.lbl}>Annonce optimisee</div>
              <div style={{ fontSize:13,color:'var(--cream)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{result.annonceAmelioree}</div>
            </div>
          )}

          {result.conseils && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,borderLeft:'2px solid var(--gold3)',borderRadius:4,padding:'18px 22px',marginBottom:8 }}>
              <div style={S.lbl}>Conseils specifiques</div>
              <div style={{ fontSize:13,color:'var(--muted3)',lineHeight:1.8,fontStyle:'italic',whiteSpace:'pre-wrap' }}>{result.conseils}</div>
            </div>
          )}

          <button className="copy-btn"
            onClick={()=>{navigator.clipboard.writeText(result.annonceAmelioree||'');setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{ width:'100%',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,letterSpacing:1,padding:'12px',marginTop:8,transition:'all .2s' }}>
            {copied?'Copie !':"Copier l'annonce optimisee"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── VENTES TAB (Idée E) ──────────────────────────────────
function VentesTab({ isSubscribed, subscribe, hasAccess, annonces = [] }) {
  const [objets, setObjets] = useState([])
  const [stats, setStats] = useState({ vendu:0, totalGagne:0, enCours:0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre:'', prix:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [prixFinal, setPrixFinal] = useState('')

  const load = () => {
    fetch('/api/dashboard/ventes').then(r=>r.json()).then(d=>{
      setObjets(d.objets||[])
      setStats(d.stats||{ vendu:0,totalGagne:0,enCours:0 })
      setLoading(false)
    }).catch(()=>setLoading(false))
  }

  useEffect(()=>{ if(isSubscribed) { load() } else { setLoading(false) } },[isSubscribed])

  if (!isSubscribed) return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}><span className="sec-label">Suivi</span><h2 className="sec-title">Mes ventes</h2></div>
      <div style={{ filter:'blur(2px) grayscale(70%)',opacity:.35,pointerEvents:'none',userSelect:'none' }}>
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:20,height:100,marginBottom:8 }} />
      </div>
      <LockOverlay subscribe={subscribe} />
    </div>
  )

  const addObjet = async () => {
    if (!form.titre||!form.prix) return
    setSaving(true)
    await fetch('/api/dashboard/ventes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    setForm({titre:'',prix:'',notes:''})
    setShowForm(false)
    setSaving(false)
    load()
  }

  const markVendu = async (id) => {
    if (!prixFinal) return
    await fetch('/api/dashboard/ventes',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,statut:'vendu',prixFinal})})
    setEditId(null)
    setPrixFinal('')
    load()
  }

  const deleteObjet = async (id) => {
    if (!confirm('Supprimer cet objet ?')) return
    await fetch('/api/dashboard/ventes?id='+id,{method:'DELETE'})
    load()
  }

  const STATUT_COLORS = { actif:'var(--gold2)', vendu:'var(--success2)', archive:'var(--muted)' }

  return (
    <div className="db-fade">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
        <div>
          <div className="label" style={{ marginBottom:6 }}>Suivi</div>
          <h2 className="sec-title">Mes ventes</h2>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-gold" style={{ fontSize:11,padding:'10px 18px',letterSpacing:1.5,color:'#030303' }}>
          + AJOUTER UN OBJET
        </button>
      </div>

      {/* Stats */}
      <div className="db-grid3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16 }}>
        {[
          {label:'En cours',val:stats.enCours,color:'var(--gold2)'},
          {label:'Vendus',val:stats.vendu,color:'var(--success2)'},
          {label:'Total gagne',val:stats.totalGagne.toLocaleString('fr-FR')+' EUR',color:'var(--gold2)'},
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px',textAlign:'center' }}>
            <div style={{ fontFamily:'DM Mono, monospace',fontSize:26,color:s.color,letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'18px',marginBottom:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:8 }}>
            <div style={{ background:'var(--ink)',padding:'12px 16px' }}>
              <label style={S.lbl}>Nom de l'objet *</label>
              <input style={S.inp} placeholder="iPhone 14 Pro, BMW 320d..." value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} />
            </div>
            <div style={{ background:'var(--ink)',padding:'12px 16px' }}>
              <label style={S.lbl}>Prix demande (EUR) *</label>
              <input style={S.inp} type="number" placeholder="450" value={form.prix} onChange={e=>setForm({...form,prix:e.target.value})} />
            </div>
          </div>
          {annonces.length>0 && (
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 16px',marginBottom:8 }}>
              <label style={S.lbl}>Lier a une annonce (optionnel)</label>
              <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={form.annonceId||''} onChange={e=>setForm({...form,annonceId:e.target.value})}>
                <option value="">Aucune</option>
                {annonces.filter(a=>a.type!=='estimation').map(a=>(
                  <option key={a.id} value={a.id}>{a.titre||'Sans titre'}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 16px',marginBottom:8 }}>
            <label style={S.lbl}>Notes (optionnel)</label>
            <input style={S.inp} placeholder="Mis en vente le 15 mai, 3 contacts..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          </div>
          <div style={{ display:'flex',gap:8,marginTop:1 }}>
            <button onClick={addObjet} disabled={saving||!form.titre||!form.prix} className="btn-primary" style={{ flex:2,fontSize:12,padding:'12px',opacity:(saving||!form.titre||!form.prix)?0.5:1 }}>
              {saving?'Ajout...':'AJOUTER'}
            </button>
            <button onClick={()=>setShowForm(false)} className="btn-ghost" style={{ flex:1,fontSize:12 }}>Annuler</button>
          </div>
        </div>
      )}

      {loading && <div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}

      {!loading && objets.length === 0 && (
        <div style={{ textAlign:'center',padding:40,fontFamily:'Cormorant Garamond, serif',fontStyle:'italic',color:'var(--muted2)' }}>
          Aucun objet suivi. Ajoutez vos articles en cours de vente.
        </div>
      )}

      {objets.map(o => (
        <div key={o.id} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,marginBottom:8 }}>
          <div style={{ padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:15,fontWeight:600,marginBottom:3 }}>{o.titre}</div>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'DM Mono, monospace',fontSize:12,letterSpacing:.5,
                    color:o.statut==='vendu'?'var(--success2)':o.statut==='actif'?'var(--gold2)':'var(--muted)',
                    background:o.statut==='vendu'?'rgba(45,122,79,.1)':o.statut==='actif'?'rgba(201,168,76,.1)':'var(--s2)',
                    border:'1px solid',borderColor:o.statut==='vendu'?'rgba(45,122,79,.3)':o.statut==='actif'?'var(--gold-border)':'var(--border)',
                    borderRadius:2,padding:'2px 8px' }}>
                    {o.statut==='vendu'?'Vendu':o.statut==='actif'?'En cours':'Archive'}
                  </span>
                  <span style={{ fontSize:12,color:'var(--cream)',fontWeight:600 }}>
                    {o.statut==='vendu'
                      ? o.prixFinal+' EUR'+(o.prixFinal!==o.prix?o.prixFinal>o.prix?' (+'+Math.round(o.prixFinal-o.prix)+' EUR)':' (-'+Math.round(o.prix-o.prixFinal)+' EUR)':'')
                      : o.prix+' EUR demandes'}
                  </span>
                </div>
                <span style={{ fontSize:10,color:'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
              </div>
              {o.notes && <div style={{ fontSize:11,color:'var(--muted2)',marginTop:3,fontStyle:'italic' }}>{o.notes}</div>}
            </div>
            <div style={{ display:'flex',gap:6,flexShrink:0 }}>
              {o.statut === 'actif' && (
                editId === o.id ? (
                  <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                    <input style={{ ...S.inp,width:90,fontSize:13 }} type="number" placeholder="Prix final" value={prixFinal} onChange={e=>setPrixFinal(e.target.value)} />
                    <button onClick={()=>markVendu(o.id)} className="btn-gold" style={{ fontSize:10,padding:'6px 12px',color:'#030303' }}>OK</button>
                    <button onClick={()=>setEditId(null)} className="btn-ghost" style={{ fontSize:10,padding:'6px 10px' }}>x</button>
                  </div>
                ) : (
                  <button onClick={()=>setEditId(o.id)} className="btn-ghost" style={{ fontSize:10,padding:'6px 12px',color:'var(--success2)',borderColor:'rgba(45,122,79,.3)' }}>
                    Marquer vendu
                  </button>
                )
              )}
              <button onClick={()=>deleteObjet(o.id)} style={{ background:'none',border:'1px solid rgba(200,57,43,.2)',borderRadius:2,color:'var(--red2)',cursor:'pointer',fontSize:10,padding:'5px 10px' }}>
                Sup.
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CHATBOTS TAB (Idée Q) ────────────────────────────────
function ChatBotsTab() {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [annonces, setAnnonces] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedAnnonceId, setSelectedAnnonceId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  useEffect(()=>{
    fetch('/api/chat/list').then(r=>r.json()).then(d=>{
      setBots(d.bots||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
    fetch('/api/dashboard/annonces').then(r=>r.json()).then(d=>{
      setAnnonces((d.annonces||[]).filter(a=>a.type!=='estimation'))
    }).catch(()=>{})
  },[])

  const createBot = async () => {
    if (!selectedAnnonceId) return
    setCreating(true)
    try {
      const res = await fetch('/api/chat/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ annonceId: selectedAnnonceId })
      })
      const data = await res.json()
      if (data.chatBot) {
        setBots(prev => [data.chatBot, ...prev.filter(b=>b.id!==data.chatBot.id)])
        setShowCreate(false)
        setSelectedAnnonceId('')
        setCreateMsg('Assistant cree avec succes !')
        setTimeout(()=>setCreateMsg(''), 3000)
      }
    } catch(e) {}
    setCreating(false)
  }

  const copyLink = (code) => {
    const text = 'Des questions sur cet article ? Mon assistant repond instantanement : annonza.business/chat/' + code
    navigator.clipboard.writeText(text)
    setCopied(code)
    setTimeout(()=>setCopied(null), 2000)
  }

  const toggleBot = async (id, actif) => {
    try {
      await fetch('/api/chat/toggle', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      })
      setBots(prev => prev.map(b => b.id===id ? {...b, actif:!actif} : b))
    } catch(e) {}
  }

  const copyUrl = (code) => {
    navigator.clipboard.writeText('https://annonza.business/chat/'+code)
    setCopied(code+'url')
    setTimeout(()=>setCopied(null), 2000)
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--muted2)',textTransform:'uppercase',marginBottom:8 }}>Assistants IA</div>
        <h2 className="sec-title">Mes chatbots</h2>
        <p style={{ fontSize:13,color:'var(--muted2)',marginTop:6,lineHeight:1.65 }}>
          Chaque annonce generee cree automatiquement un assistant IA. Copiez le texte et collez-le dans vos annonces LeBonCoin.
        </p>
      </div>

      {/* Bouton créer + formulaire */}
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:12 }}>
        <button onClick={()=>setShowCreate(!showCreate)} className="btn-gold" style={{ fontSize:11,padding:'10px 18px',letterSpacing:1.5,color:'#030303' }}>
          + CREER UN ASSISTANT
        </button>
      </div>

      {createMsg && (
        <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'10px 14px',marginBottom:12,fontSize:13,color:'var(--success2)' }}>
          {createMsg}
        </div>
      )}

      {showCreate && (
        <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',padding:'18px',marginBottom:16,borderTop:'2px solid var(--gold)' }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:16,fontWeight:600,marginBottom:14 }}>Creer un assistant pour une annonce</div>
          {annonces.length === 0 ? (
            <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.65 }}>
              Vous n'avez pas encore d'annonce. Generez une annonce dans l"onglet Annonce pour creer un assistant.
            </div>
          ) : (
            <>
              <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'12px 16px',marginBottom:8 }}>
                <label style={S.lbl}>Choisir une annonce *</label>
                <select style={{ ...S.inp,appearance:'none',cursor:'pointer' }} value={selectedAnnonceId} onChange={e=>setSelectedAnnonceId(e.target.value)}>
                  <option value="">Selectionner une annonce...</option>
                  {annonces.map(a=>(
                    <option key={a.id} value={a.id}>{a.titre||'Sans titre'} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</option>
                  ))}
                </select>
              </div>
              {selectedAnnonceId && (
                <div style={{ background:'rgba(201,168,76,.06)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'10px 14px',marginBottom:10,fontSize:12,color:'var(--muted2)',lineHeight:1.65 }}>
                  Un assistant IA sera cree pour cette annonce. Il pourra repondre aux questions des acheteurs 24h/24 avec toutes les infos de votre annonce.
                </div>
              )}
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={createBot} disabled={creating||!selectedAnnonceId} className="btn-primary" style={{ flex:2,fontSize:12,padding:'12px',opacity:(creating||!selectedAnnonceId)?0.5:1 }}>
                  {creating ? 'Creation...' : 'CREER L ASSISTANT'}
                </button>
                <button onClick={()=>{setShowCreate(false);setSelectedAnnonceId('')}} className="btn-ghost" style={{ flex:1,fontSize:12 }}>Annuler</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Explication */}
      <div style={{ background:'var(--s1)',border:'1px solid var(--gold-border)',borderLeft:'2px solid var(--gold)',borderRadius:4,padding:'18px 22px',marginBottom:86 }}>
        <div style={{ fontSize:12,color:'var(--cream)',lineHeight:1.7,marginBottom:8,fontWeight:600 }}>Comment ca marche ?</div>
        <div style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7 }}>
          1. Generez une annonce dans l'onglet Annonce<br/>
          2. Un assistant est cree automatiquement<br/>
          3. Copiez le texte ci-dessous et ajoutez-le a la fin de votre annonce LeBonCoin<br/>
          4. Les acheteurs tapent l'adresse dans leur navigateur et posent leurs questions directement<br/>
          5. L'IA repond 24h/24 avec toutes les infos de votre annonce
        </div>
      </div>

      {loading && <div style={{ fontSize:13,color:'var(--muted2)',padding:20,textAlign:'center' }}>Chargement...</div>}

      {!loading && bots.length === 0 && (
        <div style={{ textAlign:'center',padding:40,fontFamily:'Cormorant Garamond, serif',fontStyle:'italic',color:'var(--muted2)' }}>
          Aucun assistant cree. Generez une annonce pour en creer un automatiquement.
        </div>
      )}

      {bots.map(bot => (
        <div key={bot.id} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,marginBottom:8 }}>
          <div style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8 }}>
              <div>
                <div style={{ fontFamily:'Cormorant Garamond, serif',fontSize:14,fontWeight:600,marginBottom:2 }}>{bot.titre}</div>
                <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                  <span style={{ fontFamily:'monospace',fontSize:10,color:'var(--muted2)',background:'var(--s3)',padding:'2px 8px' }}>{bot.code}</span>
                  <span style={{ fontSize:10,color:'var(--muted)' }}>{bot.nbQuestions} questions posees</span>
                  <span style={{ fontSize:10,color:bot.actif?'var(--success2)':'var(--muted)' }}>{bot.actif?'Actif':'Inactif'}</span>
                </div>
              </div>
            </div>

            {/* Texte a copier pour LeBonCoin */}
            <div style={{ background:'var(--s2)',border:'1px solid var(--border)',padding:'10px 14px',fontSize:12,color:'var(--cream)',lineHeight:1.6,marginBottom:10,borderRadius:3 }}>
              Des questions sur cet article ? Mon assistant repond instantanement : annonza.business/chat/{bot.code}
            </div>

            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <button onClick={()=>copyLink(bot.code)}
                style={{ background:copied===bot.code?'rgba(201,168,76,.1)':'var(--s1)',border:'1px solid',borderColor:copied===bot.code?'var(--gold-border)':'var(--border2)',borderRadius:2,color:copied===bot.code?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',flex:1,transition:'all .15s' }}>
                {copied===bot.code?'Copie ! (texte LeBonCoin)':'Copier pour LeBonCoin'}
              </button>
              <button onClick={()=>copyUrl(bot.code)}
                style={{ background:'var(--s1)',border:'1px solid var(--border2)',borderRadius:2,color:copied===bot.code+'url'?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',transition:'all .15s' }}>
                {copied===bot.code+'url'?'Copie !':'Copier le lien seul'}
              </button>
              <a href={'/chat/'+bot.code} target="_blank" rel="noreferrer"
                style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted2)',cursor:'pointer',fontSize:11,padding:'7px 14px',textDecoration:'none',display:'inline-flex',alignItems:'center' }}>
                Tester
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


// ─── CIEL ÉTOILÉ ──────────────────────────────────────────
function NightSky() {
  const stars = Array.from({length:60}, (_,i) => ({
    id:i,
    size: Math.random()*2+1,
    x: Math.random()*100,
    y: Math.random()*100,
    dur: Math.random()*3+2,
    delay: Math.random()*4,
    opacity: Math.random()*.6+.2,
  }))
  const shootingStars = Array.from({length:3}, (_,i) => ({
    id:i,
    x: Math.random()*60+10,
    y: Math.random()*30+5,
    delay: i*7+Math.random()*5,
  }))

  return (
    <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
      {/* Étoiles fixes */}
      {stars.map(s=>(
        <div key={s.id} className="star" style={{
          width:s.size+'px',height:s.size+'px',
          left:s.x+'%',top:s.y+'%',
          background:`rgba(${180+Math.random()*60},${190+Math.random()*50},255,${s.opacity})`,
          '--dur': s.dur+'s',
          '--delay': s.delay+'s',
        }} />
      ))}
      {/* Lune */}
      <div style={{
        position:'fixed',top:'8%',right:'12%',
        fontSize:36,
        animation:'moonGlow 4s ease-in-out infinite',
        filter:'drop-shadow(0 0 10px rgba(180,200,255,.5))',
        pointerEvents:'none',
        zIndex:0,
        transform:'rotate(180deg)',
      }}>🌙</div>
      {/* Nébuleuses bleu nuit */}
      <div style={{
        position:'fixed',top:'-15%',right:'-5%',
        width:'55vw',height:'55vw',
        background:'radial-gradient(circle,rgba(40,80,160,.18) 0%,rgba(20,50,120,.08) 40%,transparent 70%)',
        pointerEvents:'none',zIndex:0,
        borderRadius:'50%',
        animation:'nebulaPulse 12s ease-in-out infinite',
      }} />
      <div style={{
        position:'fixed',bottom:'-15%',left:'-5%',
        width:'45vw',height:'45vw',
        background:'radial-gradient(circle,rgba(30,60,140,.14) 0%,rgba(15,35,90,.06) 40%,transparent 70%)',
        pointerEvents:'none',zIndex:0,
        borderRadius:'50%',
        animation:'nebulaPulse 16s ease-in-out infinite reverse',
      }} />
      <div style={{
        position:'fixed',top:'40%',left:'30%',
        width:'30vw',height:'30vw',
        background:'radial-gradient(circle,rgba(20,50,120,.06) 0%,transparent 70%)',
        pointerEvents:'none',zIndex:0,
        borderRadius:'50%',
        animation:'nebulaPulse 20s ease-in-out infinite',
      }} />
    </div>
  )
}


// ─── GUIDE PANEL ──────────────────────────────────────────
const GUIDES = {
  home: { titre:'Tableau de bord', sections:[
    ['Score vendeur', "Votre score augmente à chaque annonce (+10 pts) et réponse (+5 pts). Niveaux : Débutant → Vendeur → Pro → Expert."],
    ['Crédits annonces', "Remis à zéro chaque semaine. Starter = 10/sem, Business = 30/sem, Expert = illimité. Packs disponibles dans Tarifs."],
    ['Crédits réponses', "Chaque réponse IA consomme 1 crédit. Rechargement chaque lundi. Packs de réponses disponibles à l\'unité."],
  ]},
  annonce: { titre:'Créer une annonce', sections:[
    ['Comment ça marche', "Choisissez une catégorie, remplissez le formulaire, cliquez Générer. L\'IA rédige une annonce complète en 15 secondes."],
    ['Barre de complétion', "Plus vous remplissez de champs, meilleure sera l\'annonce. Visez 70% minimum pour 3x plus de contacts."],
    ['Score de qualité', "Après génération, l\'IA note votre annonce sur 100. Un score > 80 est excellent."],
    ['Texte prêt à copier', "Le texte est directement prêt à coller sur LeBonCoin. Un chatbot est créé automatiquement."],
  ]},
  reponse: { titre:'Répondre à un acheteur', sections:[
    ['Comment ça marche', "Copiez le message de l\'acheteur. Sélectionnez votre annonce si disponible. Réponse prête en 5 secondes."],
    ['Lier une annonce', "En liant une annonce, l\'IA connaît votre article et son prix. La réponse sera beaucoup plus précise."],
    ['Conseil de négociation', "En plus de la réponse, l\'IA vous donne un conseil privé sur comment gérer la négociation."],
  ]},
  estimation: { titre:'Estimer le prix', sections:[
    ['Comment ça marche', "Décrivez votre article. L\'IA analyse les prix du marché pour donner une fourchette basse / conseillée / haute."],
    ['Fourchette', "Bas = vendre vite. Haut = attendre l\'acheteur idéal. Conseillé = juste milieu."],
    ['Disponibilité', "Disponible sur tous les plans, même gratuit."],
  ]},
  analyser: { titre:'Analyser une annonce', sections:[
    ['Comment ça marche', "Collez une annonce existante. L\'IA la note, identifie les 3 problèmes principaux, puis la réécrit entièrement."],
    ['Avant / Après', "Score original vs score amélioré. En moyenne +35 points après réécriture."],
    ['Plan requis', "Disponible à partir du plan Business (5,99€/sem)."],
  ]},
  ventes: { titre:'Mes ventes', sections:[
    ['Ajouter une vente', "Cliquez Ajouter, renseignez le titre et le prix demandé. Liez à une annonce existante si disponible."],
    ['Marquer vendu', "Entrez le prix final obtenu. L\'outil calcule si vous avez vendu au-dessus ou en dessous du prix demandé."],
    ['Statistiques', "En haut : objets en cours, vendus, total gagné."],
  ]},
  chatbots: { titre:'Chatbots vendeur', sections:[
    ["Principe", "Un assistant IA lié à votre annonce répond aux acheteurs 24h/24 à votre place via un lien unique."],
    ['Ajouter à LeBonCoin', "Copiez le texte \"Copier pour LeBonCoin\" et collez-le dans votre description d\'annonce."],
    ['Désactiver', "Désactivez le chatbot une fois l\'article vendu."],
    ['Limites', "Starter = non disponible · Business = 50 msg/jour · Expert = 200 msg/jour · Premium = 500 msg/jour."],
  ]},
  outils: { titre:'9 outils IA', sections:[
    ['Titres', "5 titres optimisés pour LeBonCoin générés à partir d\'une description courte."],
    ['Prix abusif', "L\'IA compare le prix demandé avec le marché et donne un verdict."],
    ['Calendrier', "Meilleur jour et heure pour publier selon la catégorie de l\'article."],
    ['Arnaque', "Analyse un message suspect et donne un verdict rouge / orange / vert."],
    ['Mode flash', "Annonce agressive pour vendre en 48h : prix cassé, urgence assumée."],
    ['Mode lot', "Annonce groupée pour vendre plusieurs objets ensemble."],
  ]},
  historique: { titre:'Historique', sections:[
    ['Annonces', "Toutes vos annonces générées. Cliquez pour voir et copier le texte complet."],
    ['Réponses', "Toutes vos réponses générées pour les acheteurs."],
    ['Conservation', "Historique conservé indéfiniment tant que votre compte est actif."],
  ]},
  tarifs: { titre:'Tarifs et plans', sections:[
    ['Fonctionnement', "Plans hebdomadaires. Changement ou annulation possible à tout moment, sans engagement."],
    ['Starter vs Business', "Starter = outils de base. Business = tout + chatbot + arnaque + analyser + flash. Expert = illimité."],
    ['Packs', "Crédits supplémentaires sans abonnement. Idéal pour un usage ponctuel."],
    ['Paiement', "Stripe sécurisé. Annulable en un clic depuis Profil."],
  ]},
  profil: { titre:'Profil et paramètres', sections:[
    ['Modifier email', "Dans Sécurité : nouvel email + mot de passe actuel. Confirmation par email requise."],
    ['Double auth', "Code à 6 chiffres par email à chaque connexion. Bouton \"Ce n\'était pas moi\" pour bloquer."],
    ['Parrainage', "Votre lien dans Compte. Un ami qui souscrit = 1 semaine Business gratuite pour vous."],
  ]},
}

function GuidePanel({ tab, onClose }) {
  const guide = GUIDES[tab]
  if (!guide) return null
  const [openIdx, setOpenIdx] = useState(null)
  return (
    <div className="guide-scroll" style={{ position:'fixed',top:0,right:0,bottom:0,width:340,maxWidth:'90vw',background:'rgba(8,10,15,.99)',border:'1px solid rgba(201,168,76,.15)',borderRadius:'12px 0 0 12px',zIndex:500,display:'flex',flexDirection:'column',boxShadow:'-20px 0 60px rgba(0,0,0,.6)',animation:'slideInGuide .25s ease' }}>
      <style>{`@keyframes slideInGuide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.guide-scroll::-webkit-scrollbar{width:2px}.guide-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,.2);border-radius:1px}`}</style>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:9,letterSpacing:3,color:'var(--gold3)',marginBottom:2 }}>GUIDE CONTEXTUEL</div>
          <div style={{ fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:400 }}>{guide.titre}</div>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)',border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',color:'var(--muted2)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>✕</button>
      </div>
      <div className="guide-scroll" style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
        {guide.sections.map(([titre, contenu], i) => (
          <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
            <button onClick={()=>setOpenIdx(openIdx===i?null:i)}
              style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 20px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10 }}>
              <span style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:11,letterSpacing:1,color:openIdx===i?'var(--gold2)':'var(--cream)',transition:'color .2s' }}>{titre}</span>
              <span style={{ color:'var(--muted)',fontSize:10,flexShrink:0,transform:openIdx===i?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block' }}>▾</span>
            </button>
            {openIdx===i && (
              <div style={{ padding:'0 20px 16px 20px',fontSize:12,color:'var(--muted2)',lineHeight:1.8,borderLeft:'2px solid rgba(201,168,76,.25)',marginLeft:20,paddingLeft:14 }}>
                {contenu}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,.04)',fontSize:10,color:'var(--muted)',textAlign:'center',flexShrink:0 }}>
        Une question ? Contactez-nous sur la page d&apos;accueil.
      </div>
    </div>
  )
}


function ScoreVendeur({ usage }) {
  const { points, niveau, prochainNiveau, pointsManquants, emoji } = (() => {
    let p = Math.min(usage.annonces * 10, 200) + Math.min(usage.reponses * 5, 150)
    let n = 'Débutant', pn = 'Vendeur', pm = Math.max(0, 50-p), em = '🌱'
    if (p >= 500) { n = 'Expert'; pn = null; em = '👑'; pm = 0 }
    else if (p >= 200) { n = 'Pro'; pn = 'Expert'; em = '⭐'; pm = 500-p }
    else if (p >= 50) { n = 'Vendeur'; pn = 'Pro'; em = '🔥'; pm = 200-p }
    return { points:p, niveau:n, prochainNiveau:pn, pointsManquants:pm, emoji:em }
  })()
  const maxPoints = prochainNiveau==='Expert'?500:prochainNiveau==='Pro'?200:50
  const minPoints = niveau==='Expert'?200:niveau==='Pro'?50:niveau==='Vendeur'?50:0
  const pct = Math.min(100, Math.max(0, ((points-minPoints)/(maxPoints-minPoints))*100))

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,.05),rgba(201,168,76,.02))',border:'1px solid rgba(201,168,76,.15)',borderRadius:10,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
      <div style={{ fontSize:24 }}>{emoji}</div>
      <div style={{ flex:1,minWidth:140 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:14,color:'var(--gold2)',letterSpacing:1 }}>{niveau}</span>
            {prochainNiveau && <span style={{ fontSize:10,color:'var(--muted)',background:'rgba(255,255,255,.04)',padding:'2px 7px',borderRadius:10 }}>→ {prochainNiveau} · {pointsManquants} pts</span>}
          </div>
          <span style={{ fontFamily:'DM Mono, monospace',fontSize:11,color:'var(--muted2)' }}>{points} pts</span>
        </div>
        <div style={{ background:'rgba(255,255,255,.06)',borderRadius:4,height:3,overflow:'hidden' }}>
          <div className="progress-fill" style={{ width:Math.max(2,pct)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',borderRadius:4 }} />
        </div>
      </div>
    </div>
  )
}

function LaunchBanner() {
  const [countdown, setCountdown] = useState(null)
  const LAUNCH_END = new Date('2026-06-30T23:59:59.000Z')

  useEffect(() => {
    const update = () => {
      const diff = LAUNCH_END - new Date()
      if (diff <= 0) { setCountdown(null); return }
      setCountdown({
        days: Math.floor(diff/(1000*60*60*24)),
        hours: Math.floor((diff%(1000*60*60*24))/(1000*60*60)),
        minutes: Math.floor((diff%(1000*60*60))/(1000*60)),
        seconds: Math.floor((diff%(1000*60))/1000),
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  if (!countdown) return null

  return (
    <div style={{ background:'rgba(201,168,76,.06)',border:'1px solid rgba(201,168,76,.2)',borderRadius:4,padding:'14px 20px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
      <div>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:'var(--gold2)',animation:'pulse 1.5s infinite' }} />
          <span style={{ fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2.5,color:'var(--gold2)' }}>LANCEMENT — ACCÈS GRATUIT</span>
        </div>
        <div style={{ fontSize:12,color:'var(--muted2)' }}>Plan Business offert jusqu'au 30 juin 2026</div>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        {[[countdown.days,'J'],[countdown.hours,'H'],[countdown.minutes,'M'],[countdown.seconds,'S']].map(([v,u])=>(
          <div key={u} style={{ textAlign:'center',minWidth:40 }}>
            <div style={{ fontFamily:'DM Mono, monospace',fontSize:20,color:'var(--gold2)',letterSpacing:-1,lineHeight:1 }}>{String(v).padStart(2,'0')}</div>
            <div style={{ fontSize:8,color:'var(--muted)',letterSpacing:2,marginTop:2 }}>{u}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferralSection() {
  const [code, setCode] = useState(null)
  const [stats, setStats] = useState({ total:0, active:0 })
  const [copied, setCopied] = useState(false)

  useEffect(()=>{
    fetch('/api/referral/generate').then(r=>r.json()).then(data=>{ if(data.code){ setCode(data.code); if(data.stats) setStats(data.stats) } }).catch(()=>{})
  },[])

  if (!code) return null
  const link = (typeof window!=='undefined'?window.location.origin:"')+'/?ref='+code

  return (
    <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'18px 20px',marginBottom:8 }}>
      <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>Mon lien de parrainage</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10 }}>
        <div style={{ background:'var(--ink)',padding:'10px 14px',textAlign:'center' }}>
          <div style={{ fontFamily:'DM Mono, monospace',fontSize:22,color:'var(--gold2)',letterSpacing:-1 }}>{stats.total}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Amis parraines</div>
        </div>
        <div style={{ background:'var(--ink)',padding:'10px 14px',textAlign:'center' }}>
          <div style={{ fontFamily:'DM Mono, monospace',fontSize:22,color:'var(--success2)',letterSpacing:-1 }}>{stats.active}</div>
          <div style={{ fontSize:10,color:'var(--muted2)',marginTop:2 }}>Actifs</div>
        </div>
      </div>
      <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'var(--muted2)',wordBreak:'break-all',marginBottom:8 }}>{link}</div>
      <button onClick={()=>{navigator.clipboard.writeText(link);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
        className="btn-ghost" style={{ width:'100%',fontSize:11,color:copied?'var(--gold2)':'var(--muted2)',borderColor:copied?'var(--gold-border)':'var(--border2)' }}>
        {copied?'Lien copie !':'Copier mon lien de parrainage'}
      </button>
    </div>
  )
}
