import { stripe } from '../_utils.js';
import getRawBody from 'raw-body';

// Nota: su Vercel serverless è necessario leggere il body raw per verificare la firma
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

  let event;
  try {
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        console.log('[Webhook] payment_intent.succeeded', intent.id, intent.amount);
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('[Webhook] checkout.session.completed', session.id, session.amount_total);
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type ${event.type}`);
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handling error:', err?.message || err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}