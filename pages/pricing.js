import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Pricing() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      setUser(data.user || null)
      setCheckingAuth(false)
    }).catch(() => setCheckingAuth(false))
  }, [])

  const handlePay = (link, packName) => {
    if (!user) {
      // Sauvegarder l'intention pour rediriger après inscription
      sessionStorage.setItem('after_login_redirect', link)
      sessionStorage.setItem('after_login_pack', packName)
      router.push('/auth/register?intent=pack')
      return
    }
    window.open(link, '_blank')
  }

  const handleElite = () => {
    if (!user) {
      router.push('/auth/register?plan=elite')
      return
    }
    // Déjà connecté, créer la subscription
    fetch('/api/stripe/create-subscription', { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.url) window.location.href = data.url })
  }

  const packs = [
    { id: 'pack5', name: '5 annonces', price: '9,99€', unit: '2,00€/annonce', desc: 'Paiement unique', features: ['5 annonces professionnelles', 'Version courte incluse', 'Score qualité inclus'], cta: 'Acheter ce pack', link: process.env.NEXT_PUBLIC_STRIPE_PACK5 || '#' },
    { id: 'pack10', name: '10 annonces', price: '17,99€', unit: '1,80€/annonce', desc: 'Paiement unique', features: ['10 annonces professionnelles', 'Version courte incluse', 'Score qualité inclus'], cta: 'Acheter ce pack', link: process.env.NEXT_PUBLIC_STRIPE_PACK10 || '#' },
    { id: 'rep50', name: '50 réponses', price: '14,99€', unit: '0,30€/réponse', desc: 'Paiement unique', features: ['50 réponses acheteurs', 'Conseil négociation inclus', 'Ton professionnel garanti'], cta: 'Acheter ce pack', link: process.env.NEXT_PUBLIC_STRIPE_REP50 || '#' },
    { id: 'rep500', name: '500 réponses', price: '39,99€', unit: '0,08€/réponse', desc: 'Paiement unique', features: ['500 réponses acheteurs', 'Conseil négociation inclus', 'Meilleure valeur réponses'], cta: 'Acheter ce pack', link: process.env.NEXT_PUBLIC_STRIPE_REP500 || '#' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .fade-up { animation: fadeUp .6s ease forwards; }
        .d1{animation-delay:.1s;opacity:0} .d2{animation-delay:.2s;opacity:0} .d3{animation-delay:.3s;opacity:0} .d4{animation-delay:.4s;opacity:0}
        .pack-card { transition: all .2s; }
        .pack-card:hover { transform: translateY(-3px); border-color: rgba(255,45,45,.3) !important; }
        .elite-card { transition: all .2s; }
        .elite-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(255,45,45,.2) !important; }
        .cta-btn { transition: all .2s; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,45,45,.35) !important; }
        .outline-btn { transition: all .2s; }
        .outline-btn:hover { border-color: rgba(255,45,45,.4) !important; color: var(--white) !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(5,5,5,.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2 }}>
          Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--muted2)' }}>Connexion</Link>
          <Link href="/auth/register">
            <button style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 1, padding: '8px 16px' }}>
              Commencer
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px 100px' }}>

        {/* HEADER */}
        <div className="fade-up d1" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,45,45,.08)', border: '1px solid rgba(255,45,45,.2)', borderRadius: 20, padding: '6px 14px', fontSize: 11, color: 'var(--red)', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, background: 'var(--red)', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }}></span>
            Tarifs simples et transparents
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(32px,7vw,52px)', letterSpacing: -1, lineHeight: 1.05, marginBottom: 14 }}>
            Choisissez votre offre
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted2)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Un abonnement tout-inclus ou des packs à l&apos;unité. L&apos;abonnement Elite est toujours la meilleure valeur.
          </p>
        </div>

        {/* PLAN ELITE — MIS EN AVANT */}
        <div className="fade-up d2 elite-card" style={{ background: 'linear-gradient(135deg, rgba(255,45,45,.08), rgba(255,45,45,.03))', border: '2px solid rgba(255,45,45,.4)', borderRadius: 20, padding: '32px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 40px rgba(255,45,45,.1)' }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,45,45,.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

          <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--red)', color: 'white', fontFamily: 'Bebas Neue', fontSize: 11, letterSpacing: 1.5, padding: '4px 12px', borderRadius: 4 }}>
            ⭐ MEILLEURE VALEUR
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 1, marginBottom: 4 }}>Plan Elite</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, maxWidth: 360 }}>
                Tout illimité — annonces, réponses acheteurs, estimations. Un seul abonnement pour tout.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 52, color: 'var(--red)', letterSpacing: -2, lineHeight: 1 }}>5,99€</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>par semaine</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>soit 0,86€/jour</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 24 }}>
            {[
              '✍️ Annonces illimitées',
              '💬 Réponses illimitées',
              '💰 Estimations (50/mois)',
              '📊 Score qualité',
              '📋 Historique complet',
              '🔄 Résiliable à tout moment',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--white)', background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '8px 12px' }}>
                {f}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="cta-btn" onClick={handleElite}
              style={{ flex: 1, minWidth: 200, background: 'var(--red)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1.5, padding: '16px 24px', boxShadow: '0 4px 20px rgba(255,45,45,.25)' }}>
              {user ? '⚡ PASSER ELITE — 5,99€/SEMAINE' : '⚡ COMMENCER — 5,99€/SEMAINE'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>✓ Annulable à tout moment</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>✓ Non remboursable</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>✓ Sans engagement</div>
            </div>
          </div>
        </div>

        {/* COMPARAISON RAPIDE */}
        <div className="fade-up d2" style={{ background: 'rgba(255,176,32,.05)', border: '1px solid rgba(255,176,32,.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--warning)' }}>Pourquoi l&apos;abonnement ?</strong> Avec Elite à 5,99€/sem, chaque annonce te coûte <strong style={{ color: 'var(--white)' }}>moins de 0,01€</strong>. Le pack 5 annonces revient à <strong style={{ color: '#f87171' }}>2,00€/annonce</strong>, le pack 10 à <strong style={{ color: '#f87171' }}>1,80€/annonce</strong>. Avec Elite à 5,99€/sem, tout est illimité pour moins de 0,01€ par annonce.
          </div>
        </div>

        {/* PACKS À L'UNITÉ */}
        <div className="fade-up d3" style={{ marginBottom: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 1, marginBottom: 6 }}>Packs à l&apos;unité</div>
            <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Pour ceux qui veulent essayer sans s&apos;abonner</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {packs.map(p => (
              <div key={p.id} className="pack-card" style={{ background: 'var(--s1)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '20px 18px' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: .5, marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--muted2)', letterSpacing: -1 }}>{p.price}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>{p.unit} · {p.desc}</div>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted2)', marginBottom: 6 }}>
                    <span style={{ color: 'var(--success)', fontSize: 10 }}>✓</span>{f}
                  </div>
                ))}
                <button className="outline-btn" onClick={() => handlePay(p.link, p.name)}
                  style={{ width: '100%', marginTop: 14, background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 1, padding: '11px' }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PLAN GRATUIT */}
        <div className="fade-up d4" style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: .5, marginBottom: 4 }}>Gratuit</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)' }}>3 estimations de prix par jour · Sans carte bancaire</div>
          </div>
          <button className="outline-btn" onClick={() => user ? router.push('/dashboard') : router.push('/auth/register')}
            style={{ background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 1, padding: '11px 20px' }}>
            COMMENCER GRATUITEMENT
          </button>
        </div>

        {/* FAQ RAPIDE */}
        <div className="fade-up d4">
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 1, marginBottom: 16, textAlign: 'center' }}>Questions fréquentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: "Puis-je annuler quand je veux ?", a: "Oui, l'abonnement Elite est annulable à tout moment depuis votre espace client. Vous conservez l'accès jusqu'à la fin de la période payée." },
              { q: "Les packs ont-ils une date d'expiration ?", a: "Non, les crédits de vos packs n'expirent jamais." },
              { q: "Puis-je passer d'un pack à l'abonnement ?", a: "Oui, à tout moment. Vous pouvez vous abonner au plan Elite depuis votre dashboard." },
              { q: "Remboursements ?", a: "Les paiements ne sont pas remboursables. C'est une prestation de service numérique livré immédiatement." },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
