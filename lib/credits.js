import { prisma } from './db'

export const PACK_MAP = {
  'price_1TSJjYFREjYOQtxiPhdPDU8E': { name: 'Pack 5 annonces',   type: 'annonces', qty: 5,   amount: 9.99  },
  'price_1TSJliFREjYOQtxiv1D7Z2Cv': { name: 'Pack 10 annonces',  type: 'annonces', qty: 10,  amount: 17.99 },
  'price_1TSJmpFREjYOQtxi1NvRkDxC': { name: 'Pack 50 reponses',  type: 'reponses', qty: 50,  amount: 14.99 },
  'price_1TSJnvFREjYOQtxiVC2KPEtd': { name: 'Pack 500 reponses', type: 'reponses', qty: 500, amount: 39.99 },
}

export const PLAN_LIMITS = {
  premium:  { annonces: Infinity, reponses: Infinity }, // acces admin illimite
  expert:   { annonces: 40,  reponses: 250 },
  business: { annonces: 15,  reponses: 60  },
  starter:  { annonces: 5,   reponses: 20  },
  pro:      { annonces: 15,  reponses: 60  },
  free:     { annonces: 0,   reponses: 0   },
}

export const PLAN_WEEKLY_COMMISSION = {
  starter: 0.50, business: 1.50, expert: 2.50, pro: 1.50,
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now); monday.setDate(diff); monday.setHours(0,0,0,0)
  return monday
}

export async function getWeeklyUsage(userId) {
  const weekStart = getWeekStart()
  const [annonces, reponses] = await Promise.all([
    prisma.annonce.count({ where: { userId, createdAt: { gte: weekStart } } }),
    prisma.reponse.count({ where: { userId, createdAt: { gte: weekStart } } }),
  ])
  return { annonces, reponses }
}

export async function canUse(userId, type, plan) {
  // Plan premium (acces admin) = illimite
  if (plan === 'premium') return { allowed: true, source: 'premium', remaining: Infinity }

  if (plan === 'free') {
    const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
    if (credit && credit.total > credit.used) return { allowed: true, source: 'pack', remaining: credit.total - credit.used }
    return { allowed: false, source: null, remaining: 0 }
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const weekStart = getWeekStart()
  let usedThisWeek = 0
  if (type === 'annonces') usedThisWeek = await prisma.annonce.count({ where: { userId, createdAt: { gte: weekStart } } })
  else if (type === 'reponses') usedThisWeek = await prisma.reponse.count({ where: { userId, createdAt: { gte: weekStart } } })

  const limit = limits[type] || 0
  const remaining = limit === Infinity ? Infinity : limit - usedThisWeek

  if (remaining > 0) return { allowed: true, source: 'subscription', remaining }

  const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
  if (credit && credit.total > credit.used) return { allowed: true, source: 'pack', remaining: credit.total - credit.used }

  return { allowed: false, source: null, remaining: 0 }
}

export async function addCredits(userId, type, quantity, packName, amount, stripeId) {
  await prisma.credit.upsert({
    where: { userId_type: { userId, type } },
    update: { total: { increment: quantity } },
    create: { userId, type, total: quantity, used: 0 }
  })
  await prisma.purchase.create({ data: { userId, packName, packType: type, quantity, amount, stripeId } })
}

export async function useCredit(userId, type) {
  const credit = await prisma.credit.findUnique({ where: { userId_type: { userId, type } } })
  if (!credit || credit.used >= credit.total) return false
  await prisma.credit.update({ where: { userId_type: { userId, type } }, data: { used: { increment: 1 }, updatedAt: new Date() } })
  return true
}

export async function getCredits(userId) {
  const credits = await prisma.credit.findMany({ where: { userId } })
  const result = { annonces: { total: 0, used: 0, remaining: 0 }, reponses: { total: 0, used: 0, remaining: 0 } }
  credits.forEach(c => {
    if (result[c.type]) {
      result[c.type].total += c.total
      result[c.type].used += c.used
      result[c.type].remaining = result[c.type].total - result[c.type].used
    }
  })
  return result
}
