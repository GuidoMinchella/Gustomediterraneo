import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Clock, User, Phone, Mail, MessageSquare, CreditCard, Wallet, X, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoginModal from '../components/Auth/LoginModal';
import RegisterModal from '../components/Auth/RegisterModal';

const Prenotazione: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, total, itemsCount, discountInfo, discountLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupDate: '',
    pickupTime: '',
    paymentMethod: 'pickup', // Default to pickup payment
    notes: '',
    privacyConsent: false,
  });

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDiscountInfo, setOrderDiscountInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [redirectOrderSummary, setRedirectOrderSummary] = useState<any>(null);
  
  const formatItalianDate = (input: string) => {
    try {
      if (!input) return '';
      const hasTime = input.includes('T');
      const d = new Date(hasTime ? input : `${input}T00:00:00`);
      return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return input;
    }
  };

  // Se l'utente arriva da Stripe ma manca il riepilogo completo,
  // recupero i dettagli ordine da Supabase usando l'orderId passato nello state.
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;
    const { orderConfirmed: oc, orderNumber: on, discountInfo: di, orderSummary: os, orderId } = state || {};
    if (typeof oc !== 'undefined') setOrderConfirmed(!!oc);
    if (typeof on !== 'undefined') setOrderNumber(on);
    if (typeof di !== 'undefined') setOrderDiscountInfo(di);
    if (typeof os !== 'undefined') setRedirectOrderSummary(os);

    // Recupero da Supabase se abbiamo l'ID ma non il riepilogo
    const fetchIfNeeded = async () => {
      if (!orderId || os) return;
      try {
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, customer_email, customer_phone, pickup_date, pickup_time, payment_method, total_amount, notes')
          .eq('id', orderId)
          .single();
        if (orderErr) throw orderErr;

        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('dish_name, dish_price, quantity, subtotal')
          .eq('order_id', orderId);
        if (itemsErr) throw itemsErr;

        const fetchedSummary = {
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          pickup_date: order.pickup_date,
          pickup_time: order.pickup_time,
          payment_method: order.payment_method,
          total_amount: order.total_amount,
          notes: order.notes,
          items: (itemsData || []).map((it: any) => ({
            name: it.dish_name,
            price: it.dish_price,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        };
        setOrderNumber(order.order_number);
        setRedirectOrderSummary(fetchedSummary as any);
      } catch (e) {
        console.error('Errore nel recupero riepilogo ordine:', e);
      }
    };

    fetchIfNeeded();
  }, [location.state]);

  // Se arrivi dalla pagina di pagamento con stato di conferma, attiva la vista di conferma
  useEffect(() => {
    const state = location.state as any;
    if (state?.orderConfirmed) {
      setOrderConfirmed(true);
      if (state.orderNumber) setOrderNumber(state.orderNumber);
      if (state.discountInfo) setOrderDiscountInfo(state.discountInfo);
    }
  }, [location.state]);

  // Available pickup time slots based on new opening hours
  // Martedì-Sabato: 11:00-15:30, 17:00-22:00
  // Domenica: 09:30-15:00
  // Lunedì: Chiuso
  const getAvailableTimeSlots = (date: Date = new Date()) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 1) { // Monday - Closed
      return [];
    } else if (dayOfWeek === 0) { // Sunday
      return ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
    } else { // Tuesday to Saturday
      return [
        // Pranzo: 11:00-15:30
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        // Cena: 17:00-22:00
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
      ];
    }
  };

  // Function to get available dates (next 7 days, excluding Mondays)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) { // Check next 14 days to get at least 7 available days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Mondays (day 1)
      if (date.getDay() !== 1) {
        dates.push({
          value: date.toISOString().split('T')[0], // YYYY-MM-DD format
          label: date.toLocaleDateString('it-IT', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          }),
          date: date
        });
      }
      
      // Stop when we have 7 available dates
      if (dates.length >= 7) break;
    }
    
    return dates;
  };

  // Function to check if a time slot is available (not in the past + 30min buffer)
  const isTimeSlotAvailable = (timeSlot: string, date: Date = new Date()) => {
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Create a date object for the time slot
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    
    // Add 30 minutes buffer for preparation time
    const minimumTime = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Check if the slot time is after the minimum required time
    return slotTime > minimumTime;
  };

  // Get filtered time slots (only future times with 30min buffer)
  const getFilteredTimeSlots = (selectedDate?: string) => {
    let targetDate = new Date();
    
    if (selectedDate) {
      targetDate = new Date(selectedDate + 'T00:00:00');
    }
    
    const allSlots = getAvailableTimeSlots(targetDate);
    return allSlots.filter(slot => isTimeSlotAvailable(slot, targetDate));
  };

  const availableDates = getAvailableDates();
  const timeSlots = getFilteredTimeSlots(formData.pickupDate);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // If pickup date changes, reset pickup time
    if (name === 'pickupDate') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        pickupTime: '' // Reset time when date changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const validateForm = () => {
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) {
      alert('Il nome è obbligatorio');
      return false;
    }
    
    if (!phoneRegex.test(formData.phone)) {
      alert('Inserisci un numero di telefono valido');
      return false;
    }
    
    if (!emailRegex.test(formData.email)) {
      alert('Inserisci un indirizzo email valido');
      return false;
    }
    
    if (!formData.pickupDate) {
      alert('Seleziona una data di ritiro');
      return false;
    }
    
    if (!formData.pickupTime) {
      alert('Seleziona un orario di ritiro');
      return false;
    }
    
    if (!formData.privacyConsent) {
      alert('Devi accettare l\'informativa sulla privacy');
      return false;
    }
    
    if (items.length === 0) {
      alert('Il carrello è vuoto. Aggiungi almeno un piatto per continuare.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Doppio controllo di sicurezza per l'autenticazione
    if (!user) {
      console.error('Tentativo di ordine senza autenticazione bloccato');
      alert('Errore: devi essere autenticato per effettuare un ordine.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    console.log('User authenticated:', {
      id: user.id,
      email: user.email,
      authenticated: !!user
    });

    // Se il pagamento è online, reindirizza alla pagina di pagamento Stripe
    if (formData.paymentMethod === 'online') {
      // Impedisci il pagamento finché lo sconto non è stato calcolato
      if (discountLoading) {
        alert('Calcolo sconto in corso. Attendi qualche secondo e riprova.');
        return;
      }
      // Calcola il totale scontato se disponibile
      const finalAmount = (discountInfo && typeof discountInfo.final_amount === 'number')
        ? Number(discountInfo.final_amount)
        : total;

      // Salva i dati dell'ordine nel sessionStorage per la pagina di pagamento
      const orderData = {
        user_id: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        payment_method: formData.paymentMethod,
        total_amount: finalAmount,
        original_total: total,
        notes: formData.notes || null,
        items: items,
        discountInfo: discountInfo
      };
      
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      navigate('/pagamento');
      return;
    }

    // Procedi con il pagamento al ritiro (logica esistente)
    setIsSubmitting(true);
    
    try {
      // Create the order with original amount (before discount)
      const orderData = {
        user_id: user.id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentMethod === 'pickup' ? 'pending' : 'paid',
        total_amount: total, // This will be updated by apply_discount_to_order
        notes: formData.notes || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Apply discount to the order
      console.log('Applying discount to order:', {
        orderId: order.id,
        userId: user.id,
        originalTotal: total
      });

      const { data: discountResult, error: discountError } = await supabase.rpc('apply_discount_to_order', {
        order_uuid: order.id,
        user_uuid: user.id,
        original_total: total
      });

      if (discountError) {
        console.error('Error applying discount:', discountError);
        // Continue with order creation even if discount fails
      } else {
        console.log('Discount applied successfully:', discountResult);
      }

      // Create order items - allow custom items without UUID dish_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = items.map(item => ({
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

      if (itemsError) {
        throw itemsError;
      }

      // Set order number and confirm
      setOrderNumber(order.order_number);
      
      // Save discount information for confirmation page
      if (discountResult && discountResult[0] && discountResult[0].discount_info) {
        setOrderDiscountInfo(discountResult[0].discount_info);
      }
      
      setOrderConfirmed(true);
      
      console.log('Order submitted successfully:', {
        orderNumber: order.order_number,
        customer: formData,
        items,
        originalTotal: total,
        discountApplied: discountResult?.[0]?.success || false,
        discountInfo: discountResult?.[0]?.discount_info || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error submitting order:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user: user?.id,
        orderData: {
          user_id: user?.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          pickup_date: formData.pickupDate,
          pickup_time: formData.pickupTime,
          payment_method: formData.paymentMethod,
          total_amount: total,
        },
        items: items.map(item => ({
          dish_id: typeof item.id === 'string' && uuidRegex.test(item.id) ? item.id : null,
          dish_name: item.name,
          dish_price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        }))
      });
      alert(`Si è verificato un errore durante l'invio dell'ordine: ${error.message || 'Errore sconosciuto'}. Riprova più tardi.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printOrder = () => {
    window.print();
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-mediterranean-beige py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="font-serif text-3xl font-bold text-mediterranean-blu-scuro mb-4">
              Ordine Confermato!
            </h1>
            
            <p className="text-lg text-mediterranean-blu-scuro mb-6">
              Grazie per aver scelto Gusto Mediterraneo. Il tuo ordine è stato registrato con successo.
            </p>

            <div className="bg-mediterranean-beige p-6 rounded-lg mb-6 text-left">
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
                Riepilogo Ordine
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Numero Ordine:</h4>
                  <p className="text-2xl font-bold text-mediterranean-marroncino">{orderNumber}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Data e Orario Ritiro:</h4>
                  <p className="text-lg text-mediterranean-blu-scuro">
                    {formatItalianDate(redirectOrderSummary?.pickup_date || formData.pickupDate)} alle {redirectOrderSummary?.pickup_time || formData.pickupTime}
                  </p>
                </div>
              </div>

              {/* Dettagli Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Nome:</h4>
                  <p className="text-mediterranean-blu-scuro">{redirectOrderSummary?.customer_name || formData.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Email:</h4>
                  <p className="text-mediterranean-blu-scuro">{redirectOrderSummary?.customer_email || formData.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Telefono:</h4>
                  <p className="text-mediterranean-blu-scuro">{redirectOrderSummary?.customer_phone || formData.phone}</p>
                </div>
              </div>

              <div className="mb-6">
                <div>
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Modalità di Pagamento:</h4>
                  <p className="text-lg text-mediterranean-blu-scuro">
                    {(redirectOrderSummary?.payment_method || formData.paymentMethod) === 'pickup' ? 'Pagamento al Ritiro' : 'Pagamento Online'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Piatti Ordinati:</h4>
                {(redirectOrderSummary?.items || items).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-semibold">€{(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 text-right">
                {orderDiscountInfo && orderDiscountInfo.discount_amount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Subtotale:</span>
                      <span>€{orderDiscountInfo.original_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>
                        Sconto ({orderDiscountInfo.discount_percentage}% - {
                          orderDiscountInfo.discount_type === 'first_order' 
                            ? 'Primo ordine' 
                            : 'Ordine superiore a 40€'
                        }):
                      </span>
                      <span>-€{orderDiscountInfo.discount_amount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center text-xl font-bold text-mediterranean-marroncino">
                        <span>Totale:</span>
                        <span>€{orderDiscountInfo.final_amount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Hai risparmiato €{orderDiscountInfo.discount_amount.toFixed(2)}!
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-mediterranean-marroncino">
                    Totale: €{(redirectOrderSummary?.total_amount ?? total).toFixed(2)}
                  </p>
                )}
              </div>

              {formData.notes && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Note:</h4>
                  <p className="text-mediterranean-blu-scuro">{formData.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-mediterranean-blu-scuro">
                Ti aspettiamo in Viale Anicio Gallo, 49, 00174 Roma RM all'orario concordato.<br />
                Per informazioni o modifiche, contattaci al +39 331 332 0411.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={printOrder} variant="outline">
                  Stampa Riepilogo
                </Button>
                <Button onClick={() => navigate('/')}>Ritorna alla Home</Button>
                <Button onClick={() => navigate('/dashboard')}>Visualizza Ordine</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra il messaggio di richiesta login
  if (!user) {
    return (
      <div className="min-h-screen bg-mediterranean-beige py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
              Prenota il Tuo Ordine
            </h1>
            <p className="text-lg text-mediterranean-blu-scuro">
              Per effettuare un ordine devi prima accedere al tuo account.
            </p>
          </div>

          <Card className="text-center">
            <div className="py-12">
              <User className="w-24 h-24 text-mediterranean-marroncino mx-auto mb-6" />
              
              <h2 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-4">
                Accesso Richiesto
              </h2>
              
              <p className="text-mediterranean-blu-scuro mb-6 max-w-md mx-auto">
                Per garantire la sicurezza e tracciare i tuoi ordini, è necessario essere registrati e aver effettuato l'accesso.
              </p>

              {items.length > 0 && (
                <div className="bg-mediterranean-beige p-4 rounded-lg mb-6 max-w-md mx-auto">
                  <p className="text-sm text-mediterranean-blu-scuro mb-2">
                    <strong>Il tuo carrello contiene {itemsCount} {itemsCount === 1 ? 'piatto' : 'piatti'}</strong>
                  </p>
                  <p className="text-sm text-mediterranean-blu-scuro">
                    Non preoccuparti, i tuoi piatti rimarranno nel carrello dopo il login!
                  </p>
                </div>
              )}

              <div className="space-y-4 max-w-sm mx-auto">
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  size="lg"
                  className="w-full"
                >
                  Accedi al Tuo Account
                </Button>
                
                <Button
                  onClick={() => setIsRegisterModalOpen(true)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Registrati Gratuitamente
                </Button>
              </div>

              <p className="text-sm text-mediterranean-blu-scuro opacity-75 mt-6">
                La registrazione è veloce e gratuita. Potrai anche tenere traccia dei tuoi ordini!
              </p>
            </div>
          </Card>

          {/* Login Modal */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onSwitchToRegister={() => {
              setIsLoginModalOpen(false);
              setIsRegisterModalOpen(true);
            }}
          />

          {/* Register Modal */}
          <RegisterModal
            isOpen={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onSwitchToLogin={() => {
              setIsRegisterModalOpen(false);
              setIsLoginModalOpen(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
            Prenota il Tuo Ordine
          </h1>
          <p className="text-lg text-mediterranean-blu-scuro">
            Completa il modulo per finalizzare il tuo ordine take away.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Il Tuo Carrello ({itemsCount})
              </h3>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-mediterranean-blu-scuro opacity-50 mx-auto mb-4" />
                  <p className="text-mediterranean-blu-scuro mb-4">Il tuo carrello è vuoto</p>
                  <p className="text-sm text-mediterranean-blu-scuro opacity-75 mb-4">
                    Aggiungi piatti dal nostro menù per continuare
                  </p>
                  <div className="space-y-2">
                    <Link to="/menu-fisso">
                      <Button variant="outline" size="sm" className="w-full">
                        Menù Fisso
                      </Button>
                    </Link>
                    <Link to="/menu-del-giorno">
                      <Button variant="outline" size="sm" className="w-full">
                        Menù del Giorno
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-mediterranean-beige rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-mediterranean-blu-scuro">{item.name}</h4>
                          <p className="text-mediterranean-marroncino font-semibold">€{item.price}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-mediterranean-bianco flex items-center justify-center text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <span className="w-8 text-center font-medium text-mediterranean-blu-scuro">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-mediterranean-bianco flex items-center justify-center text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                     {discountInfo && discountInfo.discount_amount > 0 && (
                       <div className="space-y-2 mb-4">
                         <div className="flex justify-between items-center text-sm text-mediterranean-blu-scuro">
                           <span>Subtotale:</span>
                           <span>€{total.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm text-green-600">
                           <span className="flex items-center">
                             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                             </svg>
                             Sconto {discountInfo.discount_type === 'first_order' ? 'Primo Ordine' : 'Ordine >40€'} ({discountInfo.discount_percentage}%):
                           </span>
                           <span>-€{discountInfo.discount_amount.toFixed(2)}</span>
                         </div>
                         <div className="border-t pt-2">
                           <div className="flex justify-between items-center text-lg font-semibold text-mediterranean-blu-scuro">
                             <span>Totale:</span>
                             <div className="text-right">
                               <span className="text-mediterranean-marroncino">€{discountInfo.final_amount.toFixed(2)}</span>
                               <div className="text-xs text-green-600 font-normal">
                                 Risparmi €{discountInfo.discount_amount.toFixed(2)}!
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {(!discountInfo || discountInfo.discount_amount === 0) && (
                       <div className="flex justify-between items-center text-lg font-semibold text-mediterranean-blu-scuro">
                         <span>Totale:</span>
                         <span className="text-mediterranean-marroncino">€{total.toFixed(2)}</span>
                       </div>
                     )}
                     
                     {discountLoading && (
                       <div className="flex justify-center items-center py-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mediterranean-marroncino"></div>
                         <span className="ml-2 text-sm text-mediterranean-blu-scuro">Calcolo sconto...</span>
                       </div>
                     )}
                     
                     {/* Notifica per utenti loggati - Primo ordine */}
                     {user && discountInfo && discountInfo.discount_type === 'first_order' && discountInfo.discount_amount === 0 && !discountLoading && (
                       <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                         <div className="flex items-start">
                           <div className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                             <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="text-sm font-semibold text-green-800 mb-1">
                               🎉 Sconto primo ordine del 10%!
                             </h4>
                             <p className="text-xs text-green-700">
                               Questo è il tuo primo ordine! Riceverai automaticamente il 10% di sconto su qualsiasi importo.
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {/* Notifica per utenti loggati - Ordini successivi con totale >= 40€ */}
                     {user && discountInfo && discountInfo.discount_type === 'amount_threshold' && discountInfo.discount_amount === 0 && total >= 40 && !discountLoading && (
                       <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                         <div className="flex items-center text-sm text-green-700">
                           <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           Ordine idoneo per sconto del 10%! (Totale superiore a 40€)
                         </div>
                       </div>
                     )}
                     
                     {/* Notifica per utenti loggati - Ordini successivi con totale < 40€ */}
                     {user && discountInfo && discountInfo.discount_type === 'none' && total > 0 && total < 40 && !discountLoading && (
                       <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                         <div className="flex items-start">
                           <div className="bg-amber-100 rounded-full p-1 mr-2 mt-0.5">
                             <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="text-sm font-semibold text-amber-800 mb-1">
                               💰 Aggiungi €{(40 - total).toFixed(2)} per lo sconto!
                             </h4>
                             <p className="text-xs text-amber-700">
                               Hai già effettuato il primo ordine. Aggiungi €{(40 - total).toFixed(2)} per raggiungere i 40€ e ottenere il 10% di sconto.
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {/* Notifica per utenti non loggati - Primo ordine */}
                     {!user && total > 0 && (
                       <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                         <div className="flex items-start">
                           <div className="bg-purple-100 rounded-full p-1 mr-2 mt-0.5">
                             <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="text-sm font-semibold text-purple-800 mb-1">
                               🎁 Sconto del 10% sul primo ordine!
                             </h4>
                             <p className="text-xs text-purple-700 mb-2">
                               <strong>Registrati ora</strong> e ottieni automaticamente il 10% di sconto sul tuo primo ordine, indipendentemente dall'importo!
                             </p>
                             <button
                               onClick={() => setShowAuthModal(true)}
                               className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors"
                             >
                               Registrati e Risparmia
                             </button>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>

                  <Button
                    onClick={clearCart}
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Svuota Carrello
                  </Button>
                </>
              )}
            </Card>
          </div>

          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-6">
                Dati per la Prenotazione
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Nome e Cognome *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                      placeholder="Il tuo nome completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Numero di Telefono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                      placeholder="+39 xxx xxx xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                    placeholder="la.tua.email@esempio.com"
                  />
                </div>

                {/* Pickup Date */}
                <div>
                  <label htmlFor="pickupDate" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data di Ritiro *
                  </label>
                  <select
                    id="pickupDate"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                  >
                    <option value="">Seleziona una data</option>
                    {availableDates.map(date => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Time */}
                <div>
                  <label htmlFor="pickupTime" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Orario di Ritiro *
                  </label>
                  <select
                    id="pickupTime"
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                  >
                    <option value="">Seleziona un orario</option>
                    {!formData.pickupDate ? (
                      <option disabled>Seleziona prima una data</option>
                    ) : timeSlots.length === 0 ? (
                      <option disabled>Nessun orario disponibile per questa data</option>
                    ) : (
                      <>
                        {(() => {
                          const selectedDate = formData.pickupDate ? new Date(formData.pickupDate + 'T00:00:00') : new Date();
                          const dayOfWeek = selectedDate.getDay();
                          
                          if (dayOfWeek === 0) {
                            // Sunday - only one time period
                            return (
                              <optgroup label="Domenica (09:30-15:00)">
                                {timeSlots.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </optgroup>
                            );
                          } else {
                            // Tuesday to Saturday - two time periods
                            const lunchSlots = timeSlots.filter(time => {
                              const [hours] = time.split(':').map(Number);
                              return hours >= 11 && hours < 17;
                            });
                            const dinnerSlots = timeSlots.filter(time => {
                              const [hours] = time.split(':').map(Number);
                              return hours >= 17;
                            });
                            
                            return (
                              <>
                                {lunchSlots.length > 0 && (
                                  <optgroup label="Pranzo (11:00-15:30)">
                                    {lunchSlots.map(time => (
                                      <option key={time} value={time}>{time}</option>
                                    ))}
                                  </optgroup>
                                )}
                                {dinnerSlots.length > 0 && (
                                  <optgroup label="Cena (17:00-22:00)">
                                    {dinnerSlots.map(time => (
                                      <option key={time} value={time}>{time}</option>
                                    ))}
                                  </optgroup>
                                )}
                              </>
                            );
                          }
                        })()}
                      </>
                    )}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-mediterranean-blu-scuro mb-4">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Modalità di Pagamento *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === 'pickup' 
                          ? 'border-mediterranean-marroncino bg-mediterranean-marroncino bg-opacity-10' 
                          : 'border-gray-300 hover:border-mediterranean-marroncino'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'pickup' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="pickup"
                          name="paymentMethod"
                          value="pickup"
                          checked={formData.paymentMethod === 'pickup'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-mediterranean-marroncino border-gray-300 focus:ring-mediterranean-marroncino"
                        />
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-5 h-5 text-mediterranean-marroncino" />
                          <div>
                            <label htmlFor="pickup" className="font-medium text-mediterranean-blu-scuro cursor-pointer">
                              Pagamento al Ritiro
                            </label>
                            <p className="text-sm text-mediterranean-blu-scuro opacity-75">
                              Paga direttamente in negozio
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === 'online' 
                          ? 'border-mediterranean-marroncino bg-mediterranean-marroncino bg-opacity-10' 
                          : 'border-gray-300 hover:border-mediterranean-marroncino'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="online"
                          name="paymentMethod"
                          value="online"
                          checked={formData.paymentMethod === 'online'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-mediterranean-marroncino border-gray-300 focus:ring-mediterranean-marroncino"
                        />
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-mediterranean-marroncino" />
                          <div>
                            <label htmlFor="online" className="font-medium text-mediterranean-blu-scuro cursor-pointer">
                              Paga Ora Online
                            </label>
                            <p className="text-sm text-mediterranean-blu-scuro opacity-75">
                              Carta di credito/debito
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-mediterranean-blu-scuro mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Note e Allergie (opzionale)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
                    placeholder="Eventuali richieste speciali, allergie o note aggiuntive..."
                  />
                </div>

                {/* Privacy Consent */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    name="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-4 h-4 text-mediterranean-marroncino border-gray-300 rounded focus:ring-mediterranean-marroncino"
                  />
                  <label htmlFor="privacyConsent" className="text-sm text-mediterranean-blu-scuro">
                    Accetto l'<a href="#" className="text-mediterranean-marroncino hover:underline">informativa sulla privacy</a> e 
                    autorizzo il trattamento dei miei dati personali per la gestione dell'ordine. *
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={items.length === 0 || isSubmitting || (formData.paymentMethod === 'online' && discountLoading)}
                  >
                    {isSubmitting ? (
                      'Invio in corso...'
                    ) : (
                      <span className="flex items-center justify-center">
                        {formData.paymentMethod === 'online' ? 'Vai al Pagamento' : 'Conferma Ordine'}
                        <span className="ml-2 font-semibold">
                          €{((discountInfo && typeof discountInfo.final_amount === 'number')
                            ? Number(discountInfo.final_amount)
                            : total).toFixed(2)}
                        </span>
                      </span>
                    )}
                  </Button>
                  {formData.paymentMethod === 'online' && discountLoading && (
                    <p className="mt-2 text-sm text-mediterranean-blu-scuro opacity-75 text-center">
                      Calcolo sconto in corso... attendi un attimo prima di procedere.
                    </p>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Authentication Modal - Rimosso perché non più necessario */}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
};

export default Prenotazione;