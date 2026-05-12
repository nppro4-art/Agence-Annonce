import { prisma } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { nom, ville, article, note, commentaire, email } = req.body
  if (!commentaire || !note) return res.status(400).json({ error: 'Commentaire et note requis' })

  try {
    await prisma.avis.create({
      data: { nom: nom||'Anonyme', ville: ville||'', article: article||'', note: parseInt(note), commentaire, email: email||'', statut: 'pending' }
    })
  } catch(e) { console.error('DB:', e.message) }

  const webhookUrl = process.env.DISCORD_WEBHOOK_AVIS
  if (webhookUrl) {
    const stars = '⭐'.repeat(parseInt(note))
    try {
      await fetch(webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '📝 **NOUVEL AVIS**\n'+stars+' '+note+'/5\n**'+(nom||'Anonyme')+'**'+(ville?' · '+ville:'')+(article?' · '+article:'')+'\n> '+commentaire+(email?'\n📧 '+email:'') })
      })
    } catch(e) {}
  }
  res.status(200).json({ success: true })
}
