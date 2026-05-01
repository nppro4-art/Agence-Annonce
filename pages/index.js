import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const S = {
  page: { minHeight: '100vh', background: 'var(--black)' },
  nav: { padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' },
  logo: { fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2 },
  logoEm: { color: 'var(--red)' },
  navLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  navLink: { fontSize: 13, color: 'var(--muted2)', cursor: 'pointer' },
  btnPrimary: { background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '10px 20px' },
  hero: { padding: '80px 24px 60px', textAlign: 'center', maxWidth: 700, margin: '0 auto' },
  heroTitle: { fontFamily: 'Bebas Neue', fontSize: 'clamp(32px, 8vw, 52px)', lineHeight: 1.05, letterSpacing: -1, marginBottom: 16 },
  heroTitleEm: { color: 'var(--red)' },
  heroSub: { fontSize: 16, color: 'var(--muted2)', lineHeight: 1.75, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, maxWidth: 700, margin: '0 auto 60px' },
  actionCard: { background: 'var(--s1)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '24px 20px', cursor: 'pointer', transition: 'all .2s', textAlign: 'left' },
  actionIcon: { fontSize: 28, marginBottom: 12 },
  actionTitle: { fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, marginBottom: 6 },
  actionSub: { fontSize: 11, color: 'var(--muted2)', background: 'rgba(255,45,45,.08)', border: '1px solid rgba(255,45,45,.2)', borderRadius: 4, padding: '2px 8px', display: 'inline-block' },
  actionDesc: { fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 },
  trust: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 60 },
  trustPill: { fontSize: 11, color: 'var(--muted2)', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px' },
}

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const ref = router.query.ref
    if (ref) {
      sessionStorage.setItem('ref', ref)
      fetch('/api/employee/click', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref })
      }).catch(() => {})
    }
  }, [router.query])

  const goTo = (path) => router.push(path)

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.logo}>Agence d'<span style={S.logoEm}>Annonce</span></div>
        <div style={S.navLinks}>
          <Link href="/pricing" style={S.navLink}>Tarifs</Link>
          <Link href="/auth/login" style={S.navLink}>Connexion</Link>
          <Link href="/auth/register">
            <button style={S.btnPrimary}>Commencer</button>
          </Link>
        </div>
      </nav>

      <div style={S.hero}>
        <h1 style={S.heroTitle}>
          Vends plus vite avec une IA<br />
          <span style={S.heroTitleEm}>qui t'assiste du début à la fin</span>
        </h1>
        <p style={S.heroSub}>
          Génère des annonces pro, réponds aux acheteurs, estime le juste prix. Tout en quelques secondes.
        </p>

        <div style={S.actions}>
          <div style={S.actionCard} onClick={() => goTo('/auth/register')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,45,45,.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={S.actionIcon}>✍️</div>
            <div style={S.actionTitle}>Créer une annonce</div>
            <div style={S.actionSub}>Version Pro</div>
            <div style={S.actionDesc}>Titre accrocheur, description complète, points forts — prêt à publier.</div>
          </div>

          <div style={S.actionCard} onClick={() => goTo('/auth/register')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,45,45,.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={S.actionIcon}>💬</div>
            <div style={S.actionTitle}>Répondre à un acheteur</div>
            <div style={S.actionSub}>Version Pro</div>
            <div style={S.actionDesc}>Réponse pro prête à copier, conseil de négociation, ton parfait.</div>
          </div>

          <div style={S.actionCard} onClick={() => goTo('/pricing')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,45,45,.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={S.actionIcon}>💰</div>
            <div style={S.actionTitle}>Estimer le prix</div>
            <div style={S.actionSub}>Version Basic</div>
            <div style={S.actionDesc}>Fourchette basse / moyenne / haute basée sur le marché actuel.</div>
          </div>
        </div>

        <div style={S.trust}>
          {['IA Claude Anthropic', 'Paiement Stripe sécurisé', 'Résultat en 15 secondes', 'Sans engagement'].map(t => (
            <span key={t} style={S.trustPill}>✓ {t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
