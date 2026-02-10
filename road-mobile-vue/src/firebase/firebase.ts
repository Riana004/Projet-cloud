import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, addDoc, serverTimestamp, GeoPoint, getDocs, doc, setDoc, getDoc, runTransaction, updateDoc, Timestamp, query, where, connectFirestoreEmulator, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { API_CONFIG } from '@/config';

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
const functions = getFunctions(app);

// Emulators: connect only when explicitly enabled via VITE_USE_FIREBASE_EMULATORS === 'true'
const USE_FIREBASE_EMULATORS = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.VITE_USE_FIREBASE_EMULATORS === 'true');

// Create Firestore instance. In production force long-polling to avoid QUIC/DNS
// network issues in some environments (helps with ERR_QUIC_PROTOCOL_ERROR).
const db = USE_FIREBASE_EMULATORS ? getFirestore(app) : initializeFirestore(app, { experimentalForceLongPolling: true });
// Note: Firebase Storage usage removed in favour of Cloudinary uploads.
// Messaging instance (for FCM web push)
let messaging: ReturnType<typeof getMessaging> | null = null;
// Maximum failed login attempts before blocking
const MAX_FAILED_ATTEMPTS = 3;

// Cloudinary configuration (can be overridden via Vite env vars)
const CLOUDINARY_CLOUD_NAME = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) || 'dfabawwvp';
const CLOUDINARY_UPLOAD_PRESET = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET) || 'signalement';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

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
  id_status_signalement?: number | string | null;
  is_dirty?: boolean;
  surface: number;
  budget: number;
  entreprise_concerne: string;
  prix_par_m2?: number;
  niveau?: number;
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
      
      // Référence au statut - défaut "NOUVEAU"
      id_status_signalement: data.id_status_signalement || 'NOUVEAU',
      
      is_dirty: data.is_dirty || false,
      updated_at: serverTimestamp(),
      
      // Conversion explicite en nombre
      surface: parseFloat(String(data.surface || 0)),
      budget: parseFloat(String(data.budget || 0)),
      entreprise_concerne: data.entreprise_concerne || '',
      prix_par_m2: data.prix_par_m2 ? parseFloat(String(data.prix_par_m2)) : null,
      niveau: data.niveau !== undefined && data.niveau !== null ? parseInt(String(data.niveau), 10) : 0
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
      longitude: doc.data().location?.longitude || 0,
      id_status_signalement: doc.data().id_status_signalement || doc.data().statut || 'NOUVEAU'
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
    const ancienStatut = currentData?.id_status_signalement || 'NOUVEAU';

    // Resolve provided nouveauStatut and existing ancienStatut to canonical IDs (accept labels too)
    const nouveauId = (await resolveStatusId(nouveauStatut)) || String(nouveauStatut || '');
    const ancienId = (await resolveStatusId(ancienStatut)) || String(ancienStatut || '');

    // Mettre à jour le signalement (mettre à jour id_status_signalement) with resolved ID
    await updateDoc(signalementDocRef, {
      id_status_signalement: nouveauId,
      updated_at: serverTimestamp()
    });

    // Ajouter un enregistrement du changement de statut dans la collection `avancement`
    // (utilisée pour les notifications et l'historique côté client)
    const avancementRef = collection(db, 'avancement');
    const avDocRef = await addDoc(avancementRef, {
      signalementId,
      ancien_statut_id: ancienId,
      nouveau_statut_id: nouveauId,
      date_modification: serverTimestamp(),
      raison: raison || '',
      userId: currentData?.id_utilisateur || ''
    });

    // Créer également une notification dans la collection `notifications`
    // en liant la notification à l'avancement créé (id_avancement) and referencing statut ids
    try {
      await createStatusNotification(avDocRef.id, signalementId, currentData?.id_utilisateur || '', ancienId, nouveauId);
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
  idAvancement: string,
  signalementId: string,
  userId: string,
  ancienStatutId: string,
  nouveauStatutId: string
): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const label = getStatusLabel(nouveauStatutId);
    const message = `Statut changé: ${label}`;
    const notificationData = {
      id_avancement: idAvancement,
      signalementId,
      userId: userId || auth.currentUser?.uid || '',
      ancien_statut_id: ancienStatutId || null,
      nouveau_statut_id: nouveauStatutId || null,
      message,
      timestamp: serverTimestamp(),
      isRead: false
    } as any;

    const docRef = await addDoc(notificationsRef, notificationData);
    console.log('✅ Notification créée:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    throw error;
  }
}

/**
 * Retourne un libellé lisible pour une clé de statut.
 * Accepte les clés string (ex. 'NOUVEAU') ou renvoie la valeur telle quelle.
 */
