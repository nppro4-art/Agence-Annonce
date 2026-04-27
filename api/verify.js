export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ paid: false, error: 'Pas de session_id' });

  try {
    const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY }
    });
    const session = await resp.json();
    const paid = session.payment_status === 'paid';
    res.status(200).json({ paid });
  } catch (e) {
    console.error('Verify error:', e.message);
    res.status(500).json({ paid: false, error: e.message });
  }
}
