// ============================================
// 🔧 CONFIGURATION CENTRALE DE L'APPLICATION
// ============================================
// Modifiez directement les valeurs ici selon votre environnement
// Plus besoin de fichiers .env !

/**
 * ⚠️ CONFIGURATION À MODIFIER PAR ORDINATEUR
 * Changez l'IP selon votre réseau local
 */

// 🌐 Adresse IP du serveur backend (changez cette valeur !)
const BACKEND_IP = '172.24.243.120';

// Configuration de l'environnement
export const API_CONFIG = {
  // URL du backend Spring Boot
  API_BASE_URL: `http://${BACKEND_IP}:8085/api`,
  
  // URL du backend Firebase Admin (Node.js)
  FIREBASE_ADMIN_URL: `http://${BACKEND_IP}:3000`,
  
  // URLs spécifiques
  SIGNALEMENTS_URL: '/signalements',
  REPORTS_URL: '/reports',
  AUTH_URL: '/auth',
  
  // Délai de timeout pour les requêtes (ms)
  REQUEST_TIMEOUT: 10000,
  
  // Port du serveur de développement
  DEV_PORT: 5173,
}

// Configuration Firebase (pour l'authentification)
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDDJ5Qc64SZnwGCRBShtbyHLYaGBweAwdk',
  authDomain: 'cloud-auth-2b3af.firebaseapp.com',
  projectId: 'cloud-auth-2b3af',
  storageBucket: 'cloud-auth-2b3af.firebasestorage.app',
  messagingSenderId: '482327951103',
  appId: '1:482327951103:web:ef6b58ae5dcbfdd8083eca',
}

// Configuration Cloudinary (upload photos)
export const CLOUDINARY_CONFIG = {
  cloudName: 'dfabawwvp',
  uploadPreset: 'signalement',
}

// ============================================
// 📝 INSTRUCTIONS POUR CHANGER L'IP :
// ============================================
// 1. Trouvez votre IP locale :
//    Windows : Ouvrez PowerShell et tapez : ipconfig
//    Cherchez "Adresse IPv4" de votre connexion active
//
// 2. Changez la valeur de BACKEND_IP ci-dessus
//    Exemple : const BACKEND_IP = '192.168.1.100';
//
// 3. Sauvegardez ce fichier (Ctrl+S)
//
// 4. Redémarrez le serveur de développement
//
// ⚠️ IP locale vs localhost :
//    - localhost : fonctionne uniquement sur VOTRE PC
//    - IP locale (192.168.x.x ou 172.x.x.x) : fonctionne sur tout le réseau
//    - Utilisez l'IP locale pour tester sur mobile !
// ============================================
