import React, { useState, useEffect } from 'react';
import DishManagement from '../components/Admin/DishManagement';
import MenuDelGiornoManagement from '../components/Admin/MenuDelGiornoManagement';
import MenuFissoManagement from '../components/Admin/MenuFissoManagement';
import OrdersManagement from '../components/Admin/OrdersManagement';
import AdminLoginModal from '../components/Auth/AdminLoginModal';
import { Users, ChefHat, ShoppingBag, BarChart3, Package, LogOut } from 'lucide-react';
import AdminStats from '../components/Admin/AdminStats';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily-menu');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, signOut, loading, isAdmin, adminLoading } = useAuth();

  useEffect(() => {
    // Se non c'è un utente autenticato, mostra il modal di login
    if (!loading && !user) {
      setShowLoginModal(true);
    } else if (user && !adminLoading && !isAdmin) {
      // Se l'utente è autenticato ma non è admin, mostra messaggio di accesso negato
      setShowLoginModal(false);
    } else if (user && isAdmin) {
      setShowLoginModal(false);
    }
  }, [user, loading, isAdmin, adminLoading]);

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setShowLoginModal(false);
    }
  };

  const handleAdminLogout = async () => {
    await signOut();
    setShowLoginModal(true);
  };

  // Se l'applicazione sta caricando o verificando i permessi admin
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mediterranean-marroncino mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loading ? 'Caricamento...' : 'Verifica permessi amministratore...'}
          </p>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato
  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Pannello Amministratore
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Accesso riservato agli amministratori autorizzati.
            </p>
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="w-full"
            >
              Accedi come Amministratore
            </Button>
          </div>
        </div>
        
        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleAdminLogin}
        />
      </>
    );
  }

  // Se l'utente è autenticato ma non è un amministratore autorizzato
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Accesso Negato
          </h2>
          <p className="text-gray-600 mb-4">
            Non hai i permessi necessari per accedere al pannello amministratore.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Utente connesso: {user.email}
          </p>
          <Button 
            onClick={handleAdminLogout}
            variant="outline"
            className="w-full"
          >
            Disconnetti
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'daily-menu', label: 'Menu del Giorno', icon: ChefHat },
    { id: 'fixed-menu', label: 'Menu Fisso', icon: ShoppingBag },
    { id: 'dishes', label: 'Gestione Piatti', icon: Users },
    { id: 'orders', label: 'Ordini', icon: Package },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'daily-menu':
        return <MenuDelGiornoManagement />;
      case 'fixed-menu':
        return <MenuFissoManagement />;
      case 'dishes':
        return <DishManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'analytics':
        return <AdminStats />;
      default:
        return <MenuDelGiornoManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pannello Amministratore
              </h1>
              <p className="text-sm text-gray-600">
                Benvenuto, {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Logout Button */}
              <button
                onClick={handleAdminLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-amber-100 text-amber-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-full overflow-x-hidden">
            <div className="bg-white rounded-lg shadow-sm max-w-full overflow-x-hidden">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;