import { prisma } from './db'

export const PACK_MAP = {
  'price_1TSJjYFREjYOQtxiPhdPDU8E': { name: 'Pack 5 annonces',   type: 'annonces', qty: 5,   amount: 9.99  },
  'price_1TSJliFREjYOQtxiv1D7Z2Cv': { name: 'Pack 10 annonces',  type: 'annonces', qty: 10,  amount: 17.99 },
  'price_1TSJmpFREjYOQtxi1NvRkDxC': { name: 'Pack 50 reponses',  type: 'reponses', qty: 50,  amount: 14.99 },
  'price_1TSJnvFREjYOQtxiVC2KPEtd': { name: 'Pack 500 reponses', type: 'reponses', qty: 500, amount: 39.99 },
}

// ── LIMITES PAR PLAN ────────────────────────────────────────
export const PLAN_LIMITS = {
  premium:  { annonces: Infinity, reponses: Infinity, chatbot: 500 },
  expert:   { annonces: Infinity, reponses: Infinity, chatbot: 200 },
  business: { annonces: 30,       reponses: 100,      chatbot: 50  },
  starter:  { annonces: 10,       reponses: 30,       chatbot: 0   },
  pro:      { annonces: 30,       reponses: 100,      chatbot: 50  },
  free:     { annonces: 0,        reponses: 0,        chatbot: 0   },
}

// ── FONCTIONNALITES PAR PLAN ────────────────────────────────
export const PLAN_FEATURES = {
  premium: {
    annonce: true, reponse: true, estimation: true, analyser: true,
    chatbot: true, ventes: true, flash: true, traduction: true,
    lot: true, arnaque: true, calendrier: true, plateformes: true,
    titres: true, prixDetect: true, checklist: true,
  },
  expert: {
    annonce: true, reponse: true, estimation: true, analyser: true,
    chatbot: true, ventes: true, flash: true, traduction: true,
    lot: true, arnaque: true, calendrier: true, plateformes: true,
    titres: true, prixDetect: true, checklist: true,
  },
  business: {
    annonce: true, reponse: true, estimation: true, analyser: true,
    chatbot: true, ventes: true, flash: true, traduction: true,
    lot: false, arnaque: true, calendrier: true, plateformes: true,
    titres: true, prixDetect: true, checklist: true,
  },
  starter: {
    annonce: true, reponse: true, estimation: true, analyser: false,
    chatbot: false, ventes: false, flash: false, traduction: false,
    lot: false, arnaque: false, calendrier: true, plateformes: false,
    titres: true, prixDetect: true, checklist: true,
  },
  pro: {
    annonce: true, reponse: true, estimation: true, analyser: true,
    chatbot: true, ventes: true, flash: true, traduction: true,
    lot: false, arnaque: true, calendrier: true, plateformes: true,
    titres: true, prixDetect: true, checklist: true,
  },
  free: {
    annonce: false, reponse: false, estimation: true, analyser: false,
    chatbot: false, ventes: false, flash: false, traduction: false,
    lot: false, arnaque: false, calendrier: false, plateformes: false,
    titres: false, prixDetect: false, checklist: true,
  },
}

export const PLAN_NAMES = {
  premium: 'Premium', expert: 'Expert', business: 'Business',
  starter: 'Starter', pro: 'Business', free: 'Gratuit',
}

export const PLAN_PRICES = {
  premium: '—', expert: '12,99', business: '5,99',
  starter: '3,99', pro: '5,99', free: '0',
}

export const PLAN_WEEKLY_COMMISSION = {
  starter: 0.50, business: 1.50, expert: 2.50, pro: 1.50,
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function hasFeature(planKey, feature) {
  const features = PLAN_FEATURES[planKey] || PLAN_FEATURES.free
  return !!features[feature]
}

export async function getWeeklyUsage(userId) {
  const weekStart = getWeekStart()
  const [annonces, reponses] = await Promise.all([
    prisma.annonce.count({ where: { userId, createdAt: { gte: weekStart }, type: { not: 'estimation' } } }),
    prisma.reponse.count({ where: { userId, createdAt: { gte: weekStart } } }),
  ])
  return { annonces, reponses }
}

export async function canUse(userId, type, plan) {
  if (plan === 'premium') return { allowed: true, source: 'premium', remaining: Infinity }

  if (plan === 'free') {
    const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
    if (credit && credit.total > credit.used) return { allowed: true, source: 'pack', remaining: credit.total - credit.used }
    return { allowed: false, source: null, remaining: 0 }
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const weekStart = getWeekStart()
  let usedThisWeek = 0

  if (type === 'annonces') {
    usedThisWeek = await prisma.annonce.count({ where: { userId, createdAt: { gte: weekStart }, type: { not: 'estimation' } } })
  } else if (type === 'reponses') {
    usedThisWeek = await prisma.reponse.count({ where: { userId, createdAt: { gte: weekStart } } })
  }

  const limit = limits[type] || 0
  const remaining = limit === Infinity ? Infinity : limit - usedThisWeek

  if (remaining > 0) return { allowed: true, source: 'subscription', remaining }

  // Fallback sur les packs
  const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
  if (credit && credit.total > credit.used) return { allowed: true, source: 'pack', remaining: credit.total - credit.used }

  return { allowed: false, source: null, remaining: 0 }
}

export async function canUseChatbot(userId, plan) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const maxPerDay = limits.chatbot || 0
  if (maxPerDay === 0) return { allowed: false }
  if (maxPerDay === Infinity || maxPerDay >= 500) return { allowed: true }

  // Compter les messages chatbot aujourd'hui pour cet utilisateur
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const count = await prisma.chatMessage.count({
    where: {
      chatBot: { userId },
      role: 'assistant',
      createdAt: { gte: today }
    }
  }).catch(() => 0)

  return { allowed: count < maxPerDay, remaining: Math.max(0, maxPerDay - count) }
}

export async function addCredits(userId, type, quantity, packName, amount, stripeId) {
  await prisma.credit.upsert({
    where: { userId_type: { userId, type } },
    update: { total: { increment: quantity } },
    create: { userId, type, total: quantity, used: 0 }
  })
  await prisma.purchase.create({
    data: { userId, packName, packType: type, quantity, amount, stripeId }
  })
}

export async function useCredit(userId, type) {
  const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
  if (!credit || credit.used >= credit.total) return false
  await prisma.credit.update({
    where: { userId_type: { userId, type } },
    data: { used: { increment: 1 }, updatedAt: new Date() }
  })
  return true
}

export async function getCredits(userId) {
  const credits = await prisma.credit.findMany({ where: { userId } })
  const result = {
    annonces: { total: 0, used: 0, remaining: 0 },
    reponses: { total: 0, used: 0, remaining: 0 }
  }
  credits.forEach(c => {
    if (result[c.type]) {
      result[c.type].total += c.total
      result[c.type].used += c.used
      result[c.type].remaining = result[c.type].total - result[c.type].used
    }
  })
  return result
}
