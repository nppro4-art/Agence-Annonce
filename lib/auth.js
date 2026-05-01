import jwt from 'jsonwebtoken'
import { parse } from 'cookie'

const SECRET = process.env.JWT_SECRET || 'change-this-secret'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export function getUserFromRequest(req) {
  const cookies = parse(req.headers.cookie || '')
  const token = cookies.token
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Non autorisé' })
    req.user = user
    return handler(req, res)
  }
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req)
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
    req.user = user
    return handler(req, res)
  }
}
