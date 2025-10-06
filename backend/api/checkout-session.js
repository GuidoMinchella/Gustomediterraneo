import { stripe, cors, handleOptions } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sessionId = req.query.session_id || req.query.id;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    return res.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    return res.status(500).json({ error: 'Failed to retrieve checkout session' });
  }
}