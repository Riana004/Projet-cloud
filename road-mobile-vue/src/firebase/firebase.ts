import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint, getDocs, doc, setDoc, getDoc, runTransaction, updateDoc, Timestamp, query, where, connectFirestoreEmulator, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

/**
 * Interface pour suivre les tentatives de connexion
 */
export interface LoginAttempt {
  email: string;
  attempts: number;
  disabled: boolean;
  lastAttempt: Timestamp;
  blockedAt?: Timestamp;
}

const firebaseConfig = {
  apiKey: 'AIzaSyDDJ5Qc64SZnwGCRBShtbyHLYaGBweAwdk',
  authDomain: 'cloud-auth-2b3af.firebaseapp.com',
  projectId: 'cloud-auth-2b3af',
  storageBucket: 'cloud-auth-2b3af.appspot.com',
  messagingSenderId: '482327951103',
  appId: '1:482327951103:web:ef6b58ae5dcbfdd8083eca'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Note: Firebase Storage usage removed in favour of Cloudinary uploads.
// Messaging instance (for FCM web push)
let messaging: ReturnType<typeof getMessaging> | null = null;
// Maximum failed login attempts before blocking
const MAX_FAILED_ATTEMPTS = 3;
const FUNCTIONS_REGION = 'us-central1';
const functions = getFunctions(app, FUNCTIONS_REGION);
const FUNCTIONS_HTTP_BASE = `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net`;

// Cloudinary configuration (can be overridden via Vite env vars)
const CLOUDINARY_CLOUD_NAME = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) || 'dfabawwvp';
const CLOUDINARY_UPLOAD_PRESET = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET) || 'signalement';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

// Emulators: connect only when explicitly enabled via VITE_USE_FIREBASE_EMULATORS === 'true'
const USE_FIREBASE_EMULATORS = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.VITE_USE_FIREBASE_EMULATORS === 'true');
if (USE_FIREBASE_EMULATORS) {
  try {
    // Firestore emulator (port from firebase.json)
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('⚙️ Connected to Firestore emulator at localhost:8080');
  } catch (e) {
    console.warn('Could not connect to Firestore emulator:', e);
  }

  try {
    // Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('⚙️ Connected to Functions emulator at localhost:5001');
  } catch (e) {
    console.warn('Could not connect to Functions emulator:', e);
  }

  // Storage emulator disabled (Storage removed in favour of Cloudinary)
} else {
  // Ensure we don't attempt to contact local emulators in normal mode
  console.log('ℹ️ Firebase emulators not enabled (VITE_USE_FIREBASE_EMULATORS != true). Using production Firebase services.');
}

/**
 * Interface pour un signalement
 */
export interface Signalement {
  id_utilisateur: string;
  description: string;
  latitude: number;
  longitude: number;
  id_statut?: number | null;
  is_dirty?: boolean;
  surface: number;
  budget: number;
  entreprise_concerne: string;
}

/**
 * Crée un nouveau signalement dans Firebase Firestore
 * @param data - Les données du signalement à créer
 * @returns L'ID du document créé
 */
