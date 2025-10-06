import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, ShoppingCart, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

// UUID v4 regex used to detect dish IDs vs custom items
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderData {
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  payment_method: string;
  total_amount: number;
  original_total?: number;
  notes: string | null;
  items: any[];
  discountInfo: any;
}

const Pagamento: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const processedSuccessRef = useRef(false);

  // Genera un idempotency key unico per questo tentativo di pagamento,
  // evitando di riutilizzare un PaymentIntent già "succeeded" in test ripetuti.
  const paymentAttemptKeyRef = useRef<string>(
    (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `attempt_${Date.now()}_${Math.random()}`
  );

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  // Base URL dell'API backend: in produzione deve essere impostato via VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const createdIntentRef = useRef(false);

  useEffect(() => {
    // Recupera i dati dell'ordine dal sessionStorage
    const savedOrderData = sessionStorage.getItem('pendingOrder');
    if (!savedOrderData) {
      // Se non ci sono dati dell'ordine, reindirizza al carrello
      navigate('/prenotazione');
      return;
    }

    try {
      const parsedOrderData = JSON.parse(savedOrderData);
      setOrderData(parsedOrderData);
    } catch (error) {
      console.error('Errore nel parsing dei dati dell\'ordine:', error);
      navigate('/prenotazione');
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');
    const redirectStatus = params.get('redirect_status');
    const paymentIntentId = params.get('payment_intent');
    if (success === 'true' && sessionId && orderData && user) {
      // Flusso Checkout Session
      if (!processedSuccessRef.current) {
        processedSuccessRef.current = true;
        confirmPaymentAndCreateOrder(sessionId);
      }
    } else if (success === 'true' && redirectStatus === 'succeeded' && paymentIntentId && orderData && user) {
      // Flusso PaymentIntent con redirect 3DS
      if (!processedSuccessRef.current) {
        processedSuccessRef.current = true;
        confirmPaymentIntentAndCreateOrder(paymentIntentId);
      }
    } else if (canceled === 'true') {
      setPaymentError('Pagamento annullato. Puoi riprovare quando vuoi.');
    }
  }, [orderData, user]);

  useEffect(() => {
    const setupPaymentIntent = async () => {
      if (!orderData) return;
      if (!API_URL) {
        console.error('Missing VITE_API_URL for backend API');
        setPaymentError('Configurazione API mancante. Imposta VITE_API_URL nelle variabili di ambiente.');
        return;
      }
      // Prevent duplicate creation in development (React 18 StrictMode re-runs effects)
      if (createdIntentRef.current) return;
      createdIntentRef.current = true;
      try {
        // Assicura che il totale passato al backend sia quello scontato
        const discountFinal = (orderData?.discountInfo && typeof orderData.discountInfo.final_amount === 'number')
          ? Number(orderData.discountInfo.final_amount)
          : undefined;
        const providedTotal = Number(orderData.total_amount);
        const effectiveTotal = (Number.isFinite(discountFinal) && discountFinal! > 0)
          ? Math.min(providedTotal, discountFinal!)
          : providedTotal;

        const payloadOrder = {
          ...orderData,
          total_amount: effectiveTotal,
          idempotencyKey: paymentAttemptKeyRef.current,
        };

        const resp = await fetch(`${API_URL}/api/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: payloadOrder }),
        });
        if (!resp.ok) {
          let message = 'Creazione PaymentIntent fallita';
          try {
            const errData = await resp.json();
            if (errData?.error) message = `${message}: ${errData.error}`;
            if (errData?.message) message = `${message} - ${errData.message}`;
          } catch {}
          throw new Error(message);
        }
        const data = await resp.json();
        setPaymentClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Errore PaymentIntent:', err);
        setPaymentError('Impossibile inizializzare il pagamento. Riprova più tardi.');
      }
    };
    setupPaymentIntent();
  }, [orderData]);

  const StripeEmbeddedForm: React.FC<{ clientSecret: string }> = ({ clientSecret }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [paymentRequestObj, setPaymentRequestObj] = useState<any | null>(null);
    const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);

    const formatStripeErrorMessage = (err: any): string => {
      if (!err) return 'Errore durante la conferma del pagamento';
      const code = err?.code as string | undefined;
      const decline = (err?.decline_code as string | undefined) || (err?.payment_intent?.last_payment_error?.decline_code as string | undefined);
      const baseMsg = err?.message as string | undefined;
      switch (code) {
        case 'processing_error':
          return 'Si è verificato un errore di elaborazione sulla carta. Riprova o usa un’altra carta.';
        case 'card_declined':
          return `Carta rifiutata${decline ? ` (${decline})` : ''}. Usa un’altra carta o contatta la banca.`;
        case 'incorrect_number':
        case 'invalid_number':
          return 'Numero di carta non valido. Controlla e riprova.';
        case 'incorrect_cvc':
        case 'invalid_cvc':
          return 'CVC non valido. Controlla e riprova.';
        case 'expired_card':
          return 'La carta è scaduta. Usa un’altra carta.';
        case 'amount_too_small':
          return 'Importo troppo basso per il circuito di pagamento. Aumenta l’importo o aggiungi un articolo.';
        case 'parameter_missing':
          return 'Parametro mancante nella richiesta. Aggiorna la pagina e riprova.';
        case 'payment_intent_unexpected_state':
          return 'Il pagamento è in uno stato non confermabile. Aggiorna la pagina e riprova.';
        case 'missing_payment_method':
          return 'Metodo di pagamento mancante o incompleto. Compila i campi della carta e riprova.';
        case 'invalid_request_error':
          return baseMsg || 'Richiesta non valida verso Stripe. Riprova o contattaci.';
        case 'intent_not_updatable':
          return 'Il PaymentIntent non può essere aggiornato. Riparti dal carrello.';
        case 'currency_not_supported':
          return 'Valuta non supportata per questo metodo di pagamento.';
        case 'authentication_required':
          return 'Autenticazione 3D Secure richiesta. Segui le istruzioni di Stripe.';
        default:
          return baseMsg || 'Errore durante la conferma del pagamento. Riprova più tardi.';
      }
    };

    // Inizializza Apple Pay / Google Pay via Payment Request Button se supportato
    useEffect(() => {
      const initPaymentRequest = async () => {
        if (!stripe || !orderData || !clientSecret) return;
        // Calcola l'importo effettivo (scontato se presente)
        const discountFinal = (orderData?.discountInfo && typeof orderData.discountInfo.final_amount === 'number')
          ? Number(orderData.discountInfo.final_amount)
          : undefined;
        const providedTotal = Number(orderData.total_amount);
        const effectiveTotal = (Number.isFinite(discountFinal) && discountFinal! > 0)
          ? Math.min(providedTotal, discountFinal!)
          : providedTotal;
        const amountCents = Math.round(effectiveTotal * 100);

        const pr = stripe.paymentRequest({
          country: 'IT',
          currency: 'eur',
          total: { label: 'Gusto Mediterraneo', amount: amountCents },
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: true,
        });

        try {
          const result = await pr.canMakePayment();
          if (result) {
            setPaymentRequestObj(pr);
            setCanUsePaymentRequest(true);
            // Gestisci il flusso di conferma con wallet (Apple/Google Pay)
            pr.on('paymentmethod', async (ev: any) => {
              try {
                const { error } = await stripe.confirmPayment({
                  clientSecret,
                  payment_method: ev.paymentMethod.id,
                  confirmParams: {
                    return_url: `${window.location.origin}/pagamento?success=true`,
                    payment_method_data: {
                      billing_details: {
                        email: ev.payerEmail || orderData?.customer_email || undefined,
                        name: ev.payerName || orderData?.customer_name || undefined,
                        phone: ev.payerPhone || orderData?.customer_phone || undefined,
                      },
                    },
                  },
                });
                if (error) {
                  ev.complete('fail');
                  setLocalError(formatStripeErrorMessage(error));
                } else {
                  ev.complete('success');
                  const res = await stripe.retrievePaymentIntent(clientSecret);
                  const intent = res.paymentIntent;
                  if (intent?.status === 'succeeded') {
                    if (!processedSuccessRef.current) {
                      processedSuccessRef.current = true;
                      await confirmPaymentIntentAndCreateOrder(intent.id);
                    }
                  }
                }
              } catch (e: any) {
                ev.complete('fail');
                setLocalError(e?.message || 'Errore durante il pagamento con wallet.');
              }
            });
          } else {
            setCanUsePaymentRequest(false);
          }
        } catch (e) {
          setCanUsePaymentRequest(false);
        }
      };
      initPaymentRequest();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stripe, orderData, clientSecret]);

    const confirm = async () => {
      if (!stripe || !elements) return;
      setSubmitting(true);
      setLocalError(null);
      try {
        // Validazione e raccolta dati del Payment Element
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setLocalError(submitError.message || 'Errore di validazione dei dati di pagamento');
          setSubmitting(false);
          return;
        }

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/pagamento?success=true`,
            // Imposta i billing details per associare correttamente email/nome/telefono al pagamento
            payment_method_data: {
              billing_details: {
                email: orderData?.customer_email || undefined,
                name: orderData?.customer_name || undefined,
                phone: orderData?.customer_phone || undefined,
              },
            },
          },
        });
        if (error) {
          // Prova a recuperare dettagli aggiuntivi dal PaymentIntent
          try {
            const result = await stripe.retrievePaymentIntent(clientSecret);
            const intent = result.paymentIntent;
            const amountEur = intent ? (intent.amount / 100) : undefined;
            let niceMsg = formatStripeErrorMessage(error);
            if (typeof amountEur === 'number' && amountEur > 0 && amountEur < 0.5) {
              niceMsg = 'Importo minimo di transazione con carta è €0,50.';
            }
            setLocalError(niceMsg);
            console.error('Stripe confirm error:', {
              code: (error as any)?.code,
              message: (error as any)?.message,
              decline_code: (error as any)?.decline_code,
              intent_status: intent?.status,
              intent_amount_cents: intent?.amount,
            });
          } catch (riErr) {
            setLocalError(formatStripeErrorMessage(error));
          }
        } else {
          // Nessun errore: se non avviene redirect, completa l'ordine lato client
          const result = await stripe.retrievePaymentIntent(clientSecret);
          const intent = result.paymentIntent;
          if (intent?.status === 'succeeded') {
            if (!processedSuccessRef.current) {
              processedSuccessRef.current = true;
              await confirmPaymentIntentAndCreateOrder(intent.id);
            }
          }
        }
      } catch (e: any) {
        setLocalError(e?.message || 'Errore sconosciuto');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div>
        {canUsePaymentRequest && paymentRequestObj && (
          <div className="mb-4">
            <PaymentRequestButtonElement options={{ paymentRequest: paymentRequestObj }} />
          </div>
        )}
        <PaymentElement options={{ layout: 'tabs' }} />
        {localError && (
          <p className="mt-3 text-sm text-red-600">{localError}</p>
        )}
        <Button onClick={confirm} disabled={submitting || isProcessing} className="w-full mt-4" size="lg">
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Elaborazione...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {(() => {
                const discountFinal = (orderData?.discountInfo && typeof orderData.discountInfo.final_amount === 'number')
                  ? Number(orderData.discountInfo.final_amount)
                  : undefined;
                const providedTotal = Number(orderData?.total_amount ?? 0);
                const effectiveTotal = (Number.isFinite(discountFinal) && discountFinal! > 0)
                  ? Math.min(providedTotal, discountFinal!)
                  : providedTotal;
                return `Paga €${effectiveTotal.toFixed(2)}`;
              })()}
            </>
          )}
        </Button>
      </div>
    );
  };

  // Generatore robusto di order_number lato client per evitare conflitti
  const generateClientOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    // Formato compatto: YYYYMMDDHHMMSS + 3 cifre random (max 17 char)
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${y}${m}${d}${hh}${mm}${ss}${rand}`;
  };

  const handlePayment = async () => {
    if (!orderData || !user) {
      setPaymentError('Dati dell\'ordine non validi');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Allinea il totale alla cifra scontata prima di creare la Checkout Session
      const discountFinal = (orderData?.discountInfo && typeof orderData.discountInfo.final_amount === 'number')
        ? Number(orderData.discountInfo.final_amount)
        : undefined;
      const providedTotal = Number(orderData.total_amount);
      const effectiveTotal = (Number.isFinite(discountFinal) && discountFinal! > 0)
        ? Math.min(providedTotal, discountFinal!)
        : providedTotal;
      const payloadOrder = {
        ...orderData,
        total_amount: effectiveTotal,
        // Anche per la Checkout Session manteniamo un tentativo unico.
        idempotencyKey: paymentAttemptKeyRef.current,
      };

      const resp = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: payloadOrder }),
      });

      if (!resp.ok) {
        throw new Error('Creazione sessione Checkout fallita');
      }

      const { id } = await resp.json();
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe non inizializzato');
      }
      const { error } = await stripe.redirectToCheckout({ sessionId: id });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Errore durante il pagamento:', error);
      setPaymentError('Si è verificato un errore durante la creazione del pagamento. Riprova più tardi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPaymentAndCreateOrder = async (sessionId: string) => {
    if (!orderData || !user) return;
    // Idempotenza lato client per evitare duplicazioni
    const idempotencyKey = `order_created_for_session_${sessionId}`;
    if (sessionStorage.getItem(idempotencyKey) === 'true') return;
    try {
      const resp = await fetch(`${API_URL}/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
      if (!resp.ok) throw new Error('Verifica sessione Stripe fallita');
      const session = await resp.json();
      if (session.payment_status !== 'paid') {
        setPaymentError('Pagamento non completato.');
        return;
      }

      const paidTotalEuros = typeof session.amount_total === 'number'
        ? Number(session.amount_total) / 100
        : Number(orderData.total_amount);

      // Crea l'ordine nel database dopo la conferma del pagamento
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          order_number: generateClientOrderNumber(),
          user_id: orderData.user_id,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          pickup_date: orderData.pickup_date,
          pickup_time: orderData.pickup_time,
          payment_method: orderData.payment_method,
          payment_status: 'paid',
          total_amount: paidTotalEuros,
          notes: orderData.notes,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Applica i dettagli dello sconto direttamente all'ordine per evitare sovrascritture del totale
      let orderDiscountInfo: any = null;
      const originalTotal = (orderData.original_total ?? orderData.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0));
      if (orderData.discountInfo && Number(orderData.discountInfo?.discount_amount) > 0) {
        orderDiscountInfo = orderData.discountInfo;
        const { error: updError } = await supabase
          .from('orders')
          .update({
            original_amount: Number(originalTotal),
            discount_type: String(orderData.discountInfo.discount_type || 'none'),
            discount_percentage: Number(orderData.discountInfo.discount_percentage || 0),
            discount_amount: Number(orderData.discountInfo.discount_amount || 0),
            total_amount: Number(paidTotalEuros),
          })
          .eq('id', order.id);
        if (updError) {
          console.error('Errore aggiornamento dettagli sconto ordine:', updError);
        }
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        dish_id: typeof item.id === 'string' && uuidRegex.test(item.id) ? item.id : null,
        dish_name: item.name,
        dish_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      sessionStorage.removeItem('pendingOrder');
      sessionStorage.setItem(idempotencyKey, 'true');

      const orderSummary = {
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        pickup_date: orderData.pickup_date,
        pickup_time: orderData.pickup_time,
        payment_method: orderData.payment_method,
        items: orderItems.map(i => ({
          name: i.dish_name,
          price: i.dish_price,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        total_amount: paidTotalEuros,
      };

      navigate('/prenotazione', { 
        state: { 
          orderConfirmed: true, 
          orderNumber: order.order_number,
          orderId: order.id,
          discountInfo: orderDiscountInfo || orderData.discountInfo,
          orderSummary
        } 
      });
    } catch (error) {
      console.error('Errore conferma pagamento:', error);
      setPaymentError('Errore nella conferma del pagamento. Se il problema persiste, contattaci.');
    }
  };

  const confirmPaymentIntentAndCreateOrder = async (intentId: string) => {
    if (!orderData || !user) return;
    // Idempotenza lato client per evitare duplicazioni
    const idempotencyKey = `order_created_for_intent_${intentId}`;
    if (sessionStorage.getItem(idempotencyKey) === 'true') return;
    try {
      const resp = await fetch(`${API_URL}/api/payment-intent?payment_intent=${encodeURIComponent(intentId)}`);
      if (!resp.ok) throw new Error('Verifica PaymentIntent fallita');
      const intent = await resp.json();
      if (intent.status !== 'succeeded') {
        setPaymentError('Pagamento non completato.');
        return;
      }

      const paidTotalEuros = typeof intent.amount === 'number'
        ? Number(intent.amount) / 100
        : Number(orderData.total_amount);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          order_number: generateClientOrderNumber(),
          user_id: orderData.user_id,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          pickup_date: orderData.pickup_date,
          pickup_time: orderData.pickup_time,
          payment_method: orderData.payment_method,
          payment_status: 'paid',
          total_amount: paidTotalEuros,
          notes: orderData.notes,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Applica i dettagli dello sconto direttamente all'ordine per evitare sovrascritture del totale
      let orderDiscountInfo: any = null;
      const originalTotal2 = (orderData.original_total ?? orderData.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0));
      if (orderData.discountInfo && Number(orderData.discountInfo?.discount_amount) > 0) {
        orderDiscountInfo = orderData.discountInfo;
        const { error: updError2 } = await supabase
          .from('orders')
          .update({
            original_amount: Number(originalTotal2),
            discount_type: String(orderData.discountInfo.discount_type || 'none'),
            discount_percentage: Number(orderData.discountInfo.discount_percentage || 0),
            discount_amount: Number(orderData.discountInfo.discount_amount || 0),
            total_amount: Number(paidTotalEuros),
          })
          .eq('id', order.id);
        if (updError2) {
          console.error('Errore aggiornamento dettagli sconto ordine (intent):', updError2);
        }
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        dish_id: typeof item.id === 'string' && uuidRegex.test(item.id) ? item.id : null,
        dish_name: item.name,
        dish_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      sessionStorage.removeItem('pendingOrder');
      sessionStorage.setItem(idempotencyKey, 'true');

      const orderSummary = {
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        pickup_date: orderData.pickup_date,
        pickup_time: orderData.pickup_time,
        payment_method: orderData.payment_method,
        items: orderItems.map(i => ({
          name: i.dish_name,
          price: i.dish_price,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        total_amount: paidTotalEuros,
      };

      navigate('/prenotazione', { 
        state: { 
          orderConfirmed: true, 
          orderNumber: order.order_number,
          orderId: order.id,
          discountInfo: orderDiscountInfo || orderData.discountInfo,
          orderSummary
        } 
      });
    } catch (error) {
      console.error('Errore conferma PaymentIntent:', error);
      setPaymentError('Errore nella conferma del pagamento. Se il problema persiste, contattaci.');
    }
  };

  const handleGoBack = () => {
    navigate('/prenotazione');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-mediterranean-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino mx-auto mb-4"></div>
          <p className="text-mediterranean-blu-scuro">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8 pagamento-isolation">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al Carrello
          </Button>
          
          <h1 className="font-serif text-3xl font-bold text-mediterranean-blu-scuro mb-2">
            Pagamento Online
          </h1>
          <p className="text-mediterranean-blu-scuro opacity-75">
            Completa il tuo ordine con il pagamento sicuro
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Riepilogo Ordine */}
          <Card>
            <h2 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
              <ShoppingCart className="w-5 h-5 inline mr-2" />
              Riepilogo Ordine
            </h2>
            
            {/* Dettagli Cliente */}
            <div className="mb-6 p-4 bg-mediterranean-beige bg-opacity-50 rounded-lg">
              <h3 className="font-medium text-mediterranean-blu-scuro mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Dettagli Cliente
              </h3>
              <p className="text-sm text-mediterranean-blu-scuro">
                <strong>Nome:</strong> {orderData.customer_name}
              </p>
              <p className="text-sm text-mediterranean-blu-scuro">
                <strong>Email:</strong> {orderData.customer_email}
              </p>
              <p className="text-sm text-mediterranean-blu-scuro">
                <strong>Telefono:</strong> {orderData.customer_phone}
              </p>
              <p className="text-sm text-mediterranean-blu-scuro">
                <Clock className="w-4 h-4 inline mr-1" />
                <strong>Ritiro:</strong> {new Date(orderData.pickup_date).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} alle {orderData.pickup_time}
              </p>
            </div>

            {/* Articoli */}
            <div className="space-y-3 mb-6">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <h4 className="font-medium text-mediterranean-blu-scuro">{item.name}</h4>
                    <p className="text-sm text-mediterranean-blu-scuro opacity-75">
                      Quantità: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-mediterranean-blu-scuro">
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totale */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-serif text-lg font-semibold text-mediterranean-blu-scuro">
                  Totale:
                </span>
                <span className="font-serif text-xl font-bold text-mediterranean-marroncino">
                  €{orderData.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Sezione Pagamento */}
          <Card>
            <h2 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
              <CreditCard className="w-5 h-5 inline mr-2" />
              Pagamento Sicuro
            </h2>

            {paymentError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{paymentError}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="p-6 border-2 border-mediterranean-marroncino rounded-lg">
                <h3 className="font-medium text-mediterranean-blu-scuro mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 text-mediterranean-marroncino mr-2" />
                  Pagamento sicuro con Stripe
                </h3>
                {paymentClientSecret ? (
                  <Elements stripe={stripePromise!} options={{ clientSecret: paymentClientSecret }}>
                    <StripeEmbeddedForm clientSecret={paymentClientSecret} />
                  </Elements>
                ) : (
                  <p className="text-sm text-mediterranean-blu-scuro opacity-75">Inizializzazione pagamento in corso...</p>
                )}
              </div>
            </div>

            {/* Il bottone di pagamento è ora dentro il form embedded */}

            <p className="text-xs text-mediterranean-blu-scuro opacity-50 text-center mt-4">
              I tuoi dati di pagamento sono protetti con crittografia SSL
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pagamento;
