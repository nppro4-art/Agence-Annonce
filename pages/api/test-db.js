import { prisma } from '../../lib/db'

export default async function handler(req, res) {
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    res.status(200).json({ 
      status: 'OK',
      message: 'Base de données connectée',
      users: userCount
    })
  } catch(e) {
    res.status(500).json({ 
      status: 'ERREUR',
      message: e.message
    })
  }
}
