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
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const origin = process.env.CLIENT_URL || req.headers.origin;

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
      const factor = finalCents / rawTotalCents;
      let accumulated = 0;
      const discounted = baseItems.map((it) => {
        let unitDiscounted = Math.floor(it.unitGrossCents * factor);
        unitDiscounted = Math.min(unitDiscounted, it.unitGrossCents);
        accumulated += unitDiscounted * it.quantity;
        return { ...it, unitDiscounted };
      });
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
      line_items = baseItems.map((it) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: it.name },
          unit_amount: it.unitGrossCents,
        },
        quantity: it.quantity,
      }));
    }

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
      sessionParams.customer_email = order.customer_email;
      sessionParams.customer_creation = 'always';
      sessionParams.customer_update = { name: 'auto', address: 'auto' };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}