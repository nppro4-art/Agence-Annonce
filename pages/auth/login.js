import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { SkyBackground } from '../../lib/SkyBackground'

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
  const [step, setStep] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tIdx, setTIdx] = useState(0)
  const [showPwd, setShowPwd] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTIdx(i => (i + 1) % TEMOIGNAGES.length), 4000)
    const { email, step: qs, error: qe } = router.query
    if (email && qs === 'code') { setForm(f => ({ ...f, email: decodeURIComponent(email) })); setStep('2fa') }
    if (qe === 'refused') setError('Connexion refusee depuis votre email.')
    if (qe === 'expired') setError('Le lien a expire. Reessayez.')
    return () => clearInterval(t)
  }, [router.query])

  useEffect(() => {
    if (!pollingActive || !form.email) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/status-2fa?email=' + encodeURIComponent(form.email))
        const data = await res.json()
        if (data.status === 'refused') { setPollingActive(false); setStep('refused'); clearInterval(interval) }
        if (data.status === 'confirmed' && data.code) { setCode(data.code); setPollingActive(false); clearInterval(interval) }
      } catch(e) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [pollingActive, form.email])

  const submitLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Identifiants incorrects'); setLoading(false); return }
      if (data.requires2FA) {
        await fetch('/api/auth/send-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email }) })
        setStep('2fa'); setPollingActive(true); setLoading(false); return
      }
      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) { setError('Erreur de connexion. Reessayez.'); setLoading(false) }
  }

  const submit2FA = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, code }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Code invalide'); setLoading(false); return }
      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) { setError('Erreur. Reessayez.'); setLoading(false) }
  }

  const resendCode = async () => {
    await fetch('/api/auth/send-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email }) })
    setError('Nouveau code envoye !'); setTimeout(() => setError(''), 3000)
  }

  const t = TEMOIGNAGES[tIdx]

  const INP = { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, color:'#f0ece4', fontSize:15, outline:'none', fontFamily:'DM Sans,sans-serif', transition:'border-color .2s', boxSizing:'border-box' }
  const BTN = { width:'100%', padding:'14px', background:'linear-gradient(135deg,#a8843c,#c9a84c)', border:'none', borderRadius:8, color:'#030303', fontFamily:'Bebas Neue,sans-serif', fontSize:14, letterSpacing:2, cursor:'pointer', marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }
  const LBL = { fontSize:11, color:'rgba(180,190,220,.7)', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:8, fontFamily:'Bebas Neue,sans-serif' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes tfade{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .auth-panel{animation:fadeUp .5s cubic-bezier(.16,1,.3,1) forwards}
        .auth-inp:focus{border-color:rgba(201,168,76,.5)!important;background:rgba(255,255,255,.1)!important}
        @media(max-width:768px){
          .auth-left{display:none!important}
          .auth-right{width:100%!important;padding:0!important;align-items:flex-start!important}
          .auth-panel-wrap{padding:32px 20px 40px!important;min-height:100vh!important;display:flex!important;align-items:center!important;justify-content:center!important}
        }
      `}</style>

      {/* Ciel */}
      <SkyBackground />

      {/* Panneau gauche — desktop uniquement */}
      <div className="auth-left" style={{ flex:1, background:'rgba(8,12,24,.8)', backdropFilter:'blur(16px)', borderRight:'1px solid rgba(255,255,255,.06)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', position:'relative', zIndex:1 }}>
        <Link href="/" style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:16, letterSpacing:4, color:'#f0ece4', textDecoration:'none' }}>
          A.<span style={{ color:'#c8392b' }}>A</span> <span style={{ fontSize:12, letterSpacing:2, color:'rgba(180,190,220,.6)', fontWeight:300, fontFamily:'Cormorant Garamond,serif' }}>Annonza</span>
        </Link>
        <div style={{ position:'relative', minHeight:200 }}>
          <div key={tIdx} style={{ animation:'tfade 4s ease-in-out forwards' }}>
            <div style={{ fontSize:18, color:'#c9a84c', marginBottom:14, letterSpacing:3 }}>{'★'.repeat(t.stars)}</div>
            <blockquote style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontStyle:'italic', fontWeight:300, lineHeight:1.65, color:'#f0ece4', marginBottom:16 }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div style={{ fontSize:12, color:'rgba(180,190,220,.7)' }}>— {t.name}, {t.city}</div>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:24 }}>
            {TEMOIGNAGES.map((_,i)=>(<div key={i} onClick={()=>setTIdx(i)} style={{ width:i===tIdx?16:5, height:5, borderRadius:3, background:i===tIdx?'#c9a84c':'rgba(255,255,255,.15)', transition:'all .3s', cursor:'pointer' }} />))}
          </div>
        </div>
        <div style={{ fontSize:11, color:'rgba(180,190,220,.5)' }}>annonza.business</div>
      </div>

      {/* Formulaire — droite */}
      <div className="auth-right" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
        <div className="auth-panel-wrap" style={{ width:'100%', maxWidth:440, padding:'48px 32px' }}>
          <div className="auth-panel">

            {/* Logo mobile */}
            <div style={{ textAlign:'center', marginBottom:32, display:'none' }} className="mobile-logo">
              <Link href="/" style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:22, letterSpacing:4, color:'#f0ece4', textDecoration:'none' }}>
                A.<span style={{ color:'#c8392b' }}>A</span>
              </Link>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:13, color:'rgba(180,190,220,.6)', marginTop:4 }}>Annonza</div>
            </div>
            <style>{`@media(max-width:768px){.mobile-logo{display:block!important}}`}</style>

            {step === 'login' && (
              <>
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:9, letterSpacing:3, color:'rgba(201,168,76,.8)', marginBottom:10 }}>ESPACE PERSONNEL</div>
                  <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(30px,6vw,42px)', fontWeight:400, letterSpacing:-.5, color:'#f0ece4', margin:0 }}>Connexion</h1>
                </div>
                <form onSubmit={submitLogin}>
                  <div style={{ marginBottom:16 }}>
                    <label style={LBL}>Adresse e-mail</label>
                    <input className="auth-inp" type="email" placeholder="votre@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={INP} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={LBL}>Mot de passe</label>
                    <div style={{ position:'relative' }}>
                      <input className="auth-inp" type={showPwd?'text':'password'} placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{ ...INP, paddingRight:48 }} />
                      <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(180,190,220,.6)', cursor:'pointer', fontSize:18, padding:4 }}>
                        {showPwd ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  {error && <div style={{ background:'rgba(200,57,43,.1)', border:'1px solid rgba(200,57,43,.25)', borderRadius:6, padding:'11px 14px', fontSize:13, color:'#e05a4a', marginBottom:16 }}>{error}</div>}
                  <button type="submit" disabled={loading} style={{ ...BTN, opacity:loading?0.7:1 }}>
                    {loading ? <><div style={{ width:16,height:16,border:'2px solid rgba(0,0,0,.3)',borderTopColor:'#030303',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Connexion...</> : 'SE CONNECTER'}
                  </button>
                </form>
              </>
            )}

            {step === 'refused' && (
              <div style={{ textAlign:'center' }}>
                <div style={{ background:'rgba(200,57,43,.08)', border:'1px solid rgba(200,57,43,.25)', borderRadius:10, padding:'32px 24px', marginBottom:20 }}>
                  <div style={{ fontSize:44, marginBottom:14 }}>🔒</div>
                  <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:400, marginBottom:8, color:'#e05a4a' }}>Connexion refusée</h2>
                  <p style={{ fontSize:13, color:'rgba(180,190,220,.7)', lineHeight:1.7, margin:0 }}>La connexion a été refusée depuis votre email.</p>
                </div>
                <button onClick={()=>{setStep('login');setCode('');setError('');setPollingActive(false)}} style={BTN}>RETOUR À LA CONNEXION</button>
              </div>
            )}

            {step === '2fa' && (
              <>
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:9, letterSpacing:3, color:'rgba(201,168,76,.8)', marginBottom:10 }}>VÉRIFICATION</div>
                  <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(24px,5vw,36px)', fontWeight:400, color:'#f0ece4', margin:'0 0 10px' }}>Code de vérification</h1>
                  <p style={{ fontSize:13, color:'rgba(180,190,220,.7)', lineHeight:1.65, margin:0 }}>
                    Email envoyé à <strong style={{ color:'#f0ece4' }}>{form.email}</strong>. Cliquez sur <strong style={{ color:'#c9a84c' }}>Accepter</strong> puis entrez le code.
                  </p>
                </div>
                <form onSubmit={submit2FA}>
                  <div style={{ marginBottom:20 }}>
                    <label style={LBL}>Code à 6 chiffres</label>
                    <input className="auth-inp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} style={{ ...INP, textAlign:'center', fontSize:28, letterSpacing:10, fontFamily:'DM Mono,monospace' }} autoFocus required />
                  </div>
                  {error && <div style={{ background:error.includes('envoye')?'rgba(45,122,79,.08)':'rgba(200,57,43,.08)', border:'1px solid', borderColor:error.includes('envoye')?'rgba(45,122,79,.25)':'rgba(200,57,43,.25)', borderRadius:6, padding:'11px 14px', fontSize:13, color:error.includes('envoye')?'#2d7a4f':'#e05a4a', marginBottom:16 }}>{error}</div>}
                  <button type="submit" disabled={loading||code.length!==6} style={{ ...BTN, opacity:(loading||code.length!==6)?0.5:1 }}>
                    {loading ? <><div style={{ width:16,height:16,border:'2px solid rgba(0,0,0,.3)',borderTopColor:'#030303',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Vérification...</> : 'VÉRIFIER LE CODE'}
                  </button>
                </form>
                <div style={{ marginTop:16, textAlign:'center', display:'flex', gap:12, justifyContent:'center' }}>
                  <button onClick={resendCode} style={{ background:'none', border:'none', color:'rgba(180,190,220,.6)', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>Renvoyer le code</button>
                  <span style={{ color:'rgba(255,255,255,.2)' }}>·</span>
                  <button onClick={()=>{setStep('login');setCode('');setError('')}} style={{ background:'none', border:'none', color:'rgba(180,190,220,.6)', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>Retour</button>
                </div>
              </>
            )}

            <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:'rgba(180,190,220,.6)' }}>
              Pas encore de compte ?{' '}
              <Link href="/auth/register" style={{ color:'#c9a84c', borderBottom:'1px solid rgba(201,168,76,.3)', paddingBottom:1, textDecoration:'none' }}>S&apos;inscrire</Link>
            </div>
            <div style={{ textAlign:'center', marginTop:10 }}>
              <Link href="/" style={{ fontSize:12, color:'rgba(180,190,220,.4)', textDecoration:'none' }}>← Retour à l&apos;accueil</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
