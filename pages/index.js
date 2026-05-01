import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [counter, setCounter] = useState({ annonces: 0, reponses: 0 })

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref })
      }).catch(() => {})
    }
    setTimeout(() => setVisible(true), 100)

    // Animation des compteurs
    const targets = { annonces: 1200, reponses: 3500 }
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const ease = 1 - Math.pow(1 - progress, 3)
      setCounter({
        annonces: Math.floor(targets.annonces * ease),
        reponses: Math.floor(targets.reponses * ease)
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [router.query])

  const testimonials = [
    { text: "J'ai vendu en 2 jours au lieu de 2 semaines", name: "Thomas", city: "Lyon", note: "⭐⭐⭐⭐⭐" },
    { text: "Annonce beaucoup plus professionnelle, plus de contacts", name: "Sarah", city: "Paris", note: "⭐⭐⭐⭐⭐" },
    { text: "Les réponses aux acheteurs sont ultra efficaces", name: "Marc", city: "Bordeaux", note: "⭐⭐⭐⭐⭐" },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
        @keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
        .fade-up { opacity:0; animation: fadeUp .7s ease forwards; }
        .d1 { animation-delay:.1s }
        .d2 { animation-delay:.25s }
        .d3 { animation-delay:.4s }
        .d4 { animation-delay:.55s }
        .d5 { animation-delay:.7s }
        .action-card { transition: all .25s cubic-bezier(.4,0,.2,1); }
        .action-card:hover { transform: translateY(-4px); border-color: rgba(255,45,45,.5) !important; box-shadow: 0 12px 40px rgba(255,45,45,.12); }
        .cta-btn { transition: all .2s; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,45,45,.35) !important; }
        .test-card { transition: all .2s; }
        .test-card:hover { border-color: rgba(255,45,45,.3) !important; transform: translateY(-2px); }
        .trust-pill:hover { border-color: rgba(255,45,45,.3) !important; }
        .shimmer-text {
          background: linear-gradient(90deg, #f5f5f5 0%, #ff2d2d 50%, #f5f5f5 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(5,5,5,.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="fade-up d1">
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2 }}>
            Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>Propulsé par IA</div>
        </div>
        <div className="fade-up d2" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 13, color: 'var(--muted2)', padding: '8px 12px', borderRadius: 8, transition: 'color .15s' }}>Tarifs</Link>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'var(--muted2)', padding: '8px 12px', borderRadius: 8, transition: 'color .15s' }}>Connexion</Link>
          <Link href="/auth/register">
            <button className="cta-btn" style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, padding: '9px 18px' }}>
              Commencer
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', padding: '80px 24px 70px', textAlign: 'center', maxWidth: 760, margin: '0 auto', overflow: 'hidden' }}>
        {/* Glow background */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(255,45,45,0.1) 0%, transparent 65%)', pointerEvents: 'none' }}></div>

        <div className="fade-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,45,45,.08)', border: '1px solid rgba(255,45,45,.2)', borderRadius: 20, padding: '6px 14px', fontSize: 11, color: 'var(--red)', marginBottom: 28, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, background: 'var(--red)', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }}></span>
          IA disponible maintenant
        </div>

        <h1 className="fade-up d2" style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(36px,9vw,64px)', lineHeight: 1.0, letterSpacing: -1, marginBottom: 20 }}>
          Vends plus vite avec<br/>
          <span className="shimmer-text">l&apos;IA qui t&apos;assiste</span><br/>
          du début à la fin
        </h1>

        <p className="fade-up d3" style={{ fontSize: 16, color: 'var(--muted2)', lineHeight: 1.75, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          Génère des annonces professionnelles, réponds aux acheteurs avec le bon ton, négocie intelligemment. Tout en quelques secondes.
        </p>

        <div className="fade-up d4" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <Link href="/auth/register?plan=elite">
            <button className="cta-btn" style={{ background: 'var(--red)', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1.5, padding: '16px 32px', boxShadow: '0 4px 20px rgba(255,45,45,.25)' }}>
              ⚡ Commencer — 5,99€/semaine
            </button>
          </Link>
          <Link href="/pricing">
            <button style={{ background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: 12, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 14, fontWeight: 500, padding: '16px 24px', transition: 'all .2s' }}>
              Voir les tarifs →
            </button>
          </Link>
        </div>

        {/* Trust pills */}
        <div className="fade-up d5" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['✓ Annulable à tout moment', '✓ Résultat en 15 secondes', '✓ Paiement sécurisé Stripe', '✓ Sans engagement'].map(t => (
            <span key={t} className="trust-pill" style={{ fontSize: 11, color: 'var(--muted2)', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px', transition: 'all .15s', cursor: 'default' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '32px 24px', background: 'var(--s1)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { val: '+' + counter.annonces.toLocaleString('fr-FR'), label: 'annonces optimisées' },
            { val: '+' + counter.reponses.toLocaleString('fr-FR'), label: 'réponses générées' },
            { val: '2x', label: 'plus vite vendu' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(28px,5vw,42px)', color: 'var(--red)', letterSpacing: -1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 4, letterSpacing: .5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 ACTIONS */}
      <div style={{ padding: '64px 24px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(28px,6vw,40px)', letterSpacing: -0.5, marginBottom: 10 }}>
            Tout ce dont tu as besoin pour vendre
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted2)' }}>Trois outils IA, un seul abonnement</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {[
            {
              icon: '✍️',
              badge: 'Plan Elite',
              badgeColor: 'rgba(255,45,45,.1)',
              badgeBorder: 'rgba(255,45,45,.2)',
              badgeText: 'var(--red)',
              title: 'Créer une annonce',
              desc: 'Titre accrocheur, description complète, points forts mis en avant — prêt à publier en 15 secondes.',
              href: '/auth/register'
            },
            {
              icon: '💬',
              badge: 'Plan Elite',
              badgeColor: 'rgba(255,45,45,.1)',
              badgeBorder: 'rgba(255,45,45,.2)',
              badgeText: 'var(--red)',
              title: 'Répondre à un acheteur',
              desc: 'Réponse professionnelle prête à copier, conseil de négociation, ton parfait pour conclure la vente.',
              href: '/auth/register'
            },
            {
              icon: '💰',
              badge: 'Gratuit',
              badgeColor: 'rgba(0,217,126,.08)',
              badgeBorder: 'rgba(0,217,126,.2)',
              badgeText: 'var(--success)',
              title: 'Estimer le prix',
              desc: 'Fourchette basse / moyenne / haute basée sur le marché actuel. 3 estimations gratuites par jour.',
              href: '/pricing'
            },
          ].map((a, i) => (
            <div key={i} className="action-card" onClick={() => router.push(a.href)}
              style={{ background: 'var(--s1)', border: '1.5px solid var(--border)', borderRadius: 18, padding: '24px 20px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: 32, marginBottom: 14, animation: 'float 3s ease-in-out infinite', animationDelay: i * 0.4 + 's', display: 'inline-block' }}>{a.icon}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: a.badgeColor, border: '1px solid ' + a.badgeBorder, borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: a.badgeText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 8 }}>
                {a.badge}
              </div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: .5, marginBottom: 8, display: 'block' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.7 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TÉMOIGNAGES */}
      <div style={{ background: 'var(--s1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(24px,5vw,36px)', letterSpacing: -0.5, marginBottom: 8 }}>Ce qu&apos;ils en disent</div>
            <div style={{ fontSize: 14, color: 'var(--muted2)' }}>Des résultats concrets, pas des promesses</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="test-card" style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 18px' }}>
                <div style={{ fontSize: 13, marginBottom: 4 }}>{t.note}</div>
                <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, background: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {t.name[0]}
                  </div>
                  {t.name}, {t.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(28px,6vw,44px)', letterSpacing: -0.5, marginBottom: 14 }}>
          Prêt à vendre plus vite ?
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 32, lineHeight: 1.7 }}>
          Rejoins +1 200 vendeurs qui utilisent l&apos;IA pour vendre 2x plus vite. Premier résultat en 15 secondes.
        </div>
        <Link href="/auth/register?plan=elite">
          <button className="cta-btn" style={{ background: 'var(--red)', border: 'none', borderRadius: 14, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, padding: '20px 48px', boxShadow: '0 4px 24px rgba(255,45,45,.25)' }}>
            COMMENCER MAINTENANT
          </button>
        </Link>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14 }}>
          5,99€/semaine · Annulable à tout moment · Non remboursable
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, marginRight: 16 }}>
          Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
        </span>
        <Link href="/pricing" style={{ color: 'var(--muted)', marginRight: 12 }}>Tarifs</Link>
        <Link href="/auth/login" style={{ color: 'var(--muted)', marginRight: 12 }}>Connexion</Link>
        <Link href="/auth/register" style={{ color: 'var(--muted)' }}>S&apos;inscrire</Link>
      </div>

    </div>
  )
}