export function getStatusLabel(statusKey: any): string {
  // If we've loaded dynamic statut labels from Firestore, prefer them
  try {
    if (statusKey === null || statusKey === undefined) return 'Nouveau';
    const key = String(statusKey);
    if (statutSignalementMap && Object.prototype.hasOwnProperty.call(statutSignalementMap, key)) {
      return statutSignalementMap[key];
    }
    const labels: Record<string, string> = {
      'Nouveau': 'Nouveau',
      'En cours': 'En cours',
      'Resolu': 'Resolu',
      'Rejete': 'Rejete'
    };
    return labels[key] || key;
  } catch {
    return String(statusKey || 'Nouveau');
  }
}

// In-memory cache for statut_signallement collection (key -> label)
let statutSignalementMap: Record<string, string> = {};

/**
 * Resolve a status value (could be an ID like 'NOUVEAU' or a label 'Nouveau')
 * to the canonical statut ID stored in `statut_signallement`.
 * Returns the ID string or null if not resolvable.
 */
export async function resolveStatusId(value: any): Promise<string | null> {
  if (value == null) return null;
  const s = String(value);

  // If cache empty, try load
  if (!statutSignalementMap || Object.keys(statutSignalementMap).length === 0) {
    try { await loadStatutSignallement(); } catch {}
  }

  // If value already an ID present in map, return it
  if (statutSignalementMap && Object.prototype.hasOwnProperty.call(statutSignalementMap, s)) {
    return s;
  }

  // Try to match by label (case-insensitive)
  const lower = s.toLowerCase();
  for (const [id, label] of Object.entries(statutSignalementMap || {})) {
    if (String(label).toLowerCase() === lower) return id;
  }

  // Fallback: query Firestore for a document where label or statut matches
  try {
    const col = collection(db, 'statut_signallement');
    const q1 = query(col, where('label', '==', s));
    const q2 = query(col, where('statut', '==', s));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const d = snap1.docs[0];
      statutSignalementMap[d.id] = d.data().label || d.data().statut || d.id;
      return d.id;
    }
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const d = snap2.docs[0];
      statutSignalementMap[d.id] = d.data().label || d.data().statut || d.id;
      return d.id;
    }
  } catch (e) {
    console.warn('resolveStatusId query failed:', e);
  }

  // Not found
  return null;
}

/**
 * Charge la collection `statut_signallement` depuis Firestore et met en cache
 */
export async function loadStatutSignallement(): Promise<void> {
  try {
    const col = collection(db, 'statut_signallement');
    const snap = await getDocs(col);
    const map: Record<string, string> = {};
    snap.docs.forEach(d => {
      const data = d.data() as any;
      // If doc id is a meaningful key, use it; otherwise look for `statut` or `label` field
      const key = d.id;
      const label = (data.label || data.statut || key) as string;
      map[key] = label;
    });
    statutSignalementMap = map;
    console.log('✅ statut_signallement loaded:', Object.keys(map).length);
  } catch (err) {
    console.warn('⚠️ Impossible de charger statut_signallement:', err);
    statutSignalementMap = {};
  }
}

/**
 * Seed the `statut_signallement` collection with given key/label pairs.
 * Example input: [{ key: 'NOUVEAU', label: 'Nouveau' }, ...]
 */
export async function seedStatutSignallement(items: Array<{ key: string; label: string }>): Promise<void> {
  try {
    const col = collection(db, 'statut_signallement');
    for (const it of items) {
      const docRef = doc(col, it.key);
      await setDoc(docRef, { label: it.label, createdAt: serverTimestamp() });
    }
    // reload cache
    await loadStatutSignallement();
    console.log('✅ Seed statut_signallement complete');
  } catch (err) {
    console.error('❌ seedStatutSignallement failed:', err);
    throw err;
  }
}

/**
 * Ensure initial seed of `statut_signallement` and optional sample `avancement`.
 * If collections already contain documents, does nothing for that collection.
 * @param seedSampleAvancement - when true, create a few sample avancement docs if none exist
 */
