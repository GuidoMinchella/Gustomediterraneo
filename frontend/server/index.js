import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY in environment');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const DEFAULT_CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || undefined;

// Helper: trova o crea un Customer in Stripe per una data email
async function getOrCreateCustomerByEmail(email, name, userId) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    // Prova a trovare un customer esistente con la stessa email
    const existing = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
    if (existing?.data && existing.data.length > 0) {
      return existing.data[0].id;
    }
    // Crea un nuovo customer se non esiste
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

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.items || !Array.isArray(order.items)) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const origin = process.env.CLIENT_URL || req.headers.origin || DEFAULT_CLIENT_URL;

    // Calcolo importi grezzi e finali
    const baseItems = order.items.map((item) => ({
      name: item.name,
      unitGrossCents: Math.round(Number(item.price ?? item.dish_price) * 100),
      quantity: Number(item.quantity) || 1,
    }));
    const rawTotalCents = baseItems.reduce((sum, it) => sum + (it.unitGrossCents * it.quantity), 0);
    const providedFinalCents = Math.round(Number(order.total_amount) * 100);
    const discountInfoFinalCents = Math.round(Number(order?.discountInfo?.final_amount) * 100);
    const candidateFinals = [providedFinalCents, discountInfoFinalCents].filter((v) => Number.isFinite(v) && v > 0);
    const finalCents = candidateFinals.length > 0 ? Math.min(...candidateFinals) : providedFinalCents;

    let line_items;
    if (Number.isFinite(finalCents) && finalCents > 0 && finalCents < rawTotalCents) {
      // Applica lo sconto direttamente sui prezzi unitari (evita i coupon)
      const factor = finalCents / rawTotalCents;
      let accumulated = 0;
      const discounted = baseItems.map((it) => {
        let unitDiscounted = Math.floor(it.unitGrossCents * factor);
        unitDiscounted = Math.min(unitDiscounted, it.unitGrossCents);
        accumulated += unitDiscounted * it.quantity;
        return { ...it, unitDiscounted };
      });
      // Aggiusta eventuale differenza per arrotondamenti
      let diff = finalCents - accumulated;
      if (diff !== 0 && discounted.length > 0) {
        const last = discounted[discounted.length - 1];
        const perUnitAdjust = Math.ceil(Math.abs(diff) / last.quantity) * Math.sign(diff);
        const adjusted = Math.max(0, Math.min(last.unitDiscounted + perUnitAdjust, last.unitGrossCents));
        accumulated = accumulated - (last.unitDiscounted * last.quantity) + (adjusted * last.quantity);
        last.unitDiscounted = adjusted;
      }

      line_items = discounted.map((it) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: it.name },
          unit_amount: it.unitDiscounted,
        },
        quantity: it.quantity,
      }));
    } else {
      // Nessuno sconto: prezzi base
      line_items = baseItems.map((it) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: it.name },
          unit_amount: it.unitGrossCents,
        },
        quantity: it.quantity,
      }));
    }

    // Associa la sessione al Customer corretto (per email) per popolare la colonna "cliente"
    const customerId = await getOrCreateCustomerByEmail(order.customer_email, order.customer_name, order.user_id);
    const sessionParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/pagamento?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pagamento?canceled=true`,
      metadata: {
        user_id: String(order.user_id || ''),
        pickup_date: String(order.pickup_date || ''),
        pickup_time: String(order.pickup_time || ''),
      },
    };
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      // fallback se la creazione/lookup fallisce
      sessionParams.customer_email = order.customer_email;
      // Crea sempre un Customer per la sessione, così Stripe popola correttamente la colonna "cliente"
      sessionParams.customer_creation = 'always';
      sessionParams.customer_update = { name: 'auto', address: 'auto' };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.get('/api/checkout-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session_id' });
    }
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    res.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    res.status(500).json({ error: 'Failed to retrieve checkout session' });
  }
});

// Create PaymentIntent for embedded form
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.items || !Array.isArray(order.items)) {
      console.warn('Invalid order payload received:', req.body);
      return res.status(400).json({ error: 'Invalid order payload: missing items array' });
    }

    // Recalculate amount from items (raw sum) for safety
    const rawAmount = order.items.reduce((sum, item) => {
      const price = Number(item.price ?? item.dish_price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + Math.round(price * 100) * qty;
    }, 0);

    // Prefer the client-provided discounted total_amount when valid
    let amount = rawAmount;
    const providedCents = Math.round(Number(order.total_amount) * 100);
    const discountInfoFinalCents = Math.round(Number(order?.discountInfo?.final_amount) * 100);
    const candidates = [providedCents, discountInfoFinalCents].filter((v) => Number.isFinite(v) && v > 0);
    const chosen = candidates.length > 0 ? Math.min(...candidates) : providedCents;
    if (Number.isFinite(chosen) && chosen > 0 && chosen <= rawAmount) {
      amount = chosen;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      console.warn('Calculated invalid amount for PaymentIntent:', amount, 'from items:', order.items, 'total_amount:', order.total_amount);
      return res.status(400).json({ error: 'Invalid amount: must be greater than 0' });
    }

    console.log('[Stripe] Creating PaymentIntent with amount (cents):', amount, '(raw:', rawAmount, ', provided:', providedCents, ')');
    console.log('[Stripe] Order metadata/email:', {
      user_id: String(order.user_id || ''),
      pickup_date: String(order.pickup_date || ''),
      pickup_time: String(order.pickup_time || ''),
      receipt_email: order.customer_email,
    });

    // Build an idempotency key to prevent duplicate intents for the same order/cart
    // Prefer client-provided key if available; otherwise derive a deterministic one
    const derivedKeyBase = [
      String(order.user_id || ''),
      String(order.pickup_date || ''),
      String(order.pickup_time || ''),
      String(amount),
      String(order.items?.length || 0),
    ].join('|');
    const idempotencyKey = String(order.idempotencyKey || derivedKeyBase);

    // Associa il PaymentIntent al Customer corretto per avere il cliente/email giusti in dashboard
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

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err?.message || err);
    res.status(500).json({ error: 'Failed to create payment intent', message: err?.message });
  }
});

// Retrieve PaymentIntent status
app.get('/api/payment-intent', async (req, res) => {
  try {
    const id = req.query.payment_intent;
    if (!id) return res.status(400).json({ error: 'Missing payment_intent' });
    const intent = await stripe.paymentIntents.retrieve(String(id));
    res.json({ id: intent.id, status: intent.status, amount: intent.amount, currency: intent.currency });
  } catch (err) {
    console.error('Error retrieving payment intent:', err);
    res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
});

// Usa la variabile PORT fornita dall'hosting (es. Render),
// altrimenti fallback a SERVER_PORT o 4242 in locale
const port = Number(process.env.PORT) || Number(process.env.SERVER_PORT) || 4242;
app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});