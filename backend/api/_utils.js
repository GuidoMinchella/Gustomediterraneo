import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function cors(res) {
  const origin = process.env.CLIENT_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.status(200).end();
    return true;
  }
  return false;
}

export async function getOrCreateCustomerByEmail(email, name, userId) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
    if (existing?.data && existing.data.length > 0) {
      return existing.data[0].id;
    }
    const created = await stripe.customers.create({
      email: normalizedEmail,
      name: name ? String(name) : undefined,
      metadata: { user_id: String(userId || '') },
    });
    return created.id;
  } catch (err) {
    console.warn('[Stripe] Customer lookup/create failed:', err?.message || err);
    return null;
  }
}