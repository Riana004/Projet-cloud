import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint, getDocs, doc, setDoc, getDoc, runTransaction, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  storageBucket: 'cloud-auth-2b3af.firebasestorage.app',
  messagingSenderId: '482327951103',
  appId: '1:482327951103:web:ef6b58ae5dcbfdd8083eca'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const FUNCTIONS_REGION = 'us-central1';
const functions = getFunctions(app, FUNCTIONS_REGION);
const FUNCTIONS_HTTP_BASE = `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net`;

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
      
      // Référence au statut
      id_statut: data.id_statut || null,
      
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
    
    // Mettre à jour le signalement
    await updateDoc(signalementDocRef, {
      id_statut: nouveauStatut,
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
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Références aux Cloud Functions
const disableUserFunction = httpsCallable(functions, 'disableUser');
const enableUserFunction = httpsCallable(functions, 'enableUser');
const checkStatusFunction = httpsCallable(functions, 'checkUserStatus');

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
      const attemptData: LoginAttempt = {
        email: normalizedEmail,
        attempts: nextAttempts,
        disabled: isDisabled,
        lastAttempt: Timestamp.now(),
        ...(isDisabled ? { blockedAt: Timestamp.now() } : {})
      };
      transaction.set(attemptRef, attemptData, { merge: true });
    });
    console.log(`📝 Tentative ${nextAttempts} enregistrée dans Firestore pour ${email}`);
  } catch (firestoreError: any) {
    console.error('❌ Erreur Firestore lors de l\'enregistrement:', firestoreError?.message || firestoreError);
    // Fallback local si Firestore échoue
    const current = getLocalAttempts(email);
    nextAttempts = current + 1;
    isDisabled = nextAttempts >= MAX_FAILED_ATTEMPTS;
    setLocalAttempts(email, nextAttempts);
  }

  // Désactiver réellement dans Firebase Authentication après 3 tentatives
  if (isDisabled) {
    try {
      console.log(`🔒 Désactivation du compte Firebase pour ${email} (tentatives: ${nextAttempts})...`);
      await callUpdateUserStatusHttp(email, true);
    } catch (error: any) {
      console.error('❌ Erreur Cloud Function désactivation (HTTP):', error?.message || error);
    }
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
    console.error('❌ Erreur Firestore lors de la réinitialisation:', firestoreError?.message || firestoreError);
    // Fallback local si Firestore échoue
    setLocalAttempts(email, 0);
  }

  // Réactiver dans Firebase Authentication si désactivé
  try {
    console.log(`🔓 Réactivation du compte Firebase pour ${email}...`);
    await callUpdateUserStatusHttp(email, false);
  } catch (error: any) {
    console.error('❌ Erreur Cloud Function réactivation (HTTP):', error?.message || error);
  }

  console.log(`✅ Tentatives réinitialisées pour ${email}`);
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
    console.warn('⚠️ Erreur lecture Firestore, utilisation localStorage:', firestoreError?.message);
    attempts = getLocalAttempts(email);
  }

  // Vérifier le statut dans Firebase Authentication
  try {
    const result = await checkStatusFunction({ email });
    const data = result.data as { success: boolean; disabled: boolean };
    const authDisabled = Boolean((data as any).disabled);
    // Utiliser la valeur la plus restrictive (disabled = true si l'un des deux est vrai)
    disabled = disabled || authDisabled;
    console.log(`🔍 Statut complet de ${email}:`, { disabled, attempts, authDisabled });
    return { disabled, attempts, exists: true };
  } catch (error: any) {
    // Si l'utilisateur n'existe pas côté Auth
    if (error?.code === 'functions/not-found') {
      return { disabled, attempts, exists: false };
    }
    console.error('❌ Erreur vérification statut Auth:', error?.message || error);
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
    const authDisabled = await callUpdateUserStatusHttp(email, disable);

    // Synchroniser dans Firestore
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

async function callUpdateUserStatusHttp(email: string, disable: boolean): Promise<boolean> {
  const response = await fetch(`${FUNCTIONS_HTTP_BASE}/updateUserStatusHttp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, disable })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }

  const payload = await response.json() as { disabled?: boolean };
  return Boolean(payload?.disabled ?? disable);
}

export { auth, db };


