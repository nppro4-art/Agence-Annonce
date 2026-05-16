import { useState, useEffect } from 'react'
import { SkyBackground } from '../../lib/SkyBackground'
import { useRouter } from 'next/router'
import Link from 'next/link'

const TEMOIGNAGES = [
  { quote: "Vendu en 48h. L'annonce etait tellement professionnelle.", name: "Thomas R.", city: "Lyon", stars: 5 },
  { quote: "12 contacts en un seul jour grace a l'annonce generee.", name: "Sarah M.", city: "Paris", stars: 5 },
  { quote: "La reponse IA a sauve ma vente face a un acheteur agressif.", name: "Marc D.", city: "Bordeaux", stars: 5 },
  { quote: "Annonce professionnelle, vendu en weekend au prix demande.", name: "Julie K.", city: "Nantes", stars: 5 },
  { quote: "3x plus de contacts avec la meme voiture.", name: "Pierre L.", city: "Toulouse", stars: 5 },
]

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [code, setCode] = useState('')
  const [step, setStep] = useState('login') // login | 2fa | refused
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [testIndex, setTestIndex] = useState(0)
  const [showPwd, setShowPwd] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTestIndex(i => (i + 1) % TEMOIGNAGES.length), 4000)

    // Gérer le retour depuis confirm-2fa
    const { email, step, error } = router.query
    if (email && step === 'code') {
      setForm(f => ({ ...f, email: decodeURIComponent(email) }))
      setStep('2fa')
    }
    if (error === 'refused') {
      setError('Connexion refusee depuis votre email.')
    }
    if (error === 'expired') {
      setError('Le lien a expire. Reessayez.')
    }

    return () => clearInterval(t)
  }, [router.query])

  // Polling - vérifier si refusé ou confirmé
  useEffect(() => {
    if (!pollingActive || !form.email) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/status-2fa?email=' + encodeURIComponent(form.email))
        const data = await res.json()
        if (data.status === 'refused') {
          setPollingActive(false)
          setStep('refused')
          clearInterval(interval)
        }
        if (data.status === 'confirmed' && data.code) {
          setCode(data.code)
          setPollingActive(false)
          clearInterval(interval)
        }
      } catch(e) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [pollingActive, form.email])

  const submitLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Identifiants incorrects'); setLoading(false); return }

      if (data.requires2FA) {
        // Envoyer le code 2FA
        await fetch('/api/auth/send-2fa', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email })
        })
        setStep('2fa')
        setPollingActive(true)
        setLoading(false)
        return
      }

      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) {
      setError('Erreur de connexion. Reessayez.')
      setLoading(false)
    }
  }

  const submit2FA = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Code invalide'); setLoading(false); return }
      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) {
      setError('Erreur. Reessayez.')
      setLoading(false)
    }
  }

  const resendCode = async () => {
    await fetch('/api/auth/send-2fa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email })
    })
    setError('Nouveau code envoye !')
    setTimeout(() => setError(''), 3000)
  }

  const t = TEMOIGNAGES[testIndex]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes tfade { 0%{opacity:0;transform:translateY(6px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
        @media(max-width:768px) { .auth-left{display:none!important} .auth-right{padding:32px 20px!important} }
      `}</style>

      {/* Panneau gauche */}
      <div className="auth-left" style={{ flex:1,background:'var(--ink)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 60%,rgba(201,168,76,.06) 0%,transparent 60%)',pointerEvents:'none' }} />
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>
          Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
        </Link>
        <div style={{ position:'relative',minHeight:180 }}>
          <div key={testIndex} style={{ animation:'tfade 4s ease-in-out forwards' }}>
            <div style={{ fontSize:20,color:'var(--gold2)',marginBottom:14,letterSpacing:3 }}>{'★'.repeat(t.stars)}</div>
            <blockquote style={{ fontFamily:'var(--font-display)',fontSize:20,fontStyle:'italic',fontWeight:300,lineHeight:1.6,color:'var(--cream)',marginBottom:16 }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div style={{ fontSize:12,color:'var(--muted2)' }}>— {t.name}, {t.city}</div>
          </div>
          <div style={{ display:'flex',gap:6,marginTop:24 }}>
            {TEMOIGNAGES.map((_,i)=>(<div key={i} onClick={()=>setTestIndex(i)} style={{ width:i===testIndex?16:5,height:5,borderRadius:3,background:i===testIndex?'var(--gold)':'var(--border2)',transition:'all .3s',cursor:'pointer' }} />))}
          </div>
        </div>
        <div style={{ fontSize:11,color:'var(--muted)',letterSpacing:.5 }}>annonza.business</div>
      </div>

      <SkyBackground />
      {/* Formulaire */}
      <div className="auth-right" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px' }}>
        <div style={{ width:'100%',maxWidth:380 }}>

          <div style={{ display:'none',marginBottom:32,textAlign:'center' }} className="mobile-logo">
            <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:20,letterSpacing:3 }}>
              Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
            </Link>
          </div>
          <style>{`@media(max-width:768px){.mobile-logo{display:block!important}}`}</style>

          {step === 'login' && (
            <>
              <div style={{ marginBottom:32 }}>
                <div className="label" style={{ marginBottom:10 }}>Espace personnel</div>
                <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(28px,6vw,40px)',fontWeight:600,letterSpacing:-.5,lineHeight:1 }}>Connexion</h1>
              </div>
              <form onSubmit={submitLogin}>
                {[
                  { key:'email',label:'Adresse e-mail',type:'email',ph:'votre@email.com' },
                  { key:'password',label:'Mot de passe',type:'password',ph:'••••••••' },
                ].map(f=>(
                  <div key={f.key} style={{ marginBottom:16 }}>
                    <label style={{ fontSize:11,fontWeight:500,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:8 }}>{f.label}</label>
                    {f.key==='password' ? (
                      <div style={{ position:'relative' }}>
                        <input className="input-field" type={showPwd?'text':'password'} placeholder={f.ph} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required style={{ paddingRight:44 }} />
                        <button type="button" onClick={()=>setShowPwd(!showPwd)}
                          style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16,padding:4,lineHeight:1 }}>
                          {showPwd ? '🙈' : '👁'}
                        </button>
                      </div>
                    ) : (
                      <input className="input-field" type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required />
                    )}
                  </div>
                ))}
                {error && <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.2)',borderRadius:3,padding:'10px 14px',fontSize:13,color:'var(--red2)',marginBottom:16 }}>{error}</div>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%',marginTop:8,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                  {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Connexion...</>:'SE CONNECTER'}
                </button>
              </form>
            </>
          )}

          {step === 'refused' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.3)',borderRadius:8,padding:32,marginBottom:24 }}>
                <div style={{ fontSize:48,marginBottom:16 }}>🔒</div>
                <h2 style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:600,marginBottom:10,color:'var(--red2)' }}>Connexion refusee</h2>
                <p style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.7 }}>
                  La connexion a ete refusee depuis votre email.<br/>Si c'etait vous, reessayez.
                </p>
              </div>
              <button onClick={()=>{setStep('login');setCode('');setError('');setPollingActive(false)}} className="btn-primary" style={{ width:'100%',fontSize:13,padding:'14px' }}>
                RETOUR A LA CONNEXION
              </button>
            </div>
          )}

          {step === '2fa' && (
            <>
              <div style={{ marginBottom:32 }}>
                <div className="label" style={{ marginBottom:10 }}>Verification</div>
                <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(24px,5vw,36px)',fontWeight:600,letterSpacing:-.5,lineHeight:1,marginBottom:10 }}>Code de verification</h1>
                <p style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.65 }}>
                  Un email vous a ete envoye a <strong style={{ color:'var(--cream)' }}>{form.email}</strong>. Cliquez sur <strong style={{ color:'var(--gold2)' }}>Accepter</strong> dans l'email, puis entrez le code ci-dessous.
                </p>
              </div>
              <form onSubmit={submit2FA}>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:11,fontWeight:500,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:8 }}>Code a 6 chiffres</label>
                  <input className="input-field"
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
                    style={{ textAlign:'center',fontSize:24,letterSpacing:8,fontFamily:'monospace' }}
                    autoFocus required />
                </div>
                {error && <div style={{ background: error.includes('envoye') ? 'rgba(45,122,79,.08)':'rgba(200,57,43,.08)',border:'1px solid',borderColor:error.includes('envoye')?'rgba(45,122,79,.2)':'rgba(200,57,43,.2)',borderRadius:3,padding:'10px 14px',fontSize:13,color:error.includes('envoye')?'var(--success2)':'var(--red2)',marginBottom:16 }}>{error}</div>}
                <button type="submit" disabled={loading||code.length!==6} className="btn-primary" style={{ width:'100%',marginTop:8,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:10,opacity:(loading||code.length!==6)?0.5:1 }}>
                  {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Verification...</>:'VERIFIER LE CODE'}
                </button>
              </form>
              <div style={{ marginTop:16,textAlign:'center' }}>
                <button onClick={resendCode} style={{ background:'none',border:'none',color:'var(--muted2)',cursor:'pointer',fontSize:12,textDecoration:'underline' }}>Renvoyer le code</button>
                <span style={{ color:'var(--muted)',margin:'0 10px' }}>·</span>
                <button onClick={()=>{setStep('login');setCode('');setError('')}} style={{ background:'none',border:'none',color:'var(--muted2)',cursor:'pointer',fontSize:12,textDecoration:'underline' }}>Retour</button>
              </div>
            </>
          )}

          <div style={{ marginTop:20,textAlign:'center',fontSize:13,color:'var(--muted2)' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{ color:'var(--gold2)',borderBottom:'1px solid var(--gold-border)',paddingBottom:1 }}>S&apos;inscrire</Link>
          </div>
          <div style={{ textAlign:'center',marginTop:12 }}>
            <Link href="/" style={{ fontSize:12,color:'var(--muted)' }}>← Retour a l&apos;accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
