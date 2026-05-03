import jwt from 'jsonwebtoken'
import { parse } from 'cookie'

const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch(e) {
    return null
  }
}

export function getUserFromRequest(req) {
  try {
    const cookieHeader = req.headers.cookie || ''
    const cookies = parse(cookieHeader)
    const token = cookies.token
    if (!token) return null
    return verifyToken(token)
  } catch(e) {
    return null
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Non autorise' })
    req.user = user
    return handler(req, res)
  }
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Non autorise' })
    if (user.email !== process.env.ADMIN_EMAIL) return res.status(403).json({ error: 'Acces refuse' })
    req.user = user
    return handler(req, res)
  }
}