export async function ensureInitialSeed(seedSampleAvancement = false): Promise<void> {
  try {
    // Load current labels first
    await loadStatutSignallement();

    // If statut_signallement is empty, seed defaults
    if (!statutSignalementMap || Object.keys(statutSignalementMap).length === 0) {
      await createStatusDefaults();
    } else {
      console.log('ℹ️ statut_signallement already present, skipping seed');
    }

    if (seedSampleAvancement) {
      // Check if avancement collection has any docs
      try {
        const avCol = collection(db, 'avancement');
        const snap = await getDocs(avCol);
        if (snap.empty) {
          console.log('ℹ️ No avancement docs found, creating sample avancement entries');
          // Ensure default statut docs exist before creating samples
          await createStatusDefaults();
          // Create a couple of sample avancement entries with placeholder signalement IDs
          await createAvancement('sample-1', 'NOUVEAU', 'EN_COURS', 'Seed sample', 'system');
          await createAvancement('sample-1', 'EN_COURS', 'RESOLU', 'Seed sample', 'system');
          // Also create sample avancements for the provided real signalement id
          try {
            const providedId = 'VO418lddQtgraDgkiCQi';
            const r = await createSampleAvancementsFor(providedId);
            console.log('ℹ️ createSampleAvancementsFor result for', providedId, r);
          } catch (sErr) {
            console.warn('⚠️ createSampleAvancementsFor failed for provided id:', sErr);
          }
          // Immediately migrate any existing label-based values to canonical IDs for the sample
          try {
            const migrateRes = await migrateAvancementLabels('sample-1');
            console.log('ℹ️ migrateAvancementLabels result for sample-1:', migrateRes);
          } catch (mErr) {
            console.warn('⚠️ migrateAvancementLabels failed for sample-1:', mErr);
          }
          console.log('✅ Sample avancement entries created');
        } else {
          console.log('ℹ️ avancement collection already contains documents, skipping sample creation');
        }
      } catch (e) {
        console.warn('⚠️ Could not verify/create sample avancement:', e);
      }
    }
  } catch (err) {
    console.warn('⚠️ ensureInitialSeed failed:', err);
  }
}

/**
 * Create default statut_signallement documents if they are missing.
 * Idempotent: does nothing if at least one of the expected keys exists.
 */
export async function createStatusDefaults(): Promise<void> {
  try {
    const col = collection(db, 'statut_signallement');
    const snap = await getDocs(col);
    // If collection already has documents, check for expected keys
    const expectedKeys = ['NOUVEAU', 'EN_COURS', 'RESOLU', 'REJETE'];
    const existingKeys = new Set(snap.docs.map(d => d.id));
    const missing = expectedKeys.filter(k => !existingKeys.has(k));
    if (missing.length === 0) {
      console.log('ℹ️ statut_signallement already contains expected keys, skipping creation');
      await loadStatutSignallement();
      return;
    }
    console.log('ℹ️ Creating missing statut_signallement keys:', missing);
    const defaults = {
      NOUVEAU: 'Nouveau',
      EN_COURS: 'En cours',
      RESOLU: 'Résolu',
      REJETE: 'Rejeté'
    } as Record<string, string>;
    for (const k of missing) {
      const docRef = doc(col, k);
      await setDoc(docRef, { label: defaults[k], createdAt: serverTimestamp() }, { merge: true });
      console.log('  created statut_signallement/', k);
    }
    await loadStatutSignallement();
    console.log('✅ createStatusDefaults complete');
  } catch (err) {
    console.warn('⚠️ createStatusDefaults failed:', err);
    throw err;
  }
}

/**
 * Create example avancement documents if the collection is empty.
 * Idempotent: does nothing if any avancement documents exist.
 */
export async function createExempleAvancement(): Promise<void> {
  try {
    const avCol = collection(db, 'avancement');
    const snap = await getDocs(avCol);
    if (!snap.empty) {
      console.log('ℹ️ avancement collection already has documents, skipping sample creation');
      return;
    }
    console.log('ℹ️ Creating sample avancement documents');
    // Using createAvancement which also creates linked notifications
    await createAvancement('sample-1', 'NOUVEAU', 'EN_COURS', 'Seed sample', 'system');
    await createAvancement('sample-1', 'EN_COURS', 'RESOLU', 'Seed sample', 'system');
    await createAvancement('sample-2', 'NOUVEAU', 'REJETE', 'Seed sample', 'system');
    console.log('✅ createExempleAvancement complete');
  } catch (err) {
    console.warn('⚠️ createExempleAvancement failed:', err);
    throw err;
  }
}

/**
 * Create sample avancement entries for a specific signalement ID and migrate labels to IDs.
 * Useful to insert examples for a real user's signalement.
 */
export async function createSampleAvancementsFor(signalementId: string): Promise<{ created: string[]; migrated?: any }> {
  if (!signalementId) throw new Error('signalementId is required');
  try {
    // Ensure statut defaults exist
    await createStatusDefaults();
    const created: string[] = [];
    created.push(await createAvancement(signalementId, 'NOUVEAU', 'EN_COURS', 'Seed sample', 'system'));
    created.push(await createAvancement(signalementId, 'EN_COURS', 'RESOLU', 'Seed sample', 'system'));
    // Migrate any label strings to canonical IDs for this signalement
    const migrated = await migrateAvancementLabels(signalementId);
    return { created, migrated };
  } catch (err) {
    console.error('createSampleAvancementsFor failed:', err);
    throw err;
  }
}

