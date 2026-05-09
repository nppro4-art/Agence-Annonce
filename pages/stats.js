import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Stats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      fetch('/api/stats/public').then(r => r.json()).then(d => {
        setData(d)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
    load()
    // Rafraichir toutes les 30 secondes
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',color:'var(--white)',fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .fade-up{animation:fadeUp .6s ease forwards}
        .stat-card{transition:all .2s}.stat-card:hover{transform:translateY(-2px)}
      `}</style>

      <nav style={{ position:'sticky',top:0,zIndex:100,padding:'0 32px',background:'rgba(3,3,3,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',height:56 }}>
        <Link href="/" style={{ fontFamily:'var(--font-label)',fontSize:16,letterSpacing:3 }}>
          Agence <span style={{ color:'var(--red)' }}>d&apos;Annonce</span>
        </Link>
        <Link href="/auth/register">
          <button className="btn-primary" style={{ fontSize:11,padding:'8px 16px' }}>Commencer</button>
        </Link>
      </nav>

      <div style={{ maxWidth:800,margin:'0 auto',padding:'60px 24px 100px' }}>

        <div className="fade-up" style={{ textAlign:'center',marginBottom:52 }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:16,background:'rgba(45,122,79,.08)',border:'1px solid rgba(45,122,79,.2)',borderRadius:20,padding:'6px 14px' }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#2d7a4f',animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:12,color:'#2d7a4f',fontWeight:500 }}>Statistiques en direct</span>
          </div>
          <div className="label" style={{ marginBottom:12 }}>Transparence totale</div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(28px,5vw,48px)',fontWeight:400,letterSpacing:-.5,marginBottom:12 }}>
            Annonza en chiffres
          </h1>
          <p style={{ fontSize:14,color:'var(--muted2)',lineHeight:1.7 }}>
            Donnees mises a jour en temps reel depuis mai 2026.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:40 }}>
            <div style={{ width:32,height:32,border:'2px solid var(--border2)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {/* KPIs principaux */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)',marginBottom:1 }}>
              {[
                { label:'Annonces generees', val:(data?.annonces||0).toLocaleString('fr-FR'), sub:'depuis mai 2026', color:'var(--gold2)' },
                { label:'Reponses creees', val:(data?.reponses||0).toLocaleString('fr-FR'), sub:'depuis mai 2026', color:'var(--gold2)' },
                { label:'Estimations realisees', val:(data?.estimations||0).toLocaleString('fr-FR'), sub:'depuis mai 2026', color:'var(--gold2)' },
              ].map((s,i) => (
                <div key={i} className="stat-card" style={{ background:'var(--ink)',padding:'28px 20px',textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:'clamp(28px,4vw,42px)',color:s.color,letterSpacing:-2,lineHeight:1,marginBottom:8 }}>{s.val}</div>
                  <div style={{ fontSize:12,fontWeight:600,color:'var(--cream)',marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:10,color:'var(--muted2)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Objectif */}
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',padding:'24px',marginBottom:1 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-label)',fontSize:11,letterSpacing:2,color:'var(--gold3)',marginBottom:4 }}>OBJECTIF 2026</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:600 }}>1 000 vendeurs actifs</div>
                </div>
                <div style={{ fontFamily:'var(--font-label)',fontSize:28,color:'var(--gold2)',letterSpacing:-1 }}>
                  {data?.users||0}<span style={{ fontSize:14,color:'var(--muted2)',letterSpacing:0 }}> / 1 000</span>
                </div>
              </div>
              <div style={{ background:'var(--s3)',borderRadius:2,height:8,overflow:'hidden' }}>
                <div style={{ width:Math.min(((data?.users||0)/1000)*100,100)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold3),var(--gold2))',transition:'width 1.5s cubic-bezier(.4,0,.2,1)',borderRadius:2 }} />
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'var(--muted2)' }}>
                <span>{Math.round(((data?.users||0)/1000)*100)}% atteint</span>
                <span>{1000-(data?.users||0)} vendeurs restants</span>
              </div>
            </div>

            {/* Message rassurant */}
            <div style={{ background:'var(--ink)',border:'1px solid var(--border)',borderLeft:'3px solid var(--gold)',padding:'20px 24px',marginBottom:1 }}>
              <div style={{ fontSize:13,color:'var(--muted2)',lineHeight:1.8 }}>
                Ces chiffres sont reels et mis a jour automatiquement. Annonza est un service transparent qui ne gonfle pas ses statistiques.
                Chaque annonce comptabilisee a ete reellement generee par un utilisateur sur la plateforme.
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign:'center',marginTop:40 }}>
              <p style={{ fontSize:14,color:'var(--muted2)',marginBottom:20 }}>Rejoignez les vendeurs qui utilisent l&apos;IA pour vendre plus vite.</p>
              <Link href="/auth/register">
                <button className="btn-gold" style={{ fontSize:13,padding:'15px 40px',letterSpacing:2,color:'#030303' }}>
                  COMMENCER GRATUITEMENT
                </button>
              </Link>
            </div>
          </>
        )}
      </div>

      <footer style={{ borderTop:'1px solid var(--border)',padding:'20px 32px',display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center' }}>
        {[['Accueil','/'],['Tarifs','/pricing'],['CGV','/cgv'],['Confidentialite','/confidentialite'],['A propos','/a-propos']].map(([l,h]) => (
          <Link key={l} href={h} style={{ fontSize:12,color:'var(--muted2)' }}>{l}</Link>
        ))}
      </footer>
    </div>
  )
}
