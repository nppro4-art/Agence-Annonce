import { useRouter } from 'next/router'

export default function ServerError() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: 80, color: 'var(--red)', lineHeight: 1, letterSpacing: -4 }}>500</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginBottom: 12, marginTop: 8 }}>Erreur serveur</div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 32 }}>Une erreur inattendue s&apos;est produite. Reessayez dans quelques instants.</div>
        <button onClick={() => router.reload()} className="btn-primary" style={{ fontSize: 13, padding: '13px 28px', letterSpacing: 2 }}>
          REESSAYER
        </button>
      </div>
    </div>
  )
}
