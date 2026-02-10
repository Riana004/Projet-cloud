import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'
import { loadStatutSignallement, seedStatutSignallement, createAvancement, ensureInitialSeed, promoteCurrentUserToAdmin, createStatusDefaults, createExempleAvancement, testWrite, normalizeStatusValues, migrateAvancementLabels, createSampleAvancementsFor, onAuthStateChangeListener, auth, db } from './firebase/firebase'
import { applyStatusChange, startAvancementListener, stopAvancementListener, startSignalementListener, stopSignalementListener } from './firebase/firebase'

// Ionic CSS
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

// Leaflet CSS
import 'leaflet/dist/leaflet.css'

// App CSS
import './theme/variables.css'

const app = createApp(App);
app.use(IonicVue);
app.use(router);

// Wait for router to be ready before mounting (recommended with Ionic)
router.isReady().then(() => {
  app.mount('#app');
}).catch((err) => {
  console.error('Router failed to become ready:', err);
  // As a fallback attempt mount anyway
  try { app.mount('#app'); } catch (e) { console.error('Mount failed:', e); }
});

// NOTE: automatic seeding / loading and auto-start of listeners disabled
// per developer request — seeding and debug helpers were previously exposed
// on `window` during development and have been removed.

// Start/stop listeners automatically when auth state changes
onAuthStateChangeListener((user) => {
  // When a user signs in, automatically ensure the statut seed is loaded
  // and start the client-side listeners so in-app behavior can be tested
  // without manual console intervention.
    if (user) {
    // User signed in: start listeners and ensure seeds
    // Ensure status labels exist (no sample avancements)
    ensureInitialSeed(true).catch(e => console.warn('ensureInitialSeed failed:', e));
    // Start client-side emulation listeners
    try { startAvancementListener(); } catch (e) { console.warn('startAvancementListener failed:', e); }
    try { startSignalementListener(); } catch (e) { console.warn('startSignalementListener failed:', e); }
    // debug notification snapshot listener removed
  } else {
    // User signed out: stop listeners
    try { stopAvancementListener(); } catch (e) { /* ignore */ }
    try { stopSignalementListener(); } catch (e) { /* ignore */ }
    // cleanup of debug unsub removed
  }
});
