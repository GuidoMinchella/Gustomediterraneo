import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Card from '../UI/Card';
import { BarChart3, PackageCheck, PackageSearch, Package, CheckCircle, XCircle, CreditCard, Wallet, Percent, Users } from 'lucide-react';

interface OrderItem {
  id: string;
  dish_name: string;
  dish_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  payment_method: 'pickup' | 'online';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  original_amount?: number;
  discount_type?: 'first_order' | 'amount_threshold' | 'none' | null;
  discount_percentage?: number;
  discount_amount?: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[] | any;
}

const AdminStats: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc('get_admin_orders');
        if (error) throw error;
        setOrders((data || []) as Order[]);
      } catch (err: any) {
        console.error('Errore nel recupero ordini per statistiche:', err);
        setError(err?.message || 'Errore sconosciuto nel recupero dati');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const byStatus = {
      received: orders.filter(o => o.order_status === 'received').length,
      preparing: orders.filter(o => o.order_status === 'preparing').length,
      ready: orders.filter(o => o.order_status === 'ready').length,
      completed: orders.filter(o => o.order_status === 'completed').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length,
    };

    const payments = {
      online: orders.filter(o => o.payment_method === 'online').length,
      pickup: orders.filter(o => o.payment_method === 'pickup').length,
    };

    const discounts = {
      first_order: orders.filter(o => (o.discount_type || 'none') === 'first_order').length,
      amount_threshold: orders.filter(o => (o.discount_type || 'none') === 'amount_threshold').length,
      none: orders.filter(o => (o.discount_type || 'none') === 'none' || !o.discount_type).length,
    };

    const totalSum = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const userOrderCounts = new Map<string, number>();
    orders.forEach(o => {
      if (!o.user_id) return;
      userOrderCounts.set(o.user_id, (userOrderCounts.get(o.user_id) || 0) + 1);
    });
    const distinctUsersWithOrders = userOrderCounts.size;
    const habitualUsers = Array.from(userOrderCounts.values()).filter(c => c > 1).length;

    return {
      totalOrders,
      byStatus,
      payments,
      discounts,
      totalSum,
      users: {
        totalRegisteredApprox: distinctUsersWithOrders,
        habitual: habitualUsers,
      },
    };
  }, [orders]);

  const currency = (value: number) => `€${value.toFixed(2)}`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-red-700">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-mediterranean-marroncino bg-opacity-10 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Statistiche
        </h2>
        <p className="text-gray-600 mt-1">Panoramica degli ordini e degli utenti</p>
      </div>

      {/* Stato ordini */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Stato ordini
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center text-blue-700 font-medium">
              <PackageSearch className="w-4 h-4 mr-2" /> Ricevuti
            </div>
            <div className="text-2xl font-bold text-blue-800 mt-2">{stats.byStatus.received}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-yellow-700 font-medium">
              <Package className="w-4 h-4 mr-2" /> In preparazione
            </div>
            <div className="text-2xl font-bold text-yellow-800 mt-2">{stats.byStatus.preparing}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-700 font-medium">
              <CheckCircle className="w-4 h-4 mr-2" /> Pronto
            </div>
            <div className="text-2xl font-bold text-green-800 mt-2">{stats.byStatus.ready}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-700 font-medium">
              <PackageCheck className="w-4 h-4 mr-2" /> Consegnato
            </div>
            <div className="text-2xl font-bold text-gray-800 mt-2">{stats.byStatus.completed}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-700 font-medium">
              <XCircle className="w-4 h-4 mr-2" /> Annullato
            </div>
            <div className="text-2xl font-bold text-red-800 mt-2">{stats.byStatus.cancelled}</div>
          </div>
        </div>
      </Card>

      {/* Numero ordini totale */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Numero ordini totale
        </h3>
        <div className="text-3xl font-bold text-mediterranean-blu-scuro">{stats.totalOrders}</div>
      </Card>

      {/* Numero pagamenti */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Numero pagamenti</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-700 font-medium">
              <CreditCard className="w-4 h-4 mr-2" /> Con carta (sul sito)
            </div>
            <div className="text-2xl font-bold text-green-800 mt-2">{stats.payments.online}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center text-amber-700 font-medium">
              <Wallet className="w-4 h-4 mr-2" /> Al ristorante (alla consegna)
            </div>
            <div className="text-2xl font-bold text-amber-800 mt-2">{stats.payments.pickup}</div>
          </div>
        </div>
      </Card>

      {/* Ordini con sconti */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ordini con sconti</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center text-indigo-700 font-medium">
              <Percent className="w-4 h-4 mr-2" /> Primo ordine
            </div>
            <div className="text-2xl font-bold text-indigo-800 mt-2">{stats.discounts.first_order}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center text-purple-700 font-medium">
              <Percent className="w-4 h-4 mr-2" /> Superati i 40€
            </div>
            <div className="text-2xl font-bold text-purple-800 mt-2">{stats.discounts.amount_threshold}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-700 font-medium">
              <Percent className="w-4 h-4 mr-2" /> Nessuno sconto
            </div>
            <div className="text-2xl font-bold text-gray-800 mt-2">{stats.discounts.none}</div>
          </div>
        </div>
      </Card>

      {/* Totale somma ordini */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Totale somma ordini</h3>
        <div className="text-3xl font-bold text-mediterranean-marroncino">{currency(stats.totalSum)}</div>
      </Card>

      {/* Sezione utenti */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Utenti
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="text-sky-700 font-medium">Numero totale utenti registrati</div>
            <div className="text-2xl font-bold text-sky-800 mt-2">{stats.users.totalRegisteredApprox}</div>
            <div className="text-xs text-sky-700 mt-1">Basato sugli utenti con almeno un ordine</div>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="text-teal-700 font-medium">Utenti abituali (più di un ordine)</div>
            <div className="text-2xl font-bold text-teal-800 mt-2">{stats.users.habitual}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminStats;