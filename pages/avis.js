import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Avis() {
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom:'', ville:'', article:'', note:5, commentaire:'', email:'' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/avis/list').then(r=>r.json()).then(d => {
      setAvis(d.avis||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.commentaire || form.commentaire.length < 10) { setError('Ecrivez au moins 10 caracteres'); return }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/avis/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setError(data.error || 'Erreur envoi')
    } catch(e) { setError('Erreur reseau') }
    setSending(false)
  }

  const avgNote = avis.length > 0 ? (avis.reduce((a,b) => a+b.note, 0) / avis.length).toFixed(1) : null

  return (
    <div style={{ minHeight:'100vh', background:'var(--black)', color:'var(--cream)', fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .6s ease forwards}
        .avis-card{transition:all .2s}.avis-card:hover{transform:translateY(-2px)}
        input:focus,textarea:focus{border-bottom-color:var(--gold)!important;outline:none}
        @media(max-width:768px){
          .avis-grid{grid-template-columns:1fr!important}
          .avis-form-grid{grid-template-columns:1fr!important}
          .avis-pad{padding:32px 16px 80px!important}
        }
      `}</style>

      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>
          Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
        </Link>
        <div style={{ display:'flex',gap:16,alignItems:'center' }}>
          <Link href="/pricing" style={{ fontSize:12,color:'var(--muted2)' }}>Tarifs</Link>
          <Link href="/auth/register"><button className="btn-primary" style={{ fontSize:11,padding:'8px 16px' }}>Commencer</button></Link>
        </div>
      </nav>

      <div className="avis-pad" style={{ maxWidth:900,margin:'0 auto',padding:'60px 24px 100px' }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign:'center',marginBottom:52 }}>
          <div className="label" style={{ marginBottom:12 }}>Temoignages</div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(32px,6vw,52px)',fontWeight:400,letterSpacing:-.5,marginBottom:12 }}>
            Avis de nos vendeurs
          </h1>
          {avgNote && (
            <div style={{ display:'inline-flex',alignItems:'center',gap:10,background:'var(--s1)',border:'1px solid var(--gold-border)',borderRadius:3,padding:'10px 20px' }}>
              <span style={{ fontFamily:'var(--font-label)',fontSize:28,color:'var(--gold2)',letterSpacing:-1 }}>{avgNote}</span>
              <div>
                <div style={{ color:'var(--gold2)',fontSize:16,letterSpacing:2 }}>{'★'.repeat(Math.round(parseFloat(avgNote)))}</div>
                <div style={{ fontSize:11,color:'var(--muted2)' }}>{avis.length} avis verifies</div>
              </div>
            </div>
          )}
        </div>

        {/* Liste avis */}
        {loading ? (
          <div style={{ textAlign:'center',padding:40,color:'var(--muted2)' }}>Chargement...</div>
        ) : avis.length === 0 ? (
          <div style={{ textAlign:'center',padding:40,fontFamily:'var(--font-display)',fontStyle:'italic',color:'var(--muted2)',marginBottom:40 }}>
            Soyez le premier a laisser un avis !
          </div>
        ) : (
          <div className="avis-grid" style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:1,background:'var(--border)',marginBottom:48 }}>
            {avis.map(a => (
              <div key={a.id} className="avis-card" style={{ background:'var(--ink)',padding:'24px' }}>
                <div style={{ fontSize:16,color:'var(--gold2)',letterSpacing:2,marginBottom:10 }}>{'★'.repeat(a.note)}<span style={{ color:'var(--border2)' }}>{'★'.repeat(5-a.note)}</span></div>
                <p style={{ fontFamily:'var(--font-display)',fontSize:16,fontStyle:'italic',fontWeight:300,lineHeight:1.7,color:'var(--cream)',marginBottom:14 }}>
                  &ldquo;{a.commentaire}&rdquo;
                </p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--s3)',border:'1px solid var(--gold-border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-label)',fontSize:14,color:'var(--gold2)' }}>
                      {a.nom[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--white)' }}>{a.nom}{a.ville&&' · '+a.ville}</div>
                      {a.article && <div style={{ fontSize:11,color:'var(--muted2)' }}>{a.article}</div>}
                    </div>
                  </div>
                  <span style={{ fontSize:10,color:'var(--muted)',background:'var(--s2)',border:'1px solid var(--border)',padding:'2px 8px',borderRadius:2 }}>
                    {new Date(a.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire */}
        <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderTop:'2px solid var(--gold)',padding:'32px 28px' }}>
          <div style={{ marginBottom:24 }}>
            <div className="label" style={{ marginBottom:8 }}>Partager votre experience</div>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,letterSpacing:-.3 }}>Laisser un avis</h2>
            <p style={{ fontSize:13,color:'var(--muted2)',marginTop:6,lineHeight:1.65 }}>
              Votre avis aide d&apos;autres vendeurs a se lancer. Il sera visible apres validation.
            </p>
          </div>

          {sent ? (
            <div style={{ background:'rgba(45,122,79,.1)',border:'1px solid rgba(45,122,79,.3)',borderRadius:3,padding:'20px',textAlign:'center' }}>
              <div style={{ fontSize:24,marginBottom:8 }}>✓</div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,marginBottom:6 }}>Merci pour votre avis !</div>
              <div style={{ fontSize:13,color:'var(--muted2)' }}>Il sera visible apres validation sous 24h.</div>
            </div>
          ) : (
            <form onSubmit={submit}>
              {/* Note */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10,fontWeight:600,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:10 }}>Note *</div>
                <div style={{ display:'flex',gap:8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setForm({...form,note:n})}
                      style={{ background:'none',border:'none',cursor:'pointer',fontSize:32,color:form.note>=n?'var(--gold2)':'var(--border2)',transition:'all .15s',padding:'0 2px' }}>
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize:13,color:'var(--muted2)',alignSelf:'center',marginLeft:8 }}>{form.note}/5</span>
                </div>
              </div>

              {/* Champs */}
              <div className="avis-form-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:1 }}>
                {[
                  {key:'nom',label:'Prenom',ph:'Thomas',req:false},
                  {key:'ville',label:'Ville',ph:'Lyon',req:false},
                  {key:'article',label:'Article vendu',ph:'BMW 320d, iPhone 14...',req:false},
                  {key:'email',label:'Email (non publie)',ph:'votre@email.com',req:false},
                ].map(f => (
                  <div key={f.key} style={{ background:'var(--ink)',padding:'14px 18px' }}>
                    <label style={{ fontSize:10,fontWeight:600,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:7 }}>{f.label}</label>
                    <input style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',transition:'border-color .2s' }}
                      placeholder={f.ph} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} />
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:1 }}>
                <label style={{ fontSize:10,fontWeight:600,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:7 }}>Votre avis *</label>
                <textarea style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:14,padding:'6px 0',width:'100%',outline:'none',resize:'vertical',minHeight:90,lineHeight:1.7,transition:'border-color .2s' }}
                  placeholder="Decrivez votre experience avec Annonza. Avez-vous reussi a vendre ? En combien de temps ? L'annonce generee etait-elle efficace ?"
                  value={form.commentaire} onChange={e => setForm({...form,commentaire:e.target.value})} required />
              </div>

              {error && (
                <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.2)',borderRadius:3,padding:'10px 14px',fontSize:13,color:'var(--red2)',marginBottom:12 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={sending} className="btn-gold"
                style={{ width:'100%',marginTop:1,fontSize:13,padding:'15px',letterSpacing:2,opacity:sending?0.6:1,color:'#030303' }}>
                {sending ? 'Envoi...' : 'ENVOYER MON AVIS'}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer style={{ borderTop:'1px solid var(--border)',padding:'20px 32px',display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center' }}>
        {[['Accueil','/'],['Tarifs','/pricing'],['Stats','/stats'],['CGV','/cgv'],['Confidentialite','/confidentialite']].map(([l,h]) => (
          <Link key={l} href={h} style={{ fontSize:12,color:'var(--muted2)' }}>{l}</Link>
        ))}
      </footer>
    </div>
  )
}
