import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import WelcomeNotification from '../UI/WelcomeNotification';
import MiniWelcomeNotification from '../UI/MiniWelcomeNotification';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [showMiniNotification, setShowMiniNotification] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Evita overlay e notifiche sulla pagina di pagamento per non interferire con 3DS
  const isPaymentRoute = location.pathname === '/pagamento';
  // Su /pagamento nascondi anche Header e Footer per evitare sovrapposizioni su mobile
  const hideChrome = isPaymentRoute;

  useEffect(() => {
    // Mostra la notifica solo se l'utente non è loggato e non sta caricando
    // e non l'ha già vista in questa sessione
    if (!loading && !user && !isPaymentRoute) {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcomeNotification');
      const hasClosedWelcome = sessionStorage.getItem('hasClosedWelcomeNotification');
      
      if (!hasSeenWelcome) {
        // Mostra la notifica dopo un breve delay per migliorare l'UX
        const timer = setTimeout(() => {
          setShowWelcomeNotification(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else if (hasClosedWelcome && !sessionStorage.getItem('hasDismissedMiniNotification')) {
        // Se ha chiuso la notifica principale senza registrarsi, mostra la mini notifica
        setShowMiniNotification(true);
      }
    }
  }, [user, loading, isPaymentRoute]);

  const handleRegisterClick = () => {
    setShowWelcomeNotification(false);
    sessionStorage.setItem('hasSeenWelcomeNotification', 'true');
    setIsRegisterModalOpen(true); // Apre il modal di registrazione invece di navigare
  };

  const handleCloseNotification = () => {
    setShowWelcomeNotification(false);
    sessionStorage.setItem('hasSeenWelcomeNotification', 'true');
    sessionStorage.setItem('hasClosedWelcomeNotification', 'true');
    
    // Mostra la mini notifica dopo un breve delay se l'utente non è registrato
    setTimeout(() => {
      if (!user && !sessionStorage.getItem('hasDismissedMiniNotification')) {
        setShowMiniNotification(true);
      }
    }, 2000);
  };

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleMiniNotificationRegister = () => {
    setShowMiniNotification(false);
    sessionStorage.setItem('hasDismissedMiniNotification', 'true');
    setIsRegisterModalOpen(true);
  };

  const handleMiniNotificationClose = () => {
    setShowMiniNotification(false);
    sessionStorage.setItem('hasDismissedMiniNotification', 'true');
  };

  return (
    <div className="min-h-screen bg-mediterranean-bianco">
      {!hideChrome && <Header />}
      <main>
        {children}
      </main>
      {!hideChrome && <Footer />}
      
      {showWelcomeNotification && !isPaymentRoute && (
        <WelcomeNotification
          onRegisterClick={handleRegisterClick}
          onClose={handleCloseNotification}
        />
      )}

      {/* Mini Welcome Notification */}
      {showMiniNotification && !user && !isPaymentRoute && (
        <MiniWelcomeNotification
          onRegisterClick={handleMiniNotificationRegister}
          onClose={handleMiniNotificationClose}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default Layout;