import { stripe, cors, handleOptions, getOrCreateCustomerByEmail } from './_utils.js';

export default async function handler(req, res) {
  cors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { order } = req.body || {};
    if (!order || !order.items || !Array.isArray(order.items)) {
      return res.status(400).json({ error: 'Invalid order payload: missing items array' });
    }

    const rawAmount = order.items.reduce((sum, item) => {
      const price = Number(item.price ?? item.dish_price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + Math.round(price * 100) * qty;
    }, 0);

    let amount = rawAmount;
    const providedCents = Math.round(Number(order.total_amount) * 100);
    const discountInfoFinalCents = Math.round(Number(order?.discountInfo?.final_amount) * 100);
    const candidates = [providedCents, discountInfoFinalCents].filter((v) => Number.isFinite(v) && v > 0);
    const chosen = candidates.length > 0 ? Math.min(...candidates) : providedCents;
    if (Number.isFinite(chosen) && chosen > 0 && chosen <= rawAmount) {
      amount = chosen;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount: must be greater than 0' });
    }

    const derivedKeyBase = [
      String(order.user_id || ''),
      String(order.pickup_date || ''),
      String(order.pickup_time || ''),
      String(amount),
      String(order.items?.length || 0),
    ].join('|');
    const idempotencyKey = String(order.idempotencyKey || derivedKeyBase);

    const customerId = await getOrCreateCustomerByEmail(order.customer_email, order.customer_name, order.user_id);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      customer: customerId || undefined,
      metadata: {
        user_id: String(order.user_id || ''),
        pickup_date: String(order.pickup_date || ''),
        pickup_time: String(order.pickup_time || ''),
      },
      receipt_email: order.customer_email,
    }, { idempotencyKey });

    return res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err?.message || err);
    return res.status(500).json({ error: 'Failed to create payment intent', message: err?.message });
  }
}