export async function createSignalement(data: Partial<Signalement>): Promise<string> {
  try {
    // Référence à la collection (elle sera créée si elle n'existe pas)
    const signalementsRef = collection(db, 'signalements');

    // Préparation du document selon le schéma SQL
    const nouveauSignalement = {
      id_utilisateur: data.id_utilisateur || auth.currentUser?.uid || '',
      description: data.description || '',
      
      // Utilisation du type Timestamp natif de Firebase
      date_signalement: serverTimestamp(),
      
      // Stockage optimisé pour la géolocalisation avec GeoPoint
      location: new GeoPoint(
        data.latitude || 0,
        data.longitude || 0
      ),
      
      // Latitude et longitude séparées (pour compatibilité)
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      
      // Référence au statut - défaut "EN_ATTENTE"
      id_statut: data.id_statut || 'EN_ATTENTE',
      statut: data.id_statut ? String(data.id_statut) : 'EN_ATTENTE', // Statut lisible
      
      is_dirty: data.is_dirty || false,
      updated_at: serverTimestamp(),
      
      // Conversion explicite en nombre
      surface: parseFloat(String(data.surface || 0)),
      budget: parseFloat(String(data.budget || 0)),
      entreprise_concerne: data.entreprise_concerne || ''
    };

    // Envoi à Firestore
    const docRef = await addDoc(signalementsRef, nouveauSignalement);
    
    console.log(' Signalement enregistré dans Firebase avec ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(' Erreur lors de la création du signalement Firebase:', error);
    throw error;
  }
}

/**
 * Récupère tous les signalements depuis Firebase Firestore
 * @returns Array de signalements
 */
export async function getAllSignalements(): Promise<any[]> {
  try {
    const signalementsRef = collection(db, 'signalements');
    const querySnapshot = await getDocs(signalementsRef);
    
    const signalements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Extraire latitude/longitude du GeoPoint
      latitude: doc.data().location?.latitude || 0,
      longitude: doc.data().location?.longitude || 0
    }));
    
    console.log('✅ Signalements chargés depuis Firebase:', signalements.length);
    return signalements;
  } catch (error) {
    console.error('❌ Erreur chargement signalements Firebase:', error);
    throw error;
  }
}

/**
 * Récupère les signalements de l'utilisateur actuel
 * @returns Array de signalements filtrés
 */
export async function getUserSignalements(): Promise<any[]> {
  try {
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    const q = query(
      collection(db, 'signalements'),
      where('id_utilisateur', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    const signalements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      latitude: doc.data().location?.latitude || 0,
      longitude: doc.data().location?.longitude || 0
    }));
    
    console.log('✅ Mes signalements chargés:', signalements.length);
    return signalements;
  } catch (error) {
    console.error('❌ Erreur chargement mes signalements:', error);
    throw error;
  }
}

/**
 * Interface pour une photo
 */
export interface Photo {
  id?: string;
  id_signalement: string;
  url: string;
  date_ajout?: Timestamp;
}

/**
 * Ajoute une photo à la table photos
 * @param signalementId - ID du signalement
 * @param photoUrl - URL de la photo uploadée
 * @returns ID du document photo
 */
export async function addPhotoToSignalement(
  signalementId: string,
  photoUrl: string
): Promise<string> {
  try {
    const photosRef = collection(db, 'photos');
    
    const photoData: Photo = {
      id_signalement: signalementId,
      url: photoUrl,
      date_ajout: serverTimestamp() as Timestamp,
    };
    
    const docRef = await addDoc(photosRef, photoData);
    console.log('✅ Photo ajoutée:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur ajout photo:', error);
    throw error;
  }
}

/**
 * Récupère toutes les photos d'un signalement
 * @param signalementId - ID du signalement
 * @returns Array de photos
 */
export async function getPhotosForSignalement(signalementId: string): Promise<Photo[]> {
  try {
    const q = query(
      collection(db, 'photos'),
      where('id_signalement', '==', signalementId)
    );
    
    const querySnapshot = await getDocs(q);
    const photos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
    
    console.log('✅ Photos récupérées:', photos.length);
    return photos;
  } catch (error) {
    console.error('❌ Erreur récupération photos:', error);
    throw error;
  }
}

/**
 * Supprime une photo
 * @param photoId - ID de la photo
 * @returns Promesse résolue quand la suppression est complète
 */
export async function deletePhoto(photoId: string): Promise<void> {
  try {
    const photosRef = collection(db, 'photos');
    const photoDocRef = doc(photosRef, photoId);
    
    await updateDoc(photoDocRef, {
      deleted_at: serverTimestamp()
    });
    
    console.log('✅ Photo supprimée (marquée)');
  } catch (error) {
    console.error('❌ Erreur suppression photo:', error);
    throw error;
  }
}

/**
 * Met à jour un signalement avec les photos
 * @param signalementId - ID du signalement
 * @param photoUrls - URLs des photos uploadées
 * @returns Promesse résolue quand la mise à jour est complète
 */
