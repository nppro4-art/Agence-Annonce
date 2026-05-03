import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState({ annonces: 0, reponses: 0, estimations: 0 })
  const [credits, setCredits] = useState({ annonces: { total: 0, used: 0, remaining: 0 }, reponses: { total: 0, used: 0, remaining: 0 } })
  const [purchases, setPurchases] = useState([])
  const [showSubModal, setShowSubModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
    }).catch(() => router.push('/auth/login'))

    Promise.all([
      fetch('/api/dashboard/annonces').then(r => r.json()),
      fetch('/api/dashboard/reponses').then(r => r.json()),
      fetch('/api/dashboard/credits').then(r => r.json()),
    ]).then(([a, r, c]) => {
      setUsage({
        annonces: a.annonces?.length || 0,
        reponses: r.reponses?.length || 0,
        estimations: parseInt(localStorage.getItem('est_count') || '0')
      })
      if (c.credits) setCredits(c.credits)
      if (c.purchases) setPurchases(c.purchases)
    }).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const upgradePro = async () => {
    const res = await fetch('/api/stripe/create-subscription', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const cancelSubscription = async () => {
    if (!confirm('Confirmer annulation ? Vous gardez acces jusqu\'a fin de semaine payee.')) return
    setCancelLoading(true)
    const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' })
    const data = await res.json()
    setCancelLoading(false)
    if (data.success) setCancelDone(true)
    else alert('Erreur : ' + (data.error || 'Contacter le support'))
  }

  const isPro = user?.plan === 'pro' && user?.subStatus === 'active'
  const LIMIT_ANNONCES = 200
  const LIMIT_REPONSES = 300

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--muted2)', fontStyle: 'italic' }}>Chargement</div>
      </div>
    </div>
  )

  const TABS = [
    { id: 'home',       label: 'Accueil' },
    { id: 'annonce',    label: 'Annonce' },
    { id: 'reponse',    label: 'Repondre' },
    { id: 'estimation', label: 'Estimer' },
    { id: 'historique', label: 'Historique' },
    { id: 'tarifs',     label: 'Tarifs' },
    { id: 'profil',     label: 'Profil' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
        .db-fade { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) forwards; }
        .tab-btn { transition: all .2s; border-bottom: 2px solid transparent; }
        .tab-btn:hover { color: var(--cream) !important; }
        .tab-btn.active { color: var(--gold2) !important; border-bottom-color: var(--gold) !important; }
        .action-tile { transition: all .25s; }
        .action-tile:hover { background: var(--s2) !important; transform: translateY(-2px); }
        .copy-btn:hover { border-color: var(--gold-border) !important; color: var(--gold2) !important; }
        @media (max-width: 640px) {
          .tab-btn { font-size: 10px !important; padding: 0 8px !important; }
          .db-grid-2 { grid-template-columns: 1fr !important; }
          .db-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .db-grid-form { grid-template-columns: 1fr !important; }
          .db-actions { grid-template-columns: 1fr !important; }
          .db-status { flex-direction: column !important; align-items: flex-start !important; }
          .db-header-nav { gap: 0 !important; }
          .db-main { padding: 16px 12px 80px !important; }
          .db-kpi { font-size: 22px !important; }
        }
      `}</style>

      {showSubModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowSubModal(false)}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', borderRadius: 4, padding: '32px 28px', width: '100%', maxWidth: 460, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSubModal(false)}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 20 }}>
              x
            </button>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 3, color: 'var(--gold3)', marginBottom: 10 }}>MON ABONNEMENT</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 20 }}>Plan Elite</h3>
            <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 20 }}>
              {[
                ['Nom', 'Plan Elite'],
                ['Prix', '5,99 EUR / semaine'],
                ['Duree', '7 jours renouvelable'],
                ['Statut', cancelDone ? 'Annulation planifiee' : 'Actif'],
                ['Annonces', '200 / semaine'],
                ['Reponses', '300 / semaine'],
                ['Estimations', '50 / mois'],
                ['Acces', 'Toutes fonctionnalites'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'var(--ink)', padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(200,57,43,.06)', border: '1px solid rgba(200,57,43,.2)', borderRadius: 3, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>
              En cas d&apos;annulation vous conservez l&apos;acces Elite jusqu&apos;a la fin de la semaine payee. Aucun remboursement.
            </div>
            {cancelDone ? (
              <div style={{ background: 'rgba(45,122,79,.1)', border: '1px solid rgba(45,122,79,.3)', borderRadius: 3, padding: '12px 16px', fontSize: 13, color: 'var(--success2)', textAlign: 'center' }}>
                Annulation confirmee. Acces maintenu jusqu&apos;a fin de periode.
              </div>
            ) : (
              <button onClick={cancelSubscription} disabled={cancelLoading}
                style={{ width: '100%', background: 'none', border: '1px solid rgba(200,57,43,.3)', borderRadius: 3, color: 'var(--red2)', cursor: cancelLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500, padding: '12px', opacity: cancelLoading ? .6 : 1 }}>
                {cancelLoading ? 'Annulation...' : 'Arreter le prelevement automatique'}
              </button>
            )}
          </div>
        </div>
      )}

      <header style={{ background: 'rgba(3,3,3,.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-label)', fontSize: 16, letterSpacing: 3, color: 'var(--white)' }}>
            A.<span style={{ color: 'var(--red)' }}>A</span>
          </Link>
          <nav style={{ display: 'flex', gap: 0, height: '100%', alignItems: 'stretch' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'tab-btn' + (tab === t.id ? ' active' : '')}
                style={{ background: 'none', border: 'none', borderBottom: '2px solid transparent', color: tab === t.id ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, padding: '0 12px', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isPro ? (
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 9, letterSpacing: 2, color: 'var(--gold2)', background: 'rgba(201,168,76,.08)', border: '1px solid var(--gold-border)', borderRadius: 2, padding: '3px 8px' }}>ELITE</span>
            ) : (
              <button onClick={upgradePro} className="btn-primary" style={{ fontSize: 11, padding: '7px 14px', letterSpacing: 1.5 }}>Elite</button>
            )}
            <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '6px 12px' }}>
              Quitter
            </button>
          </div>
        </div>
      </header>

      <main className="db-main" style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>

        {tab === 'home' && (
          <div className="db-fade">
            <div style={{ marginBottom: 28 }}>
              <div className="label" style={{ marginBottom: 8 }}>Espace personnel</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 400, letterSpacing: -.5 }}>
                Bonjour, <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{user.name || user.email.split('@')[0]}</span>
              </h1>
            </div>

            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPro ? 'var(--gold)' : 'var(--muted)', animation: isPro ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: 13, color: 'var(--muted3)' }}>
                  Plan <strong style={{ color: isPro ? 'var(--gold2)' : 'var(--muted2)', fontFamily: 'var(--font-label)', letterSpacing: 1 }}>{isPro ? 'ELITE' : 'GRATUIT'}</strong>
                  {isPro && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted)' }}>5,99 EUR / semaine</span>}
                </span>
              </div>
              {isPro ? (
                <button onClick={() => setShowSubModal(true)} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '5px 12px' }}>
                  Mon abonnement
                </button>
              ) : (
                <button onClick={upgradePro} className="btn-gold" style={{ fontSize: 11, padding: '8px 18px', letterSpacing: 1.5 }}>PASSER ELITE</button>
              )}
            </div>

            <div className="db-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 20 }}>
              {[
                { title: 'Creer', sub: 'une annonce', tab: 'annonce', pro: true },
                { title: 'Repondre', sub: 'a un acheteur', tab: 'reponse', pro: true },
                { title: 'Estimer', sub: 'le prix', tab: 'estimation', pro: false },
              ].map(a => (
                <div key={a.tab} className="action-tile" onClick={() => setTab(a.tab)}
                  style={{ background: 'var(--ink)', padding: '24px 16px', cursor: 'pointer', position: 'relative', textAlign: 'center' }}>
                  <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: 'var(--font-label)', fontSize: 7, letterSpacing: 1.5, color: a.pro ? 'var(--gold3)' : 'var(--success2)' }}>
                    {a.pro ? '♛ Abonne' : 'Gratuit'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{a.title}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontStyle: 'italic', fontWeight: 300, color: 'var(--muted2)', marginTop: 3 }}>{a.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 20 }}>
              {[
                { label: 'Annonces', val: usage.annonces, limit: isPro ? LIMIT_ANNONCES : credits.annonces.total, used: isPro ? usage.annonces : credits.annonces.used, color: 'var(--gold)', isPack: !isPro },
                { label: 'Reponses', val: usage.reponses, limit: isPro ? LIMIT_REPONSES : credits.reponses.total, used: isPro ? usage.reponses : credits.reponses.used, color: 'var(--red)', isPack: !isPro },
              ].map(s => {
                const pct = s.limit > 0 ? Math.min((s.used / s.limit) * 100, 100) : 0
                const remaining = s.limit - s.used
                return (
                  <div key={s.label} style={{ background: 'var(--ink)', padding: '20px 24px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted2)', letterSpacing: .5, marginBottom: 10, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, letterSpacing: -1, lineHeight: 1, marginBottom: 10 }}>
                      {s.isPack
                        ? <span style={{ color: remaining <= 2 ? 'var(--red2)' : 'var(--cream)' }}>{remaining}</span>
                        : <span>{s.val}<span style={{ fontSize: 13, color: 'var(--muted2)', fontStyle: 'italic' }}>/{s.limit}</span></span>}
                    </div>
                    <div style={{ background: 'var(--s3)', borderRadius: 1, height: 2, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: pct > 80 ? 'var(--red)' : s.color, transition: 'width 1.2s' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                      {s.isPack
                        ? (s.limit === 0 ? 'Aucun credit - achetez un pack' : remaining + ' restant(s) sur ' + s.limit)
                        : 'Cette semaine - ' + Math.max(0, s.limit - s.val) + ' restantes'}
                    </div>
                  </div>
                )
              })}
            </div>

            {!isPro && (
              <div style={{ border: '1px solid var(--gold-border)', borderRadius: 3, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,.04), transparent)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Passez Elite</div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Annonces et reponses incluses - 5,99 EUR / semaine</div>
                  </div>
                  <button onClick={upgradePro} className="btn-gold" style={{ fontSize: 11, padding: '12px 24px', letterSpacing: 2, flexShrink: 0 }}>PASSER ELITE</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'annonce'    && <AnnonceTab    isPro={isPro} upgradePro={upgradePro} onUsed={() => setUsage(u => ({ ...u, annonces: u.annonces + 1 }))} />}
        {tab === 'reponse'    && <ReponseTab    isPro={isPro} upgradePro={upgradePro} onUsed={() => setUsage(u => ({ ...u, reponses: u.reponses + 1 }))} />}
        {tab === 'estimation' && <EstimationTab onUsed={() => { const n = parseInt(localStorage.getItem('est_count') || '0') + 1; localStorage.setItem('est_count', n); setUsage(u => ({ ...u, estimations: n })) }} />}
        {tab === 'historique' && <HistoriqueTab />}
        {tab === 'tarifs'     && <TarifsTab isPro={isPro} upgradePro={upgradePro} />}
        {tab === 'profil'     && <ProfilTab user={user} isPro={isPro} upgradePro={upgradePro} openSubModal={() => setShowSubModal(true)} usage={usage} credits={credits} purchases={purchases} />}
      </main>
    </div>
  )
}

const S = {
  card: { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 3, padding: 24, marginBottom: 12 },
  inp: { background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--white)', fontSize: 14, padding: '6px 0', width: '100%', outline: 'none', transition: 'border-color .2s' },
  lbl: { fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 7 },
}

function LockScreen({ upgradePro, feature }) {
  return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px 24px', borderColor: 'var(--gold-border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,.04), transparent)', pointerEvents: 'none' }} />
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: -.3, marginBottom: 8 }}>Fonctionnalite Elite</h3>
      <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 16, lineHeight: 1.7 }}>{feature} est reservee au plan Elite.</p>
      <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 3, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65 }}>
        Pour acceder a ce systeme, abonnez-vous a 5,99 EUR/semaine ou achetez un pack.
      </div>
      <button onClick={upgradePro} className="btn-gold" style={{ fontSize: 12, padding: '13px 32px', letterSpacing: 2 }}>
        PASSER ELITE - 5,99 EUR / SEMAINE
      </button>
    </div>
  )
}

function AnnonceTab({ isPro, upgradePro, onUsed }) {
  const [form, setForm] = useState({
    categorie: '', marque: '', modele: '', annee: '', reference: '', couleur: '',
    etat: '', kilometrage: '', heuresUsage: '', nbProprietaires: '',
    carburant: '', boite: '', puissance: '', cylindree: '',
    ct: '', carnet: '', facture: '', garantie: '',
    defauts: '', reparations: '', options: '', accessoires: '',
    prix: '', negociable: '', ville: '', disponibilite: '', raison: '',
    livraison: '', fraisLivraison: '', urgence: 'normal',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [section, setSection] = useState(0)

  if (!isPro) return <LockScreen upgradePro={upgradePro} feature="La creation d'annonces" />

  const SECTIONS = [
    {
      title: 'Article', fields: [
        { key: 'categorie', label: 'Categorie', type: 'select', opts: ['Voiture', 'Moto', 'Velo', 'Electronique', 'Informatique', 'Telephone', 'Mobilier', 'Electromenager', 'Vetements', 'Sport', 'Jeux video', 'Livre', 'Bijou', 'Outil', 'Autre'] },
        { key: 'marque', label: 'Marque *', ph: 'BMW, Apple, Samsung...' },
        { key: 'modele', label: 'Modele *', ph: 'Serie 3, iPhone 15...' },
        { key: 'annee', label: 'Annee', ph: '2021', type: 'number' },
        { key: 'reference', label: 'Reference / Version', ph: 'M Sport, 128Go, XL...' },
        { key: 'couleur', label: 'Couleur', ph: 'Noir, Blanc, Rouge...' },
      ]
    },
    {
      title: 'Etat', fields: [
        { key: 'etat', label: 'Etat general *', type: 'select', opts: ['Neuf jamais utilise', 'Comme neuf', 'Tres bon etat', 'Bon etat', 'Etat correct', 'A reparer'] },
        { key: 'kilometrage', label: 'Kilometrage (vehicule)', ph: '75000', type: 'number' },
        { key: 'heuresUsage', label: 'Heures usage (machine)', ph: '120h' },
        { key: 'nbProprietaires', label: 'Nombre de proprietaires', ph: '1', type: 'number' },
        { key: 'defauts', label: 'Defauts et imperfections', ph: 'Rayures, bosses, voyants...', type: 'textarea' },
        { key: 'reparations', label: 'Reparations effectuees', ph: 'Embrayage refait, ecran change...', type: 'textarea' },
      ]
    },
    {
      title: 'Technique', fields: [
        { key: 'carburant', label: 'Carburant', type: 'select', opts: ['Non applicable', 'Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', 'Electrique', 'GPL'] },
        { key: 'boite', label: 'Boite de vitesse', type: 'select', opts: ['Non applicable', 'Manuelle', 'Automatique', 'Semi-automatique'] },
        { key: 'puissance', label: 'Puissance (CV ou W)', ph: '120 CV' },
        { key: 'cylindree', label: 'Cylindree', ph: '1598 cc' },
        { key: 'options', label: 'Equipements et options', ph: 'GPS, camera, sieges chauffants...', type: 'textarea' },
        { key: 'accessoires', label: 'Accessoires inclus', ph: 'Chargeur, housse, telecommande...', type: 'textarea' },
      ]
    },
    {
      title: 'Documents', fields: [
        { key: 'ct', label: 'Controle technique', type: 'select', opts: ['Non applicable', 'Valide', 'A refaire sous 2 mois', 'Non presente'] },
        { key: 'carnet', label: 'Carnet entretien', type: 'select', opts: ['Non applicable', 'Complet', 'Partiel', 'Absent'] },
        { key: 'facture', label: 'Facture achat', type: 'select', opts: ['Non disponible', 'Disponible'] },
        { key: 'garantie', label: 'Garantie restante', ph: '6 mois restants...' },
      ]
    },
    {
      title: 'Vente', fields: [
        { key: 'prix', label: 'Prix (EUR) *', ph: '11500', type: 'number' },
        { key: 'negociable', label: 'Prix negociable', type: 'select', opts: ['Non', 'Oui', 'Legerement'] },
        { key: 'ville', label: 'Ville *', ph: 'Lyon, Paris...' },
        { key: 'disponibilite', label: 'Disponibilite', ph: 'Immediate, weekend seulement...' },
        { key: 'livraison', label: 'Livraison possible', type: 'select', opts: ['Non', 'Oui', 'A discuter'] },
        { key: 'fraisLivraison', label: 'Frais livraison', ph: 'Gratuite, 15 EUR...' },
        { key: 'raison', label: 'Raison de la vente', ph: 'Upgrade, demenagement...' },
        { key: 'urgence', label: 'Urgence de vente', type: 'urgence' },
      ]
    },
  ]

  const current = SECTIONS[section]
  const specs = Object.entries(form).filter(([, v]) => v && v !== 'Non applicable' && v !== 'Non').map(([k, v]) => k + ': ' + v).join('\n')
  const filled = Object.values(form).filter(v => v && v !== 'Non applicable' && v !== 'Non').length
  const total = Object.keys(form).length

  const generate = async () => {
    if (!form.marque || !form.modele || !form.prix || !form.ville) {
      alert('Marque, modele, prix et ville sont obligatoires')
      return
    }
    setLoading(true)
    const res = await fetch('/api/ai/annonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs, lang: 'fr', urgence: form.urgence, type: form.categorie || 'article', inputData: form })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Outil IA</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Creer une annonce</h2>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '12px 20px', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1 }}>Formulaire complete</span>
            <span style={{ fontSize: 11, color: 'var(--gold2)', fontWeight: 600 }}>{Math.round((filled / total) * 100)}%</span>
          </div>
          <div style={{ background: 'var(--s3)', borderRadius: 1, height: 2 }}>
            <div style={{ width: Math.round((filled / total) * 100) + '%', height: '100%', background: 'linear-gradient(90deg, var(--gold3), var(--gold2))', transition: 'width .5s' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', background: 'var(--border)', marginBottom: 1, gap: 1 }}>
        {SECTIONS.map((s, i) => (
          <div key={i} onClick={() => setSection(i)}
            style={{ flex: 1, background: section === i ? 'var(--s1)' : 'var(--ink)', borderBottom: section === i ? '2px solid var(--gold)' : '2px solid transparent', padding: '10px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}>
            <div style={{ fontSize: 9, color: section === i ? 'var(--gold2)' : 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.title}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
        {current.fields.map(f => (
          <div key={f.key} style={{ background: 'var(--ink)', padding: '16px 20px', gridColumn: f.type === 'textarea' ? '1/-1' : 'auto' }}>
            <label style={S.lbl}>{f.label}</label>
            {f.type === 'select' ? (
              <select style={{ ...S.inp, appearance: 'none', cursor: 'pointer' }}
                value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                <option value="">Selectionner</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea style={{ ...S.inp, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }}
                placeholder={f.ph} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            ) : f.type === 'urgence' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginTop: 4 }}>
                {[['normal', 'Normal'], ['rapide', 'Rapide'], ['optimise', 'Max prix']].map(([v, l]) => (
                  <div key={v} onClick={() => setForm({ ...form, urgence: v })}
                    style={{ background: form.urgence === v ? 'rgba(201,168,76,.08)' : 'var(--s2)', borderBottom: form.urgence === v ? '2px solid var(--gold)' : '2px solid transparent', padding: '10px', textAlign: 'center', fontSize: 11, color: form.urgence === v ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', transition: 'all .15s' }}>
                    {l}
                  </div>
                ))}
              </div>
            ) : (
              <input style={S.inp} type={f.type || 'text'} placeholder={f.ph}
                value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
        {section > 0 && (
          <button onClick={() => setSection(s => s - 1)} className="btn-ghost" style={{ flex: 1, borderRadius: 0, borderColor: 'transparent', background: 'var(--ink)', fontSize: 12 }}>
            Precedent
          </button>
        )}
        {section < SECTIONS.length - 1 ? (
          <button onClick={() => setSection(s => s + 1)} className="btn-primary" style={{ flex: 1, borderRadius: 0, fontSize: 12, padding: '14px' }}>
            Suivant
          </button>
        ) : (
          <button onClick={generate} disabled={loading} className="btn-primary"
            style={{ flex: 1, borderRadius: 0, fontSize: 13, padding: '16px', opacity: loading ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Generation...</>
              : 'GENERER MON ANNONCE'}
          </button>
        )}
      </div>

      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          {result.score && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--s1)', border: '1px solid var(--border)', padding: '14px 20px', marginBottom: 1 }}>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 38, letterSpacing: -2, color: result.score.score >= 70 ? 'var(--gold2)' : result.score.score >= 50 ? 'var(--warning)' : 'var(--red2)', lineHeight: 1 }}>
                {result.score.score}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>Score qualite - {result.score.grade}</div>
                {result.score.suggestions?.slice(0, 2).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--muted2)' }}>- {s}</div>
                ))}
              </div>
            </div>
          )}
          {result.annonce?.titre && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', padding: '16px 20px', marginBottom: 1 }}>
              <div style={S.lbl}>Titre</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>{result.annonce.titre}</div>
            </div>
          )}
          {[
            ['Description', result.annonce?.description],
            ['Points forts', result.annonce?.pointsForts],
            ['Transparence', result.annonce?.defauts],
            ['Prix conseille', result.annonce?.prixConseil],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
              <div style={S.lbl}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', padding: '16px 20px', marginBottom: 1 }}>
              <div style={S.lbl}>Version courte - Facebook / SMS</div>
              <div style={{ fontSize: 13, color: 'var(--muted3)', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={() => { navigator.clipboard.writeText(result.raw || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 2, color: copied ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: '12px', marginTop: 1 }}>
            {copied ? 'Copie !' : 'Copier l\'annonce complete'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReponseTab({ isPro, upgradePro, onUsed }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isPro) return <LockScreen upgradePro={upgradePro} feature="La reponse aux acheteurs" />

  const generate = async () => {
    if (!message) return
    setLoading(true)
    const res = await fetch('/api/ai/reponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, contexte })
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Outil IA</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Repondre a un acheteur</h2>
      </div>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
        <label style={S.lbl}>Message recu</label>
        <textarea style={{ ...S.inp, minHeight: 100, resize: 'vertical', lineHeight: 1.7 }}
          placeholder="Collez le message de l'acheteur ici..." value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
        <label style={S.lbl}>Contexte (optionnel)</label>
        <textarea style={{ ...S.inp, minHeight: 60, resize: 'vertical', lineHeight: 1.7 }}
          placeholder="Prix demande, etat de l'objet..." value={contexte} onChange={e => setContexte(e.target.value)} />
      </div>
      <button onClick={generate} disabled={loading || !message} className="btn-primary"
        style={{ width: '100%', fontSize: 13, padding: '16px', opacity: (loading || !message) ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {loading
          ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Generation...</>
          : 'GENERER LA REPONSE'}
      </button>
      {result?.reponse && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', padding: '20px', marginBottom: 1 }}>
            <div style={S.lbl}>Reponse prete a copier</div>
            <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion && (
            <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', padding: '16px 20px', marginBottom: 1 }}>
              <div style={S.lbl}>Conseil de negociation</div>
              <div style={{ fontSize: 13, color: 'var(--muted3)', lineHeight: 1.7, fontStyle: 'italic' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button className="copy-btn"
            onClick={() => { navigator.clipboard.writeText(result.reponse.reponsePrete); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 2, color: copied ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: '12px', marginTop: 1 }}>
            {copied ? 'Copie !' : 'Copier la reponse'}
          </button>
        </div>
      )}
    </div>
  )
}

function EstimationTab({ onUsed }) {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs })
    })
    const data = await res.json()
    if (data.error && data.upgrade) { alert(data.message); setLoading(false); return }
    setResult(data)
    setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Outil gratuit</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Estimer le prix</h2>
      </div>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
        <label style={S.lbl}>Decrivez votre article</label>
        <textarea style={{ ...S.inp, minHeight: 120, resize: 'vertical', lineHeight: 1.7 }}
          placeholder="Ex: iPhone 15 Pro 256Go noir, tres bon etat, batterie 94%, avec boite..." value={specs} onChange={e => setSpecs(e.target.value)} />
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>3 estimations gratuites par jour</div>
      </div>
      <button onClick={estimate} disabled={loading || !specs} className="btn-primary"
        style={{ width: '100%', fontSize: 13, padding: '16px', opacity: (loading || !specs) ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {loading
          ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /> Analyse...</>
          : 'ESTIMER LE PRIX'}
      </button>
      {result && !result.error && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)' }}>
          {[['Basse', result.low, 'var(--red2)'], ['Moyenne', result.mid, 'var(--gold2)'], ['Haute', result.high, 'var(--success2)']].map(([label, val, color]) => (
            <div key={label} style={{ background: 'var(--ink)', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color, letterSpacing: -1 }}>
                {Number(val).toLocaleString('fr-FR')} EUR
              </div>
            </div>
          ))}
          {result.note && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', gridColumn: '1/-1', padding: '14px 20px', marginTop: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--muted2)', fontStyle: 'italic', lineHeight: 1.65 }}>{result.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistoriqueTab() {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('annonces')

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/annonces').then(r => r.json()),
      fetch('/api/dashboard/reponses').then(r => r.json()),
    ]).then(([a, r]) => {
      setAnnonces(a.annonces || [])
      setReponses(r.reponses || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Mes creations</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Historique</h2>
      </div>
      <div style={{ display: 'flex', gap: 1, background: 'var(--border)', marginBottom: 14 }}>
        {[['annonces', 'Annonces (' + annonces.length + ')'], ['reponses', 'Reponses (' + reponses.length + ')']].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)}
            style={{ flex: 1, background: section === id ? 'var(--s1)' : 'var(--ink)', border: 'none', borderBottom: section === id ? '2px solid var(--gold)' : '2px solid transparent', color: section === id ? 'var(--gold2)' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, padding: '12px', transition: 'all .15s' }}>
            {label}
          </button>
        ))}
      </div>
      {loading && <div style={{ fontSize: 13, color: 'var(--muted2)', padding: 20, textAlign: 'center' }}>Chargement...</div>}
      {section === 'annonces' && !loading && (
        annonces.length === 0
          ? <div style={{ ...S.card, textAlign: 'center', padding: 40, color: 'var(--muted2)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Aucune annonce generee</div>
          : annonces.map(a => (
            <div key={a.id} style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre || 'Sans titre'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{a.type} - {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              {a.scoreGrade && <div style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: a.score >= 70 ? 'var(--gold2)' : 'var(--muted2)', flexShrink: 0 }}>{a.scoreGrade}</div>}
            </div>
          ))
      )}
      {section === 'reponses' && !loading && (
        reponses.length === 0
          ? <div style={{ ...S.card, textAlign: 'center', padding: 40, color: 'var(--muted2)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Aucune reponse generee</div>
          : reponses.map(r => (
            <div key={r.id} style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 6 }}>Message recu - {r.messageAcheteur.slice(0, 80)}</div>
              <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.65 }}>{r.reponsePrete.slice(0, 120)}...</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
            </div>
          ))
      )}
    </div>
  )
}

function TarifsTab({ isPro, upgradePro }) {
  const PACKS = [
    { name: '5 annonces', price: '9,99 EUR', unit: '2,00 EUR/ann.', link: process.env.NEXT_PUBLIC_STRIPE_PACK5 || '' },
    { name: '10 annonces', price: '17,99 EUR', unit: '1,80 EUR/ann.', link: process.env.NEXT_PUBLIC_STRIPE_PACK10 || '' },
    { name: '50 reponses', price: '14,99 EUR', unit: '0,30 EUR/rep.', link: process.env.NEXT_PUBLIC_STRIPE_REP50 || '' },
    { name: '500 reponses', price: '39,99 EUR', unit: '0,08 EUR/rep.', link: process.env.NEXT_PUBLIC_STRIPE_REP500 || '' },
  ]

  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Offres</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Tarifs</h2>
      </div>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--gold-border)', padding: 24, marginBottom: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(201,168,76,.04),transparent)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: isPro ? 0 : 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Plan Elite</div>
            <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.65 }}>Tout inclus - annonces, reponses, estimations</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: 38, color: 'var(--gold2)', letterSpacing: -2, lineHeight: 1 }}>5,99 EUR</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>par semaine</div>
          </div>
        </div>
        {isPro ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gold2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s infinite' }} />
            Plan Elite actif
          </div>
        ) : (
          <button onClick={upgradePro} className="btn-gold" style={{ width: '100%', fontSize: 12, padding: '14px', letterSpacing: 2 }}>
            PASSER ELITE - 5,99 EUR / SEMAINE
          </button>
        )}
      </div>
      <div style={{ padding: '14px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>ou packs a l&apos;unite</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
        {PACKS.map(p => (
          <div key={p.name} style={{ background: 'var(--ink)', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 14 }}>{p.unit} - Paiement unique</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 20, color: 'var(--muted3)', letterSpacing: -1 }}>{p.price}</span>
              <button onClick={() => p.link ? window.open(p.link, '_blank') : alert('Lien non configure')}
                className="btn-ghost" style={{ fontSize: 11, padding: '7px 16px' }}>
                Acheter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfilTab({ user, isPro, upgradePro, openSubModal, usage, credits, purchases }) {
  return (
    <div className="db-fade">
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 8 }}>Mon compte</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: -.5 }}>Profil</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
        <div style={{ background: 'var(--ink)', padding: '20px 24px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Compte</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 2 }}>{user.name || 'Sans nom'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{user.email}</div>
        </div>
        <div style={{ background: 'var(--ink)', padding: '20px 24px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Plan</div>
          <div style={{ fontFamily: 'var(--font-label)', fontSize: 24, letterSpacing: 2, color: isPro ? 'var(--gold2)' : 'var(--muted2)', marginBottom: 2 }}>{isPro ? 'ELITE' : 'GRATUIT'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
        {[
          { val: usage.annonces, label: 'Annonces' },
          { val: usage.reponses, label: 'Reponses' },
          { val: usage.estimations, label: 'Estimations' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--s1)', padding: '18px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Abonnement</div>
        {isPro ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, color: 'var(--cream)', marginBottom: 3 }}>Plan Elite actif - 5,99 EUR / semaine</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Annulable a tout moment - Non remboursable</div>
            </div>
            <button onClick={openSubModal} className="btn-ghost" style={{ fontSize: 11 }}>Gerer</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Plan gratuit - Passez Elite pour tout debloquer</div>
            <button onClick={upgradePro} className="btn-gold" style={{ fontSize: 11, padding: '9px 20px', letterSpacing: 1.5 }}>PASSER ELITE</button>
          </div>
        )}
      </div>
      {isPro && <ReferralSection />}
      {purchases && purchases.length > 0 && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginTop: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Historique des achats</div>
          {purchases.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>{p.packName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 16, color: 'var(--gold2)' }}>{p.amount} EUR</div>
                <div style={{ fontSize: 10, color: 'var(--muted2)' }}>{p.quantity} {p.packType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReferralSection() {
  const [code, setCode] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral/generate').then(r => r.json()).then(data => {
      if (data.code) setCode(data.code)
    }).catch(() => {})
  }, [])

  if (!code) return null

  const link = (typeof window !== 'undefined' ? window.location.origin : '') + '/?ref=' + code

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', padding: '20px 24px', marginTop: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Parrainage</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 12, lineHeight: 1.65 }}>
        Parrainez un ami - il recoit <strong style={{ color: 'var(--cream)' }}>1 semaine gratuite</strong>.
      </div>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted2)', wordBreak: 'break-all', marginBottom: 10 }}>
        {link}
      </div>
      <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="btn-ghost" style={{ width: '100%', fontSize: 11, color: copied ? 'var(--gold2)' : 'var(--muted2)', borderColor: copied ? 'var(--gold-border)' : 'var(--border2)' }}>
        {copied ? 'Lien copie !' : 'Copier mon lien'}
      </button>
    </div>
  )
}
