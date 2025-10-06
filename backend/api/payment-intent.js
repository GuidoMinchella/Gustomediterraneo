import { stripe, cors, handleOptions } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const id = req.query.payment_intent || req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing payment_intent' });
    const intent = await stripe.paymentIntents.retrieve(String(id));
    return res.json({ id: intent.id, status: intent.status, amount: intent.amount, currency: intent.currency });
  } catch (err) {
    console.error('Error retrieving payment intent:', err);
    return res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
}