import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const TESTIMONIALS = [
  { quote: "Vendu en 48h au lieu de 3 semaines.", name: "Thomas R.", city: "Lyon", stars: 5 },
  { quote: "12 contacts en un seul jour grace a l'annonce generee.", name: "Sarah M.", city: "Paris", stars: 5 },
  { quote: "La reponse IA a sauve ma vente face a un acheteur agressif.", name: "Marc D.", city: "Bordeaux", stars: 5 },
  { quote: "Annonce beaucoup plus professionnelle, vendu en weekend.", name: "Julie K.", city: "Nantes", stars: 5 },
  { quote: "3x plus de contacts qu'avec mon ancienne annonce.", name: "Pierre L.", city: "Toulouse", stars: 5 },
]

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [testIndex, setTestIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTestIndex(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Identifiants incorrects'); setLoading(false); return }
      if (data.user.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch(e) {
      setError('Erreur de connexion. Reessayez.'); setLoading(false)
    }
  }

  const t = TESTIMONIALS[testIndex]

  return (
    <div style={{ minHeight:'100vh',display:'flex',background:'var(--black)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes tfade{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-6px)}}.auth-left{flex:1;background:var(--ink);border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;padding:48px;position:relative;overflow:hidden}@media(max-width:768px){.auth-left{display:none!important}.auth-right{padding:32px 20px!important}}`}</style>

      {/* Panneau gauche */}
      <div className="auth-left">
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 60%,rgba(201,168,76,.06) 0%,transparent 60%)',pointerEvents:'none' }} />
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>
          Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
        </Link>
        <div style={{ position:'relative',minHeight:160 }}>
          <div key={testIndex} style={{ animation:'tfade 4s ease-in-out forwards' }}>
            <div style={{ fontSize:20,color:'var(--gold2)',marginBottom:14,letterSpacing:3 }}>{'★'.repeat(t.stars)}</div>
            <blockquote style={{ fontFamily:'var(--font-display)',fontSize:20,fontStyle:'italic',fontWeight:300,lineHeight:1.6,color:'var(--cream)',marginBottom:16 }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div style={{ fontSize:12,color:'var(--muted2)' }}>— {t.name}, {t.city}</div>
          </div>
          {/* Dots */}
          <div style={{ display:'flex',gap:6,marginTop:24 }}>
            {TESTIMONIALS.map((_,i) => (
              <div key={i} style={{ width:i===testIndex?16:5,height:5,borderRadius:3,background:i===testIndex?'var(--gold)':'var(--border2)',transition:'all .3s',cursor:'pointer' }} onClick={() => setTestIndex(i)} />
            ))}
          </div>
        </div>
        <div style={{ fontSize:11,color:'var(--muted)',letterSpacing:.5 }}>+1247 vendeurs · annonza.business</div>
      </div>

      {/* Formulaire */}
      <div className="auth-right" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px' }}>
        <div style={{ width:'100%',maxWidth:380 }}>
          <div style={{ marginBottom:36 }}>
            <div className="label" style={{ marginBottom:10 }}>Espace personnel</div>
            <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:600,letterSpacing:-.5,lineHeight:1 }}>Connexion</h1>
          </div>
          <form onSubmit={submit}>
            {[
              { key:'email',label:'Adresse e-mail',type:'email',ph:'votre@email.com' },
              { key:'password',label:'Mot de passe',type:'password',ph:'••••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ fontSize:11,fontWeight:500,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:8 }}>{f.label}</label>
                <input className="input-field" type={f.type} placeholder={f.ph}
                  value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} required />
              </div>
            ))}
            {error && <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.2)',borderRadius:3,padding:'10px 14px',fontSize:13,color:'var(--red2)',marginBottom:16 }}>{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%',marginTop:8,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
              {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Connexion...</>:'SE CONNECTER'}
            </button>
          </form>
          <div style={{ marginTop:20,textAlign:'center',fontSize:13,color:'var(--muted2)' }}>
            Pas encore de compte ? <Link href="/auth/register" style={{ color:'var(--gold2)',borderBottom:'1px solid var(--gold-border)',paddingBottom:1 }}>S&apos;inscrire</Link>
          </div>
          <div style={{ textAlign:'center',marginTop:12 }}>
            <Link href="/" style={{ fontSize:12,color:'var(--muted)' }}>← Retour a l&apos;accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