/**
 * Client-side helper to apply a status change for a signalement without Cloud Functions.
 * - Resolves status key/label to ID
 * - Updates signalement.id_status_signalement
 * - Creates an `avancement` record and a linked `notification` via `createAvancement`
 * Use this when you can't deploy Cloud Functions (dev/local).
 */
export async function applyStatusChange(signalementId: string, nouveauStatutKey: any, raison?: string): Promise<{ avancementId?: string }> {
  if (!signalementId) throw new Error('signalementId required');
  try {
    // resolve nouveau statut to ID
    const nouveauId = (await resolveStatusId(nouveauStatutKey)) || String(nouveauStatutKey || '');

    // call existing update flow which updates signalement and records avancement
    await updateSignalementStatut(signalementId, nouveauId, raison);

    // find last avancement created for this signalement with this nouveauId
    try {
      const avCol = collection(db, 'avancement');
      const q = query(avCol, where('signalementId', '==', signalementId));
      const snap = await getDocs(q);
      // pick most recent by date_modification if present
      let recent: any = null;
      for (const d of snap.docs) {
        const data = d.data() as any;
        if (data.nouveau_statut_id === nouveauId) {
          if (!recent) recent = { id: d.id, data };
          else {
            const a = data.date_modification as any;
            const b = recent.data.date_modification as any;
            if ((a && b && a.toMillis && b.toMillis && a.toMillis() > b.toMillis()) || (!recent)) recent = { id: d.id, data };
          }
        }
      }
      return { avancementId: recent ? recent.id : undefined };
    } catch (e) {
      return { };
    }
  } catch (err) {
    console.error('applyStatusChange failed:', err);
    throw err;
  }
}

let _avancementUnsubscribe: (() => void) | null = null;

/**
 * Start a client-side listener on `avancement` collection that logs changes
 * and ensures signalement + notification are created when `nouveau_statut_id` appears or changes.
 * Useful when Cloud Functions are not deployed.
 */
export function startAvancementListener(): void {
  if (_avancementUnsubscribe) {
    console.log('Avancement listener already running');
    return;
  }
  const col = collection(db, 'avancement');
  _avancementUnsubscribe = onSnapshot(col, async (snapshot) => {
    console.log('Avancement listener snapshot —', snapshot.docChanges().length, 'changes');
    for (const change of snapshot.docChanges()) {
      const type = change.type; // 'added' | 'modified' | 'removed'
      const id = change.doc.id;
      const data = change.doc.data() as any;
      console.log(`Avancement ${type}:`, id, data);

      if (type === 'removed') continue;
      try {
        const nouveau = data.nouveau_statut_id || data.nouveauStatut || data.nouveau_statut || null;
        const signalementId = data.signalementId || data.signalement_id || null;

        // Determine current user and whether they are admin (to respect security rules)
        const currentUid = auth.currentUser?.uid || null;
        let currentUserIsAdmin = false;
        if (currentUid) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUid));
            if (userDoc.exists()) {
              const u = userDoc.data() as any;
              currentUserIsAdmin = u?.role === 'admin';
            }
          } catch (e) {
            console.warn('Could not read current user document to determine admin role:', e);
          }
        }

        // Pre-fetch signalement owner to use for update and notification decisions
        let sigData: any = null;
        let ownerUid: string | null = null;
        if (signalementId) {
          try {
            const sigDoc = await getDoc(doc(db, 'signalements', signalementId));
            if (sigDoc.exists()) {
              sigData = sigDoc.data();
              ownerUid = sigData?.id_utilisateur || sigData?.userId || null;
            }
          } catch (e) {
            console.warn('Could not read signalement to determine owner for avancement handling:', e);
          }
        }

        // Update signalement id_status_signalement if nouveau present AND current user is allowed
        if (signalementId && nouveau) {
          try {
            if (ownerUid && (ownerUid === currentUid || currentUserIsAdmin)) {
              // Mark this signalement as being updated by the avancement listener
              // so the signalement listener can ignore the resulting snapshot.
              try {
                _signalementSkipSet.add(signalementId);
              } catch (e) {
                /* ignore */
              }
              await setDoc(doc(db, 'signalements', signalementId), { id_status_signalement: nouveau, updated_at: serverTimestamp() }, { merge: true });
              console.log('Updated signalement', signalementId, '->', nouveau);
              // Safety: remove skip marker after a short timeout in case the other
              // listener missed it for any reason.
              setTimeout(() => { try { _signalementSkipSet.delete(signalementId); } catch (e) { /* ignore */ } }, 5000);
            } else {
              console.log('Skipping signalement update for', signalementId, 'not owned by current user');
            }
          } catch (uErr) {
            console.warn('Could not update signalement due to permission or read error:', uErr);
          }
        }

        // Ensure notification exists for this avancement
        // Note: Firestore security rules restrict reading notifications to the
        // notification owner (userId). To avoid "Missing or insufficient permissions"
        // we only query/create notifications for the current authenticated user.
        const notCol = collection(db, 'notifications');

        // Only attempt to read/create a notification when the signalement owner matches
        // the signed-in user (we derive owner from the signalement).
        if (currentUid && ownerUid && currentUid === ownerUid) {
          const q = query(notCol, where('id_avancement', '==', id), where('userId', '==', currentUid));
          const existing = await getDocs(q);
          if (existing.empty) {
            const statusMessages: { [key: string]: string } = {
              'NOUVEAU': 'Votre signalement est nouveau',
              'EN_COURS': 'Votre signalement est en cours de traitement',
              'RESOLU': 'Votre signalement a été résolu',
              'REJETE': 'Votre signalement a été rejeté'
            };
            const notificationData: any = {
              id_avancement: id,
              signalementId: signalementId || null,
              userId: currentUid,
              ancien_statut_id: data.ancien_statut_id || null,
              nouveau_statut_id: nouveau || null,
              message: statusMessages[nouveau] || `Statut changé: ${nouveau}`,
              timestamp: serverTimestamp(),
              isRead: false
            };
            const nr = await addDoc(notCol, notificationData);
            console.log('Created notification', nr.id, 'for avancement', id);
          } else {
            // If a notification for this avancement already exists, update it
            // so the user receives an unread update instead of creating a duplicate.
            try {
              for (const nd of existing.docs) {
                const notifRef = doc(notCol, nd.id);
                const newMsg = (data && data.nouveau_statut_id) ? getStatusLabel(data.nouveau_statut_id) : (nouveau || 'Statut changé');
                await updateDoc(notifRef, {
                  nouveau_statut_id: nouveau || null,
                  ancien_statut_id: data.ancien_statut_id || null,
                  message: data.message || (`Statut changé: ${newMsg}`),
                  timestamp: serverTimestamp(),
                  isRead: false
                });
                console.log('Updated notification', nd.id, 'for avancement', id);
              }
            } catch (uErr) {
              console.warn('Could not update existing notification for avancement', id, uErr);
            }
          }
        } else {
          // Skip creating notifications for other users in client-side listener.
          console.log('Skipping notification creation for avancement', id, 'not owned by current user');
        }
      } catch (e) {
        console.error('Error handling avancement change', id, e);
      }
    }
  }, (err) => {
    console.error('Avancement listener error:', err);
  });
  console.log('Avancement listener started');
}

