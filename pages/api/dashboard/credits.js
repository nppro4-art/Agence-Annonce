import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { getCredits, getWeeklyUsage, PLAN_LIMITS } from '../../../lib/credits'

export default requireAuth(async function handler(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).end()

  const [credits, weeklyUsage, purchases] = await Promise.all([
    getCredits(user.id),
    getWeeklyUsage(user.id),
    prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  const limits = PLAN_LIMITS[user.planKey || user.plan] || PLAN_LIMITS.free

  // Calcul du reset - prochain lundi
  const now = new Date()
  const day = now.getDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const nextReset = new Date(now)
  nextReset.setDate(now.getDate() + daysUntilMonday)
  nextReset.setHours(0, 0, 0, 0)

  res.status(200).json({
    credits,
    purchases,
    weeklyUsage,
    limits,
    nextReset: nextReset.toISOString(),
    plan: user.plan,
    planKey: user.planKey || user.plan
  })
})