export async function updateSignalementWithPhotos(
  signalementId: string,
  photoUrls: string[]
): Promise<void> {
  try {
    console.log('📸 Début mise à jour photos pour signalement:', signalementId);
    console.log('📸 Nombre de photos à ajouter:', photoUrls?.length || 0);
    console.log('📸 URLs des photos:', photoUrls);

    const signalementsRef = collection(db, 'signalements');
    const signalementDocRef = doc(signalementsRef, signalementId);
    
    // Mettre à jour le signalement
    await updateDoc(signalementDocRef, {
      photos_count: photoUrls?.length || 0,
      updated_at: serverTimestamp()
    });
    
    console.log('✅ Document signalement mis à jour avec photos_count:', photoUrls?.length || 0);
    
    // Ajouter les photos à la table photos
    if (photoUrls && photoUrls.length > 0) {
      for (let i = 0; i < photoUrls.length; i++) {
        const url = photoUrls[i];
        console.log(`📸 Ajout photo ${i + 1}/${photoUrls.length}:`, url);
        const photoId = await addPhotoToSignalement(signalementId, url);
        console.log(`✅ Photo ${i + 1} ajoutée avec ID:`, photoId);
      }
    }
    
    console.log('✅ Signalement mis à jour avec photos:', photoUrls?.length || 0);
  } catch (error) {
    console.error('❌ Erreur mise à jour signalement:', error);
    throw error;
  }
}

/**
 * Interface pour un statut de signalement
 */
export interface StatutSignalement {
  id: string;
  signalementId: string;
  ancienStatut: string;
  nouveauStatut: string;
  dateChangement: Timestamp;
  raison?: string;
}

/**
 * Met à jour le statut d'un signalement
 * @param signalementId - ID du signalement
 * @param nouveauStatut - Nouveau statut
 * @param raison - Raison du changement (optionnel)
 * @returns Promesse résolue quand la mise à jour est complète
 */
export async function updateSignalementStatut(
  signalementId: string,
  nouveauStatut: string,
  raison?: string
): Promise<void> {
  try {
    const signalementsRef = collection(db, 'signalements');
    const signalementDocRef = doc(signalementsRef, signalementId);
    
    // Récupérer le signalement actuel
    const currentDoc = await getDoc(signalementDocRef);
    const currentData = currentDoc.data();
    const ancienStatut = currentData?.id_statut || 'EN_ATTENTE';
    
    // Mettre à jour le signalement (mettre à jour id_statut et statut lisible)
    await updateDoc(signalementDocRef, {
      id_statut: nouveauStatut,
      statut: String(nouveauStatut),
      updated_at: serverTimestamp()
    });
    
    // Ajouter un enregistrement du changement de statut
    const statusChangesRef = collection(db, 'statut_changes');
    await addDoc(statusChangesRef, {
      signalementId,
      ancienStatut,
      nouveauStatut,
      dateChangement: serverTimestamp(),
      raison: raison || '',
      userId: currentData?.id_utilisateur || ''
    });
    
    // Créer également une notification dans la collection `notifications`
    try {
      await createStatusNotification(signalementId, currentData?.id_utilisateur || '', nouveauStatut);
    } catch (notifErr) {
      console.warn('⚠️ Impossible de créer la notification via createStatusNotification:', notifErr);
    }

    console.log('✅ Statut mis à jour:', nouveauStatut);
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    throw error;
  }
}

/**
 * Envoie une notification de changement de statut
 * @param signalementId - ID du signalement
 * @param userId - ID de l'utilisateur
 * @param nouveauStatut - Nouveau statut
 * @returns Promesse résolue quand la notification est créée
 */
export async function createStatusNotification(
  signalementId: string,
  userId: string,
  nouveauStatut: string
): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    
    const statusMessages: { [key: string]: string } = {
      'EN_ATTENTE': 'Votre signalement est en attente de traitement',
      'EN_TRAITEMENT': 'Votre signalement est en traitement',
      'TRAITE': 'Votre signalement a été traité',
      'REJETE': 'Votre signalement a été rejeté',
      'CLOTURE': 'Votre signalement est clos',
    };
    
    const notificationData = {
      signalementId,
      userId,
      statut: nouveauStatut,
      message: statusMessages[nouveauStatut] || `Statut changé: ${nouveauStatut}`,
      timestamp: serverTimestamp(),
      isRead: false
    };
    
    const docRef = await addDoc(notificationsRef, notificationData);
    console.log('✅ Notification créée:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    throw error;
  }
}