export function stopAvancementListener(): void {
  if (_avancementUnsubscribe) {
    _avancementUnsubscribe();
    _avancementUnsubscribe = null;
    console.log('Avancement listener stopped');
  } else console.log('Avancement listener not running');
}

// Signalement listener (temporary client-side replacement for Cloud Function)
let _signalementUnsubscribe: (() => void) | null = null;
// Local cache of last-seen id_status_signalement per signalement id
const _signalementStatusCache: Record<string, any> = {};
// Set of signalement IDs that should be ignored by the signalement listener
// because they were updated by the avancement listener. This prevents
// a write loop where signalement->avancement->signalement cycles occur.
const _signalementSkipSet: Set<string> = new Set();

export function startSignalementListener(): void {
  if (_signalementUnsubscribe) {
    console.log('Signalement listener already running');
    return;
  }
  const col = collection(db, 'signalements');
  // initialize cache with current values
  getDocs(col).then(snap => {
    snap.docs.forEach(d => {
      const data = d.data() as any;
      _signalementStatusCache[d.id] = data.id_status_signalement || null;
    });
    console.log('Signalement cache primed:', Object.keys(_signalementStatusCache).length);
  }).catch(err => console.warn('Could not prime signalement cache:', err));

  _signalementUnsubscribe = onSnapshot(col, async (snapshot) => {
    console.log('Signalement listener snapshot —', snapshot.docChanges().length, 'changes');
    for (const change of snapshot.docChanges()) {
      const id = change.doc.id;
      const data = change.doc.data() as any;
      const newStatus = data.id_status_signalement || null;
      const oldStatus = _signalementStatusCache[id] || null;
      if (change.type === 'removed') {
        delete _signalementStatusCache[id];
        continue;
      }
      if (change.type === 'added') {
        _signalementStatusCache[id] = newStatus;
        continue;
      }

      // For modified documents, if status changed create an avancement
      if (change.type === 'modified') {
        if (String(oldStatus || '') !== String(newStatus || '')) {
          // If this signalement was recently updated by our avancement listener,
          // skip creating a new avancement to avoid an infinite loop.
          if (_signalementSkipSet.has(id)) {
            console.log('Skipping avancement creation for', id, 'because update originated from avancement listener');
            // update cache and remove the skip marker
            _signalementStatusCache[id] = newStatus;
            _signalementSkipSet.delete(id);
            continue;
          }
          console.log('Detected status change for', id, oldStatus, '->', newStatus);
          try {
            // create avancement documenting the change (client-side)
            await createAvancement(id, oldStatus || 'NOUVEAU', newStatus || '', 'Auto from signalement change', data.id_utilisateur || data.userId || null);
            console.log('Created avancement for signalement', id);
          } catch (e) {
            console.warn('Could not create avancement for', id, e);
          }
          // update cache
          _signalementStatusCache[id] = newStatus;
        }
      }
    }
  }, (err) => {
    console.error('Signalement listener error:', err);
  });
  console.log('Signalement listener started');
}

