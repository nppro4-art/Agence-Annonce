import { useRouter } from 'next/router'

export default function ServerError() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 80, color: 'var(--red)', lineHeight: 1 }}>500</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, marginBottom: 12 }}>Erreur serveur</div>
        <div style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 28 }}>Une erreur inattendue s'est produite. Réessayez dans quelques instants.</div>
        <button onClick={() => router.reload()}
          style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '12px 24px' }}>
          RÉESSAYER
        </button>
      </div>
    </div>
  )
}
