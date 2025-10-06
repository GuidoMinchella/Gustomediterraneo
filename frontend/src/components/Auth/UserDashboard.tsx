import React, { useEffect, useRef } from 'react';
import { X, User, Mail, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Chiudi dashboard quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardRef.current && !dashboardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Previeni scroll del body
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Chiudi dashboard con ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  if (!isOpen || !user) return null;

  // Formatta la data di registrazione
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-4 z-50">
      <div
        ref={dashboardRef}
        className="bg-white rounded-lg shadow-xl w-80 max-w-full animate-in slide-in-from-right-2 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard Utente</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="p-4 space-y-4">
          {/* Avatar e Nome */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {user.user_metadata?.full_name || 'Utente'}
              </h3>
              <p className="text-sm text-gray-500">Cliente</p>
            </div>
          </div>

          {/* Informazioni Utente */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900">{user.email}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Registrato il:</span>
              <span className="text-gray-900">{formatDate(user.created_at)}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${user.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
              <span className="text-gray-600">Stato:</span>
              <span className={`text-sm font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.email_confirmed_at ? 'Email verificata' : 'Email non verificata'}
              </span>
            </div>
          </div>

          {/* Statistiche */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Le tue statistiche</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-orange-600">0</div>
                <div className="text-gray-500">Prenotazioni</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">0</div>
                <div className="text-gray-500">Ordini</div>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {/* TODO: Implementare modifica profilo */}}
            >
              <User className="h-4 w-4 mr-2" />
              Modifica Profilo
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};