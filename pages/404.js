import { useRouter } from 'next/router'
import Link from 'next/link'

export default function NotFound() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 80, color: 'var(--red)', lineHeight: 1, letterSpacing: -4 }}>404</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginBottom: 12, marginTop: 8 }}>Page introuvable</div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 32 }}>Cette page n&apos;existe pas ou a ete deplacee.</div>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ fontSize: 13, padding: '13px 28px', letterSpacing: 2 }}>
          RETOUR A L&apos;ACCUEIL
        </button>
      </div>
    </div>
  )
}
