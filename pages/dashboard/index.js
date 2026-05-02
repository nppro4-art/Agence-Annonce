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

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      setLoading(false)
      if (router.query.subscribed) setTab('home')
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

  const manageSubscription = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const isPro = user?.plan === 'pro' && user?.subStatus === 'active'
  const LIMIT_ANNONCES = 200
  const LIMIT_REPONSES = 100
  const LIMIT_EST = 50

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--red)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }}></div>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Chargement...</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }
        .fade-up { animation: fadeUp .5s ease forwards; }
        .action-card { transition: all .2s cubic-bezier(.4,0,.2,1); cursor: pointer; }
        .action-card:hover { transform: translateY(-3px); border-color: rgba(255,45,45,.4) !important; box-shadow: 0 8px 32px rgba(255,45,45,.08); }
        .tab-item { transition: all .15s; cursor: pointer; }
        .copy-btn:hover { border-color: var(--success) !important; color: var(--success) !important; }
        .progress-bar { transition: width 1s cubic-bezier(.4,0,.2,1); }
      `}</style>

      {/* NAV */}
      <nav style={{ background: 'rgba(5,5,5,.95)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>
            Agence d&apos;<span style={{ color: 'var(--red)' }}>Annonce</span>
          </Link>
          {isPro && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--red)', background: 'rgba(255,45,45,.1)', border: '1px solid rgba(255,45,45,.2)', borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>
              Elite
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isPro && (
            <button onClick={upgradePro} style={{ background: 'var(--red)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 1, padding: '7px 14px', transition: 'all .2s' }}>
              ⚡ Passer Elite
            </button>
          )}
          <button onClick={logout} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '7px 12px' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div style={{ display: 'flex', background: 'var(--s1)', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }}>
        {[
          ['home', '🏠', 'Accueil'],
          ['annonce', '✍️', 'Annonce'],
          ['reponse', '💬', 'Répondre'],
          ['estimation', '💰', 'Estimer'],
          ['historique', '📋', 'Historique'],
          ['profil', '👤', 'Profil'],
          ['tarifs', '💎', 'Tarifs'],
        ].map(([id, icon, label]) => (
          <div key={id} className="tab-item"
            onClick={() => setTab(id)}
            style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: tab === id ? 'var(--white)' : 'var(--muted2)', borderBottom: tab === id ? '2px solid var(--red)' : '2px solid transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{icon}</span>
            <span style={{ display: window?.innerWidth > 480 ? 'inline' : 'none' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* ACCUEIL */}
        {tab === 'home' && (
          <div className="fade-up">
            {/* Bannière bienvenue */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,45,45,.08), rgba(255,45,45,.02))', border: '1px solid rgba(255,45,45,.2)', borderRadius: 16, padding: '20px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: .5, marginBottom: 4 }}>
                  Bonjour {user.name || user.email.split('@')[0]} 👋
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
                  {isPro ? '✅ Plan Elite actif — tout illimité' : '🔓 Plan gratuit — passez Elite pour tout débloquer'}
                </div>
              </div>
              {isPro && (
                <button onClick={manageSubscription} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '7px 12px' }}>
                  Gérer l&apos;abonnement
                </button>
              )}
            </div>

            {/* Crédits & Usage */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 14 }}>
                {isPro ? 'UTILISATION CE MOIS (ELITE)' : 'MES CRÉDITS'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Annonces */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>✍️ Annonces</span>
                    <span style={{ fontSize: 12 }}>
                      {isPro ? (
                        <span style={{ color: 'var(--muted2)' }}>{usage.annonces} utilisées / {LIMIT_ANNONCES} ce mois</span>
                      ) : (
                        <span style={{ color: credits.annonces.remaining <= 2 ? '#f87171' : 'var(--success)', fontWeight: 700 }}>
                          {credits.annonces.remaining} crédit{credits.annonces.remaining > 1 ? 's' : ''} restant{credits.annonces.remaining > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  {isPro ? (
                    <div style={{ background: 'var(--s3)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ width: Math.min((usage.annonces/LIMIT_ANNONCES)*100, 100) + '%', height: '100%', background: usage.annonces > LIMIT_ANNONCES*0.8 ? '#f87171' : 'var(--red)', borderRadius: 4 }}></div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {credits.annonces.total === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Aucun crédit — achetez un pack ou passez Elite</div>
                      ) : (
                        Array.from({ length: Math.min(credits.annonces.total, 20) }).map((_, i) => (
                          <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: i < credits.annonces.used ? 'var(--s4)' : 'var(--red)', border: '1px solid ' + (i < credits.annonces.used ? 'var(--border)' : 'rgba(255,45,45,.4)'), transition: 'all .3s' }}></div>
                        ))
                      )}
                      {credits.annonces.total > 20 && <span style={{ fontSize: 11, color: 'var(--muted2)' }}>+{credits.annonces.total - 20} autres</span>}
                    </div>
                  )}
                </div>

                {/* Réponses */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>💬 Réponses acheteurs</span>
                    <span style={{ fontSize: 12 }}>
                      {isPro ? (
                        <span style={{ color: 'var(--muted2)' }}>{usage.reponses} utilisées / {LIMIT_REPONSES} ce mois</span>
                      ) : (
                        <span style={{ color: credits.reponses.remaining <= 5 ? '#f87171' : 'var(--stripe)', fontWeight: 700 }}>
                          {credits.reponses.remaining} crédit{credits.reponses.remaining > 1 ? 's' : ''} restant{credits.reponses.remaining > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  {isPro ? (
                    <div style={{ background: 'var(--s3)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ width: Math.min((usage.reponses/LIMIT_REPONSES)*100, 100) + '%', height: '100%', background: usage.reponses > LIMIT_REPONSES*0.8 ? '#f87171' : 'var(--stripe)', borderRadius: 4 }}></div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {credits.reponses.total === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Aucun crédit — achetez un pack ou passez Elite</div>
                      ) : (
                        Array.from({ length: Math.min(credits.reponses.total, 20) }).map((_, i) => (
                          <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: i < credits.reponses.used ? 'var(--s4)' : 'var(--stripe)', border: '1px solid ' + (i < credits.reponses.used ? 'var(--border)' : 'rgba(103,114,229,.4)'), transition: 'all .3s' }}></div>
                        ))
                      )}
                      {credits.reponses.total > 20 && <span style={{ fontSize: 11, color: 'var(--muted2)' }}>+{credits.reponses.total - 20} autres</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton racheter si pas Elite et crédits bas */}
              {!isPro && (credits.annonces.remaining <= 2 || credits.reponses.remaining <= 5) && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,45,45,.05)', border: '1px solid rgba(255,45,45,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted2)' }}>⚠️ Crédits bientôt épuisés</div>
                  <button onClick={() => setTab('tarifs')} style={{ background: 'var(--red)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 1, padding: '7px 14px' }}>
                    Recharger →
                  </button>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 12 }}>ACTIONS RAPIDES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '✍️', label: 'Créer une annonce', tab: 'annonce', pro: true },
                { icon: '💬', label: 'Répondre', tab: 'reponse', pro: true },
                { icon: '💰', label: 'Estimer', tab: 'estimation', pro: false },
              ].map(a => (
                <div key={a.tab} className="action-card"
                  onClick={() => setTab(a.tab)}
                  style={{ background: 'var(--s1)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '18px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>{a.icon}</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: .5, marginBottom: 6, color: (!isPro && a.pro) ? 'var(--muted2)' : 'var(--white)' }}>{a.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: a.pro ? 'var(--red)' : 'var(--success)', background: a.pro ? 'rgba(255,45,45,.08)' : 'rgba(0,217,126,.08)', border: a.pro ? '1px solid rgba(255,45,45,.2)' : '1px solid rgba(0,217,126,.2)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>
                    {a.pro ? 'Elite' : 'Gratuit'}
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade banner si pas pro */}
            {!isPro && (
              <div style={{ background: 'linear-gradient(135deg, rgba(255,45,45,.07), rgba(255,45,45,.02))', border: '1.5px solid rgba(255,45,45,.25)', borderRadius: 16, padding: '22px 20px' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 8 }}>Passez Elite — 5,99€/semaine</div>
                <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 18, lineHeight: 1.7 }}>
                  Annonces illimitées, réponses acheteurs, score qualité, historique complet. Annulable à tout moment.
                </div>
                <button onClick={upgradePro} style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '13px 24px', transition: 'all .2s' }}>
                  ⚡ PASSER ELITE — 5,99€/SEMAINE
                </button>
              </div>
            )}
          </div>
        )}

        {/* ANNONCE */}
        {tab === 'annonce' && <AnnonceTab user={user} isPro={isPro} upgradePro={upgradePro} onUsed={() => setUsage(u => ({...u, annonces: u.annonces + 1}))}/>}

        {/* REPONSE */}
        {tab === 'reponse' && <ReponseTab user={user} isPro={isPro} upgradePro={upgradePro} onUsed={() => setUsage(u => ({...u, reponses: u.reponses + 1}))}/>}

        {/* ESTIMATION */}
        {tab === 'estimation' && <EstimationTab onUsed={() => { const n = parseInt(localStorage.getItem('est_count')||'0')+1; localStorage.setItem('est_count', n); setUsage(u => ({...u, estimations: n})) }}/>}

        {/* HISTORIQUE */}
        {tab === 'historique' && <HistoriqueTab/>}

        {/* TARIFS */}
        {tab === 'tarifs' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,rgba(255,45,45,.08),rgba(255,45,45,.02))', border: '1.5px solid rgba(255,45,45,.3)', borderRadius: 16, padding: '22px 20px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, marginBottom: 4 }}>Plan Elite</div>
                  <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Tout illimité — annonces, réponses, estimations</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--red)', letterSpacing: -2, lineHeight: 1 }}>5,99€</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>par semaine</div>
                </div>
              </div>
              {isPro ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%' }}></div>
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Plan Elite actif ✓</div>
                </div>
              ) : (
                <button onClick={upgradePro} style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '13px', transition: 'all .2s' }}>
                  ⚡ PASSER ELITE — 5,99€/SEMAINE
                </button>
              )}
            </div>

            <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 12 }}>PACKS À L'UNITÉ</div>
            {[
              { name: '5 annonces', price: '9,99€', unit: '2,00€/annonce', key: 'NEXT_PUBLIC_STRIPE_PACK5' },
              { name: '10 annonces', price: '17,99€', unit: '1,80€/annonce', key: 'NEXT_PUBLIC_STRIPE_PACK10' },
              { name: '50 réponses', price: '14,99€', unit: '0,30€/réponse', key: 'NEXT_PUBLIC_STRIPE_REP50' },
              { name: '500 réponses', price: '39,99€', unit: '0,08€/réponse', key: 'NEXT_PUBLIC_STRIPE_REP500' },
            ].map(p => (
              <div key={p.name} style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: .5 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{p.unit} · Paiement unique</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'var(--muted2)' }}>{p.price}</div>
                  <button onClick={() => window.open(process.env['NEXT_PUBLIC_STRIPE_PACK5'] || '#', '_blank')}
                    style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '7px 12px', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                    Acheter →
                  </button>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
              Paiements sécurisés par Stripe · Non remboursables
            </div>
          </div>
        )}

        {/* PROFIL */}
        {tab === 'profil' && <ProfilTab user={user} isPro={isPro} upgradePro={upgradePro} manageSubscription={manageSubscription} usage={usage} limitAnnonces={LIMIT_ANNONCES} limitReponses={LIMIT_REPONSES} credits={credits} purchases={purchases}/>}

        {/* TARIFS */}
        {tab === 'tarifs' && <TarifsTab user={user} isPro={isPro} upgradePro={upgradePro}/>}

      </div>
    </div>
  )
}

// ── ANNONCE TAB ──────────────────────────────────────────
function AnnonceTab({ user, isPro, upgradePro, onUsed }) {
  const [form, setForm] = useState({ marque: '', modele: '', annee: '', kilometrage: '', etat: '', carburant: '', boite: '', defauts: '', options: '', prix: '', ville: '', urgence: 'normal', raison: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const inp = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%', transition: 'border-color .2s' }
  const lbl = { fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }

  if (!isPro) return (
    <div style={{ ...card, textAlign: 'center', padding: 36 }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, marginBottom: 8 }}>Fonctionnalité Elite</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, lineHeight: 1.7 }}>Passez Elite pour créer des annonces professionnelles illimitées.</div>
      <button onClick={upgradePro} style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '13px 24px' }}>
        ⚡ PASSER ELITE — 5,99€/SEMAINE
      </button>
    </div>
  )

  const specs = Object.entries(form).filter(([,v]) => v).map(([k,v]) => `- ${k}: ${v}`).join('\n')

  const generate = async () => {
    if (!form.marque || !form.modele) { alert('Marque et modèle obligatoires.'); return }
    setLoading(true)
    const res = await fetch('/api/ai/annonce', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs, lang: 'fr', urgence: form.urgence, type: 'article', inputData: form })
    })
    const data = await res.json()
    setResult(data); setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✍️ Informations de l&apos;article
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={lbl}>Marque *</label><input style={inp} placeholder="BMW, Apple, Ikea…" value={form.marque} onChange={e => setForm({...form, marque: e.target.value})}/></div>
          <div><label style={lbl}>Modèle *</label><input style={inp} placeholder="Série 3, iPhone 15, KALLAX…" value={form.modele} onChange={e => setForm({...form, modele: e.target.value})}/></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={lbl}>Année</label><input style={inp} type="number" placeholder="2019" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})}/></div>
          <div><label style={lbl}>Kilométrage</label><input style={inp} type="number" placeholder="75000" value={form.kilometrage} onChange={e => setForm({...form, kilometrage: e.target.value})}/></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl}>État général *</label>
            <select style={{ ...inp, appearance: 'none' }} value={form.etat} onChange={e => setForm({...form, etat: e.target.value})}>
              <option value="">— Sélectionner</option>
              {['Excellent','Très bon','Bon','Moyen','À réparer'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Carburant</label>
            <select style={{ ...inp, appearance: 'none' }} value={form.carburant} onChange={e => setForm({...form, carburant: e.target.value})}>
              <option value="">—</option>
              {['Essence','Diesel','Hybride','Électrique','Non applicable'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Défauts connus</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', lineHeight: 1.6 }} placeholder="Rayures, défauts, voyants allumés…" value={form.defauts} onChange={e => setForm({...form, defauts: e.target.value})}/>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Équipements inclus</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', lineHeight: 1.6 }} placeholder="GPS, caméra recul, boîte d'origine, chargeur…" value={form.options} onChange={e => setForm({...form, options: e.target.value})}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={lbl}>Prix souhaité (€) *</label><input style={inp} type="number" placeholder="11500" value={form.prix} onChange={e => setForm({...form, prix: e.target.value})}/></div>
          <div><label style={lbl}>Ville *</label><input style={inp} placeholder="Lyon, Paris…" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}/></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Urgence de vente</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[['normal','⏳ Normal'],['rapide','🔥 Rapide'],['optimise','💎 Max prix']].map(([v,l]) => (
              <div key={v} onClick={() => setForm({...form, urgence: v})}
                style={{ background: form.urgence === v ? 'rgba(255,176,32,.1)' : 'var(--s2)', border: form.urgence === v ? '1.5px solid var(--warning)' : '1.5px solid var(--border)', borderRadius: 8, padding: '9px 4px', textAlign: 'center', fontSize: 11, color: form.urgence === v ? 'var(--warning)' : 'var(--muted2)', cursor: 'pointer', transition: 'all .15s' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          style={{ width: '100%', background: loading ? 'var(--s4)' : 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '14px', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div> Génération en cours...</> : '⚡ GÉNÉRER MON ANNONCE'}
        </button>
      </div>

      {result && !result.error && (
        <div style={card}>
          {/* Score */}
          {result.score && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: result.score.score >= 70 ? 'var(--success)' : result.score.score >= 50 ? 'var(--warning)' : '#f87171', lineHeight: 1 }}>{result.score.score}/100</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Score qualité : {result.score.grade}</div>
                {result.score.suggestions?.slice(0,2).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--muted2)' }}>💡 {s}</div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--red)', marginBottom: 14, opacity: .8 }}>ANNONCE GÉNÉRÉE</div>
          {result.annonce?.titre && <div style={{ fontFamily: 'Bebas Neue', fontSize: 17, padding: '12px 14px', background: 'var(--s2)', borderRadius: 10, borderLeft: '3px solid var(--red)', marginBottom: 12, lineHeight: 1.4 }}>{result.annonce.titre}</div>}
          {[['📋 Description', result.annonce?.description], ['⭐ Points forts', result.annonce?.pointsForts], ['⚠️ Défauts', result.annonce?.defauts], ['💰 Prix conseillé', result.annonce?.prixConseil]].map(([label, val]) => val && (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>⚡ Version courte (Facebook / SMS)</div>
              <div style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--warning)' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(result.raw || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: copied ? 'var(--success)' : 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '11px', transition: 'all .15s' }}>
            {copied ? '✅ Copié !' : '📋 Copier l\'annonce complète'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── REPONSE TAB ──────────────────────────────────────────
function ReponseTab({ user, isPro, upgradePro, onUsed }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const ta = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '11px 13px', outline: 'none', width: '100%', resize: 'vertical', minHeight: 90, lineHeight: 1.7 }

  if (!isPro) return (
    <div style={{ ...card, textAlign: 'center', padding: 36 }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, marginBottom: 8 }}>Fonctionnalité Elite</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, lineHeight: 1.7 }}>Passez Elite pour répondre aux acheteurs avec l&apos;IA.</div>
      <button onClick={upgradePro} style={{ background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '13px 24px' }}>
        ⚡ PASSER ELITE
      </button>
    </div>
  )

  const generate = async () => {
    if (!message) return
    setLoading(true)
    const res = await fetch('/api/ai/reponse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, contexte })
    })
    const data = await res.json()
    setResult(data); setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, marginBottom: 16 }}>💬 Message de l&apos;acheteur</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Message reçu *</label>
          <textarea style={ta} placeholder="Colle ici le message de l'acheteur…" value={message} onChange={e => setMessage(e.target.value)}/>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Contexte (optionnel)</label>
          <textarea style={{ ...ta, minHeight: 60 }} placeholder="Prix demandé, état de l'objet, infos utiles…" value={contexte} onChange={e => setContexte(e.target.value)}/>
        </div>
        <button onClick={generate} disabled={loading || !message}
          style={{ width: '100%', background: loading ? 'var(--s4)' : 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '14px', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div> Génération...</> : '⚡ GÉNÉRER LA RÉPONSE'}
        </button>
      </div>
      {result?.reponse && (
        <div style={card}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--red)', marginBottom: 14, opacity: .8 }}>RÉPONSE GÉNÉRÉE</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Réponse prête à copier</div>
            <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '14px', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--success)' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💡 Conseil de négociation</div>
              <div style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.7, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid var(--warning)' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(result.reponse.reponsePrete); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: copied ? 'var(--success)' : 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '11px', transition: 'all .15s' }}>
            {copied ? '✅ Copié !' : '📋 Copier la réponse'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── ESTIMATION TAB ───────────────────────────────────────
function EstimationTab({ onUsed }) {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs })
    })
    const data = await res.json()
    if (data.error && data.upgrade) {
      alert(data.message); setLoading(false); return
    }
    setResult(data); setLoading(false)
    if (!data.error) onUsed()
  }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, marginBottom: 16 }}>💰 Estimer le prix de vente</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Décrivez votre article *</label>
          <textarea
            style={{ background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '11px 13px', outline: 'none', width: '100%', resize: 'vertical', minHeight: 120, lineHeight: 1.7 }}
            placeholder="Ex: Peugeot 308 SW 2019, 85 000 km, diesel, très bon état, CT valide, GPS…"
            value={specs} onChange={e => setSpecs(e.target.value)}/>
        </div>
        <button onClick={estimate} disabled={loading || !specs}
          style={{ width: '100%', background: loading ? 'var(--s4)' : 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '14px', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div> Analyse...</> : '🔍 ESTIMER LE PRIX'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>3 estimations gratuites par jour</div>
      </div>
      {result && !result.error && (
        <div style={{ ...card, border: '1px solid rgba(255,176,32,.25)' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, color: 'var(--warning)', marginBottom: 14, letterSpacing: 2, opacity: .8 }}>ESTIMATION DU MARCHÉ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['Basse', result.low, '#f87171'], ['Moyenne', result.mid, 'var(--warning)'], ['Haute', result.high, 'var(--success)']].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center', background: 'var(--s2)', borderRadius: 10, padding: '14px 4px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color }}>{Number(val).toLocaleString('fr-FR')} €</div>
              </div>
            ))}
          </div>
          {result.note && <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.65, fontStyle: 'italic' }}>{result.note}</div>}
        </div>
      )}
    </div>
  )
}

// ── HISTORIQUE TAB ───────────────────────────────────────
function HistoriqueTab() {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('annonces')

  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 10 }

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

  if (loading) return <div style={{ fontSize: 13, color: 'var(--muted2)', padding: 20, textAlign: 'center' }}>Chargement...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['annonces', `✍️ Annonces (${annonces.length})`], ['reponses', `💬 Réponses (${reponses.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)}
            style={{ flex: 1, background: activeSection === id ? 'rgba(255,45,45,.1)' : 'var(--s2)', border: activeSection === id ? '1.5px solid var(--red)' : '1.5px solid var(--border)', borderRadius: 10, color: activeSection === id ? 'var(--white)' : 'var(--muted2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '10px', transition: 'all .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'annonces' && (
        annonces.length === 0
          ? <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 32 }}>Aucune annonce générée</div>
          : annonces.map(a => (
            <div key={a.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, marginBottom: 4 }}>{a.titre || 'Annonce sans titre'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                {a.scoreGrade && (
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: a.score >= 70 ? 'var(--success)' : a.score >= 50 ? 'var(--warning)' : '#f87171', flexShrink: 0 }}>
                    {a.scoreGrade}
                  </div>
                )}
              </div>
              {a.description && <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 8, lineHeight: 1.6 }}>{a.description.slice(0, 100)}…</div>}
            </div>
          ))
      )}

      {activeSection === 'reponses' && (
        reponses.length === 0
          ? <div style={{ ...card, textAlign: 'center', fontSize: 13, color: 'var(--muted2)', padding: 32 }}>Aucune réponse générée</div>
          : reponses.map(r => (
            <div key={r.id} style={card}>
              <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 6 }}>Message reçu : &ldquo;{r.messageAcheteur.slice(0, 80)}&rdquo;</div>
              <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.65 }}>{r.reponsePrete.slice(0, 120)}…</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          ))
      )}
    </div>
  )
}

