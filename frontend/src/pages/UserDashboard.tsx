import React, { useState, useEffect } from 'react';
import { User, Clock, Package, CreditCard, Calendar, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  payment_method: 'pickup' | 'online';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  original_amount?: number;
  discount_type?: string;
  discount_percentage?: number;
  discount_amount?: number;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  dish_name: string;
  dish_price: number;
  quantity: number;
  subtotal: number;
}

const UserDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            dish_name,
            dish_price,
            quantity,
            subtotal
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received':
        return 'Ricevuto';
      case 'preparing':
        return 'In Preparazione';
      case 'ready':
        return 'Pronto';
      case 'completed':
        return 'Completato';
      case 'cancelled':
        return 'Annullato';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'In Attesa';
      case 'paid':
        return 'Pagato';
      case 'failed':
        return 'Fallito';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-mediterranean-beige py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center">
            <h1 className="font-serif text-3xl font-bold text-mediterranean-blu-scuro mb-4">
              Accesso Richiesto
            </h1>
            <p className="text-mediterranean-blu-scuro mb-6">
              Devi effettuare il login per accedere alla tua dashboard.
            </p>
            <Button>
              <a href="/login">Accedi</a>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
            La Mia Dashboard
          </h1>
          <p className="text-lg text-mediterranean-blu-scuro">
            Benvenuto, {user.user_metadata?.full_name || user.email}!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informazioni Account
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-mediterranean-blu-scuro mb-1">
                    Nome
                  </label>
                  <p className="text-mediterranean-blu-scuro">
                    {user.user_metadata?.full_name || 'Non specificato'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-mediterranean-blu-scuro mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-mediterranean-blu-scuro">{user.email}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => signOut()}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-6 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Cronologia Ordini ({orders.length})
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino mx-auto"></div>
                  <p className="text-mediterranean-blu-scuro mt-4">Caricamento ordini...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-mediterranean-blu-scuro opacity-50 mx-auto mb-4" />
                  <p className="text-mediterranean-blu-scuro mb-4">Nessun ordine trovato</p>
                  <p className="text-sm text-mediterranean-blu-scuro opacity-75 mb-4">
                    I tuoi ordini appariranno qui una volta effettuati
                  </p>
                  <Button variant="outline" size="sm">
                    <a href="/menu-fisso">Ordina Ora</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-mediterranean-blu-scuro">
                            Ordine #{order.order_number}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {getStatusText(order.order_status)}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="text-mediterranean-marroncino hover:text-mediterranean-blu-scuro"
                        >
                          {expandedOrder === order.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-mediterranean-blu-scuro opacity-75">Data:</span>
                          <p className="font-medium text-mediterranean-blu-scuro">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div>
                          <span className="text-mediterranean-blu-scuro opacity-75">Ritiro:</span>
                          <p className="font-medium text-mediterranean-blu-scuro">
                            {new Date(order.pickup_date).toLocaleDateString('it-IT', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })} - {formatTime(order.pickup_time)}
                          </p>
                        </div>
                        <div>
                          <span className="text-mediterranean-blu-scuro opacity-75">Pagamento:</span>
                          <p className="font-medium text-mediterranean-blu-scuro">
                            {order.payment_method === 'pickup' ? 'Al Ritiro' : 'Online'}
                          </p>
                        </div>
                        <div>
                          <span className="text-mediterranean-blu-scuro opacity-75">Totale:</span>
                          <p className="font-bold text-mediterranean-marroncino">
                            €{order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details with smooth slide transition */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedOrder === order.id
                            ? 'max-h-[1200px] opacity-100 translate-y-0 mt-4 pt-4 border-t'
                            : 'max-h-0 opacity-0 -translate-y-1'
                        }`}
                        aria-hidden={expandedOrder !== order.id}
                      >
                          <h5 className="font-medium text-mediterranean-blu-scuro mb-3">Piatti Ordinati:</h5>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-mediterranean-beige rounded">
                                <div>
                                  <span className="font-medium text-mediterranean-blu-scuro">
                                    {item.dish_name}
                                  </span>
                                  <span className="text-mediterranean-blu-scuro opacity-75 ml-2">
                                    x{item.quantity}
                                  </span>
                                </div>
                                <span className="font-semibold text-mediterranean-marroncino">
                                  €{item.subtotal.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Discount Information */}
                          {order.discount_amount && order.discount_amount > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <h5 className="font-medium text-mediterranean-blu-scuro mb-2">Sconto Applicato:</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Subtotale:</span>
                                  <span>€{(order.original_amount || order.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>
                                    Sconto {order.discount_type === 'first_order' ? '(Primo Ordine)' : '(Ordine >40€)'} 
                                    {order.discount_percentage ? ` - ${order.discount_percentage}%` : ''}:
                                  </span>
                                  <span>-€{order.discount_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-1">
                                  <span>Totale Finale:</span>
                                  <span>€{order.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="text-right text-green-600 font-medium">
                                  Hai risparmiato €{order.discount_amount.toFixed(2)}!
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {order.notes && (
                            <div className="mt-4">
                              <h5 className="font-medium text-mediterranean-blu-scuro mb-2">Note:</h5>
                              <p className="text-mediterranean-blu-scuro bg-mediterranean-beige p-3 rounded">
                                {order.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;