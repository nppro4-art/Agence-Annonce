import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const TEMOIGNAGES = [
  { quote: 'Vendu en 48h au lieu de 3 semaines.', name: 'Thomas', city: 'Lyon', article: 'BMW 320d' },
  { quote: '12 contacts en un seul jour. Avant, personne.', name: 'Sarah', city: 'Paris', article: 'iPhone 14 Pro' },
  { quote: 'La réponse IA a sauvé ma vente face à un acheteur agressif.', name: 'Marc', city: 'Bordeaux', article: 'PS5' },
  { quote: 'Vendu au prix demandé en un weekend.', name: 'Julie', city: 'Nantes', article: 'MacBook Pro' },
  { quote: '3x plus de contacts avec la même voiture.', name: 'Pierre', city: 'Toulouse', article: 'Renault Clio' },
]

const OUTILS = [
  { icon: '✍', titre: 'Annonce IA', desc: 'Remplissez un formulaire. L\'IA rédige une annonce professionnelle complète.' },
  { icon: '◎', titre: 'Réponse acheteur', desc: 'Collez le message d\'un acheteur. L\'IA répond à votre place.' },
  { icon: '⚖', titre: 'Estimation prix', desc: 'Décrivez votre article. L\'IA vous dit combien il vaut sur le marché.' },
  { icon: '🔍', titre: 'Analyser', desc: 'Collez votre annonce existante. L\'IA la note et la réécrit mieux.' },
  { icon: '🚨', titre: 'Arnaque ?', desc: 'Un message suspect ? L\'IA détecte les arnaques LeBonCoin en 5 secondes.' },
  { icon: '🤖', titre: 'Chatbot vendeur', desc: 'Un lien unique. L\'acheteur pose ses questions, l\'IA répond 24h/24.' },
]

const PLANS = [
  { name: 'Starter', price: '3,99', color: '#9a9590', features: ['10 annonces/semaine', '30 réponses', 'Outils de base'] },
  { name: 'Business', price: '5,99', color: '#c9a84c', features: ['30 annonces/semaine', '100 réponses', 'Chatbot vendeur', 'Détecteur arnaque'], popular: true },
  { name: 'Expert', price: '12,99', color: '#d4b568', features: ['Annonces illimitées', 'Réponses illimitées', 'Mode lot', 'Tout inclus'] },
]