// ── PROFIL TAB ───────────────────────────────────────────
function ProfilTab({ user, isPro, upgradePro, manageSubscription, usage, limitAnnonces, limitReponses, credits, purchases }) {
  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }

  return (
    <div>
      {/* Infos compte */}
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 14 }}>MON COMPTE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, background: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 22, color: 'white', flexShrink: 0 }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: .5 }}>{user.name || 'Utilisateur'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'var(--s2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Plan</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: isPro ? 'var(--success)' : 'var(--muted2)' }}>{isPro ? 'Elite ✓' : 'Gratuit'}</div>
          </div>
          <div style={{ flex: 1, background: 'var(--s2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Membre depuis</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 14 }}>{new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 14 }}>MES STATISTIQUES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { icon: '✍️', val: usage.annonces, label: 'Annonces créées' },
            { icon: '💬', val: usage.reponses, label: 'Réponses générées' },
            { icon: '💰', val: usage.estimations, label: 'Estimations faites' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--s2)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: -1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique des achats */}
      {purchases && purchases.length > 0 && (
        <div style={card}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 14 }}>HISTORIQUE DES ACHATS</div>
          {purchases.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.packName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--success)' }}>{p.amount}€</div>
                <div style={{ fontSize: 10, color: 'var(--muted2)' }}>{p.quantity} {p.packType}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parrainage si pro */}
      {isPro && (
        <div style={{ ...card, border: '1px solid rgba(0,217,126,.2)', background: 'rgba(0,217,126,.03)' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--success)', marginBottom: 10 }}>🎁 PARRAINAGE</div>
          <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 14, lineHeight: 1.65 }}>
            Parrainez un ami — il reçoit <strong style={{ color: 'var(--white)' }}>1 semaine gratuite</strong>. Partagez votre lien personnalisé.
          </div>
          <ReferralSection/>
        </div>
      )}

      {/* Abonnement */}
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 14 }}>ABONNEMENT</div>
        {isPro ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              <div style={{ fontSize: 13, color: 'var(--white)' }}>Plan Elite actif — 5,99€/semaine</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 14 }}>Annulable à tout moment · Non remboursable</div>
            <button onClick={manageSubscription} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '11px', transition: 'all .15s' }}>
              Gérer mon abonnement →
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 14, lineHeight: 1.65 }}>Vous êtes sur le plan gratuit. Passez Elite pour tout débloquer.</div>
            <button onClick={upgradePro} style={{ width: '100%', background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '13px', transition: 'all .2s' }}>
              ⚡ PASSER ELITE — 5,99€/SEMAINE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── REFERRAL SECTION ─────────────────────────────────────
