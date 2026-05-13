import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ChatPage() {
  const router = useRouter()
  const { code } = router.query
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [botInfo, setBotInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!code) return
    // Message de bienvenue
    setMessages([{
      role: 'assistant',
      content: 'Bonjour ! Je suis l\'assistant de ce vendeur. Posez-moi toutes vos questions sur cet article, je vous repondrai instantanement.'
    }])
  }, [code])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          question,
          history: newMessages.slice(-6) // 3 derniers échanges
        })
      })
      const data = await res.json()
      if (res.status === 404) { setNotFound(true); return }
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Desolee, je ne peux pas repondre a cette question.' }])
    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Reessayez.' }])
    }
    setLoading(false)
  }

  if (notFound) return (
    <div style={{ minHeight:'100vh',background:'var(--black)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-ui)',padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:400,marginBottom:12 }}>Assistant non disponible</div>
        <div style={{ fontSize:14,color:'var(--muted2)',marginBottom:24 }}>Ce chatbot n&apos;existe plus ou a ete desactive par le vendeur.</div>
        <Link href="/"><button className="btn-primary" style={{ fontSize:12,padding:'10px 24px' }}>Retour a l&apos;accueil</button></Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--black)',display:'flex',flexDirection:'column',fontFamily:'var(--font-ui)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .msg{animation:fadeUp .3s ease forwards}
        @media(max-width:768px){.chat-pad{padding:16px 12px!important}}
      `}</style>

      {/* Header */}
      <header style={{ background:'rgba(3,3,3,.95)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(20px)',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--success2)',animation:'pulse 2s infinite' }} />
          <div>
            <div style={{ fontFamily:'var(--font-label)',fontSize:11,letterSpacing:2,color:'var(--gold2)' }}>ASSISTANT VENDEUR</div>
            <div style={{ fontSize:11,color:'var(--muted2)' }}>Repond a vos questions en temps reel</div>
          </div>
        </div>
        <Link href="/" style={{ fontSize:11,color:'var(--muted2)' }}>
          Propulse par <span style={{ color:'var(--gold2)' }}>Annonza</span>
        </Link>
      </header>

      {/* Messages */}
      <div className="chat-pad" style={{ flex:1,maxWidth:700,width:'100%',margin:'0 auto',padding:'24px',overflowY:'auto',display:'flex',flexDirection:'column',gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} className="msg" style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-label)',fontSize:11,color:'#030303',marginRight:8,flexShrink:0,marginTop:2 }}>A</div>
            )}
            <div style={{ maxWidth:'75%',padding:'10px 16px',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',background:m.role==='user'?'var(--red)':'var(--s1)',border:m.role==='user'?'none':'1px solid var(--border)',fontSize:14,lineHeight:1.65,color:'var(--cream)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold3),var(--gold2))',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-label)',fontSize:11,color:'#030303',flexShrink:0 }}>A</div>
            <div style={{ background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'16px 16px 16px 4px',padding:'12px 16px',display:'flex',gap:6,alignItems:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--muted2)',animation:'pulse 1.2s infinite',animationDelay:i*0.2+'s' }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background:'rgba(3,3,3,.95)',borderTop:'1px solid var(--border)',backdropFilter:'blur(20px)',padding:'16px 24px',position:'sticky',bottom:0 }}>
        <div style={{ maxWidth:700,margin:'0 auto',display:'flex',gap:10 }}>
          <input
            style={{ flex:1,background:'var(--s1)',border:'1px solid var(--border2)',borderRadius:24,color:'var(--white)',fontSize:14,padding:'12px 20px',outline:'none',transition:'border-color .2s' }}
            placeholder="Posez votre question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            onFocus={e => e.target.style.borderColor='var(--gold-border)'}
            onBlur={e => e.target.style.borderColor='var(--border2)'}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-gold"
            style={{ borderRadius:24,padding:'12px 20px',fontSize:13,color:'#030303',opacity:(loading||!input.trim())?0.5:1,flexShrink:0 }}>
            Envoyer
          </button>
        </div>
        <div style={{ maxWidth:700,margin:'6px auto 0',textAlign:'center',fontSize:10,color:'var(--muted)' }}>
          Propulse par <Link href="/" style={{ color:'var(--gold3)' }}>Annonza.business</Link> · Assistant IA pour vendeurs particuliers
        </div>
      </div>
    </div>
  )
}
