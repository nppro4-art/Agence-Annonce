import { useState, useEffect } from 'react'

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('emp_code') : null
    if (saved) setInput(saved)
    setInitialized(true)
    // Total users public
    fetch('/api/stats/public').then(r => r.json()).then(d => setTotalUsers(d.annonces || 0)).catch(() => {})
  }, [])

  const loadStats = async (c) => {
    if (!c || !c.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/employee/stats?code=' + c.trim())
      const data = await res.json()
      if (data.error) { setError('Code invalide.'); localStorage.removeItem('emp_code'); setLoading(false); return }
      setStats(data); setCode(c.trim())
      localStorage.setItem('emp_code', c.trim())
    } catch(e) { setError('Erreur de connexion.') }
    setLoading(false)
  }

  const handleDisconnect = () => {
    localStorage.removeItem('emp_code')
    setStats(null); setCode(''); setInput(''); setError('')
  }

  if (!initialized) return null

  const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''
  const link = SITE_URL + '/?ref=' + code

  // COMMISSION PAR PLAN
  const PLAN_COMM = { starter: 0.50, business: 1.50, expert: 2.50 }

  // PAGE CONNEXION
  if (!stats) return (
    <div style={{ minHeight:'100vh',display:'flex',background:'var(--black)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:768px){.auth-left{display:none!important}}`}</style>
      <div className="auth-left" style={{ flex:1,background:'var(--ink)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at 40% 50%,rgba(201,168,76,.05),transparent)',pointerEvents:'none' }} />
        <div style={{ fontFamily:'var(--font-label)',fontSize:18,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span></div>
        <div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:13,fontStyle:'italic',color:'var(--gold3)',letterSpacing:1,marginBottom:16 }}>Espace affilie</div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:32,fontWeight:300,letterSpacing:-.5,lineHeight:1.1,marginBottom:24,color:'var(--cream)' }}>
            Suivez vos<br/><span style={{ fontWeight:700,fontStyle:'italic' }}>performances</span>
          </h2>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:20 }}>
            {[['Starter','0,50 EUR/sem'],['Business','1,50 EUR/sem'],['Expert','2,50 EUR/sem']].map(([p,c]) => (
              <div key={p} style={{ background:'var(--s1)',padding:'12px 16px' }}>
                <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{p}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:18,color:'var(--gold2)',letterSpacing:-1 }}>{c}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:11,color:'var(--muted)' }}>annonza.business</div>
      </div>
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px' }}>
        <div style={{ width:'100%',maxWidth:360 }}>
          <div style={{ marginBottom:36 }}>
            <div className="label" style={{ marginBottom:10 }}>Acces securise</div>
            <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:600,letterSpacing:-.5,lineHeight:1 }}>Votre espace</h1>
          </div>
          <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'16px 20px',marginBottom:1 }}>
            <label style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:8 }}>Votre code</label>
            <input style={{ background:'transparent',border:'none',borderBottom:'1px solid var(--border2)',color:'var(--white)',fontSize:18,fontFamily:'var(--font-label)',letterSpacing:3,padding:'8px 0',width:'100%',outline:'none',textTransform:'uppercase' }}
              placeholder="XXXX0" value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') loadStats(input) }} />
          </div>
          {error && <div style={{ background:'rgba(200,57,43,.08)',border:'1px solid rgba(200,57,43,.2)',padding:'10px 14px',fontSize:12,color:'var(--red2)',marginBottom:1 }}>{error}</div>}
          <button onClick={() => loadStats(input)} disabled={loading || !input.trim()}
            className="btn-primary" style={{ width:'100%',fontSize:12,padding:'15px',letterSpacing:2,opacity:(loading||!input.trim())?.5:1,display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:1 }}>
            {loading?<><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>Connexion...</>:'ACCEDER'}
          </button>
        </div>
      </div>
    </div>
  )

  // CALCULS
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const commRecent = (startDate) => {
    // Simulation basée sur stats — en production viendrait de l'API
    return ((stats.commissionsTotal || 0) * 0.1).toFixed(2)
  }

  const conversionRate = stats.clicks > 0 ? Math.round((stats.ventes / stats.clicks) * 100) : 0
  const planDist = { starter: Math.floor(stats.ventes * 0.3), business: Math.floor(stats.ventes * 0.5), expert: Math.floor(stats.ventes * 0.2) }

  const S = {
    card: { background:'var(--s1)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:1 },
    secTitle: { fontFamily:'var(--font-label)',fontSize:10,letterSpacing:3,color:'var(--gold3)',marginBottom:14,borderBottom:'1px solid var(--border)',paddingBottom:8 },
    lbl: { fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:4 },
  }

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.db-fade{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) forwards}`}</style>

      <header style={{ background:'rgba(3,3,3,.95)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:900,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>Agence <span style={{ color:'var(--red)' }}>d&apos;A</span></span>
            <div style={{ width:1,height:18,background:'var(--border2)' }} />
            <span style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:2,color:'var(--gold3)' }}>AFFILIE</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontFamily:'var(--font-display)',fontSize:14,fontStyle:'italic',color:'var(--muted2)' }}>{stats.name}</span>
            <button onClick={handleDisconnect} style={{ background:'none',border:'1px solid var(--border2)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:11,padding:'6px 12px' }}>Quitter</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:900,margin:'0 auto',padding:'32px 24px 80px' }} className="db-fade">

        {/* TITRE */}
        <div style={{ marginBottom:28 }}>
          <div className="label" style={{ marginBottom:8 }}>Tableau de bord</div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:400,letterSpacing:-.5 }}>
            Bonjour, <span style={{ fontStyle:'italic',fontWeight:600 }}>{stats.name}</span>
          </h1>
        </div>

        {/* SECTION 1 : TRACKING */}
        <div style={S.secTitle}>TRACKING &amp; PERFORMANCE</div>

        {/* Total clients sur le site */}
        <div style={{ ...S.card,marginBottom:1 }}>
          <div style={S.lbl}>Nombre total de clients sur la plateforme</div>
          <div style={{ fontFamily:'var(--font-label)',fontSize:28,letterSpacing:-1,color:'var(--cream)',marginBottom:8 }}>{(totalUsers + 47).toLocaleString('fr-FR')}</div>
          <div style={{ background:'var(--s3)',borderRadius:1,height:4,overflow:'hidden',marginBottom:6 }}>
            <div style={{ width:Math.min(((totalUsers+47)/100000)*100,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width 1.2s' }} />
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--muted2)' }}>
            <span>{totalUsers+47} clients</span><span>Objectif : 100 000</span>
          </div>
        </div>

        {/* Clients via son lien */}
        <div style={{ ...S.card,marginBottom:1 }}>
          <div style={S.lbl}>Clients abonnes via votre lien / total plateforme</div>
          <div style={{ fontFamily:'var(--font-label)',fontSize:28,letterSpacing:-1,color:'var(--gold2)',marginBottom:8 }}>{stats.ventes}</div>
          <div style={{ background:'var(--s3)',borderRadius:1,height:4,overflow:'hidden',marginBottom:6 }}>
            <div style={{ width:Math.min((stats.ventes/Math.max(totalUsers+47,1))*100,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--red),var(--red2))',transition:'width 1.2s' }} />
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--muted2)' }}>
            <span>{stats.ventes} via votre lien</span><span>{(totalUsers+47)} au total</span>
          </div>
        </div>

        {/* Distribution par plan */}
        <div style={{ ...S.card,marginBottom:16 }}>
          <div style={S.lbl}>Repartition par plan (estimation)</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginTop:10 }}>
            {[['Starter',planDist.starter,'0,50'],['Business',planDist.business,'1,50'],['Expert',planDist.expert,'2,50']].map(([plan,nb,comm]) => (
              <div key={plan} style={{ background:'var(--ink)',padding:'14px' }}>
                <div style={{ fontSize:9,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>{plan}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:22,letterSpacing:-1,lineHeight:1,marginBottom:3 }}>{nb}</div>
                <div style={{ fontSize:10,color:'var(--gold3)' }}>{comm} EUR/sem chacun</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2 : REVENUS */}
        <div style={S.secTitle}>REVENUS</div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:16 }}>
          {[
            ['Cette semaine','var(--gold2)',((stats.clientsActifs||0)*1.5).toFixed(2)+' EUR'],
            ['Ce mois','var(--cream)',((stats.clientsActifs||0)*6).toFixed(2)+' EUR'],
            ['Cette annee','var(--muted3)',((stats.commissionsTotal||0)).toFixed(2)+' EUR'],
          ].map(([label,color,val]) => (
            <div key={label} style={{ background:'var(--ink)',padding:'20px' }}>
              <div style={{ fontSize:10,color:'var(--muted2)',letterSpacing:1,textTransform:'uppercase',marginBottom:8 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:24,color,letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{val}</div>
              <div style={{ fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5 }}>estimation</div>
            </div>
          ))}
        </div>

        {/* Commissions dues */}
        <div style={{ ...S.card,border:'1px solid var(--gold-border)',marginBottom:16,position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(201,168,76,.04),transparent)',pointerEvents:'none' }} />
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12 }}>
            <div>
              <div style={S.lbl}>Commissions a recevoir</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:36,color:'var(--gold2)',letterSpacing:-2,lineHeight:1,marginBottom:4 }}>{(stats.commissionsDues||0)} EUR</div>
              <div style={{ fontSize:11,color:'var(--muted2)' }}>En attente de versement par l&apos;administrateur</div>
            </div>
            <div>
              <div style={S.lbl}>Total gagne</div>
              <div style={{ fontFamily:'var(--font-label)',fontSize:28,letterSpacing:-1,lineHeight:1,marginBottom:4 }}>{(stats.commissionsTotal||0)} EUR</div>
              <div style={{ fontSize:11,color:'var(--muted)' }}>Depuis le debut</div>
            </div>
          </div>
        </div>

        {/* SECTION 3 : PROFIL & LIEN */}
        <div style={S.secTitle}>MON PROFIL &amp; LIEN AFFILIE</div>

        <div style={S.card}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)',marginBottom:12 }}>
            {[
              ['Identifiant',stats.code],
              ['Nom',stats.name],
              ['Clics totaux',stats.clicks],
              ['Taux conversion',conversionRate+'%'],
              ['Clients actifs',stats.clientsActifs||0],
              ['Clients total',stats.ventes||0],
            ].map(([label,val]) => (
              <div key={label} style={{ background:'var(--ink)',padding:'12px 16px' }}>
                <div style={{ fontSize:10,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:14,fontWeight:600,color:'var(--cream)',fontFamily:label==='Identifiant'?'monospace':'inherit' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:12 }}>
            <div style={S.lbl}>Mon lien d&apos;affiliation</div>
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',padding:'10px 14px',fontFamily:'monospace',fontSize:11,color:'var(--muted2)',wordBreak:'break-all',marginBottom:10 }}>{link}</div>
            <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
              className="btn-ghost" style={{ width:'100%',fontSize:11,color:copied?'var(--gold2)':'var(--muted2)',borderColor:copied?'var(--gold-border)':'var(--border2)' }}>
              {copied?'Lien copie !':'Copier mon lien'}
            </button>
          </div>

          {/* Structure commissions */}
          <div style={S.lbl}>Commissions par plan</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)' }}>
            {[['Starter','0,50 EUR'],['Business','1,50 EUR'],['Expert','2,50 EUR']].map(([plan,comm]) => (
              <div key={plan} style={{ background:'var(--s2)',padding:'12px',textAlign:'center' }}>
                <div style={{ fontSize:9,color:'var(--muted2)',textTransform:'uppercase',letterSpacing:1,marginBottom:4 }}>{plan}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:18,color:'var(--gold3)',letterSpacing:-1 }}>{comm}</div>
                <div style={{ fontSize:9,color:'var(--muted)',marginTop:2 }}>par semaine</div>
              </div>
            ))}
          </div>
        </div>

        {/* Taux conversion */}
        <div style={{ ...S.card,marginTop:1 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
            <div style={S.lbl}>Taux de conversion</div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:20,color:'var(--gold2)',letterSpacing:-1 }}>{conversionRate}%</div>
          </div>
          <div style={{ background:'var(--s3)',borderRadius:1,height:3,overflow:'hidden',marginBottom:6 }}>
            <div style={{ width:Math.min(conversionRate,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width 1.2s' }} />
          </div>
          <div style={{ fontSize:10,color:'var(--muted)' }}>{stats.clicks} clics → {stats.ventes} conversions</div>
        </div>

      </main>
    </div>
  )
}
