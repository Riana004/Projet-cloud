/**
 * Script de vérification des credentials Firebase
 * Vérifie la cohérence entre serviceAccount.json et la configuration
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = 'C:\\Users\\Admin\\Documents\\S5\\cloud\\key\\serviceAccount.json';

console.log('\n📋 VÉRIFICATION DES CREDENTIALS FIREBASE\n');
console.log('=' .repeat(60));

// Vérifier le fichier
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Fichier non trouvé:', serviceAccountPath);
  process.exit(1);
}

console.log('✅ Fichier trouvé:', serviceAccountPath);

const serviceAccount = require(serviceAccountPath);

console.log('\n📌 INFORMATIONS DU SERVICE ACCOUNT:');
console.log('-' .repeat(60));
console.log('Type:', serviceAccount.type);
console.log('Project:', serviceAccount.project_id);
console.log('Service Account Email:', serviceAccount.client_email);
console.log('Client ID:', serviceAccount.client_id);
console.log('Private Key ID:', serviceAccount.private_key_id);
console.log('Auth URI:', serviceAccount.auth_uri);
console.log('Token URI:', serviceAccount.token_uri);
console.log('Private Key (premiers 50 chars):', serviceAccount.private_key.substring(0, 50) + '...');

// Vérifications
console.log('\n🔍 VÉRIFICATIONS:');
console.log('-' .repeat(60));

let hasErrors = false;

// Vérifier que c'est un service account
if (serviceAccount.type !== 'service_account') {
  console.error('❌ Type invalide. Attendu "service_account", trouvé:', serviceAccount.type);
  hasErrors = true;
} else {
  console.log('✅ Type correct: service_account');
}

// Vérifier le project_id
if (!serviceAccount.project_id || serviceAccount.project_id.trim() === '') {
  console.error('❌ project_id manquant ou vide');
  hasErrors = true;
} else {
  console.log('✅ project_id présent:', serviceAccount.project_id);
}

// Vérifier que c'est le bon projet
if (serviceAccount.project_id !== 'cloud-auth-2b3af') {
  console.warn('⚠️  project_id ne correspond pas au projet attendu');
  console.warn('   Attendu: cloud-auth-2b3af');
  console.warn('   Trouvé:', serviceAccount.project_id);
} else {
  console.log('✅ project_id correspond au projet attendu');
}

// Vérifier la clé privée
if (!serviceAccount.private_key || serviceAccount.private_key.trim() === '') {
  console.error('❌ private_key manquante ou vide');
  hasErrors = true;
} else if (!serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----')) {
  console.error('❌ private_key semble invalide (ne commence pas par BEGIN PRIVATE KEY)');
  hasErrors = true;
} else if (!serviceAccount.private_key.includes('-----END PRIVATE KEY-----')) {
  console.error('❌ private_key semble invalide (ne contient pas END PRIVATE KEY)');
  hasErrors = true;
} else {
  console.log('✅ private_key au bon format PEM');
  console.log('   Longueur:', serviceAccount.private_key.length, 'caractères');
}

// Vérifier client_email
if (!serviceAccount.client_email || !serviceAccount.client_email.includes('@')) {
  console.error('❌ client_email invalide:', serviceAccount.client_email);
  hasErrors = true;
} else {
  console.log('✅ client_email valide:', serviceAccount.client_email);
}

// Vérifier private_key_id
if (!serviceAccount.private_key_id || serviceAccount.private_key_id.trim() === '') {
  console.warn('⚠️  private_key_id manquant');
} else {
  console.log('✅ private_key_id présent');
}

console.log('\n' + '=' .repeat(60));
if (hasErrors) {
  console.error('\n❌ Des erreurs ont été trouvées. Le serviceAccount.json est invalide.');
  console.error('\n💡 Solution:');
  console.error('   1. Allez sur: https://console.firebase.google.com/');
  console.error('   2. Projet: cloud-auth-2b3af');
  console.error('   3. ⚙️ Project Settings > Service accounts tab');
  console.error('   4. Cliquez "Generate new private key"');
  console.error('   5. Remplacez le fichier existant');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les vérifications sont passées!');
  console.log('\nLe serviceAccount.json semble valide.');
  console.log('Essayez maintenant: npm test');
  process.exit(0);
}