function ReferralSection() {
  const [code, setCode] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral/generate').then(r => r.json()).then(data => {
      if (data.code) setCode(data.code)
    }).catch(() => {})
  }, [])

  if (!code) return <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Chargement du code...</div>

  const link = (typeof window !== 'undefined' ? window.location.origin : '') + '/?ref=' + code

  return (
    <div>
      <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted2)', wordBreak: 'break-all', marginBottom: 8 }}>
        {link}
      </div>
      <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        style={{ width: '100%', background: copied ? 'rgba(0,217,126,.1)' : 'var(--s2)', border: copied ? '1px solid rgba(0,217,126,.3)' : '1px solid var(--border)', borderRadius: 8, color: copied ? 'var(--success)' : 'var(--muted2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '9px', transition: 'all .15s' }}>
        {copied ? '✅ Lien copié !' : '📋 Copier mon lien de parrainage'}
      </button>
    </div>
  )
}

// ── TARIFS TAB ───────────────────────────────────────────
function TarifsTab({ user, isPro, upgradePro }) {
  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }

  const handlePack = (link, name) => {
    if (!link || link === '#') { alert('Lien non configuré pour ce pack.'); return }
    window.open(link, '_blank')
  }

  const packs = [
    { name: '5 annonces', price: '9,99€', unit: '2,00€/annonce', link: process.env.NEXT_PUBLIC_STRIPE_PACK5 || '#' },
    { name: '10 annonces', price: '17,99€', unit: '1,80€/annonce', link: process.env.NEXT_PUBLIC_STRIPE_PACK10 || '#' },
    { name: '50 réponses', price: '14,99€', unit: '0,30€/réponse', link: process.env.NEXT_PUBLIC_STRIPE_REP50 || '#' },
    { name: '500 réponses', price: '39,99€', unit: '0,08€/réponse', link: process.env.NEXT_PUBLIC_STRIPE_REP500 || '#' },
  ]

  return (
    <div>
      {/* Plan Elite */}
      {!isPro ? (
        <div style={{ background: 'linear-gradient(135deg, rgba(255,45,45,.08), rgba(255,45,45,.02))', border: '2px solid rgba(255,45,45,.3)', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 1, marginBottom: 4 }}>Plan Elite ⭐</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>Tout illimité — annonces, réponses, estimations.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--red)', letterSpacing: -2, lineHeight: 1 }}>5,99€</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>par semaine</div>
            </div>
          </div>
          {['✍️ Annonces illimitées', '💬 Réponses illimitées', '💰 Estimations (50/mois)', '📊 Score qualité', '📋 Historique complet'].map(f => (
            <div key={f} style={{ fontSize: 13, color: 'var(--white)', display: 'flex', gap: 8, marginBottom: 6 }}>
              {f}
            </div>
          ))}
          <button onClick={upgradePro}
            style={{ width: '100%', marginTop: 16, background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, padding: '14px', transition: 'all .2s' }}>
            ⚡ PASSER ELITE — 5,99€/SEMAINE
          </button>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>Annulable à tout moment · Non remboursable</div>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,217,126,.05)', border: '1px solid rgba(0,217,126,.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--success)' }}>Plan Elite actif</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)' }}>Vous bénéficiez déjà de toutes les fonctionnalités.</div>
          </div>
        </div>
      )}

      {/* Packs */}
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 10 }}>PACKS À L&apos;UNITÉ</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {packs.map(p => (
          <div key={p.name} style={card}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: .5, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--muted2)', letterSpacing: -1, marginBottom: 2 }}>{p.price}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>{p.unit} · Paiement unique</div>
            <button onClick={() => handlePack(p.link, p.name)}
              style={{ width: '100%', background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 12, letterSpacing: 1, padding: '9px', transition: 'all .15s' }}>
              Acheter
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
