import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'main' },
      select: { skyMode: true, skyTheme: true }
    })
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(200).json({
      skyMode: settings?.skyMode || 'auto',
      skyTheme: settings?.skyTheme || 'deep_night'
    })
  } catch(e) {
    return res.status(200).json({ skyMode: 'auto', skyTheme: 'deep_night' })
  }
}
