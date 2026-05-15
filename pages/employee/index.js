import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Employee() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data => {
      if (!data.user) { router.push('/auth/login'); return }
      if (data.user.role !== 'employee') { router.push('/dashboard'); return }
      fetch('/api/employee/stats').then(r=>r.json()).then(d => {
        setStats(d.stats)
        setEmp(d.employee)
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [])

  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/') }

  const copyLink = () => {
    const link = (typeof window!=='undefined'?window.location.origin:'')+'/?ref='+(emp?.code||'')
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(()=>setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--black)',gap:16 }}>
      <div style={{ fontFamily:'var(--font-label)',fontSize:14,letterSpacing:4,color:'var(--gold2)' }}>ESPACE AFFILIÉ</div>
      <div style={{ width:22,height:22,border:'1.5px solid rgba(201,168,76,.2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const link = (typeof window!=='undefined'?window.location.origin:'')+'/?ref='+(emp?.code||'')

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--cream)',fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp .5s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>

      <header style={{ background:'rgba(3,3,3,.97)',borderBottom:'1px solid rgba(201,168,76,.12)',backdropFilter:'blur(24px)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:800,margin:'0 auto',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontFamily:'var(--font-label)',fontSize:15,letterSpacing:4 }}>A.<span style={{ color:'var(--red)' }}>A</span></span>
            <div style={{ width:1,height:16,background:'var(--border2)' }} />
            <span style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--muted2)' }}>ESPACE AFFILIÉ</span>
          </div>
          <button onClick={logout} style={{ background:'none',border:'1px solid rgba(255,255,255,.06)',borderRadius:2,color:'var(--muted)',cursor:'pointer',fontSize:10,padding:'6px 12px' }}>↪</button>
        </div>
      </header>

      <main style={{ maxWidth:800,margin:'0 auto',padding:'40px 24px 80px' }}>
        <div className="fade">

          {/* Bienvenue */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,letterSpacing:3,color:'var(--muted2)',marginBottom:8 }}>TABLEAU DE BORD</div>
            <h1 style={{ fontFamily:'var(--font-display)',fontSize:38,fontWeight:400,letterSpacing:-.5,marginBottom:4 }}>
              Bonjour, <span style={{ fontStyle:'italic' }}>{emp?.name||'Affilié'}</span>
            </h1>
            <p style={{ fontSize:13,color:'var(--muted2)' }}>Code affilié : <span style={{ fontFamily:'monospace',color:'var(--gold2)' }}>{emp?.code}</span></p>
          </div>

          {/* Stats principales */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20 }}>
            {[
              { label:'Clics total',val:stats?.clicks||0,color:'var(--cream)',icon:'→' },
              { label:'Conversions',val:stats?.conversions||0,color:'var(--gold2)',icon:'✦' },
              { label:'Comm. dues',val:(stats?.commissionsDues||0)+' €',color:'var(--success2)',icon:'€' },
            ].map((s,i) => (
              <div key={i} style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:12,right:14,fontSize:18,opacity:.08 }}>{s.icon}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:8 }}>{s.label.toUpperCase()}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:300,letterSpacing:-1,color:s.color,lineHeight:1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Stats détaillées */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
            {[
              ['Commissions payées',(stats?.commissionsPaid||0)+' €'],
              ['Taux conversion',stats?.clicks>0?Math.round((stats.conversions/stats.clicks)*100)+'%':'—'],
              ['Clients Starter',(stats?.clientsByPlan?.starter||0)],
              ['Clients Business',(stats?.clientsByPlan?.business||0)],
              ['Clients Expert',(stats?.clientsByPlan?.expert||0)],
              ['Total clients',stats?.conversions||0],
            ].map(([l,v]) => (
              <div key={l} style={{ background:'rgba(255,255,255,.02)',border:'1px solid var(--border)',borderRadius:3,padding:'13px 16px' }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:8,color:'var(--muted)',letterSpacing:1.5,marginBottom:5 }}>{l.toUpperCase()}</div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:20,color:'var(--cream)',letterSpacing:-1 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Lien de parrainage */}
          <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,.06),rgba(201,168,76,.02))',border:'1px solid rgba(201,168,76,.2)',borderRadius:4,padding:'24px',marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--gold3)',letterSpacing:2.5,marginBottom:12 }}>VOTRE LIEN AFFILIÉ</div>
            <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:3,padding:'11px 14px',fontFamily:'monospace',fontSize:12,color:'var(--muted2)',wordBreak:'break-all',marginBottom:12 }}>
              {link}
            </div>
            <button onClick={copyLink}
              style={{ width:'100%',background:copied?'rgba(201,168,76,.08)':'transparent',border:'1px solid',borderColor:copied?'rgba(201,168,76,.3)':'rgba(255,255,255,.1)',borderRadius:3,color:copied?'var(--gold2)':'var(--muted2)',cursor:'pointer',fontFamily:'var(--font-label)',fontSize:10,letterSpacing:2,padding:'12px',transition:'all .2s' }}>
              {copied?'✓ LIEN COPIÉ':'COPIER MON LIEN'}
            </button>
          </div>

          {/* Commissions par plan */}
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px',marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:16 }}>COMMISSIONS PAR PLAN</div>
            {[
              { plan:'Starter',montant:'0,50 €',desc:'/semaine par client',color:'var(--muted3)' },
              { plan:'Business',montant:'1,50 €',desc:'/semaine par client',color:'var(--gold2)' },
              { plan:'Expert',montant:'2,50 €',desc:'/semaine par client',color:'var(--gold2)' },
            ].map(p => (
              <div key={p.plan} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <div style={{ fontFamily:'var(--font-label)',fontSize:12,letterSpacing:1,color:'var(--cream)' }}>{p.plan}</div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:300,color:p.color }}>{p.montant}</span>
                  <span style={{ fontSize:11,color:'var(--muted2)',marginLeft:4 }}>{p.desc}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:12,fontSize:12,color:'var(--muted2)',lineHeight:1.65 }}>
              + Commission unique de <strong style={{ color:'var(--gold3)' }}>6 €</strong> pour le premier paiement de chaque nouveau client.
            </div>
          </div>

          {/* Comment ça marche */}
          <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:4,padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--font-label)',fontSize:9,color:'var(--muted2)',letterSpacing:2,marginBottom:14 }}>COMMENT ÇA MARCHE</div>
            {[
              '1. Partagez votre lien affilié à des personnes qui vendent des objets.',
              '2. Quand elles s\'inscrivent via votre lien et prennent un plan payant, vous recevez une commission.',
              '3. Vous touchez une commission chaque semaine tant qu\'elles sont abonnées.',
              '4. Les commissions sont versées manuellement par l\'administrateur.',
            ].map((s,i) => (
              <div key={i} style={{ fontSize:12,color:'var(--muted2)',lineHeight:1.7,marginBottom:7,display:'flex',gap:8 }}>
                <span style={{ color:'var(--gold3)',flexShrink:0 }}>→</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