export function stopSignalementListener(): void {
  if (_signalementUnsubscribe) {
    _signalementUnsubscribe();
    _signalementUnsubscribe = null;
    console.log('Signalement listener stopped');
  } else console.log('Signalement listener not running');
}

/**
 * Test write permission to a collection by creating and deleting a temporary document.
 * Returns an object { ok: boolean, error?: string }
 */
export async function testWrite(collectionName: string): Promise<any> {
  try {
    const col = collection(db, collectionName);
    const tmpRef = doc(col, `__perm_test__${Date.now()}`);
    await setDoc(tmpRef, { test: true, createdAt: serverTimestamp() });
    await deleteDoc(tmpRef);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err), details: err };
  }
}

/**
 * Normalize status fields across collections: convert human labels to statut IDs
 * Scans `statut_signallement` to build a label->id map, then updates documents
 * in `signalements`, `avancement`, and `notifications` where a label was stored
 * instead of an ID. Idempotent: only updates when a mapping is found.
 */
export async function normalizeStatusValues(): Promise<{ updated: number; details?: any[] }> {
  try {
    // Load statut_signallement map (id -> label)
    const col = collection(db, 'statut_signallement');
    const snap = await getDocs(col);
    const idToLabel: Record<string, string> = {};
    snap.docs.forEach(d => { const data = d.data() as any; idToLabel[d.id] = data.label || data.statut || d.id; });

    // Invert to label -> id (case-insensitive)
    const labelToId: Record<string, string> = {};
    Object.keys(idToLabel).forEach(id => { labelToId[String(idToLabel[id]).toLowerCase()] = id; });

    const updates: any[] = [];
    let updatedCount = 0;

    // Helper to try convert a value (if it's a label) to id
    const toId = (val: any) => {
      if (val == null) return null;
      const s = String(val);
      if (idToLabel[s] !== undefined) return s; // already an id
      const mapped = labelToId[s.toLowerCase()];
      return mapped || null;
    };

    // signalements: normalize id_status_signalement if it's a label
    try {
      const sigCol = collection(db, 'signalements');
      const sigSnap = await getDocs(sigCol);
      for (const d of sigSnap.docs) {
        const data = d.data() as any;
        const cur = data.id_status_signalement || null;
        const mapped = toId(cur);
        if (mapped && mapped !== cur) {
          await updateDoc(doc(sigCol, d.id), { id_status_signalement: mapped });
          updates.push({ collection: 'signalements', id: d.id, from: cur, to: mapped });
          updatedCount++;
        }
      }
    } catch (e) {
      console.warn('normalizeStatusValues: signalements scan failed', e);
    }

    // avancement: convert ancien_statut_id / nouveau_statut_id if necessary
    try {
      const avCol = collection(db, 'avancement');
      const avSnap = await getDocs(avCol);
      for (const d of avSnap.docs) {
        const data = d.data() as any;
        const ancien = data.ancien_statut_id || data.ancienStatut || null;
        const nouveau = data.nouveau_statut_id || data.nouveauStatut || null;
        const ancienId = toId(ancien);
        const nouveauId = toId(nouveau);
        const toSet: any = {};
        let changed = false;
        if (ancienId && ancienId !== ancien) { toSet.ancien_statut_id = ancienId; changed = true; }
        if (nouveauId && nouveauId !== nouveau) { toSet.nouveau_statut_id = nouveauId; changed = true; }
        if (changed) {
          await updateDoc(doc(avCol, d.id), toSet);
          updates.push({ collection: 'avancement', id: d.id, from: { ancien, nouveau }, to: toSet });
          updatedCount++;
        }
      }
    } catch (e) { console.warn('normalizeStatusValues: avancement scan failed', e); }

    // notifications: convert ancien_statut_id / nouveau_statut_id or statut field
    try {
      const notCol = collection(db, 'notifications');
      const notSnap = await getDocs(notCol);
      for (const d of notSnap.docs) {
        const data = d.data() as any;
        const ancien = data.ancien_statut_id || data.ancienStatut || null;
        const nouveau = data.nouveau_statut_id || data.nouveauStatut || data.statut || null;
        const ancienId = toId(ancien);
        const nouveauId = toId(nouveau);
        const toSet: any = {};
        let changed = false;
        if (ancienId && ancienId !== ancien) { toSet.ancien_statut_id = ancienId; changed = true; }
        if (nouveauId && nouveauId !== nouveau) { toSet.nouveau_statut_id = nouveauId; changed = true; }
        if (changed) {
          await updateDoc(doc(notCol, d.id), toSet);
          updates.push({ collection: 'notifications', id: d.id, from: { ancien, nouveau }, to: toSet });
          updatedCount++;
        }
      }
    } catch (e) { console.warn('normalizeStatusValues: notifications scan failed', e); }

    return { updated: updatedCount, details: updates };
  } catch (err) {
    console.error('normalizeStatusValues failed:', err);
    throw err;
  }
}

