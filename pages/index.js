import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [counts, setCounts] = useState({ annonces: 0, reponses: 0 })

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
    const duration = 2000
    const steps = 60
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
    return () => clearInterval(timer)
  }, [router.query])

  const testimonials = [
    { quote: "Vendu en 48h au lieu de 3 semaines.", name: "Thomas R.", city: "Lyon", item: "BMW Serie 3" },
    { quote: "12 contacts en un seul jour grace a l'annonce generee.", name: "Sarah M.", city: "Paris", item: "iPhone 15 Pro" },
    { quote: "La reponse IA a sauve ma vente face a un acheteur agressif.", name: "Marc D.", city: "Bordeaux", item: "Canape Roche Bobois" },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
        @keyframes shimmer { 0%{ background-position:-200% center } 100%{ background-position:200% center } }
        @keyframes float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-5px) } }
        .fade-up { animation: fadeUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        .d1{animation-delay:.1s;opacity:0} .d2{animation-delay:.22s;opacity:0} .d3{animation-delay:.34s;opacity:0} .d4{animation-delay:.46s;opacity:0} .d5{animation-delay:.58s;opacity:0}
        .gold-text {
          background: linear-gradient(90deg, var(--gold3) 0%, var(--gold2) 40%, var(--gold) 60%, var(--gold3) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .action-card { transition: all .25s; cursor: pointer; }
        .action-card:hover { background: var(--s2) !important; transform: translateY(-2px); }
        .cta-btn { transition: all .2s; }
        .cta-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

        /* MOBILE */
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .hero-section { padding: 48px 20px 40px !important; }
          .hero-title { font-size: 38px !important; }
          .hero-sub { font-size: 14px !important; }
          .counters-desktop { display: none !important; }
          .counters-mobile { display: grid !important; }
          .ctas { flex-direction: column !important; }
          .ctas button, .ctas a { width: 100% !important; }
          .actions-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-inner { flex-direction: column !important; gap: 16px !important; text-align: center !important; }
          .section-header { flex-direction: column !important; gap: 12px !important; }
        }
        @media (min-width: 641px) {
          .nav-mobile-btn { display: none !important; }
          .counters-mobile { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0 24px', background: 'rgba(3,3,3,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3, lineHeight: 1.1, color: 'var(--white)' }}>AGENCE D&apos;<span style={{ color: 'var(--red)' }}>ANNONCE</span></div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="nav-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/pricing" className="nav-link" style={{ fontSize: 12 }}>Tarifs</Link>
          <Link href="/auth/login" className="nav-link" style={{ fontSize: 12 }}>Connexion</Link>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ fontSize: 11, padding: '9px 18px', letterSpacing: 1.5 }}>Commencer</button>
          </Link>
        </div>

        {/* Mobile - juste le bouton */}
        <div className="nav-mobile-btn" style={{ gap: 8, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 12, color: 'var(--muted2)' }}>Tarifs</Link>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ fontSize: 11, padding: '8px 14px', letterSpacing: 1 }}>Commencer</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section" style={{ position: 'relative', padding: '72px 32px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 500, background: 'radial-gradient(ellipse, rgba(201,168,76,.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
          <div className="fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span className="label" style={{ fontSize: 10 }}>Intelligence artificielle · Vente entre particuliers</span>
          </div>

          <h1 className="fade-up d2 hero-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 6 }}>
            Vends plus vite
          </h1>
          <h1 className="fade-up d2 hero-title gold-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 6 }}>
            avec l&apos;IA qui vend
          </h1>
          <h1 className="fade-up d2 hero-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 28, color: 'var(--muted3)' }}>
            a ta place.
          </h1>

          <p className="fade-up d3 hero-sub" style={{ fontSize: 16, color: 'var(--muted2)', lineHeight: 1.8, marginBottom: 32, maxWidth: 500 }}>
            Annonces professionnelles, reponses acheteurs, estimation de prix. Resultat en <span style={{ color: 'var(--cream)', fontStyle: 'italic' }}>15 secondes</span>.
          </p>

          {/* Compteurs MOBILE — sous le texte */}
          <div className="counters-mobile" style={{ display: 'none', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 28 }}>
            {[
              { val: '+' + counts.annonces.toLocaleString('fr-FR'), label: 'annonces' },
              { val: '+' + counts.reponses.toLocaleString('fr-FR'), label: 'reponses' },
              { val: '2x', label: 'plus vite' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--gold2)', letterSpacing: -1, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'var(--muted2)', marginTop: 3, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="fade-up d4 ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <Link href="/auth/register?plan=business" style={{ flex: '1 1 auto', minWidth: 200 }}>
              <button className="btn-gold cta-btn" style={{ fontSize: 13, padding: '15px 28px', width: '100%', letterSpacing: 1.5 }}>
                Commencer — 5,99 EUR/sem
              </button>
            </Link>
            <Link href="/pricing" style={{ flex: '1 1 auto' }}>
              <button className="btn-ghost cta-btn" style={{ width: '100%', padding: '15px 20px' }}>
                Voir les tarifs
              </button>
            </Link>
          </div>

          <div className="fade-up d5" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Annulable a tout moment', 'Paiement Stripe', 'Resultat en 15s', 'Sans engagement'].map(t => (
              <span key={t} style={{ fontSize: 11, color: 'var(--muted2)', background: 'var(--s1)', border: '1px solid var(--border)', padding: '4px 10px', letterSpacing: .3 }}>
                + {t}
              </span>
            ))}
          </div>
        </div>

        {/* Compteurs DESKTOP — positionnés absolus à droite */}
        <div className="counters-desktop" style={{ position: 'absolute', right: 40, top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { val: '+' + counts.annonces.toLocaleString('fr-FR'), label: 'annonces\ngenerees' },
            { val: '+' + counts.reponses.toLocaleString('fr-FR'), label: 'reponses\ncreees' },
            { val: '2x', label: 'plus vite\nvendu' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '16px 20px', minWidth: 140, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', background: 'linear-gradient(180deg, transparent, var(--gold-border), transparent)' }} />
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 28, color: 'var(--gold2)', letterSpacing: -1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEPARATEUR OR */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--gold-border), transparent)' }} />

      {/* 3 ACTIONS */}
      <section style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-header" style={{ marginBottom: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Ce que tu peux faire</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,42px)', fontWeight: 400, letterSpacing: -.5, lineHeight: 1.1 }}>
              Trois outils.<br />
              <span style={{ fontStyle: 'italic', color: 'var(--muted3)', fontWeight: 300 }}>Un seul abonnement.</span>
            </h2>
          </div>
        </div>

        <div className="actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)' }}>
          {[
            { num: '01', title: 'Creer une annonce', badge: 'Abonne', desc: "L'IA redige un titre accrocheur, une description complete et les points forts qui vendent.", href: '/auth/register' },
            { num: '02', title: 'Repondre a un acheteur', badge: 'Abonne', desc: "Collez le message recu. L'IA vous donne la reponse parfaite avec conseil de negociation.", href: '/auth/register' },
            { num: '03', title: 'Estimer le prix', badge: 'Gratuit', desc: "Obtenez une fourchette de prix basee sur le marche francais actuel. 3 estimations gratuites.", href: '/pricing' },
          ].map((a, i) => (
            <div key={i} className="action-card" onClick={() => router.push(a.href)}
              style={{ background: 'var(--ink)', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: 'var(--font-label)', fontSize: 52, color: 'var(--border2)', lineHeight: 1, userSelect: 'none' }}>{a.num}</div>
              <div style={{ marginBottom: 12 }}>
                <span className={a.badge === 'Abonne' ? 'badge badge-gold' : 'badge badge-green'}>
                  {a.badge === 'Abonne' ? '♛ ' : ''}{a.badge}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2vw,22px)', fontWeight: 600, letterSpacing: -.3, marginBottom: 10, lineHeight: 1.2 }}>{a.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.75 }}>{a.desc}</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: a.badge === 'Abonne' ? 'linear-gradient(90deg, transparent, var(--gold-border), transparent)' : 'linear-gradient(90deg, transparent, rgba(45,122,79,.3), transparent)' }} />
            </div>
          ))}
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="label" style={{ marginBottom: 12 }}>Resultats concrets</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 400, letterSpacing: -.5 }}>Ce qu&apos;ils en disent</h2>
          </div>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'var(--ink)', padding: '28px 24px', position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--gold-border)', lineHeight: .8, marginBottom: 14 }}>&ldquo;</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.65, marginBottom: 20, color: 'var(--cream)' }}>
                  {t.quote}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: 'var(--s3)', border: '1px solid var(--gold-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-label)', fontSize: 12, color: 'var(--gold2)', flexShrink: 0 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{t.name} · {t.city}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{t.item}</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: 'linear-gradient(180deg, transparent, var(--gold-border), transparent)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.04), transparent)', pointerEvents: 'none' }} />
        <div className="ornament" style={{ marginBottom: 28 }}><span>+</span></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,50px)', fontWeight: 400, letterSpacing: -1, lineHeight: 1.05, marginBottom: 14 }}>
          Pret a vendre<br />
          <span style={{ fontWeight: 700, fontStyle: 'italic' }} className="gold-text">plus vite et mieux ?</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.8, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
          Rejoignez +1 247 vendeurs qui utilisent l&apos;IA pour vendre 2x plus vite.
        </p>
        <Link href="/auth/register?plan=business">
          <button className="btn-gold cta-btn" style={{ fontSize: 13, padding: '17px 44px', letterSpacing: 2 }}>
            COMMENCER MAINTENANT
          </button>
        </Link>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
          5,99 EUR/semaine · Annulable a tout moment · Non remboursable
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 32px' }}>
        <div className="footer-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 14, letterSpacing: 3, color: 'var(--muted2)' }}>
            A.<span style={{ color: 'var(--red)' }}>A</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/pricing" className="nav-link" style={{ fontSize: 12 }}>Tarifs</Link>
            <Link href="/auth/login" className="nav-link" style={{ fontSize: 12 }}>Connexion</Link>
            <Link href="/auth/register" className="nav-link" style={{ fontSize: 12 }}>S&apos;inscrire</Link>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>annonza.business</div>
        </div>
      </footer>
    </div>
  )
}
