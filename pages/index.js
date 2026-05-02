import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [counts, setCounts] = useState({ annonces: 0, reponses: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref })
      }).catch(() => {})
    }

    // Compteurs animés
    const targets = { annonces: 1247, reponses: 3582 }
    const duration = 2400
    const steps = 80
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

    // Cursor glow
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouse)
    return () => { clearInterval(timer); window.removeEventListener('mousemove', handleMouse) }
  }, [router.query])

  const testimonials = [
    { quote: "Vendu en 48h au lieu de 3 semaines.", name: "Thomas R.", city: "Lyon", item: "BMW Série 3" },
    { quote: "L'annonce était tellement pro, j'ai eu 12 contacts en un jour.", name: "Sarah M.", city: "Paris", item: "iPhone 15 Pro" },
    { quote: "La réponse à l'acheteur a sauvé ma vente, il voulait négocier à -40%.", name: "Marc D.", city: "Bordeaux", item: "Canapé Roche Bobois" },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', position: 'relative' }}>

      {/* CURSOR GLOW */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 1,
        left: mousePos.x - 200, top: mousePos.y - 200,
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(201,168,76,.04) 0%, transparent 65%)',
        transition: 'left .08s, top .08s',
      }}/>

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 32px',
        background: 'rgba(3,3,3,.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }} className="fade-in d1">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 20, letterSpacing: 3, lineHeight: 1, color: 'var(--white)' }}>
              AGENCE D&apos;
            </span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: 20, letterSpacing: 3, lineHeight: 1, color: 'var(--red)' }}>
              ANNONCE
            </span>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border2)', margin: '0 16px' }}/>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic', color: 'var(--gold3)', letterSpacing: 1 }}>
            Propulsé par IA
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="fade-in d2">
          <Link href="/pricing" className="nav-link">Tarifs</Link>
          <Link href="/auth/login" className="nav-link">Connexion</Link>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ fontSize: 12, padding: '10px 22px', letterSpacing: 2 }}>
              Commencer
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', padding: '100px 32px 80px', maxWidth: 1100, margin: '0 auto', overflow: 'hidden' }}>

        {/* Background decoratif */}
        <div style={{ position: 'absolute', top: 0, right: -100, width: 500, height: 600, background: 'radial-gradient(ellipse, rgba(201,168,76,.05) 0%, transparent 65%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: -80, width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(200,57,43,.05) 0%, transparent 65%)', pointerEvents: 'none' }}/>

        {/* Ligne décorative verticale */}
        <div style={{ position: 'absolute', left: 0, top: 80, width: 1, height: '60%', background: 'linear-gradient(180deg, transparent, var(--gold-border), transparent)' }}/>

        <div style={{ maxWidth: 780 }}>
          {/* Label */}
          <div className="fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', animation: 'pulse 2s infinite' }}/>
            <span className="label" style={{ fontSize: 10 }}>Intelligence artificielle · Vente entre particuliers</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up d2" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(44px,7vw,82px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 8 }}>
            Vends plus vite
          </h1>
          <h1 className="fade-up d3" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(44px,7vw,82px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 28 }}>
            <span className="gold-text">avec l&apos;IA qui vend</span>
          </h1>
          <h1 className="fade-up d3" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(44px,7vw,82px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 36, color: 'var(--muted3)' }}>
            à ta place.
          </h1>

          <p className="fade-up d4" style={{ fontSize: 16, color: 'var(--muted2)', lineHeight: 1.8, maxWidth: 520, marginBottom: 44 }}>
            Génère des annonces professionnelles, réponds aux acheteurs avec le bon ton,
            négocie intelligemment. Résultat en <span style={{ color: 'var(--cream)', fontStyle: 'italic' }}>15 secondes</span>.
          </p>

          {/* CTA */}
          <div className="fade-up d5" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/auth/register?plan=elite">
              <button className="btn-gold" style={{ fontSize: 13, padding: '16px 36px' }}>
                ⚡ Commencer — 5,99€/sem
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost">
                Voir les tarifs →
              </button>
            </Link>
          </div>

          {/* Trust */}
          <div className="fade-up d6" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Annulable à tout moment', 'Paiement Stripe', 'Résultat en 15s', 'Sans engagement'].map(t => (
              <span key={t} style={{ fontSize: 11, color: 'var(--muted2)', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 2, padding: '4px 10px', letterSpacing: .3 }}>
                ✦ {t}
              </span>
            ))}
          </div>
        </div>

        {/* Compteurs flottants */}
        <div className="fade-up d6" style={{ position: 'absolute', right: 40, top: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { val: '+' + counts.annonces.toLocaleString('fr-FR'), label: 'annonces\ngénérées', icon: '✍' },
            { val: '+' + counts.reponses.toLocaleString('fr-FR'), label: 'réponses\ncréées', icon: '💬' },
            { val: '2×', label: 'plus vite\nvendu', icon: '⚡' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px', minWidth: 140, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', background: 'linear-gradient(180deg, transparent, var(--gold), transparent)' }}/>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 28, letterSpacing: -1, color: 'var(--gold2)', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIGNE OR ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--gold-border) 20%, var(--gold-border) 80%, transparent 100%)' }}/>

      {/* ── 3 ACTIONS ────────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 12 }}>Ce que tu peux faire</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.1 }}>
              Trois outils.<br/>
              <span style={{ fontStyle: 'italic', color: 'var(--muted3)', fontWeight: 300 }}>Un seul abonnement.</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, background: 'var(--border)' }}>
          {[
            {
              num: '01',
              icon: '✍',
              title: 'Créer une annonce',
              subtitle: 'Plan Elite',
              desc: 'L\'IA analyse votre article et rédige un titre accrocheur, une description convaincante et les points forts qui vendent.',
              detail: 'Score qualité · Version courte · SEO optimisé',
              gold: true,
            },
            {
              num: '02',
              icon: '💬',
              title: 'Répondre à un acheteur',
              subtitle: 'Plan Elite',
              desc: 'Collez le message reçu. L\'IA vous donne la réponse parfaite — ton professionnel, conseil de négociation, prête à copier.',
              detail: 'Anti-négociation · Ton calibré · Stratégie',
              gold: true,
            },
            {
              num: '03',
              icon: '💰',
              title: 'Estimer le prix',
              subtitle: 'Gratuit',
              desc: 'Obtenez une fourchette de prix réaliste basée sur le marché français actuel. 3 estimations gratuites par jour.',
              detail: 'LeBonCoin · La Centrale · Marché actuel',
              gold: false,
            },
          ].map((a, i) => (
            <div key={i} onClick={() => router.push(a.gold ? '/auth/register?plan=elite' : '/pricing')}
              style={{ background: 'var(--ink)', padding: '40px 32px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'background .3s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
            >
              {/* Numéro décoratif */}
              <div style={{ position: 'absolute', top: 20, right: 24, fontFamily: 'var(--font-label)', fontSize: 64, color: 'var(--border2)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{a.num}</div>

              <div style={{ fontSize: 32, marginBottom: 20, animation: 'float 3s ease-in-out infinite', animationDelay: i * .4 + 's', display: 'inline-block' }}>{a.icon}</div>

              <div style={{ marginBottom: 8 }}>
                <span className={a.gold ? 'badge badge-gold' : 'badge badge-green'} style={{ marginBottom: 10, display: 'inline-flex' }}>
                  {a.subtitle}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: -.3, marginBottom: 12, lineHeight: 1.2 }}>{a.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.75, marginBottom: 20 }}>{a.desc}</p>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: .5 }}>{a.detail}</div>

              {/* Bordure gold au hover */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: a.gold ? 'linear-gradient(90deg, transparent, var(--gold-border), transparent)' : 'linear-gradient(90deg, transparent, rgba(45,122,79,.3), transparent)' }}/>
            </div>
          ))}
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────── */}
      <section style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="label" style={{ marginBottom: 12 }}>Résultats concrets</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, letterSpacing: -.5 }}>
              Ce qu&apos;ils en disent
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, background: 'var(--border)' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'var(--ink)', padding: '32px 28px', position: 'relative' }}>
                {/* Quote mark */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--gold-border)', lineHeight: .8, marginBottom: 16, display: 'block' }}>&ldquo;</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.65, marginBottom: 24, color: 'var(--cream)' }}>
                  {t.quote}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--s3)', border: '1px solid var(--gold-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-label)', fontSize: 14, color: 'var(--gold2)' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{t.name} · {t.city}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{t.item}</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: 'linear-gradient(180deg, transparent, var(--gold-border), transparent)' }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.04) 0%, transparent 65%)', pointerEvents: 'none' }}/>
        <div className="ornament" style={{ marginBottom: 36 }}><span>✦</span></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 400, letterSpacing: -1, lineHeight: 1.05, marginBottom: 16 }}>
          Prêt à vendre<br/>
          <span style={{ fontWeight: 700, fontStyle: 'italic' }} className="gold-text">plus vite et mieux ?</span>
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted2)', lineHeight: 1.8, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Rejoignez +1 247 vendeurs qui utilisent l&apos;IA pour vendre 2× plus vite. Premier résultat en 15 secondes.
        </p>
        <Link href="/auth/register?plan=elite">
          <button className="btn-gold" style={{ fontSize: 14, padding: '18px 48px', letterSpacing: 2 }}>
            COMMENCER MAINTENANT
          </button>
        </Link>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          5,99€/semaine · Annulable à tout moment · Non remboursable
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 14, letterSpacing: 3, color: 'var(--muted2)' }}>
          AGENCE D&apos;<span style={{ color: 'var(--red)' }}>ANNONCE</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Tarifs', '/pricing'], ['Connexion', '/auth/login'], ['S\'inscrire', '/auth/register']].map(([label, href]) => (
            <Link key={label} href={href} className="nav-link" style={{ fontSize: 12 }}>{label}</Link>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          © 2025 Agence d&apos;Annonce
        </div>
      </footer>

    </div>
  )
}