/**
 * Migrate `avancement` documents replacing ancien/nouveau statut labels with statut document IDs.
 * If `signalementId` is provided, only migrates avancement docs for that signalement.
 */
export async function migrateAvancementLabels(signalementId?: string): Promise<{ updated: number; details?: any[] }> {
  try {
    // Ensure we have the statut map
    await loadStatutSignallement();
    // Build id->label and label->id maps
    const idToLabel: Record<string, string> = {};
    Object.entries(statutSignalementMap || {}).forEach(([id, label]) => idToLabel[id] = label);
    const labelToId: Record<string, string> = {};
    Object.keys(idToLabel).forEach(id => { labelToId[String(idToLabel[id]).toLowerCase()] = id; });

    const toId = (val: any) => {
      if (val == null) return null;
      const s = String(val);
      if (idToLabel[s] !== undefined) return s; // already an id
      const mapped = labelToId[s.toLowerCase()];
      return mapped || null;
    };

    const avCol = collection(db, 'avancement');
    let q = avCol as any;
    if (signalementId) q = query(avCol, where('signalementId', '==', signalementId));
    const snap = await getDocs(q);
    const updates: any[] = [];
    let updated = 0;
    for (const d of snap.docs) {
      const data = d.data() as any;
      const ancien = data.ancien_statut_id || data.ancienStatut || null;
      const nouveau = data.nouveau_statut_id || data.nouveauStatut || null;
      const ancienId = toId(ancien);
      const nouveauId = toId(nouveau);
      const toSet: any = {};
      let changed = false;
      if (ancienId && ancienId !== ancien) { toSet.ancien_statut_id = ancienId; changed = true; }
      if (nouveauId && nouveauId !== nouveau) { toSet.nouveau_statut_id = nouveauId; changed = true; }
      if (changed) {
        await updateDoc(doc(avCol, d.id), toSet);
        updates.push({ id: d.id, from: { ancien, nouveau }, to: toSet });
        updated++;
      }
    }
    return { updated, details: updates };
  } catch (err) {
    console.error('migrateAvancementLabels failed:', err);
    throw err;
  }
}

/**
 * Promote the currently signed-in user to admin by writing users/{uid}.role = 'admin'.
 * Use only for local/dev testing. Requires the user to be authenticated.
 */
export async function promoteCurrentUserToAdmin(): Promise<void> {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user');
    const uid = auth.currentUser.uid;
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true });
    console.log('✅ Current user promoted to admin (users/' + uid + ')');
  } catch (err) {
    console.error('❌ promoteCurrentUserToAdmin failed:', err);
    throw err;
  }
}

/**
 * Create an `avancement` document (status change) and a linked notification.
 * Returns the avancement document id.
 */