/**
 * Récupère les notifications d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Array de notifications
 */
export async function getUserNotifications(userId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Notifications récupérées:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    throw error;
  }
}
/**
 * Auth helpers
 */
export async function signIn(email: string, password: string) {
  // Vérifier le statut (bloqué) avant tentative de connexion
  try {
    const status = await checkUserStatus(email);
    if (status.disabled) {
      const err = new Error('Compte bloqué après plusieurs tentatives. Contactez un administrateur.');
      (err as any).code = 'auth/too-many-requests';
      throw err;
    }
  } catch (checkErr) {
    // Si la vérification échoue pour une raison réseau, on laisse la tentative de connexion se faire,
    // mais on loggue l'erreur.
    console.warn('checkUserStatus failed before signIn:', checkErr);
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Connexion réussie -> log debug info then réinitialiser les tentatives
    try {
      // Debug: afficher l'utilisateur courant et les claims du token
      try {
        const user = auth.currentUser;
        console.log('Auth currentUser after signIn:', user ? { uid: user.uid, email: user.email } : null);
        if (user && (user as any).getIdTokenResult) {
          const idTokenResult = await (user as any).getIdTokenResult();
          console.log('Auth idTokenResult.claims:', idTokenResult?.claims);
        }
      } catch (dbgErr) {
        console.warn('Could not read idTokenResult after signIn:', dbgErr);
      }

      await resetLoginAttempts(email);
    } catch (e) { console.warn('resetLoginAttempts failed:', e); }
    return result;
  } catch (err: any) {
    // En cas d'échec, enregistrer une tentative
    try { await registerFailedLogin(email); } catch (e) { console.warn('registerFailedLogin failed:', e); }
    throw err;
  }
}

export async function signOutUser() {
  try {
    const token = (() => { try { return localStorage.getItem('fcm_token'); } catch { return null; } })();
    if (auth.currentUser && token) {
      await removeFcmToken(auth.currentUser.uid, token);
    }
  } catch (err) {
    console.warn('⚠️ Error removing FCM token at sign out:', err);
  }

  try {
    await signOut(auth);
  } finally {
    try { localStorage.removeItem('fcm_token'); } catch {}
  }
}

