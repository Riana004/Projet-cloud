/**
 * Script de test pour l'API Firebase Admin Backend
 * Usage: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Test de l\'API Firebase Admin Backend\n');

  // Test 1: Health Check
  console.log('1️⃣ Test Health Check...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log('✅ Health:', data);
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    console.log('⚠️  Assurez-vous que le serveur est démarré (npm start)');
    return;
  }

  // Test 2: Vérifier le statut d'un utilisateur inexistant
  console.log('\n2️⃣ Test vérification statut (utilisateur inexistant)...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-status?email=test@example.com`);
    const data = await res.json();
    console.log('✅ Status:', data);
  } catch (err) {
    console.error('❌ Check status failed:', err.message);
  }

  // Test 3: Enregistrer des tentatives échouées
  console.log('\n3️⃣ Test enregistrement tentatives échouées...');
  const testEmail = 'test@example.com';
  
  for (let i = 1; i <= 4; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register-failed-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      console.log(`  Tentative ${i}:`, data);
      
      if (data.disabled) {
        console.log('  🔒 Compte bloqué!');
        break;
      }
    } catch (err) {
      console.error(`  ❌ Tentative ${i} failed:`, err.message);
    }
  }

  // Test 4: Vérifier le statut après blocage
  console.log('\n4️⃣ Test vérification statut (après blocage)...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-status?email=${testEmail}`);
    const data = await res.json();
    console.log('✅ Status:', data);
  } catch (err) {
    console.error('❌ Check status failed:', err.message);
  }

  // Test 5: Réinitialiser les tentatives
  console.log('\n5️⃣ Test réinitialisation tentatives...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/reset-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    console.log('✅ Reset:', data);
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  }

  // Test 6: Vérifier le statut après réinitialisation
  console.log('\n6️⃣ Test vérification statut (après réinitialisation)...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-status?email=${testEmail}`);
    const data = await res.json();
    console.log('✅ Status:', data);
  } catch (err) {
    console.error('❌ Check status failed:', err.message);
  }

  console.log('\n✨ Tests terminés!');
}

testAPI().catch(err => {
  console.error('💥 Erreur globale:', err);
});
