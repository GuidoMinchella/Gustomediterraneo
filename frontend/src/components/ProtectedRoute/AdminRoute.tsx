import React from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Componente per le rotte amministrative
 * La logica di autenticazione è gestita direttamente nel componente AdminDashboard
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  // Rimuoviamo il redirect automatico per permettere l'accesso alla pagina di login
  return <>{children}</>;
};

export default AdminRoute;