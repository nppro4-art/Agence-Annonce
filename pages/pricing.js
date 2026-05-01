import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Pricing() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2 }}>
            Agence d'<span style={{ color: 'var(--red)' }}>Annonce</span>
          </Link>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: -1, marginTop: 32, marginBottom: 12 }}>
            Choisissez votre plan
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)' }}>Simple, sans engagement, annulable à tout moment — non remboursable.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* GRATUIT */}
          <div style={{ background: 'var(--s1)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 1, marginBottom: 6 }}>Gratuit</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--muted2)', marginBottom: 4 }}>0€</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>Pour toujours</div>
            {['3 estimations de prix offertes', 'Accès au formulaire', 'Résultat partiel sans compte'].map(f => (
              <div key={f} style={{ fontSize: 12, color: 'var(--muted2)', display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--success)' }}>✓</span>{f}
              </div>
            ))}
            <button onClick={() => router.push('/auth/register')}
              style={{ width: '100%', marginTop: 20, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, padding: '12px' }}>
              COMMENCER GRATUITEMENT
            </button>
          </div>

          {/* PRO */}
          <div style={{ background: 'var(--s1)', border: '1.5px solid var(--red)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--red)', color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', borderRadius: 4 }}>
              RECOMMANDÉ
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 1, marginBottom: 6 }}>Pro</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--red)', marginBottom: 4 }}>5,99€</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>par semaine · annulable à tout moment — non remboursable</div>
            {[
              'Annonces (usage raisonnable — 200/mois)',
              'Réponses acheteurs (100/mois)',
              'Estimations de prix (50/mois)',
              'Score qualité de vos annonces',
              'Historique complet',
              'Annulable à tout moment — non remboursable'
            ].map(f => (
              <div key={f} style={{ fontSize: 12, color: 'var(--white)', display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--success)' }}>✓</span>{f}
              </div>
            ))}
            <button onClick={() => router.push('/auth/register?plan=pro')}
              style={{ width: '100%', marginTop: 20, background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, padding: '12px', transition: 'all .2s' }}>
              COMMENCER — 5,99€/MOIS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
