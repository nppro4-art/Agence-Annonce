import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Pricing() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) setUser(data.user)
    }).catch(() => {})
  }, [])

  const handleSubscribe = async (planKey) => {
    if (!user) { router.push('/auth/register?plan=' + planKey); return }
    const res = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const handlePack = (link) => {
    if (!user) { router.push('/auth/register?redirect=pricing'); return }
    if (link) window.open(link, '_blank')
  }

  const PLANS = [
    {
      key: 'starter',
      name: 'Starter',
      price: '3,99',
      annonces: 5,
      reponses: 20,
      desc: 'Pour les vendeurs occasionnels',
      features: ['5 annonces / semaine', '20 reponses / semaine', 'Estimation de prix', 'Score qualite'],
      recommended: false,
    },
    {
      key: 'business',
      name: 'Business',
      price: '5,99',
      annonces: 15,
      reponses: 60,
      desc: 'Le plus populaire',
      features: ['15 annonces / semaine', '60 reponses / semaine', 'Estimation de prix', 'Score qualite', 'Historique complet', 'Parrainage'],
      recommended: true,
    },
    {
      key: 'expert',
      name: 'Expert',
      price: '9,99',
      annonces: 40,
      reponses: 250,
      desc: 'Pour les vendeurs intensifs',
      features: ['40 annonces / semaine', '250 reponses / semaine', 'Estimation de prix', 'Score qualite', 'Historique complet', 'Parrainage prioritaire'],
      recommended: false,
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
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.4 } }
        .fade-up { animation: fadeUp .6s ease forwards; }
        .d1{animation-delay:.1s;opacity:0} .d2{animation-delay:.2s;opacity:0} .d3{animation-delay:.3s;opacity:0} .d4{animation-delay:.4s;opacity:0}
        .plan-card { transition: all .2s; }
        .plan-card:hover { transform: translateY(-3px); }
        .btn-ghost:hover { border-color: var(--gold-border) !important; color: var(--gold2) !important; }
        @media (max-width: 640px) {
          .plans-grid { grid-template-columns: 1fr !important; }
          .packs-grid { grid-template-columns: 1fr !important; }
          .pricing-container { padding: 32px 16px 60px !important; }
        }
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3,3,3,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 3 }}>
          A.<span style={{ color: 'var(--red)' }}>A</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/auth/login" className="nav-link" style={{ fontSize: 12 }}>Connexion</Link>
          {user ? (
            <Link href="/dashboard">
              <button className="btn-primary" style={{ fontSize: 11, padding: '8px 16px', letterSpacing: 1.5 }}>Mon espace</button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <button className="btn-primary" style={{ fontSize: 11, padding: '8px 16px', letterSpacing: 1.5 }}>Commencer</button>
            </Link>
          )}
        </div>
      </nav>

      <div className="pricing-container" style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 100px' }}>

        <div className="fade-up d1" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="label" style={{ marginBottom: 14 }}>Tarifs transparents</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,6vw,52px)', fontWeight: 400, letterSpacing: -1, lineHeight: 1.05, marginBottom: 14 }}>
            Choisissez votre offre
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Abonnement hebdomadaire sans engagement. Annulable a tout moment.
          </p>
        </div>

        {/* Plans */}
        <div className="fade-up d2" className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 20 }}>
          {PLANS.map((plan, i) => (
            <div key={plan.key} className="plan-card"
              style={{ background: plan.recommended ? 'var(--s1)' : 'var(--ink)', padding: '28px 24px', position: 'relative', borderTop: plan.recommended ? '2px solid var(--gold)' : '2px solid transparent' }}>
              {plan.recommended && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)', background: 'var(--gold)', color: 'var(--black)', fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 2, padding: '3px 12px', whiteSpace: 'nowrap' }}>
                  RECOMMANDE
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 20 }}>{plan.desc}</div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-label)', fontSize: 36, color: plan.recommended ? 'var(--gold2)' : 'var(--cream)', letterSpacing: -2, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 11, color: 'var(--muted2)', marginLeft: 6 }}>EUR / semaine</span>
              </div>

              <div style={{ marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted3)', marginBottom: 8 }}>
                    <span style={{ color: plan.recommended ? 'var(--gold3)' : 'var(--muted2)', fontSize: 10 }}>+</span>
                    {f}
                  </div>
                ))}
              </div>

              <button onClick={() => handleSubscribe(plan.key)}
                style={{ width: '100%', background: plan.recommended ? 'linear-gradient(135deg,var(--gold3),var(--gold2))' : 'none', border: plan.recommended ? 'none' : '1px solid var(--border2)', borderRadius: 2, color: plan.recommended ? 'var(--black)' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-label)', fontSize: 13, letterSpacing: 2, padding: '13px', transition: 'all .2s', fontWeight: plan.recommended ? 700 : 400 }}>
                {user?.plan === 'pro' ? 'Plan actif' : 'Choisir ' + plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* Note comparaison */}
        <div className="fade-up d2" style={{ background: 'rgba(201,168,76,.04)', border: '1px solid var(--gold-border)', borderRadius: 2, padding: '14px 20px', marginBottom: 40, fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--gold2)' }}>Pourquoi s&apos;abonner ?</strong> Le plan Starter a 3,99 EUR / semaine revient a 0,80 EUR par annonce. Un pack 5 annonces = 2,00 EUR par annonce. L&apos;abonnement est toujours plus rentable.
        </div>

        {/* Packs */}
        <div className="fade-up d3">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Alternative</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, letterSpacing: -.3 }}>Packs a l&apos;unite</h2>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>Pour tester sans s&apos;abonner. Connexion requise.</p>
          </div>
          <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: 'var(--border)' }}>
            {PACKS.map(p => (
              <div key={p.name} style={{ background: 'var(--ink)', padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 14 }}>{p.unit} - Paiement unique</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--muted3)', letterSpacing: -1 }}>{p.price}</span>
                  <button onClick={() => handlePack(p.link)}
                    className="btn-ghost" style={{ fontSize: 11, padding: '7px 16px' }}>
                    {user ? 'Acheter' : 'Se connecter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan gratuit */}
        <div className="fade-up d4" style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '18px 24px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 14, letterSpacing: 2, marginBottom: 4 }}>Gratuit</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)' }}>3 estimations de prix par jour - Sans carte bancaire</div>
          </div>
          <button onClick={() => router.push(user ? '/dashboard' : '/auth/register')}
            className="btn-ghost" style={{ fontSize: 11, padding: '9px 20px' }}>
            {user ? 'Mon espace' : 'Commencer gratuitement'}
          </button>
        </div>

        {/* FAQ */}
        <div className="fade-up d4" style={{ marginTop: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Questions frequentes</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
            {[
              ['Puis-je annuler quand je veux ?', 'Oui, l\'abonnement est annulable a tout moment depuis votre espace client. Vous conservez l\'acces jusqu\'a la fin de la semaine payee.'],
              ['Les packs expirent-ils ?', 'Non, vos credits n\'expirent jamais.'],
              ['Y a-t-il des remboursements ?', 'Non. Les paiements ne sont pas remboursables car la prestation est livree immediatement.'],
              ['Comment fonctionne le parrainage ?', 'Parrainez un ami - il obtient 1 semaine gratuite et vous aussi. Le lien est disponible dans votre espace Elite.'],
            ].map(([q, a]) => (
              <div key={q} style={{ background: 'var(--ink)', padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 14, letterSpacing: 3, color: 'var(--muted2)' }}>
          A.<span style={{ color: 'var(--red)' }}>A</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/" className="nav-link" style={{ fontSize: 12 }}>Accueil</Link>
          <Link href="/auth/login" className="nav-link" style={{ fontSize: 12 }}>Connexion</Link>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>annonza.business</div>
      </footer>
    </div>
  )
}
