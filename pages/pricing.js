import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Pricing() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) setUser(data.user)
      setLoadingUser(false)
    }).catch(() => setLoadingUser(false))
  }, [])

  const handleSubscribe = async (planKey) => {
    if (!user) { router.push('/auth/register?plan=' + planKey); return }
    const res = await fetch('/api/stripe/create-subscription', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Erreur: ' + (data.error || 'Verifiez que vos price_id Stripe sont configures dans Vercel'))
  }

  const userPlanKey = user?.planKey || user?.plan || 'free'
  const isSubscribed = user?.plan === 'pro' && user?.subStatus === 'active'

  const PRICE_MAP_FAMILLE = process.env.NEXT_PUBLIC_STRIPE_FAMILLE || ''

  const PLANS = [
    {
      key: 'starter', name: 'Starter', price: '3,99',
      features: [
        '10 annonces / semaine',
        '30 reponses acheteurs / semaine',
        'Estimation de prix (3/jour)',
        'Score qualite annonce',
        'Generateur de titres',
        'Detecteur prix abusif',
        'Checklist publication',
        'Calendrier de publication optimal',
      ],
    },
    {
      key: 'business', name: 'Business', price: '5,99',
      features: [
        '30 annonces / semaine',
        '100 reponses / semaine',
        'Chatbot vendeur (50 msg/jour)',
        'Analyser et ameliorer une annonce',
        'Detecteur arnaque acheteur',
        'Comparateur plateformes',
        'Mode vente flash',
        'Traduction annonce (5 langues)',
        'Suivi des ventes',
        'Tout le Starter inclus',
      ],
      recommended: true,
    },
    {
      key: 'expert', name: 'Expert', price: '12,99',
      features: [
        'Annonces et reponses illimitees',
        'Chatbot vendeur (200 msg/jour)',
        'Mode lot (plusieurs objets)',
        'Tout le Business inclus',
        'Acces prioritaire nouveautes',
      ],
    },
  ]

  const PACKS = [
    { name: '5 annonces', price: '9,99 EUR', unit: '2,00 EUR/ann.', link: process.env.NEXT_PUBLIC_STRIPE_PACK5 || '' },
    { name: '10 annonces', price: '17,99 EUR', unit: '1,80 EUR/ann.', link: process.env.NEXT_PUBLIC_STRIPE_PACK10 || '' },
    { name: '50 reponses', price: '14,99 EUR', unit: '0,30 EUR/rep.', link: process.env.NEXT_PUBLIC_STRIPE_REP50 || '' },
    { name: '500 reponses', price: '39,99 EUR', unit: '0,08 EUR/rep.', link: process.env.NEXT_PUBLIC_STRIPE_REP500 || '' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .6s ease forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.2s;opacity:0}.d3{animation-delay:.3s;opacity:0}.d4{animation-delay:.4s;opacity:0}
        .plan-card{transition:all .2s}.plan-card:hover{transform:translateY(-3px)}
        @media(max-width:768px){
          .plans-grid{grid-template-columns:1fr!important}
          .packs-grid{grid-template-columns:1fr!important}
          .pc{padding:32px 16px 60px!important}
          .nav-desktop{display:none!important}
          .nav-mobile{display:flex!important}
        }
        @media(min-width:769px){.nav-mobile{display:none!important}}
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 32px', background: 'rgba(3,3,3,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3 }}>
          Agence <span style={{ color: 'var(--red)' }}>d&apos;Annonce</span>
        </Link>
        <div className="nav-desktop" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/auth/login" className="nav-link" style={{ fontSize: 12 }}>Connexion</Link>
          {user ? (
            <Link href="/dashboard"><button className="btn-primary" style={{ fontSize: 11, padding: '8px 16px' }}>Mon espace</button></Link>
          ) : (
            <Link href="/auth/register"><button className="btn-primary" style={{ fontSize: 11, padding: '8px 16px' }}>Commencer</button></Link>
          )}
        </div>
        <div className="nav-mobile" style={{ gap: 8 }}>
          {user
            ? <Link href="/dashboard"><button className="btn-primary" style={{ fontSize: 11, padding: '7px 12px' }}>Dashboard</button></Link>
            : <Link href="/auth/register"><button className="btn-primary" style={{ fontSize: 11, padding: '7px 12px' }}>Commencer</button></Link>
          }
        </div>
      </nav>

      <div className="pc" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,5vw,60px) clamp(16px,4vw,24px) 100px' }}>

        <div className="fade-up d1" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="label" style={{ marginBottom: 14 }}>Tarifs transparents</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,6vw,52px)', fontWeight: 400, letterSpacing: -1, lineHeight: 1.05, marginBottom: 12 }}>
            Choisissez votre offre
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7 }}>
            Abonnement hebdomadaire · Sans engagement · Annulable a tout moment
          </p>
          {!user && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gold3)' }}>
              Connectez-vous ou creez un compte pour vous abonner
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="fade-up d2 plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 16 }}>
          {PLANS.map(plan => {
            const isCurrent = isSubscribed && (userPlanKey === plan.key || (userPlanKey === 'pro' && plan.key === 'business'))
            return (
              <div key={plan.key} className="plan-card"
                style={{ background: plan.recommended ? 'var(--s1)' : 'var(--ink)', padding: '28px 20px', position: 'relative', borderTop: plan.recommended ? '2px solid var(--gold)' : '2px solid transparent' }}>
                {plan.recommended && (
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-50%)', background: 'var(--gold)', color: '#030303', fontFamily: 'var(--font-label)', fontSize: 8, letterSpacing: 2, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                    RECOMMANDE
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 2, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 32, color: plan.recommended ? 'var(--gold2)' : 'var(--cream)', letterSpacing: -2, lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted2)', marginLeft: 6 }}>EUR / semaine</span>
                </div>
                <div style={{ marginBottom: 20 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted2)', marginBottom: 7 }}>
                      <span style={{ color: plan.recommended ? 'var(--gold3)' : 'var(--muted)', fontSize: 10 }}>+</span>{f}
                    </div>
                  ))}
                </div>
                {isCurrent ? (
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--gold2)', padding: '10px', border: '1px solid var(--gold-border)', borderRadius: 2 }}>
                    ✦ Plan actif
                  </div>
                ) : (
                  <button onClick={() => handleSubscribe(plan.key)} disabled={loadingUser}
                    style={{ width: '100%', background: plan.recommended ? 'linear-gradient(135deg,var(--gold3),var(--gold2))' : 'none', border: plan.recommended ? 'none' : '1px solid var(--border2)', borderRadius: 2, color: plan.recommended ? '#030303' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-label)', fontSize: 12, letterSpacing: 1.5, padding: '13px', transition: 'all .2s' }}>
                    {user ? 'Choisir ' + plan.name : 'Commencer avec ' + plan.name}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Packs */}
        <div className="fade-up d3" style={{ marginTop: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Alternative</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, letterSpacing: -.3 }}>Packs a l&apos;unite</h2>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>Paiement unique · Credits permanents</p>
          </div>
          <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: 'var(--border)' }}>
            {PACKS.map(p => (
              <div key={p.name} style={{ background: 'var(--ink)', padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 14 }}>{p.unit} · Paiement unique</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--muted3)', letterSpacing: -1 }}>{p.price}</span>
                  <button onClick={() => { if (!user) { router.push('/auth/register'); return } if (p.link) window.open(p.link, '_blank'); else alert('Lien non configure') }}
                    className="btn-ghost" style={{ fontSize: 11, padding: '7px 16px' }}>
                    {user ? 'Acheter' : 'Se connecter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Famille - idee 28 */}
        <div className="fade-up d3" style={{ marginTop: 24, background: 'var(--s1)', border: '1px solid var(--gold-border)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, letterSpacing: 2, color: 'var(--gold3)', marginBottom: 6 }}>NOUVEAU</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Plan Famille</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.65 }}>
                3 membres · Partagez l&apos;abonnement Expert entre toute la famille.<br />
                Chaque membre a son propre espace et ses propres annonces.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 36, color: 'var(--gold2)', letterSpacing: -2, lineHeight: 1 }}>13,99</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>EUR / semaine pour 3</div>
              <button onClick={() => handleSubscribe('famille')} style={{ marginTop: 10, background: 'linear-gradient(135deg,var(--gold3),var(--gold2))', border: 'none', borderRadius: 2, color: '#030303', cursor: 'pointer', fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: 1.5, padding: '10px 20px' }}>
                CHOISIR LE PLAN FAMILLE
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="fade-up d4" style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
            {[
              ['Puis-je annuler quand je veux ?', 'Oui, depuis votre espace client. Acces maintenu jusqu\'a fin de periode payee.'],
              ['Les credits pack expirent-ils ?', 'Non, vos credits n\'expirent jamais.'],
              ['Y a-t-il des remboursements ?', 'Non. Les paiements ne sont pas remboursables car la prestation est livree immediatement.'],
              ['Comment fonctionne le parrainage ?', 'Parrainez un ami - il obtient 1 semaine Business gratuite et vous aussi. Disponible dans votre espace client.'],
            ].map(([q, a]) => (
              <div key={q} style={{ background: 'var(--ink)', padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 5 }}>{q}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['Accueil', '/'], ['Stats', '/stats'], ['CGV', '/cgv'], ['Confidentialite', '/confidentialite'], ['Mentions legales', '/mentions-legales'], ['A propos', '/a-propos']].map(([l, h]) => (
          <Link key={l} href={h} style={{ fontSize: 12, color: 'var(--muted2)' }}>{l}</Link>
        ))}
      </footer>
    </div>
  )
}
