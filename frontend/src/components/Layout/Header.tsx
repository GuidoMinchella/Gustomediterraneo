import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';

import Button from '../UI/Button';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const location = useLocation();
  const { itemsCount } = useCart();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/menu-fisso', label: 'Menù Fisso' },
    { path: '/menu-del-giorno', label: 'Menù del Giorno' },
    { path: '/prenota', label: 'Prenota Ordine' },
    { path: '/galleria', label: 'Galleria' },
    { path: '/contatti', label: 'Contatti' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-mediterranean-bianco shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/images/Senza titolo (1024 x 200 px) (700 x 200 px).png" 
              alt="Gusto Mediterraneo" 
              className="h-12 w-auto group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-mediterranean-marroncino ${
                  isActive(item.path) 
                    ? 'text-mediterranean-marroncino border-b-2 border-mediterranean-marroncino' 
                    : 'text-mediterranean-blu-scuro'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Cart Icon (only if logged in) */}
            {user && (
              <Link to="/prenota" data-cart-icon="true" className="relative p-2 text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-mediterranean-marroncino text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Authentication */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 p-2 text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden lg:block text-sm font-medium">
                    Dashboard
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                size="sm"
                className="ml-4"
              >
                Accedi
              </Button>
            )}
          </div>

          {/* Mobile controls: cart (if logged in) + menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link
                to="/prenota"
                data-cart-icon="true"
                className="relative p-2 text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
                aria-label="Carrello"
              >
                <ShoppingCart className="w-6 h-6" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-mediterranean-marroncino text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemsCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${isMenuOpen ? 'dropdown-anim open' : 'dropdown-anim'}`} aria-hidden={!isMenuOpen}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-mediterranean-beige rounded-lg mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-mediterranean-marroncino bg-mediterranean-bianco'
                      : 'text-mediterranean-blu-scuro hover:text-mediterranean-marroncino hover:bg-mediterranean-bianco'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Authentication */}
              <div className="border-t border-mediterranean-marroncino pt-2 mt-2">
                {user ? (
                  <div className="px-3 py-2 space-y-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center text-mediterranean-blu-scuro hover:text-mediterranean-marroncino transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Esci
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <Button
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      size="sm"
                      className="w-full"
                    >
                      Accedi
                    </Button>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Modals */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={handleSwitchToRegister}
        />
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </nav>
    </header>
  );
};

export default Header;