import { prisma } from '../../../lib/db'
const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://annonza.business'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { token } = req.query
  const record = await prisma.emailChange.findFirst({ where: { token } }).catch(() => null)
  if (!record || new Date() > record.expiresAt) {
    return res.redirect(siteUrl + '/dashboard?error=email_link_expired')
  }
  await prisma.user.update({ where: { id: record.userId }, data: { email: record.newEmail } })
  await prisma.emailChange.delete({ where: { id: record.id } }).catch(() => {})
  res.redirect(siteUrl + '/dashboard?success=email_updated')
}
