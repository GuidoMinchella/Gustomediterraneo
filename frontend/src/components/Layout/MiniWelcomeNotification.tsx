import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import { Button } from '../UI/Button';

interface MiniWelcomeNotificationProps {
  onRegisterClick: () => void;
  onClose: () => void;
}

const MiniWelcomeNotification: React.FC<MiniWelcomeNotificationProps> = ({
  onRegisterClick,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleRegisterClick = () => {
    onRegisterClick();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
        {/* Header con icona e pulsante chiudi */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-mediterranean-marroncino to-orange-500 rounded-full p-1.5 mr-2">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-mediterranean-blu-scuro">
              Sconto 10%
            </h4>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenuto */}
        <p className="text-xs text-mediterranean-blu-scuro mb-3 leading-relaxed">
          <strong>Registrati ora</strong> e ottieni il 10% di sconto sul tuo primo ordine!
        </p>

        {/* Pulsante */}
        <Button
          onClick={handleRegisterClick}
          className="w-full bg-gradient-to-r from-mediterranean-marroncino to-orange-500 hover:from-mediterranean-marroncino/90 hover:to-orange-500/90 text-white text-xs py-2 px-3 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Registrati Ora
        </Button>
      </div>
    </div>
  );
};

export default MiniWelcomeNotification;