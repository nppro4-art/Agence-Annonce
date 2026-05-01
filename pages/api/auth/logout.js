import { serialize } from 'cookie'
export default function handler(req, res) {
  res.setHeader('Set-Cookie', serialize('token', '', { httpOnly: true, path: '/', maxAge: 0 }))
  res.status(200).json({ success: true })
}