export default function Home() {
  const router = useRouter()
  const [counts, setCounts] = useState({ annonces: 0, reponses: 0, users: 0 })
  const [temoIndex, setTemoIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [notif, setNotif] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const LAUNCH_END = new Date('2026-06-30T23:59:59.000Z')

  const ARTICLES = ['une BMW 320d', 'un iPhone 14', 'un canapé IKEA', 'une PS5', 'un MacBook Pro', 'une Peugeot 308', 'un vélo électrique', 'une Nintendo Switch']
  const VILLES_N = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nantes', 'Toulouse', 'Lille', 'Strasbourg']

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: ref }) }).catch(() => {})
    }

    fetch('/api/stats/public').then(r => r.json()).then(data => {
      setCounts({ annonces: data.annonces || 0, reponses: data.reponses || 0, users: data.users || 0 })
    }).catch(() => {})

    const temoTimer = setInterval(() => setTemoIndex(i => (i + 1) % TEMOIGNAGES.length), 4000)

    const updateCountdown = () => {
      const diff = LAUNCH_END - new Date()
      if (diff <= 0) { setCountdown(null); return }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    updateCountdown()
    const cdTimer = setInterval(updateCountdown, 1000)

    const notifTimer = setTimeout(() => {
      const showNotif = () => {
        const art = ARTICLES[Math.floor(Math.random() * ARTICLES.length)]
        const ville = VILLES_N[Math.floor(Math.random() * VILLES_N.length)]
        setNotif({ text: `Annonce générée pour ${art} à ${ville}` })
        setTimeout(() => setNotif(null), 3500)
      }
      showNotif()
      const interval = setInterval(showNotif, 12000)
      return () => clearInterval(interval)
    }, 4000)

    return () => {
      clearInterval(temoTimer)
      clearInterval(cdTimer)
      clearTimeout(notifTimer)
    }
  }, [router.query.ref])

  const t = TEMOIGNAGES[temoIndex]

  return (
    <div style={{ minHeight: '100vh', background: '#110a0a', color: '#f0ece4', fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .fade-1{animation:fadeUp .6s ease .1s both}
        .fade-2{animation:fadeUp .6s ease .25s both}
        .fade-3{animation:fadeUp .6s ease .4s both}
        .fade-4{animation:fadeUp .6s ease .55s both}
        .gold-text{background:linear-gradient(135deg,#a8843c,#c9a84c,#e8d48a,#c9a84c);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite}
        .btn-main{display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#a8843c,#c9a84c);border:none;border-radius:6px;color:#110a0a;cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;padding:16px 32px;text-decoration:none;transition:all .2s;-webkit-tap-highlight-color:transparent}
        .btn-main:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .btn-main:active{transform:translateY(0)}
        .btn-outline{display:inline-flex;align-items:center;justify-content:center;background:transparent;border:1px solid rgba(201,168,76,.3);border-radius:6px;color:#c9a84c;cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:2px;padding:12px 24px;text-decoration:none;transition:all .2s;-webkit-tap-highlight-color:transparent}
        .btn-outline:hover{border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.06)}
        .card-outil{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px;transition:all .25s;cursor:default}
        .card-outil:hover{background:rgba(201,168,76,.05);border-color:rgba(201,168,76,.2);transform:translateY(-2px)}
        .temo-fade{animation:fadeIn .5s ease}
        a{color:inherit;text-decoration:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}
      `}</style>

      {/* Notification popup */}
      {notif && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(17,10,10,.95)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 8, padding: '10px 18px', fontSize: 12, color: '#c9a84c', zIndex: 9999, whiteSpace: 'nowrap', animation: 'slideUp .3s ease', backdropFilter: 'blur(10px)' }}>
          ✦ {notif.text}
        </div>
      )}

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(17,10,10,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 4, color: '#f0ece4' }}>
          A.<span style={{ color: '#c8392b' }}>A</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: '#7a7268', fontWeight: 400 }}>Connexion</Link>
          <Link href="/auth/register" className="btn-main" style={{ fontSize: 13, padding: '10px 20px', borderRadius: 6, letterSpacing: 1.5 }}>
            Essayer gratuitement
          </Link>
        </div>
      </header>

      {/* BANNIÈRE LANCEMENT */}
      {countdown && (
        <div style={{ background: 'linear-gradient(90deg,rgba(168,132,60,.15),rgba(201,168,76,.1),rgba(168,132,60,.15))', borderBottom: '1px solid rgba(201,168,76,.15)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: '#c9a84c' }}>ACCÈS GRATUIT</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[[countdown.days, 'J'], [countdown.hours, 'H'], [countdown.minutes, 'M'], [countdown.seconds, 'S']].map(([v, u]) => (
              <div key={u} style={{ textAlign: 'center', minWidth: 32 }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#f0ece4', letterSpacing: -1, lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
                <div style={{ fontSize: 8, color: '#5a5550', letterSpacing: 1 }}>{u}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register" style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 2, color: '#110a0a', background: '#c9a84c', padding: '5px 14px', borderRadius: 4 }}>EN PROFITER</Link>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: '60px 20px 50px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>

        <div className="fade-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 2, color: '#c9a84c' }}>GRATUIT JUSQU'AU 30 JUIN</span>
        </div>

        <h1 className="fade-2" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(38px,10vw,68px)', fontWeight: 300, letterSpacing: -1, lineHeight: 1.05, marginBottom: 20 }}>
          Vendez vos affaires{' '}
          <span className="gold-text" style={{ fontStyle: 'italic', fontWeight: 600 }}>10x plus vite</span>
          {' '}sur LeBonCoin
        </h1>

        <p className="fade-3" style={{ fontSize: 'clamp(15px,4vw,18px)', color: '#7a7268', lineHeight: 1.7, marginBottom: 32, fontWeight: 300 }}>
          L'IA rédige votre annonce, répond à vos acheteurs et détecte les arnaques à votre place.
        </p>

        <div className="fade-4" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" className="btn-main" style={{ fontSize: 15, padding: '16px 32px' }}>
            Créer mon annonce — Gratuit
          </Link>
          <Link href="/pricing" className="btn-outline">
            Voir les tarifs
          </Link>
        </div>

        <div className="fade-4" style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          {[
            [counts.annonces > 0 ? counts.annonces.toLocaleString('fr-FR') : '1 200+', 'annonces générées'],
            [counts.users > 0 ? counts.users.toLocaleString('fr-FR') : '340+', 'vendeurs actifs'],
            ['48h', 'délai moyen de vente'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#c9a84c', letterSpacing: 1, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: '#5a5550', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO VISUELLE - comment ça marche */}
      <section style={{ padding: '20px 20px 60px', maxWidth: 600, margin: '0 auto' }}>
        {/* Label exemple */}
        <div style={{ textAlign:'center',marginBottom:16 }}>
          <span style={{ fontFamily:'Bebas Neue,sans-serif',fontSize:10,letterSpacing:3,color:'#c9a84c',background:'rgba(201,168,76,.08)',border:'1px solid rgba(201,168,76,.2)',borderRadius:20,padding:'4px 14px' }}>
            EXEMPLE RÉEL — GÉNÉRÉ EN 15 SECONDES
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 16, overflow: 'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
          {/* Barre de "navigation" */}
          <div style={{ background: 'rgba(255,255,255,.03)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#c8392b', '#e0a020', '#2d7a4f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: .6 }} />)}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 4, padding: '4px 10px', fontSize: 10, color: '#5a5550', textAlign: 'center' }}>annonza.business</div>
          </div>
          {/* Contenu demo */}
          <div style={{ padding: '20px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <span style={{ fontFamily:'Bebas Neue',fontSize:10,letterSpacing:2,color:'#5a5550' }}>AVANT — Annonce classique</span>
            </div>
            <div style={{ background: 'rgba(200,57,43,.06)', border: '1px solid rgba(200,57,43,.15)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#7a7268', lineHeight: 1.6 }}>
              "Je vends ma voiture. Bon état. Contactez-moi."
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#c8392b' }}>22</span>
                <span style={{ fontSize: 10, color: '#5a5550' }}>/ 100 · 0 contact en 2 semaines</span>
              </div>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'Bebas Neue', letterSpacing: 2, color: '#5a5550', marginBottom: 12 }}>APRÈS — Généré par Annonza en 15 secondes</div>
            <div style={{ background: 'rgba(45,122,79,.06)', border: '1px solid rgba(45,122,79,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#f0ece4', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>🚗 BMW 320d Sport — 75 000 km — Diesel — Première main</div>
              Entretien complet à jour, CT valide jusqu'en mars 2026. Équipements : GPS, caméra recul, sieges chauffants. Aucun défaut mécanique. Raison de vente : passage à l'électrique.
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: '#2d7a4f' }}>94</span>
                <span style={{ fontSize: 10, color: '#5a5550' }}>/ 100 · 12 contacts en 48h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CE QUE ÇA FAIT */}
      <section style={{ padding: '20px 20px 60px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 3, color: '#5a5550', marginBottom: 12 }}>6 OUTILS EN 1</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 'clamp(28px,7vw,42px)', fontWeight: 300, letterSpacing: -0.5 }}>
              Tout ce dont vous avez besoin pour vendre
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {OUTILS.map((o, i) => (
              <div key={i} className="card-outil" style={{ gridColumn: i === 0 ? '1 / -1' : 'auto' }}>
                <div style={{ fontSize: i === 0 ? 28 : 22, marginBottom: 10 }}>{o.icon}</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: i === 0 ? 18 : 15, letterSpacing: 1, color: '#f0ece4', marginBottom: 6 }}>{o.titre}</div>
                <div style={{ fontSize: i === 0 ? 13 : 12, color: '#7a7268', lineHeight: 1.6 }}>{o.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section style={{ padding: '20px 20px 60px', background: 'rgba(255,255,255,.01)', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 3, color: '#5a5550', marginBottom: 12 }}>POUR VOUS SI...</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 'clamp(26px,6vw,38px)', fontWeight: 300, letterSpacing: -0.5 }}>
              Vous vendez sur LeBonCoin, Vinted ou Facebook
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { emoji: '😤', situation: 'Vous avez passé 1h à écrire une annonce et personne ne répond', solution: 'Annonza la réécrit en 15 secondes avec un score de qualité.' },
              { emoji: '📱', situation: 'Vous recevez 20 fois les mêmes questions d\'acheteurs', solution: 'Le chatbot vendeur répond automatiquement 24h/24.' },
              { emoji: '😰', situation: 'Vous ne savez pas si c\'est une arnaque ou un vrai acheteur', solution: 'Le détecteur analyse le message en 5 secondes.' },
              { emoji: '🤔', situation: 'Vous ne savez pas à quel prix vendre votre article', solution: 'L\'estimateur IA donne la fourchette du marché.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, color: '#9a9590', marginBottom: 6, lineHeight: 1.5 }}>{item.situation}</div>
                    <div style={{ fontSize: 13, color: '#c9a84c', lineHeight: 1.5 }}>→ {item.solution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 3, color: '#5a5550', marginBottom: 32 }}>ILS ONT VENDU AVEC ANNONZA</div>
          <div key={temoIndex} className="temo-fade" style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 'clamp(18px,5vw,24px)', fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.5, color: '#f0ece4', marginBottom: 20 }}>
              &ldquo;{t.quote}&rdquo;
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.05))', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 16, color: '#c9a84c' }}>{t.name[0]}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}, {t.city}</div>
                <div style={{ fontSize: 11, color: '#5a5550' }}>A vendu : {t.article}</div>
              </div>
              <div style={{ marginLeft: 4, color: '#c9a84c', fontSize: 12, letterSpacing: 2 }}>★★★★★</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {TEMOIGNAGES.map((_, i) => (
              <div key={i} onClick={() => setTemoIndex(i)} style={{ width: i === temoIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === temoIndex ? '#c9a84c' : 'rgba(255,255,255,.1)', transition: 'all .3s', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section style={{ padding: '20px 20px 60px', background: 'rgba(255,255,255,.01)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 3, color: '#5a5550', marginBottom: 12 }}>TARIFS</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 'clamp(26px,6vw,38px)', fontWeight: 300, letterSpacing: -0.5, marginBottom: 8 }}>
              Moins cher qu'un café
            </h2>
            <p style={{ fontSize: 13, color: '#7a7268' }}>Résiliable à tout moment · Sans engagement</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLANS.map((plan, i) => (
              <div key={plan.name} style={{ background: plan.popular ? 'linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.03))' : 'rgba(255,255,255,.02)', border: '1px solid', borderColor: plan.popular ? 'rgba(201,168,76,.3)' : 'rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg,#a8843c,#c9a84c)', color: '#110a0a', fontFamily: 'Bebas Neue', fontSize: 10, letterSpacing: 2, padding: '4px 14px', borderRadius: '0 14px 0 8px' }}>POPULAIRE</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 2, color: plan.color, marginBottom: 2 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'Cormorant Garamond', fontSize: 30, fontWeight: 300, color: '#f0ece4', letterSpacing: -1 }}>{plan.price}€</span>
                      <span style={{ fontSize: 11, color: '#5a5550' }}>/semaine</span>
                    </div>
                  </div>
                  <Link href="/auth/register" className={plan.popular ? 'btn-main' : 'btn-outline'} style={{ fontSize: 12, padding: '10px 18px', letterSpacing: 1.5, borderRadius: 8 }}>
                    Choisir
                  </Link>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plan.features.map(f => (
                    <span key={f} style={{ fontSize: 11, color: '#7a7268', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: '3px 10px' }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#5a5550', marginTop: 16 }}>
            Packs à l&apos;unité disponibles · Pas d&apos;abonnement requis pour commencer
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '60px 20px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: 'clamp(28px,7vw,44px)', fontWeight: 300, letterSpacing: -0.5, marginBottom: 16, lineHeight: 1.1 }}>
            Votre prochaine annonce est à{' '}
            <span className="gold-text" style={{ fontStyle: 'italic', fontWeight: 600 }}>15 secondes</span>
          </h2>
          <p style={{ fontSize: 14, color: '#7a7268', marginBottom: 32, lineHeight: 1.7 }}>
            Rejoignez les vendeurs qui vendent plus vite, sans effort et sans arnaques.
          </p>
          <Link href="/auth/register" className="btn-main" style={{ fontSize: 15, padding: '18px 36px', borderRadius: 8, width: '100%', maxWidth: 340, display: 'flex', margin: '0 auto 16px' }}>
            Créer mon compte — Gratuit
          </Link>
          <p style={{ fontSize: 11, color: '#5a5550' }}>Aucune carte bancaire requise · Accès immédiat</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 4, marginBottom: 16 }}>A.<span style={{ color: '#c8392b' }}>A</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 20px', marginBottom: 16 }}>
          {[['Tarifs', '/pricing'], ['Avis', '/avis'], ['Stats', '/stats'], ['CGV', '/cgv'], ['Confidentialité', '/confidentialite'], ['Mentions légales', '/mentions-legales']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 11, color: '#5a5550', transition: 'color .15s' }}>{l}</Link>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#3a3830' }}>© 2026 Annonza · Tous droits réservés</p>
      </footer>
    </div>
  )
}
