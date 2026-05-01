// Rate limiting sans dépendance externe
const requests = new Map()

export function rateLimit({ max = 10, windowMs = 60000 } = {}) {
  return function check(identifier) {
    const now = Date.now()
    const record = requests.get(identifier) || { count: 0, resetAt: now + windowMs }
    if (now > record.resetAt) { record.count = 0; record.resetAt = now + windowMs }
    record.count++
    requests.set(identifier, record)
    if (record.count > max) return { limited: true, remaining: 0 }
    return { limited: false, remaining: max - record.count }
  }
}

// Auth : 10 tentatives / 15 min par IP
export const authLimiter = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 })

// IA annonce : 200 générations / mois par user (usage raisonnable)
export const aiAnnonceLimiter = rateLimit({ max: 200, windowMs: 30 * 24 * 60 * 60 * 1000 })

// IA réponse acheteur : 100 / mois par user
export const aiReponseLimiter = rateLimit({ max: 100, windowMs: 30 * 24 * 60 * 60 * 1000 })

// Estimation : 3 / jour par IP pour les non-connectés, 50 / mois pour les connectés
export const estimationAnonLimiter = rateLimit({ max: 3, windowMs: 24 * 60 * 60 * 1000 })
export const estimationProLimiter = rateLimit({ max: 50, windowMs: 30 * 24 * 60 * 60 * 1000 })

// Clics affiliés : 50 / heure par IP (anti-spam)
export const clickLimiter = rateLimit({ max: 50, windowMs: 60 * 60 * 1000 })