export function onAuthStateChangeListener(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Upload files to Cloudinary (unsigned preset) and attach URLs to a signalement
 */
export async function uploadFilesAndAttachToSignalement(signalementId: string, files: File[] | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // optional: organize uploads per signalement
    form.append('folder', `signalements/${signalementId}`);

    try {
      const res = await fetch(CLOUDINARY_API_URL, {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();
      const url = data.secure_url || data.url;
      if (!url) throw new Error('Cloudinary did not return a URL');
      uploadedUrls.push(url);
      console.log('✅ Uploaded to Cloudinary:', url);
    } catch (err) {
      console.error('❌ Cloudinary upload error:', err);
      // fail-fast: rethrow so caller can handle/report
      throw err;
    }
  }

  // Update Firestore records with the uploaded URLs
  try {
    await updateSignalementWithPhotos(signalementId, uploadedUrls);
  } catch (e) {
    console.warn('Erreur lors de la mise à jour du signalement avec les photos:', e);
  }

  return uploadedUrls;
}

/**
 * Initialize Firebase Cloud Messaging and return the FCM token
 */
export async function initMessaging(vapidKey: string): Promise<string | null> {
  try {
    messaging = getMessaging(app as any);
    const currentToken = await getToken(messaging, { vapidKey });
    return currentToken || null;
  } catch (err) {
    console.warn('FCM initialization failed:', err);
    return null;
  }
}

/**
 * Sauvegarde un token FCM dans Firestore lié à l'utilisateur
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  try {
    const tokensRef = collection(db, 'fcm_tokens');
    // document id combine userId + token fingerprint for idempotence
    const docId = `${userId}__${token.substring(0, 24)}`;
    await setDoc(doc(db, 'fcm_tokens', docId), {
      userId,
      token,
      createdAt: serverTimestamp(),
    }, { merge: true });
    try { localStorage.setItem('fcm_token', token); } catch {}
    console.log('✅ FCM token saved for', userId);
  } catch (err) {
    console.warn('⚠️ Could not save FCM token:', err);
  }
}

/**
 * Supprime le token FCM enregistré
 */
export async function removeFcmToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  try {
    const docId = `${userId}__${token.substring(0, 24)}`;
    await deleteDoc(doc(db, 'fcm_tokens', docId));
    console.log('✅ FCM token deleted for', userId);
    try { localStorage.removeItem('fcm_token'); } catch {}
  } catch (err) {
    console.warn('⚠️ Could not remove FCM token:', err);
  }
}

export function onForegroundMessageListener(callback: (payload: any) => void) {
  if (!messaging) messaging = getMessaging(app as any);
  return onMessage(messaging as any, (payload) => callback(payload));
}
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Note: Cloud Functions disabled in this environment (no Blaze billing).
// We manage block state via the `login_attempts` Firestore documents only.

// Gestion locale des tentatives sans Firestore
const attemptsKey = (email: string) => `login_attempts:${normalizeEmail(email)}`;
function getLocalAttempts(email: string): number {
  try {
    const raw = localStorage.getItem(attemptsKey(email));
    return Math.max(0, Number(raw || 0));
  } catch {
    return 0;
  }
}
function setLocalAttempts(email: string, attempts: number): void {
  try {
    localStorage.setItem(attemptsKey(email), String(Math.max(0, attempts)));
  } catch {
    // ignore storage errors
  }
}

export async function registerFailedLogin(email: string): Promise<{ attempts: number; disabled: boolean }> {
  if (!email) return { attempts: 0, disabled: false };

  const normalizedEmail = normalizeEmail(email);
  let nextAttempts = 0;
  let isDisabled = false;

  // Incrémenter dans Firestore (source de vérité)
  try {
    const attemptRef = doc(db, 'login_attempts', normalizedEmail);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(attemptRef);
      const currentAttempts = snap.exists() ? Number((snap.data() as LoginAttempt).attempts || 0) : 0;
      nextAttempts = currentAttempts + 1;
      isDisabled = nextAttempts >= MAX_FAILED_ATTEMPTS;
      // Do NOT set `disabled: true` from the client side - Firestore rules forbid it.
      // The client only records the number of attempts and timestamp. If the
      // account needs to be disabled at Auth level, an admin/cloud-function
      // should perform that using privileged credentials.
      const attemptData: LoginAttempt = {
        email: normalizedEmail,
        attempts: nextAttempts,
        disabled: false,
        lastAttempt: Timestamp.now()
      };
      transaction.set(attemptRef, attemptData, { merge: true });
    });
    console.log(`📝 Tentative ${nextAttempts} enregistrée dans Firestore pour ${email}`);
  } catch (firestoreError: any) {
    console.error('❌ Erreur Firestore lors de l\'enregistrement (no-local fallback):', firestoreError?.message || firestoreError);
    // Ne pas utiliser localStorage en fallback — on évite d'écrire localement
    // pour ne pas créer d'état bloquant hors ligne. Retourner sans incrémenter.
    nextAttempts = 0;
    isDisabled = false;
  }

    // If the number of attempts reached the threshold, the client records it
    // but does NOT set `disabled=true`. An admin or a Cloud Function with
    // Admin SDK privileges must perform the actual disable in Auth/Firestore.
    if (isDisabled) {
      console.warn(`User ${normalizedEmail} reached ${nextAttempts} attempts — admin action required to disable the account.`);
    }

  console.log(`🔒 Tentatives pour ${email}: ${nextAttempts}/${MAX_FAILED_ATTEMPTS}, Bloqué: ${isDisabled}`);
  return { attempts: nextAttempts, disabled: isDisabled };
}

