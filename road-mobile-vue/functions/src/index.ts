/**
 * Firebase Cloud Functions pour la gestion des utilisateurs
 * 
 * Ces fonctions permettent de désactiver/réactiver des comptes utilisateurs
 * dans Firebase Authentication après plusieurs tentatives de connexion échouées
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialisation de Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const syncLoginAttempts = async (email: string, disabled: boolean) => {
  const normalizedEmail = normalizeEmail(email);
  const attempts = disabled ? 3 : 0;

  await db.doc(`login_attempts/${normalizedEmail}`).set({
    email: normalizedEmail,
    attempts,
    disabled,
    lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
    ...(disabled ? { blockedAt: admin.firestore.FieldValue.serverTimestamp() } : {})
  }, { merge: true });
};

const allowedOrigins = ['http://localhost:5173'];
const setCorsHeaders = (origin: string | undefined, res: functions.Response) => {
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * Fonction HTTP pour désactiver un utilisateur dans Firebase Authentication
 * Cette fonction est appelée après 3 tentatives de connexion échouées
 * 
 * @param email - L'email de l'utilisateur à désactiver
 * @returns {success: boolean, message: string}
 */
export const disableUser = functions.https.onCall(async (data, context) => {
  const email = data.email;
  
  // Validation de l'email
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'email est requis et doit être une chaîne de caractères'
    );
  }

  try {
    // Rechercher l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);
    
    // Désactiver le compte
    await admin.auth().updateUser(user.uid, {
      disabled: true
    });

    // Synchroniser le statut dans Firestore
    await syncLoginAttempts(email, true);

    // Re-demander l'utilisateur immédiatement pour vérifier la synchro
    const checkAgain = await admin.auth().getUser(user.uid);
    if (checkAgain.disabled === true) {
      console.log(`SYNCHRO RÉUSSIE : Firebase confirme le statut Disabled=true pour ${email}`);
    } else {
      console.error(` ÉCHEC SILENCIEUX : Firebase renvoie Disabled=${checkAgain.disabled} pour ${email}`);
    }

    console.log(` Compte désactivé pour l'utilisateur: ${email} (UID: ${user.uid})`);
    
    return {
      success: true,
      message: `Compte désactivé avec succès pour ${email}`,
      uid: user.uid
    };
  } catch (error: any) {
    console.error(`❌ Erreur lors de la désactivation de ${email}:`, error);
    
    // Gérer les différents types d'erreurs
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        `Aucun utilisateur trouvé avec l'email: ${email}`
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Erreur lors de la désactivation du compte: ${error.message}`
    );
  }
});

/**
 * Fonction HTTP pour réactiver un utilisateur dans Firebase Authentication
 * Cette fonction est appelée après une connexion réussie pour réinitialiser les tentatives
 * 
 * @param email - L'email de l'utilisateur à réactiver
 * @returns {success: boolean, message: string}
 */
export const enableUser = functions.https.onCall(async (data, context) => {
  const email = data.email;
  
  // Validation de l'email
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'email est requis et doit être une chaîne de caractères'
    );
  }

  try {
    // Rechercher l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);
    
    // Réactiver le compte s'il est désactivé
    if (user.disabled) {
      await admin.auth().updateUser(user.uid, {
        disabled: false
      });

      // Re-demander l'utilisateur immédiatement pour vérifier la synchro
      const checkAgain = await admin.auth().getUser(user.uid);
      if (checkAgain.disabled === false) {
        console.log(`✅ SYNCHRO RÉUSSIE : Firebase confirme le statut Disabled=false pour ${email}`);
      } else {
        console.error(`❌ ÉCHEC SILENCIEUX : Firebase renvoie Disabled=${checkAgain.disabled} pour ${email}`);
      }

      console.log(`✅ Compte réactivé pour l'utilisateur: ${email} (UID: ${user.uid})`);
    } else {
      console.log(`ℹ️ Le compte ${email} était déjà actif`);
    }

    // Synchroniser le statut dans Firestore
    await syncLoginAttempts(email, false);
    
    return {
      success: true,
      message: `Compte réactivé avec succès pour ${email}`,
      uid: user.uid,
      wasDisabled: user.disabled
    };
  } catch (error: any) {
    console.error(`❌ Erreur lors de la réactivation de ${email}:`, error);
    
    // Gérer les différents types d'erreurs
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        `Aucun utilisateur trouvé avec l'email: ${email}`
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Erreur lors de la réactivation du compte: ${error.message}`
    );
  }
});

/**
 * Fonction HTTP pour vérifier le statut d'un utilisateur (actif/désactivé)
 * 
 * @param email - L'email de l'utilisateur à vérifier
 * @returns {disabled: boolean, uid: string}
 */
export const checkUserStatus = functions.https.onCall(async (data, context) => {
  const email = data.email;
  
  // Validation de l'email
  if (!email || typeof email !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'email est requis et doit être une chaîne de caractères'
    );
  }

  try {
    // Rechercher l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);
    
    return {
      success: true,
      uid: user.uid,
      email: user.email,
      disabled: user.disabled,
      emailVerified: user.emailVerified
    };
  } catch (error: any) {
    console.error(`❌ Erreur lors de la vérification de ${email}:`, error);
    
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        `Aucun utilisateur trouvé avec l'email: ${email}`
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Erreur lors de la vérification du statut: ${error.message}`
    );
  }
});

/**
 * Endpoint HTTP (CORS) pour désactiver/réactiver un utilisateur
 * Corps attendu: { email: string, disable: boolean }
 */
export const updateUserStatusHttp = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(req.headers.origin as string | undefined, res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { email, disable } = req.body || {};

  if (!email || typeof email !== 'string' || typeof disable !== 'boolean') {
    res.status(400).json({ success: false, message: 'email (string) et disable (boolean) requis' });
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { disabled: disable });

    // Synchroniser le statut dans Firestore
    await syncLoginAttempts(email, disable);

    const checkAgain = await admin.auth().getUser(user.uid);
    const synced = checkAgain.disabled === disable;

    if (synced) {
      console.log(`✅ SYNCHRO RÉUSSIE : Firebase confirme Disabled=${disable} pour ${email}`);
    } else {
      console.error(`❌ ÉCHEC SILENCIEUX : Firebase renvoie Disabled=${checkAgain.disabled} pour ${email}`);
    }

    res.json({ success: true, uid: user.uid, disabled: checkAgain.disabled, synced });
  } catch (error: any) {
    console.error(`❌ Erreur updateUserStatusHttp pour ${email}:`, error);
    res.status(500).json({ success: false, message: error?.message || 'Erreur interne' });
  }
});

/**
 * Fonction trigger pour envoyer une notification quand le statut d'un signalement change
 * Cette fonction est déclenchée automatiquement quand un document de la collection signalements est modifié
 */
export const onSignalementStatusChange = functions.firestore
  .document('signalements/{signalementId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const signalementId = context.params.signalementId;

    // Vérifier si le statut a changé
    if (beforeData.id_statut === afterData.id_statut) {
      console.log(`ℹ️ Pas de changement de statut pour ${signalementId}`);
      return;
    }

    try {
      const userId = afterData.id_utilisateur;
      const nouveauStatut = afterData.id_statut;
      const ancienStatut = beforeData.id_statut || 'EN_ATTENTE';

      const statusMessages: { [key: string]: string } = {
        'EN_ATTENTE': 'Votre signalement est en attente de traitement',
        'EN_TRAITEMENT': 'Votre signalement est en traitement',
        'TRAITE': 'Votre signalement a été traité',
        'REJETE': 'Votre signalement a été rejeté',
        'CLOTURE': 'Votre signalement est clos',
      };

      // Créer une notification dans Firestore
      const notificationData = {
        signalementId,
        userId,
        statut: nouveauStatut,
        message: statusMessages[nouveauStatut] || `Statut changé: ${nouveauStatut}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
      };

      const notificationRef = await db.collection('notifications').add(notificationData);

      console.log(`✅ Notification créée pour ${userId}:`, notificationRef.id);

      // Enregistrer le changement de statut dans la collection statut_changes
      const statusChangeData = {
        signalementId,
        ancienStatut,
        nouveauStatut,
        dateChangement: admin.firestore.FieldValue.serverTimestamp(),
        userId,
      };

      await db.collection('statut_changes').add(statusChangeData);

      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error(`❌ Erreur traitement changement statut:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la notification'
      );
    }
  });

/**
 * Fonction HTTP pour envoyer une notification manuelle (pour les admin)
 */
export const sendNotification = functions.https.onCall(async (data, context) => {
  // Vérifier que l'utilisateur est authentifié
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'L\'utilisateur doit être authentifié');
  }

  const { signalementId, message, statut } = data;

  if (!signalementId || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'signalementId et message sont requis'
    );
  }

  try {
    // Récupérer le signalement
    const signalementRef = db.doc(`signalements/${signalementId}`);
    const signalementSnap = await signalementRef.get();

    if (!signalementSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Signalement non trouvé');
    }

    const signalementData = signalementSnap.data();
    const userId = signalementData?.id_utilisateur;

    // Créer la notification
    const notificationData = {
      signalementId,
      userId,
      statut: statut || signalementData?.id_statut || 'INDÉFINI',
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    };

    const notificationRef = await db.collection('notifications').add(notificationData);

    return { success: true, notificationId: notificationRef.id };
  } catch (error: any) {
    console.error(`❌ Erreur envoi notification:`, error);
    throw new functions.https.HttpsError(
      'internal',
      `Erreur: ${error.message}`
    );
  }
});