export async function createAvancement(
  signalementId: string,
  ancienStatutKey: string,
  nouveauStatutKey: string,
  raison?: string,
  userId?: string
): Promise<string> {
  try {
    const avancementRef = collection(db, 'avancement');
    // resolve keys/labels to canonical IDs
    const ancienId = (await resolveStatusId(ancienStatutKey)) || String(ancienStatutKey || '');
    const nouveauId = (await resolveStatusId(nouveauStatutKey)) || String(nouveauStatutKey || '');

    // Determine the userId from the signalement owner when possible.
    let ownerUid: string | null = null;
    try {
      const sigDoc = await getDoc(doc(db, 'signalements', signalementId));
      if (sigDoc.exists()) {
        const sd = sigDoc.data() as any;
        ownerUid = sd?.id_utilisateur || sd?.userId || null;
      }
    } catch (e) {
      console.warn('createAvancement: could not read signalement to determine owner:', e);
    }

    const docRef = await addDoc(avancementRef, {
      signalementId,
      ancien_statut_id: ancienId,
      nouveau_statut_id: nouveauId,
      date_modification: serverTimestamp(),
      raison: raison || '',
      // Prefer signalement owner; fallback to provided userId or auth user
      userId: ownerUid || userId || auth.currentUser?.uid || ''
    });

    // create notification linked to this avancement and reference statut ids
    try {
      // Prefer the signalement owner UID when available so the notification
      // is delivered to the correct user (avoid empty userId causing UI filters to miss it).
      const notifUserId = ownerUid || userId || auth.currentUser?.uid || '';
      await createStatusNotification(docRef.id, signalementId, notifUserId, ancienId, nouveauId);
    } catch (notifErr) {
      console.warn('⚠️ createStatusNotification failed for avancement:', notifErr);
    }

    console.log('✅ Avancement created:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error('❌ createAvancement failed:', err);
    throw err;
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
  try {
    // Vérifier le statut (bloqué) avant tentative
    const status = await checkUserStatus(email);
    if (status.disabled) {
      const err = new Error('Compte bloqué après plusieurs tentatives. Contactez un administrateur.');
      (err as any).code = 'auth/too-many-requests';
      throw err;
    }

    // Tentative de connexion
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // ✅ Login réussi - réinitialiser les tentatives
    try {
      await resetLoginAttempts(email);
    } catch (e) { 
      console.warn('resetLoginAttempts failed:', e); 
    }
    
    return result;
  } catch (err: any) {
    // ❌ Login échoué - enregistrer une tentative
    try { 
      await registerFailedLogin(email); 
    } catch (e) { 
      console.warn('registerFailedLogin failed:', e); 
    }
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

export async function registerFailedLogin(email: string): Promise<{ attempts: number; disabled: boolean }> {
  if (!email) return { attempts: 0, disabled: false };

  try {
    // Appeler le backend qui gère todo : Firebase Auth + Firestore logs
    const response = await fetch(`${API_CONFIG.FIREBASE_ADMIN_URL}/api/auth/register-failed-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'Failed to register login attempt');
    }

    const result = await response.json();
    console.log(`📝 Tentative enregistrée: ${result.attempts}/${MAX_FAILED_ATTEMPTS}`);
    
    return {
      attempts: result.attempts || 0,
      disabled: result.blocked || false
    };
  } catch (error: any) {
    console.error('❌ Erreur registerFailedLogin:', error?.message);
    return { attempts: 0, disabled: false };
  }
}

export async function resetLoginAttempts(email: string): Promise<void> {
  if (!email) return;

  try {
    const response = await fetch(`${API_CONFIG.FIREBASE_ADMIN_URL}/api/auth/reset-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('⚠️ Backend error:', error);
      return;
    }

    console.log(`✅ Tentatives réinitialisées pour ${email}`);
  } catch (error: any) {
    console.warn('⚠️ Erreur resetLoginAttempts:', error?.message);
  }
}

/**
 * Vérifie le statut d'un utilisateur via le backend (Firebase Auth = source de vérité)
 * @param email - L'email de l'utilisateur à vérifier
 * @returns Objet contenant le statut de l'utilisateur
 */
export async function checkUserStatus(email: string): Promise<{ disabled: boolean; attempts: number; exists: boolean }> {
  if (!email) return { disabled: false, attempts: 0, exists: false };

  try {
    const response = await fetch(`${API_CONFIG.FIREBASE_ADMIN_URL}/api/auth/check-status?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.warn('⚠️ Backend error');
      return { disabled: false, attempts: 0, exists: false };
    }

    const data = await response.json();
    console.log(`🔍 Statut utilisateur ${email}:`, { attempts: data.attempts, disabled: data.disabled });
    
    return {
      disabled: data.disabled || false,
      attempts: data.attempts || 0,
      exists: data.exists !== false
    };
  } catch (error: any) {
    console.warn('⚠️ Erreur checkUserStatus:', error?.message);
    return { disabled: false, attempts: 0, exists: false };
  }
}

/**
 * Débloquer/Bloquer un utilisateur manuellement via le backend
 */
export async function updateFirebaseUserStatus(email: string, disable: boolean): Promise<{ disabled: boolean; attempts: number }> {
  if (!email) return { disabled: false, attempts: 0 };

  try {
    const response = await fetch(`${API_CONFIG.FIREBASE_ADMIN_URL}/api/auth/update-user-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, disable })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Backend error:', error);
      throw new Error(error.error || 'Failed to update user status');
    }

    const result = await response.json();
    console.log(`✅ Utilisateur ${email} ${disable ? 'désactivé' : 'réactivé'} dans Firebase Auth`);
    
    return { disabled: disable, attempts: 0 };
  } catch (error: any) {
    console.error('❌ Erreur updateFirebaseUserStatus:', error?.message);
    throw error;
  }
}

// Cloud Functions HTTP helper removed — not used when operating without Blaze.

export { auth, db, functions };


