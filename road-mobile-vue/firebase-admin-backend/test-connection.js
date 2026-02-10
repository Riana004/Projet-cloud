/**
 * Script de test de connexion Firebase Admin
 * Usage: node test-connection.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = 'C:\\Users\\Admin\\Documents\\S5\\cloud\\key\\serviceAccount.json';

async function testConnection() {
  console.log('\n🧪 Test de connexion Firebase Admin\n');
  console.log('📂 Chemin du serviceAccount:', serviceAccountPath);

  // Vérifier que le fichier existe
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERREUR: Le fichier serviceAccount.json n\'existe pas');
    process.exit(1);
  }

  console.log('✅ Fichier serviceAccount.json trouvé\n');

  try {
    const serviceAccount = require(serviceAccountPath);
    
    console.log('📋 Informations du service account:');
    console.log('   - Project ID:', serviceAccount.project_id);
    console.log('   - Client Email:', serviceAccount.client_email);
    console.log('   - Client ID:', serviceAccount.client_id);
    console.log('   - Private Key ID:', serviceAccount.private_key_id ? '✅ Présent' : '❌ Manquant');
    console.log('   - Private Key:', serviceAccount.private_key ? '✅ Présent (' + serviceAccount.private_key.substring(0, 30) + '...)' : '❌ Manquant');
    console.log('   - Type:', serviceAccount.type);
    console.log('');
    
    // Vérifier que c'est bien un compte de service
    if (serviceAccount.type !== 'service_account') {
      console.error('❌ ERREUR: Ce n\'est pas un fichier de compte de service valide');
      console.error('   Type trouvé:', serviceAccount.type);
      process.exit(1);
    }
    
    // Détruire l'app précédente si elle existe
    if (admin.apps.length > 0) {
      console.log('🔄 Destruction de l\'application Firebase précédente...');
      await admin.app().delete();
    }
    
    // Initialiser Firebase Admin
    console.log('🔄 Initialisation de Firebase Admin...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialisé avec succès');
    console.log('   Credential:', admin.credential.cert(serviceAccount) ? 'Valide' : 'Invalide');
    console.log('   App name:', admin.app().name);
    console.log('');
    
    // Test Firestore
    console.log('🔄 Test de connexion Firestore...');
    const db = admin.firestore();
    
    console.log('   - Firestore instance créée:', db ? '✅' : '❌');
    console.log('   - Project ID dans Firestore:', db.projectId ? db.projectId : '❓');
    console.log('');
    
    // Essayer de lire une collection simple
    console.log('🔄 Tentative de lecture de Firestore...');
    try {
      const testRef = db.collection('_test_connection');
      const snapshot = await testRef.limit(1).get();
      
      console.log('✅ Connexion Firestore OK');
      console.log('   Documents trouvés:', snapshot.size);
    } catch (firestoreErr) {
      console.error('❌ Erreur Firestore:', firestoreErr.message);
      console.error('   Code:', firestoreErr.code);
      
      // Si c'est une erreur d'authentification, donner plus d'info
      if (firestoreErr.code === 16 || firestoreErr.code === 7) {
        console.error('\n💡 Diagnostic:');
        console.error('   - C\'est une erreur d\'authentification ou de permission');
        console.error('   - Possibles causes:');
        console.error('     • La clé de service est expirée ou révoquée');
        console.error('     • Le compte de service n\'a pas les bonnes permissions');
        console.error('     • Les APIs ne sont pas activées');
      }
      
      throw firestoreErr;
    }
    
    // Test Firebase Auth
    console.log('🔄 Test de connexion Firebase Auth...');
    try {
      const listUsersResult = await admin.auth().listUsers(1);
      console.log('✅ Connexion Firebase Auth OK');
      console.log('   Utilisateurs trouvés:', listUsersResult.users.length);
      console.log('');
    } catch (authErr) {
      console.warn('⚠️  Attention Firebase Auth:', authErr.message);
      console.warn('   (ce n\'est pas critique pour le fonctionnement)');
      console.warn('');
    }
    
    console.log('✨ Tous les tests ont réussi!');
    console.log('');
    console.log('💡 Vous pouvez maintenant démarrer le serveur avec: npm start');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('\n📋 Détails de l\'erreur:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    
    console.error('\n🔍 Diagnostics:');
    
    if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
      console.error('\n💡 Problème d\'authentification détecté!');
      console.error('\n   SOLUTIONS À ESSAYER (par ordre de probabilité):');
      console.error('');
      console.error('   1️⃣ RÉGÉNÉRER LA CLÉ DE SERVICE (plus courant)');
      console.error('      - Allez sur: https://console.firebase.google.com/');
      console.error('      - Projet: cloud-auth-2b3af');
      console.error('      - ⚙️ Project Settings > Service accounts');
      console.error('      - Cliquez "Generate new private key"');
      console.error('      - Remplacez le fichier à: C:\\Users\\Admin\\Documents\\S5\\cloud\\key\\serviceAccount.json');
      console.error('      - Redémarrez le test');
      console.error('');
      
      console.error('   2️⃣ VÉRIFIER LES PERMISSIONS IAM');
      console.error('      - Google Cloud Console: https://console.cloud.google.com/');
      console.error('      - Projet: cloud-auth-2b3af');
      console.error('      - IAM & Admin > Service Accounts');
      console.error('      - Trouvez: firebase-adminsdk-fbsvc@cloud-auth-2b3af.iam.gserviceaccount.com');
      console.error('      - Rôles requis:');
      console.error('        ✓ Firebase Admin SDK Administrator Service Agent');
      console.error('        ✓ Cloud Datastore User (ou broader permission)');
      console.error('      - Si manquants, cliquez "Edit" et ajoutez les rôles');
      console.error('');
      
      console.error('   3️⃣ VÉRIFIER QUE LES APIs GOOGLE CLOUD SONT ACTIVÉES');
      console.error('      - Google Cloud Console: APIs & Services > Library');
      console.error('      - Recherchez et activez:');
      console.error('        ✓ Cloud Firestore API');
      console.error('        ✓ Cloud Datastore API');
      console.error('        ✓ Identity and Access Management (IAM) API');
      console.error('        ✓ Service Usage API');
      console.error('');
      
      console.error('   4️⃣ VÉRIFIER QUE C\'EST LE BON PROJET');
      console.error('      - Ouvrez le serviceAccount.json');
      console.error('      - Vérifiez que "project_id" = "cloud-auth-2b3af"');
      console.error('');
      
    } else if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Problème de permissions détecté!');
      console.error('   - Le service account n\'a pas les permissions');
      console.error('   - Vérifiez sur Google Cloud Console:');
      console.error('     • IAM & Admin > Service Accounts');
      console.error('     • Rôles du compte firebase-adminsdk-fbsvc');
      console.error('   - Ajouter rôles: Cloud Datastore User ou Editor');
      console.error('');
    }
    
    console.error('\n📚 Stack trace complète:');
    console.error(error.stack);
    console.error('');
    
    process.exit(1);
  }
}

// Exécuter le test
testConnection();
