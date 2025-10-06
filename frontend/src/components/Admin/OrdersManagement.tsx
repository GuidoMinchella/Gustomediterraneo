import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Calendar, Clock, User, Phone, Mail, CreditCard, Eye, EyeOff, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

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
  updated_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  dish_name: string;
  dish_price: number;
  quantity: number;
  subtotal: number;
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders using admin function...');
      
      const { data: ordersData, error } = await supabase
        .rpc('get_admin_orders');

      console.log('Orders query result:', { ordersData, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Setting orders data:', ordersData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log('Attempting to update order status:', { orderId, newStatus });
      console.log('Current user:', await supabase.auth.getUser());
      
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus as Order['order_status'] }
          : order
      ));
      
      console.log('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Errore nell\'aggiornamento dello stato dell\'ordine: ' + (error as any)?.message || 'Errore sconosciuto');
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagato';
      case 'pending':
        return 'In Attesa';
      case 'failed':
        return 'Fallito';
      default:
        return status;
    }
  };

  // Etichetta pagamento per pannello admin, basata su metodo e stato
  const getAdminPaymentLabel = (order: Order) => {
    if (order.payment_method === 'online') {
      if (order.payment_status === 'paid') return 'Pagato sul sito';
      if (order.payment_status === 'failed') return 'Fallito';
      return 'In Attesa';
    }
    if (order.payment_method === 'pickup') {
      return 'Pagamento alla consegna';
    }
    // Fallback
    return getPaymentStatusText(order.payment_status);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Package className="w-6 h-6 mr-2" />
            Gestione Ordini
          </h2>
          <p className="text-gray-600 mt-1">
            Visualizza e gestisci tutti gli ordini ricevuti ({filteredOrders.length} ordini)
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-mediterranean-marroncino text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Aggiorna
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca per numero ordine, nome, email o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent appearance-none"
            >
              <option value="all">Tutti gli stati</option>
              <option value="received">Ricevuto</option>
              <option value="preparing">In Preparazione</option>
              <option value="ready">Pronto</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent appearance-none"
            >
              <option value="all">Tutti i pagamenti</option>
              <option value="paid">Pagato</option>
              <option value="pending">In Attesa</option>
              <option value="failed">Fallito</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 w-full max-w-full overflow-x-hidden bg-mediterranean-marroncino/20 p-4 rounded-lg">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ordine trovato</h3>
            <p className="text-gray-500">
              {orders.length === 0 
                ? 'Non ci sono ancora ordini nel sistema.' 
                : 'Nessun ordine corrisponde ai filtri selezionati.'
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-full"
            >
              {/* Order Header */}
              <div className="p-3 sm:p-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="font-semibold text-lg text-mediterranean-blu-scuro break-words">
                        Ordine #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-normal break-words">
                        {new Date(order.created_at).toLocaleDateString('it-IT', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                        {getStatusText(order.order_status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {getAdminPaymentLabel(order)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
                    <span className="text-lg font-bold text-mediterranean-marroncino">
                      €{order.total_amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 break-words">
                    <User className="w-4 h-4 mr-1" />
                    {order.customer_name}
                  </div>
                  <div className="flex items-center text-gray-600 break-words">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(order.pickup_date).toLocaleDateString('it-IT')}
                  </div>
                  <div className="flex items-center text-gray-600 break-words">
                    <Clock className="w-4 h-4 mr-1" />
                    {order.pickup_time}
                  </div>
                  <div className="flex items-center text-gray-600 break-words">
                    <CreditCard className="w-4 h-4 mr-1" />
                    {order.payment_method === 'pickup' ? 'Alla Consegna' : 'Online'}
                  </div>
                </div>
              </div>

              {/* Expanded Details with smooth slide transition */}
              <div
                className={`bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedOrder === order.id
                    ? 'max-h-[1200px] opacity-100 translate-y-0 p-3 sm:p-4'
                    : 'max-h-0 opacity-0 -translate-y-1 p-0'
                }`}
                aria-hidden={expandedOrder !== order.id}
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${expandedOrder === order.id ? '' : 'pointer-events-none'}`}>
                    {/* Customer Details */}
                    <div>
                      <h4 className="font-medium text-mediterranean-blu-scuro mb-3">Dettagli Cliente</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Nome:</span>
                          <span className="ml-2">{order.customer_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Email:</span>
                          <span className="ml-2">{order.customer_email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Telefono:</span>
                          <span className="ml-2">{order.customer_phone}</span>
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="mt-4">
                        <h4 className="font-medium text-mediterranean-blu-scuro mb-2">Gestione Stato</h4>
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent text-sm"
                        >
                          <option value="received">Ricevuto</option>
                          <option value="preparing">In Preparazione</option>
                          <option value="ready">Pronto</option>
                          <option value="completed">Completato</option>
                          <option value="cancelled">Annullato</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-mediterranean-blu-scuro mb-3">Piatti Ordinati</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex flex-wrap justify-between items-center gap-2 py-2 px-3 bg-white rounded border">
                            <div className="min-w-0">
                              <span className="font-medium text-mediterranean-blu-scuro block truncate">
                                {item.dish_name}
                              </span>
                              <span className="text-gray-500 block">
                                x{item.quantity} (€{item.dish_price.toFixed(2)} cad.)
                              </span>
                            </div>
                            <span className="font-semibold text-mediterranean-marroncino">
                              €{item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {/* Discount Information */}
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between items-center text-sm">
                              <span>Subtotale:</span>
                              <span>€{(order.original_amount || order.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-green-600">
                              <span>
                                Sconto {order.discount_type === 'first_order' ? '(Primo Ordine)' : '(Ordine >40€)'} 
                                {order.discount_percentage && ` - ${order.discount_percentage}%`}:
                              </span>
                              <span>-€{order.discount_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Totale:</span>
                          <span className="text-mediterranean-marroncino">€{order.total_amount.toFixed(2)}</span>
                        </div>
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="text-right text-sm text-green-600 mt-1">
                            Risparmio: €{order.discount_amount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="mt-4">
                          <h4 className="font-medium text-mediterranean-blu-scuro mb-2">Note</h4>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;