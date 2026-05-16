// lib/SkyBackground.js
// Composant ciel dynamique selon l'heure de Paris
// Utilisé dans dashboard, admin, login, register

import { useState, useEffect } from 'react'

export const SKY_THEMES = {
  deep_night: {
    label: 'Nuit profonde (00h-03h)',
    bg: 'linear-gradient(180deg, #020408 0%, #05080f 50%, #080a0f 100%)',
    stars: 60, starOpacity: 0.9,
    moon: true, moonPhase: '🌙', moonGlow: 'rgba(180,200,255,.7)',
    nebula1: 'rgba(20,40,120,.18)', nebula2: 'rgba(10,20,80,.12)',
    sun: false,
    overlay: null,
  },
  late_night: {
    label: 'Fin de nuit (03h-06h)',
    bg: 'linear-gradient(180deg, #030608 0%, #08101a 50%, #0d1520 100%)',
    stars: 40, starOpacity: 0.7,
    moon: true, moonPhase: '🌘', moonGlow: 'rgba(180,200,255,.5)',
    nebula1: 'rgba(20,50,130,.15)', nebula2: 'rgba(10,25,90,.10)',
    sun: false,
    overlay: 'rgba(10,20,40,.3)',
  },
  dawn: {
    label: 'Aube (06h-09h)',
    bg: 'linear-gradient(180deg, #0a0e18 0%, #1a2040 30%, #3d2b1a 70%, #7a4020 100%)',
    stars: 15, starOpacity: 0.4,
    moon: true, moonPhase: '🌙', moonGlow: 'rgba(180,200,255,.2)',
    nebula1: 'rgba(120,80,40,.15)', nebula2: 'rgba(80,50,20,.10)',
    sun: false,
    overlay: null,
    aurora: 'linear-gradient(180deg, transparent 0%, rgba(200,120,60,.08) 60%, rgba(230,150,80,.15) 100%)',
  },
  morning: {
    label: 'Matin (09h-12h)',
    bg: 'linear-gradient(180deg, #1a3a6a 0%, #2d5fa8 40%, #5b8fd4 70%, #8ab5e8 100%)',
    stars: 0, starOpacity: 0,
    moon: false,
    nebula1: 'rgba(255,255,255,.06)', nebula2: 'rgba(200,220,255,.04)',
    sun: true, sunPos: { top:'15%', right:'20%' }, sunSize: 60, sunGlow: 'rgba(255,220,100,.4)',
    overlay: null,
    clouds: true,
  },
  noon: {
    label: 'Plein soleil (12h-15h)',
    bg: 'linear-gradient(180deg, #1565c0 0%, #1e88e5 35%, #42a5f5 65%, #90caf9 100%)',
    stars: 0, starOpacity: 0,
    moon: false,
    nebula1: 'rgba(255,255,255,.08)', nebula2: 'rgba(200,230,255,.05)',
    sun: true, sunPos: { top:'10%', left:'50%', transform:'translateX(-50%)' }, sunSize: 80, sunGlow: 'rgba(255,230,80,.6)',
    overlay: null,
    clouds: true,
  },
  afternoon: {
    label: 'Après-midi (15h-18h)',
    bg: 'linear-gradient(180deg, #1a4a8a 0%, #2860a8 40%, #5580b8 65%, #8090a8 100%)',
    stars: 0, starOpacity: 0,
    moon: false,
    nebula1: 'rgba(200,180,100,.08)', nebula2: 'rgba(180,150,80,.05)',
    sun: true, sunPos: { top:'25%', right:'15%' }, sunSize: 65, sunGlow: 'rgba(255,180,60,.45)',
    overlay: null,
    clouds: true,
  },
  sunset: {
    label: 'Coucher de soleil (18h-21h)',
    bg: 'linear-gradient(180deg, #0d1a2e 0%, #1a2a40 20%, #4a2a10 50%, #8a3a10 75%, #c05010 100%)',
    stars: 8, starOpacity: 0.3,
    moon: false,
    nebula1: 'rgba(200,80,20,.15)', nebula2: 'rgba(150,60,10,.10)',
    sun: true, sunPos: { bottom:'5%', right:'10%' }, sunSize: 70, sunGlow: 'rgba(255,120,30,.5)',
    overlay: null,
    aurora: 'linear-gradient(180deg, transparent 0%, rgba(200,80,30,.12) 50%, rgba(230,100,40,.2) 100%)',
  },
  dusk: {
    label: 'Crépuscule (21h-00h)',
    bg: 'linear-gradient(180deg, #020306 0%, #050810 40%, #080c18 70%, #0a0e1a 100%)',
    stars: 35, starOpacity: 0.6,
    moon: true, moonPhase: '🌛', moonGlow: 'rgba(180,200,255,.4)',
    nebula1: 'rgba(30,50,120,.14)', nebula2: 'rgba(15,25,80,.09)',
    sun: false,
    overlay: null,
  },
}

