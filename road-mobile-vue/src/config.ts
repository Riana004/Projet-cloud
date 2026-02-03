// Configuration de l'environnement
export const API_CONFIG = {
  // URL du backend Spring Boot
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8085/api',
  
  // URLs spécifiques
  SIGNALEMENTS_URL: '/signalements',
  REPORTS_URL: '/reports',
  AUTH_URL: '/auth',
  
  // Délai de timeout pour les requêtes (ms)
  REQUEST_TIMEOUT: 10000,
  
  // Port du serveur de développement
  DEV_PORT: 5173,
}

// Configuration Firebase (gardée pour l'authentification)
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDDJ5Qc64SZnwGCRBShtbyHLYaGBweAwdk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cloud-auth-2b3af.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cloud-auth-2b3af',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cloud-auth-2b3af.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '482327951103',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:482327951103:web:ef6b58ae5dcbfdd8083eca',
}
