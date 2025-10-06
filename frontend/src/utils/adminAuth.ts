// Utility functions per la gestione dell'autenticazione admin

// Durata della sessione admin (2 ore)
const ADMIN_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 ore in millisecondi

/**
 * Verifica se l'utente è attualmente loggato come admin
 */
export const isAdminLoggedIn = (): boolean => {
  const isAdmin = localStorage.getItem('isAdmin');
  const loginTime = localStorage.getItem('adminLoginTime');
  
  if (!isAdmin || !loginTime) {
    return false;
  }
  
  const currentTime = Date.now();
  const sessionTime = parseInt(loginTime);
  
  // Verifica se la sessione è scaduta
  if (currentTime - sessionTime > ADMIN_SESSION_DURATION) {
    // Sessione scaduta, rimuovi i dati
    clearAdminSession();
    return false;
  }
  
  return isAdmin === 'true';
};

/**
 * Imposta lo stato di admin loggato
 */
export const setAdminLoggedIn = (): void => {
  localStorage.setItem('isAdmin', 'true');
  localStorage.setItem('adminLoginTime', Date.now().toString());
};

/**
 * Rimuove la sessione admin
 */
export const clearAdminSession = (): void => {
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('adminLoginTime');
};

/**
 * Ottiene il tempo rimanente della sessione admin in minuti
 */
export const getAdminSessionTimeLeft = (): number => {
  const loginTime = localStorage.getItem('adminLoginTime');
  
  if (!loginTime) {
    return 0;
  }
  
  const currentTime = Date.now();
  const sessionTime = parseInt(loginTime);
  const timeElapsed = currentTime - sessionTime;
  const timeLeft = ADMIN_SESSION_DURATION - timeElapsed;
  
  return Math.max(0, Math.floor(timeLeft / (60 * 1000))); // Ritorna minuti
};

/**
 * Estende la sessione admin (aggiorna il timestamp)
 */
export const extendAdminSession = (): void => {
  if (isAdminLoggedIn()) {
    localStorage.setItem('adminLoginTime', Date.now().toString());
  }
};