export function getThemeFromHour(parisHour) {
  if (parisHour >= 0 && parisHour < 3)  return 'deep_night'
  if (parisHour >= 3 && parisHour < 6)  return 'late_night'
  if (parisHour >= 6 && parisHour < 9)  return 'dawn'
  if (parisHour >= 9 && parisHour < 12) return 'morning'
  if (parisHour >= 12 && parisHour < 15) return 'noon'
  if (parisHour >= 15 && parisHour < 18) return 'afternoon'
  if (parisHour >= 18 && parisHour < 21) return 'sunset'
  return 'dusk'
}

export function useSkyTheme(manualTheme = null) {
  const [themeKey, setThemeKey] = useState('deep_night')

  useEffect(() => {
    if (manualTheme) { setThemeKey(manualTheme); return }
    const update = () => {
      const parisHour = parseInt(
        new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false }).format(new Date())
      )
      setThemeKey(getThemeFromHour(parisHour))
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [manualTheme])

  return { themeKey, theme: SKY_THEMES[themeKey] }
}

export function SkyBackground({ manualTheme = null }) {
  const { themeKey, theme } = useSkyTheme(manualTheme)
  const stars = Array.from({ length: theme.stars }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: Math.random() * 3 + 2,
    delay: Math.random() * 4,
    op: Math.random() * theme.starOpacity,
  }))

  return (
    <div key={themeKey} style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, transition: 'background 3s ease' }}>
      {/* Fond gradient */}
      <div style={{ position: 'absolute', inset: 0, background: theme.bg, transition: 'background 3s ease' }} />

      {/* Aurora / lueurs */}
      {theme.aurora && <div style={{ position: 'absolute', inset: 0, background: theme.aurora }} />}
      {theme.overlay && <div style={{ position: 'absolute', inset: 0, background: theme.overlay }} />}

      {/* Nébuleuses */}
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '55vw', height: '55vw', background: `radial-gradient(circle,${theme.nebula1} 0%,transparent 70%)`, borderRadius: '50%', animation: 'nebulaPulse 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: '45vw', height: '45vw', background: `radial-gradient(circle,${theme.nebula2} 0%,transparent 70%)`, borderRadius: '50%', animation: 'nebulaPulse 16s ease-in-out infinite reverse' }} />

      {/* Étoiles */}
      {stars.map(s => (
        <div key={s.id} style={{ position: 'absolute', borderRadius: '50%', width: s.size + 'px', height: s.size + 'px', left: s.x + '%', top: s.y + '%', background: `rgba(200,215,255,${s.op})`, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}

      {/* Lune */}
      {theme.moon && (
        <div style={{ position: 'absolute', top: '8%', right: '12%', fontSize: 32, filter: `drop-shadow(0 0 12px ${theme.moonGlow})`, animation: 'moonGlow 4s ease-in-out infinite', transform: 'rotate(180deg)' }}>
          {theme.moonPhase}
        </div>
      )}

      {/* Soleil */}
      {theme.sun && (
        <div style={{ position: 'absolute', ...theme.sunPos }}>
          <div style={{ width: theme.sunSize + 'px', height: theme.sunSize + 'px', borderRadius: '50%', background: 'radial-gradient(circle, #fff8e1 0%, #ffe082 40%, #ffb300 70%, transparent 100%)', boxShadow: `0 0 ${theme.sunSize * 1.5}px ${theme.sunGlow}, 0 0 ${theme.sunSize * 3}px ${theme.sunGlow.replace('.', ',.2').replace('rgba(', 'rgba(')}`, animation: 'sunPulse 6s ease-in-out infinite' }} />
        </div>
      )}

      {/* Nuages (jour) */}
      {theme.clouds && (
        <>
          <div style={{ position: 'absolute', top: '18%', left: '10%', width: 120, height: 40, background: 'rgba(255,255,255,.12)', borderRadius: 40, filter: 'blur(8px)', animation: 'cloudDrift 40s linear infinite' }} />
          <div style={{ position: 'absolute', top: '30%', right: '15%', width: 90, height: 30, background: 'rgba(255,255,255,.09)', borderRadius: 30, filter: 'blur(6px)', animation: 'cloudDrift 55s linear infinite reverse' }} />
          <div style={{ position: 'absolute', top: '12%', left: '35%', width: 70, height: 25, background: 'rgba(255,255,255,.07)', borderRadius: 25, filter: 'blur(5px)', animation: 'cloudDrift 70s linear infinite' }} />
        </>
      )}

      <style>{`
        @keyframes twinkle{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes moonGlow{0%,100%{filter:drop-shadow(0 0 6px ${theme.moonGlow||'rgba(180,200,255,.4)'})}50%{filter:drop-shadow(0 0 16px ${theme.moonGlow||'rgba(180,200,255,.8)'})}}
        @keyframes nebulaPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes sunPulse{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes cloudDrift{from{transform:translateX(-20px)}to{transform:translateX(20px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
    </div>
  )
}