export async function resetLoginAttempts(email: string): Promise<void> {
  if (!email) return;
  const normalizedEmail = normalizeEmail(email);

  // Réinitialiser dans Firestore (source de vérité)
  try {
    const attemptRef = doc(db, 'login_attempts', normalizedEmail);
    await setDoc(attemptRef, {
      email: normalizedEmail,
      attempts: 0,
      disabled: false,
      lastAttempt: Timestamp.now()
    }, { merge: true });
    console.log(`✅ Tentatives Firestore réinitialisées pour ${email}`);
  } catch (firestoreError: any) {
    console.error('❌ Erreur Firestore lors de la réinitialisation:', firestoreError?.code, firestoreError?.message, firestoreError);
    // Fallback local si Firestore échoue
    setLocalAttempts(email, 0);
  }

  // Note: We do not call Admin APIs here. Resetting the Firestore `login_attempts`
  // document is sufficient for client-side enforcement.

  // Final status logged above (success or error). No duplicate log here.
}

/**
 * Vérifie le statut d'un utilisateur (bloqué ou non)
 * @param email - L'email de l'utilisateur à vérifier
 * @returns Objet contenant le statut de l'utilisateur
 */
export async function checkUserStatus(email: string): Promise<{ disabled: boolean; attempts: number; exists: boolean }> {
  if (!email) return { disabled: false, attempts: 0, exists: false };

  const normalizedEmail = normalizeEmail(email);
  let attempts = 0;
  let disabled = false;

  // Vérifier d'abord dans Firestore
  try {
    const attemptRef = doc(db, 'login_attempts', normalizedEmail);
    const attemptDoc = await getDoc(attemptRef);
    if (attemptDoc.exists()) {
      const data = attemptDoc.data() as LoginAttempt;
      attempts = data.attempts || 0;
      disabled = data.disabled || false;
      console.log(`📊 Données Firestore pour ${email}:`, { attempts, disabled });
    }
  } catch (firestoreError: any) {
    console.warn('⚠️ Erreur lecture Firestore, ignorons les tentatives locales (client offline):', firestoreError?.message);
    // Ne pas utiliser les valeurs locales (localStorage) pour bloquer l'utilisateur
    // quand Firestore est inaccessible — sinon un état hors-ligne local peut
    // empêcher la connexion même si le compte est actif côté Auth.
    attempts = 0;
  }

  // Return result based on Firestore only. Auth-level disabled status can't be
  // checked here without server-side Admin privileges.
  // attemptDoc may be undefined if the try block failed, so compute exists safely
  try {
    // If we reached here normally and attemptDoc exists in scope, use it.
    // Otherwise fall back to false.
    // Note: redeclare a local reference by re-reading the doc reference is cheap.
    const checkRef = doc(db, 'login_attempts', normalizedEmail);
    const checkDoc = await getDoc(checkRef);
    return { disabled, attempts, exists: checkDoc.exists() };
  } catch {
    return { disabled, attempts, exists: false };
  }
}

/**
 * Désactive ou réactive un utilisateur via Cloud Functions
 * et synchronise le statut dans Firestore (login_attempts)
 */
export async function updateFirebaseUserStatus(email: string, disable: boolean): Promise<{ disabled: boolean; attempts: number }> {
  if (!email) return { disabled: false, attempts: 0 };

  const normalizedEmail = normalizeEmail(email);

  try {
    // Only update Firestore document to reflect the requested disabled state.
    const authDisabled = Boolean(disable);
    const attempts = authDisabled ? MAX_FAILED_ATTEMPTS : 0;
    await setDoc(doc(db, 'login_attempts', normalizedEmail), {
      email: normalizedEmail,
      attempts,
      disabled: authDisabled,
      lastAttempt: Timestamp.now(),
      ...(authDisabled ? { blockedAt: Timestamp.now() } : {})
    }, { merge: true });

    return { disabled: authDisabled, attempts };
  } catch (error: any) {
    console.error('❌ Erreur updateFirebaseUserStatus (HTTP):', error?.message || error);
    throw error;
  }
}

// Cloud Functions HTTP helper removed — not used when operating without Blaze.

export { auth, db, functions };


