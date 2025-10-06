import React, { useState } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (success: boolean) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError('Credenziali non valide o errore di autenticazione');
        onLogin(false);
      } else {
        onLogin(true);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('Errore durante il login');
      onLogin(false);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Accesso Amministratore">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-mediterranean-marroncino rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">
          Inserisci le credenziali di amministratore per accedere al pannello di controllo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Amministratore
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              id="admin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
              placeholder="Email amministratore"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password Amministratore
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mediterranean-marroncino focus:border-transparent"
              placeholder="Password amministratore"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Accesso Amministratore:</strong><br />
            Utilizza le credenziali del tuo account amministratore registrato nel sistema.
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? 'Verifica in corso...' : 'Accedi come Amministratore'}
        </Button>
      </form>
    </Modal>
  );
};

export default AdminLoginModal;