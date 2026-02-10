const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialiser Firebase Admin avec le service account
const serviceAccountPath = 'C:\\Users\\Admin\\Documents\\S5\\cloud\\key\\serviceAccount.json';

console.log('📂 Chemin du serviceAccount:', serviceAccountPath);

// Vérifier que le fichier existe
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERREUR: Le fichier serviceAccount.json n\'existe pas à:', serviceAccountPath);
  process.exit(1);
}

console.log('✅ Fichier serviceAccount.json trouvé');

let firestore; // Firestore instance

try {
  const serviceAccount = require(serviceAccountPath);
  
  console.log('📋 Project ID:', serviceAccount.project_id);
  console.log('📧 Client Email:', serviceAccount.client_email);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  // Initialiser Firestore pour les logs des tentatives (Firebase Auth = source de vérité)
  firestore = admin.firestore();
  
  console.log('✅ Firebase Admin initialisé avec succès');
  console.log('✅ Firestore initialisé pour les logs');
  console.log('✅ Firebase Auth est la source de vérité pour bloquer/débloquer les comptes');
  
} catch (error) {
  console.error('❌ ERREUR lors de l\'initialisation de Firebase Admin:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const MAX_FAILED_ATTEMPTS = 3;

/**
 * Vérifier le statut d'un utilisateur (depuis Firebase Auth)
 * GET /api/auth/check-status?email=...
 */
app.get('/api/auth/check-status', async (req, res) => {
  try {
    const { email } = req.query;
    
    console.log('📥 Check status request for:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier le disabled flag dans Firebase Auth
    let disabled = false;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      disabled = userRecord.disabled || false;
      console.log(`🔍 Firebase Auth status pour ${email}: disabled=${disabled}`);
    } catch (authErr) {
      console.log(`ℹ️  Utilisateur ${email} n'existe pas encore dans Firebase Auth`);
    }

    // Lire les logs des tentatives depuis Firestore
    let attempts = 0;
    let lastAttempt = null;
    let blockedAt = null;
    
    try {
      const docRef = firestore.collection('login_attempts').doc(email);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        attempts = data.attempts || 0;
        lastAttempt = data.lastAttempt;
        blockedAt = data.blockedAt;
        console.log(`📊 Firestore logs pour ${email}: ${attempts} tentatives`);
      }
    } catch (fsErr) {
      console.warn('⚠️  Erreur lecture Firestore:', fsErr.message);
    }

    return res.json({
      email,
      attempts,
      disabled, // Source de vérité: Firebase Auth
      lastAttempt,
      blockedAt,
      exists: true
    });
  } catch (error) {
    console.error('❌ Erreur check-status:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Voir les logs du serveur'
    });
  }
});

/**
 * Enregistrer une tentative de connexion échouée (Firestore logs + Firebase Auth disabled)
 * POST /api/auth/register-failed-login
 * Body: { email: string }
 */
app.post('/api/auth/register-failed-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Lire les tentatives actuelles depuis Firestore
    const docRef = firestore.collection('login_attempts').doc(email);
    const docSnap = await docRef.get();
    
    let attempts = 1;
    let lastAttempt = new Date().toISOString();
    let blockedAt = null;
    
    if (docSnap.exists) {
      const data = docSnap.data();
      attempts = (data.attempts || 0) + 1;
    }

    // Enregistrer dans Firestore (logs)
    await docRef.set({
      email,
      attempts,
      lastAttempt,
      blockedAt
    }, { merge: true });

    console.log(`📝 Tentative ${attempts} enregistrée dans Firestore pour ${email}`);

    // Si 3 tentatives, désactiver le compte Firebase Auth
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { disabled: true });
        
        // Marquer le blocage dans Firestore aussi
        blockedAt = new Date().toISOString();
        await docRef.set({ blockedAt }, { merge: true });
        
        console.log(`✅ Utilisateur ${email} désactivé dans Firebase Auth après 3 tentatives`);
      } catch (authErr) {
        console.warn('⚠️  Erreur Firebase Auth:', authErr.message);
      }
    }

    return res.json({
      email,
      attempts,
      blocked: attempts >= MAX_FAILED_ATTEMPTS,
      message: attempts >= MAX_FAILED_ATTEMPTS ? 'Compte bloqué après 3 tentatives' : 'Tentative enregistrée'
    });
  } catch (error) {
    console.error('❌ Erreur register-failed-login:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Réinitialiser les tentatives et réactiver le compte
 * POST /api/auth/reset-attempts
 * Body: { email: string }
 */
app.post('/api/auth/reset-attempts', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Réactiver dans Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { disabled: false });
      console.log(`✅ Utilisateur ${email} réactivé dans Firebase Auth`);
    } catch (authErr) {
      console.warn('⚠️  Erreur Firebase Auth:', authErr.message);
      return res.status(500).json({ error: authErr.message });
    }

    // Réinitialiser les logs dans Firestore
    const docRef = firestore.collection('login_attempts').doc(email);
    await docRef.set({
      email,
      attempts: 0,
      lastAttempt: new Date().toISOString(),
      blockedAt: null
    });

    return res.json({
      success: true,
      email,
      message: 'Compte réactivé et tentatives réinitialisées'
    });
  } catch (error) {
    console.error('❌ Erreur reset-attempts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Débloquer/Bloquer un utilisateur manuellement
 * POST /api/auth/update-user-status
 * Body: { email: string, disable: boolean }
 */
app.post('/api/auth/update-user-status', async (req, res) => {
  try {
    const { email, disable } = req.body;
    
    if (!email || disable === undefined) {
      return res.status(400).json({ error: 'Email et disable requis' });
    }

    let uid = null;
    
    // Modifier dans Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
      await admin.auth().updateUser(uid, { disabled: disable });
      console.log(`✅ Utilisateur ${email} ${disable ? 'désactivé' : 'réactivé'} dans Firebase Auth`);
    } catch (authErr) {
      console.warn('⚠️  Erreur Firebase Auth:', authErr.message);
      return res.status(500).json({ error: authErr.message });
    }

    // Réinitialiser les tentatives si on réactive
    const docRef = firestore.collection('login_attempts').doc(email);
    const updateData = {
      email,
      lastAttempt: new Date().toISOString()
    };

    if (disable) {
      updateData.blockedAt = new Date().toISOString();
    } else {
      updateData.attempts = 0;
      updateData.blockedAt = null;
    }

    await docRef.set(updateData, { merge: true });

    return res.json({
      success: true,
      email,
      uid,
      disabled: disable,
      message: disable ? 'Compte bloqué' : 'Compte débloqué et réactivé'
    });
  } catch (error) {
    console.error('❌ Erreur update-user-status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
const BACKEND_IP = process.env.BACKEND_IP || '172.24.243.120';

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 Serveur Firebase Admin démarré');
  console.log('========================================');
  console.log(`   Port          : ${PORT}`);
  console.log(`   IP Backend    : ${BACKEND_IP}`);
  console.log(`   URL Locale    : http://localhost:${PORT}`);
  console.log(`   URL Réseau    : http://${BACKEND_IP}:${PORT}`);
  console.log('========================================');
  console.log(`📍 Health check   : http://${BACKEND_IP}:${PORT}/health`);
  console.log('💡 Pour changer IP : Éditez ../src/config.ts');
  console.log('========================================');
  console.log('');
});
