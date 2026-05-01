import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user); setLoading(false)
      if (router.query.subscribed) setTab('home')
    }).catch(() => router.push('/auth/login'))
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

  const nav = { background: 'var(--s1)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }
  const tabs = { display: 'flex', gap: 2, background: 'var(--s2)', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }
  const tabStyle = (active) => ({ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--white)' : 'var(--muted2)', cursor: 'pointer', borderBottom: active ? '2px solid var(--red)' : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all .15s' })
  const container = { maxWidth: 700, margin: '0 auto', padding: '20px 16px 80px' }
  const card = { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }
  const btn = (color = 'var(--red)') => ({ background: color, border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, padding: '12px 20px', transition: 'all .2s' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 14, color: 'var(--muted2)' }}>Chargement...</div>

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={nav}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>
          Agence d'<span style={{ color: 'var(--red)' }}>Annonce</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isPro && <button onClick={upgradePro} style={{ ...btn(), fontSize: 12, padding: '8px 14px' }}>Passer Pro</button>}
          {isPro && <span style={{ fontSize: 11, color: 'var(--success)', background: 'rgba(0,217,126,.1)', border: '1px solid rgba(0,217,126,.2)', borderRadius: 4, padding: '3px 8px' }}>PRO ✓</span>}
          <button onClick={logout} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>Déconnexion</button>
        </div>
      </nav>

      <div style={tabs}>
        {[['home','🏠 Accueil'],['annonce','✍️ Annonce'],['reponse','💬 Répondre'],['estimation','💰 Estimer'],['historique','📋 Historique']].map(([id, label]) => (
          <div key={id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      <div style={container}>
        {tab === 'home' && <HomeTab user={user} isPro={isPro} upgradePro={upgradePro} manageSubscription={manageSubscription} setTab={setTab} card={card} btn={btn}/>}
        {tab === 'annonce' && <AnnonceTab user={user} isPro={isPro} upgradePro={upgradePro} card={card} btn={btn}/>}
        {tab === 'reponse' && <ReponseTab user={user} isPro={isPro} upgradePro={upgradePro} card={card} btn={btn}/>}
        {tab === 'estimation' && <EstimationTab card={card} btn={btn}/>}
        {tab === 'historique' && <HistoriqueTab user={user} card={card}/>}
      </div>
    </div>
  )
}

function HomeTab({ user, isPro, upgradePro, manageSubscription, setTab, card, btn }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 1, marginBottom: 4 }}>
          Bonjour {user.name || user.email.split('@')[0]} 👋
        </h2>
        <div style={{ fontSize: 13, color: 'var(--muted2)' }}>
          Plan : <strong style={{ color: isPro ? 'var(--success)' : 'var(--muted2)' }}>{isPro ? 'Pro' : 'Gratuit'}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '✍️', title: 'Créer une annonce', tab: 'annonce', sub: isPro ? 'Illimité' : 'Pro requis', color: isPro ? 'var(--white)' : 'var(--muted2)' },
          { icon: '💬', title: 'Répondre', tab: 'reponse', sub: isPro ? 'Illimité' : 'Pro requis', color: isPro ? 'var(--white)' : 'var(--muted2)' },
          { icon: '💰', title: 'Estimer', tab: 'estimation', sub: 'Gratuit', color: 'var(--white)' },
        ].map(a => (
          <div key={a.tab} style={{ ...card, cursor: 'pointer', textAlign: 'center' }} onClick={() => setTab(a.tab)}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: .5, color: a.color, marginBottom: 4 }}>{a.title}</div>
            <div style={{ fontSize: 9, color: isPro || a.tab === 'estimation' ? 'var(--success)' : 'var(--warning)', background: 'rgba(0,0,0,.2)', borderRadius: 4, padding: '2px 6px' }}>{a.sub}</div>
          </div>
        ))}
      </div>

      {!isPro && (
        <div style={{ ...card, border: '1.5px solid rgba(255,45,45,.3)', background: 'rgba(255,45,45,.04)' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, marginBottom: 8 }}>Passer à la version Pro</div>
          <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 16, lineHeight: 1.6 }}>
            Annonces illimitées, réponses acheteurs, historique complet. 5,99€/semaine, annulable à tout moment — non remboursable.
          </div>
          <button onClick={upgradePro} style={btn()}>⚡ PASSER PRO — 5,99€/MOIS</button>
        </div>
      )}

      {isPro && (
        <div style={{ ...card, border: '1px solid rgba(0,217,126,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: 'var(--success)', marginBottom: 4 }}>Abonnement Pro Actif</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>5,99€/semaine · Toutes fonctionnalités incluses</div>
            </div>
            <button onClick={manageSubscription} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted2)', cursor: 'pointer', fontSize: 11, padding: '7px 12px' }}>Gérer</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnonceTab({ user, isPro, upgradePro, card, btn }) {
  const [form, setForm] = useState({ type: 'voiture', marque: '', modele: '', annee: '', kilometrage: '', etat: '', couleur: '', carburant: '', boite: '', puissance: '', ct: '', carnet: '', defauts: '', options: '', prix: '', ville: '', urgence: 'normal', raison: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isPro) return (
    <div style={{ ...card, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 8 }}>Fonctionnalité Pro</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20 }}>Passez à la version Pro pour créer des annonces illimitées.</div>
      <button onClick={upgradePro} style={btn()}>PASSER PRO — 5,99€/MOIS</button>
    </div>
  )

  const specs = Object.entries(form).filter(([,v]) => v).map(([k,v]) => `- ${k}: ${v}`).join('\n')

  const generate = async () => {
    setLoading(true)
    const res = await fetch('/api/ai/annonce', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs, lang: 'fr', urgence: form.urgence, type: form.type, inputData: form })
    })
    const data = await res.json()
    setResult(data); setLoading(false)
  }

  const inp = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '10px 12px', outline: 'none', width: '100%' }
  const sel = { ...inp, appearance: 'none' }
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }
  const fieldLbl = { fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, marginBottom: 16 }}>Informations de l'article</div>
        <div style={g2}>
          <div><label style={fieldLbl}>Marque *</label><input style={inp} placeholder="BMW, Renault…" value={form.marque} onChange={e => setForm({...form, marque: e.target.value})}/></div>
          <div><label style={fieldLbl}>Modèle *</label><input style={inp} placeholder="Série 3, Clio…" value={form.modele} onChange={e => setForm({...form, modele: e.target.value})}/></div>
        </div>
        <div style={g2}>
          <div><label style={fieldLbl}>Année</label><input style={inp} type="number" placeholder="2019" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})}/></div>
          <div><label style={fieldLbl}>Kilométrage</label><input style={inp} type="number" placeholder="75000" value={form.kilometrage} onChange={e => setForm({...form, kilometrage: e.target.value})}/></div>
        </div>
        <div style={g2}>
          <div><label style={fieldLbl}>Carburant</label>
            <select style={sel} value={form.carburant} onChange={e => setForm({...form, carburant: e.target.value})}>
              <option value="">—</option>
              {['Essence','Diesel','Hybride','Électrique','GPL'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={fieldLbl}>Boîte</label>
            <select style={sel} value={form.boite} onChange={e => setForm({...form, boite: e.target.value})}>
              <option value="">—</option>
              {['Manuelle','Automatique','Semi-auto'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={g2}>
          <div><label style={fieldLbl}>État général *</label>
            <select style={sel} value={form.etat} onChange={e => setForm({...form, etat: e.target.value})}>
              <option value="">—</option>
              {['Excellent','Très bon','Bon','Moyen','À réparer'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={fieldLbl}>CT</label>
            <select style={sel} value={form.ct} onChange={e => setForm({...form, ct: e.target.value})}>
              <option value="">—</option>
              {['Valide','À refaire','Non présenté'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={fieldLbl}>Défauts connus</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Rayures, bosses, voyant…" value={form.defauts} onChange={e => setForm({...form, defauts: e.target.value})}/>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={fieldLbl}>Équipements</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="GPS, caméra recul, sièges chauffants…" value={form.options} onChange={e => setForm({...form, options: e.target.value})}/>
        </div>
        <div style={g2}>
          <div><label style={fieldLbl}>Prix souhaité (€) *</label><input style={inp} type="number" placeholder="11500" value={form.prix} onChange={e => setForm({...form, prix: e.target.value})}/></div>
          <div><label style={fieldLbl}>Ville *</label><input style={inp} placeholder="Lyon, Paris…" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}/></div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={fieldLbl}>Urgence</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['normal','⏳ Normal'],['rapide','🔥 Rapide'],['optimise','💎 Max prix']].map(([v,l]) => (
              <div key={v} onClick={() => setForm({...form, urgence: v})}
                style={{ flex: 1, background: form.urgence === v ? 'rgba(255,176,32,.1)' : 'var(--s2)', border: form.urgence === v ? '1.5px solid var(--warning)' : '1.5px solid var(--border)', borderRadius: 8, padding: '9px 4px', textAlign: 'center', fontSize: 11, color: form.urgence === v ? 'var(--warning)' : 'var(--muted2)', cursor: 'pointer' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading || !form.marque || !form.modele} style={{ ...btn(), width: '100%', marginTop: 6, opacity: loading ? .6 : 1 }}>
          {loading ? 'GÉNÉRATION EN COURS...' : '⚡ GÉNÉRER MON ANNONCE'}
        </button>
      </div>

      {result && (
        <div style={card}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, color: 'var(--red)', marginBottom: 14 }}>ANNONCE GÉNÉRÉE</div>
          {result.annonce?.titre && <div style={{ fontFamily: 'Bebas Neue', fontSize: 17, padding: '12px 14px', background: 'var(--s2)', borderRadius: 10, borderLeft: '3px solid var(--red)', marginBottom: 12 }}>{result.annonce.titre}</div>}
          {[['Description', result.annonce?.description],['Points forts', result.annonce?.pointsForts],['Défauts', result.annonce?.defauts],['Prix conseillé', result.annonce?.prixConseil]].map(([label, val]) => val && (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>{val}</div>
            </div>
          ))}
          {result.annonce?.shortVersion && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Version courte (Facebook/SMS)</div>
              <div style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--warning)' }}>{result.annonce.shortVersion}</div>
            </div>
          )}
          <button onClick={() => { navigator.clipboard.writeText(result.raw || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: copied ? 'var(--success)' : 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '10px', transition: 'all .15s' }}>
            {copied ? '✅ Copié !' : '📋 Copier l\'annonce complète'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReponseTab({ user, isPro, upgradePro, card, btn }) {
  const [message, setMessage] = useState('')
  const [contexte, setContexte] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isPro) return (
    <div style={{ ...card, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 8 }}>Fonctionnalité Pro</div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20 }}>Passez Pro pour répondre aux acheteurs avec l'IA.</div>
      <button onClick={upgradePro} style={btn()}>PASSER PRO — 5,99€/MOIS</button>
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
  }

  const ta = { background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '11px 13px', outline: 'none', width: '100%', resize: 'vertical', minHeight: 90, lineHeight: 1.6 }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, marginBottom: 16 }}>Répondre à un acheteur</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Message de l'acheteur *</label>
          <textarea style={ta} placeholder="Colle ici le message reçu de l'acheteur…" value={message} onChange={e => setMessage(e.target.value)}/>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Contexte (optionnel)</label>
          <textarea style={{ ...ta, minHeight: 60 }} placeholder="Prix demandé, état de l'objet, infos utiles…" value={contexte} onChange={e => setContexte(e.target.value)}/>
        </div>
        <button onClick={generate} disabled={loading || !message} style={{ ...btn(), width: '100%', opacity: loading ? .6 : 1 }}>
          {loading ? 'GÉNÉRATION...' : '⚡ GÉNÉRER LA RÉPONSE'}
        </button>
      </div>

      {result?.reponse && (
        <div style={card}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--red)', marginBottom: 14, letterSpacing: 1 }}>RÉPONSE GÉNÉRÉE</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Réponse prête à copier</div>
            <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.8, background: 'var(--s2)', borderRadius: 10, padding: '14px', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--success)' }}>{result.reponse.reponsePrete}</div>
          </div>
          {result.reponse.suggestion && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Conseil de négociation</div>
              <div style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.7, background: 'var(--s2)', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid var(--warning)' }}>{result.reponse.suggestion}</div>
            </div>
          )}
          <button onClick={() => { navigator.clipboard.writeText(result.reponse.reponsePrete); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width: '100%', background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, color: copied ? 'var(--success)' : 'var(--muted2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '10px', transition: 'all .15s' }}>
            {copied ? '✅ Copié !' : '📋 Copier la réponse'}
          </button>
        </div>
      )}
    </div>
  )
}

function EstimationTab({ card, btn }) {
  const [specs, setSpecs] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const estimate = async () => {
    if (!specs) return
    setLoading(true)
    const res = await fetch('/api/ai/estimation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs })
    })
    const data = await res.json()
    setResult(data); setLoading(false)
  }

  return (
    <div>
      <div style={card}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, marginBottom: 16 }}>Estimer le prix de vente</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: 5 }}>Décrivez votre article *</label>
          <textarea
            style={{ background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 9, color: 'var(--white)', fontSize: 13, padding: '11px 13px', outline: 'none', width: '100%', resize: 'vertical', minHeight: 120, lineHeight: 1.6 }}
            placeholder="Ex: Peugeot 308 SW 2019, 85 000 km, diesel, très bon état, CT valide, GPS, quelques rayures…"
            value={specs} onChange={e => setSpecs(e.target.value)}/>
        </div>
        <button onClick={estimate} disabled={loading || !specs} style={{ ...btn(), width: '100%', opacity: loading ? .6 : 1 }}>
          {loading ? 'ANALYSE EN COURS...' : '🔍 ESTIMER LE PRIX'}
        </button>
      </div>

      {result && (
        <div style={{ ...card, border: '1px solid rgba(255,176,32,.25)' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 14, color: 'var(--warning)', marginBottom: 14, letterSpacing: 1 }}>ESTIMATION DU MARCHÉ</div>
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

function HistoriqueTab({ user, card }) {
  const [annonces, setAnnonces] = useState([])
  const [reponses, setReponses] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div style={{ fontSize: 13, color: 'var(--muted2)', padding: 20 }}>Chargement...</div>

  return (
    <div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', marginBottom: 12 }}>ANNONCES ({annonces.length})</div>
      {annonces.length === 0 && <div style={{ ...card, fontSize: 13, color: 'var(--muted2)', textAlign: 'center', padding: 24 }}>Aucune annonce générée</div>}
      {annonces.map(a => (
        <div key={a.id} style={card}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, marginBottom: 4 }}>{a.titre || 'Annonce sans titre'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{a.type} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
        </div>
      ))}
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 13, letterSpacing: 2, color: 'var(--muted2)', margin: '20px 0 12px' }}>RÉPONSES ({reponses.length})</div>
      {reponses.length === 0 && <div style={{ ...card, fontSize: 13, color: 'var(--muted2)', textAlign: 'center', padding: 24 }}>Aucune réponse générée</div>}
      {reponses.map(r => (
        <div key={r.id} style={card}>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 6 }}>Message : {r.messageAcheteur.slice(0, 80)}…</div>
          <div style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.6 }}>{r.reponsePrete.slice(0, 120)}…</div>
        </div>
      ))}
    </div>
  )
}
