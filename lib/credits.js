import { prisma } from './db'

// Map price_id → infos du pack
export const PACK_MAP = {
  'price_1TSJjYFREjYOQtxiPhdPDU8E': { name: 'Pack 5 annonces',   type: 'annonces', qty: 5,   amount: 9.99  },
  'price_1TSJliFREjYOQtxiv1D7Z2Cv': { name: 'Pack 10 annonces',  type: 'annonces', qty: 10,  amount: 17.99 },
  'price_1TSJmpFREjYOQtxi1NvRkDxC': { name: 'Pack 50 réponses',  type: 'reponses', qty: 50,  amount: 14.99 },
  'price_1TSJnvFREjYOQtxiVC2KPEtd': { name: 'Pack 500 réponses', type: 'reponses', qty: 500, amount: 39.99 },
}

// Récupérer les crédits d'un user
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

// Ajouter des crédits après achat
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

// Consommer un crédit
export async function useCredit(userId, type) {
  const credit = await prisma.credit.findUnique({
    where: { userId_type: { userId, type } }
  })
  if (!credit || credit.used >= credit.total) return false
  await prisma.credit.update({
    where: { userId_type: { userId, type } },
    data: { used: { increment: 1 }, updatedAt: new Date() }
  })
  return true
}

// Vérifier si un user peut utiliser une fonctionnalité
export async function canUse(userId, type, plan) {
  // Plan Elite = illimité (dans les limites raisonnables)
  if (plan === 'pro') return { allowed: true, source: 'elite', remaining: null }

  // Sinon vérifier les crédits pack
  const credit = await prisma.credit.findUnique({
    where: { userId_type: { userId, type } }
  })
  if (credit && credit.total > credit.used) {
    return { allowed: true, source: 'pack', remaining: credit.total - credit.used }
  }

  return { allowed: false, source: null, remaining: 0 }
}
