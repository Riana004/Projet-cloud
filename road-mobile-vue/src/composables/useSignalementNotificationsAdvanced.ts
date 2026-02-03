import { ref, onMounted } from 'vue';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { auth } from '../firebase/firebase';

export interface SignalementNotification {
  id: string;
  signalementId: string;
  userId: string;
  statut: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
}

/**
 * Composable pour gérer les notifications de changement de statut
 */
export function useSignalementNotifications() {
  const db = getFirestore();
  const notifications = ref<SignalementNotification[]>([]);
  const unreadCount = ref<number>(0);
  const isListening = ref<boolean>(false);
  let unsubscribe: (() => void) | null = null;

  /**
   * Demande la permission pour les notifications
   */
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (err) {
      console.error('Erreur permission notifications:', err);
      return false;
    }
  };

  /**
   * Affiche une notification locale
   */
  const showNotification = async (
    title: string,
    body: string,
    signalementId: string
  ) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            sound: 'default',
            smallIcon: 'ic_notification',
            largeIcon: 'assets/icon/favicon.png',
            data: {
              signalementId,
              url: `/signalement/${signalementId}`,
            },
          },
        ],
      });
    } catch (err) {
      console.error('Erreur affichage notification:', err);
    }
  };

  /**
   * Écoute les changements de statut des signalements de l'utilisateur
   */
  const listenToSignalementUpdates = async (): Promise<void> => {
    if (!auth.currentUser || isListening.value) {
      return;
    }

    try {
      // Arrêter l'écoute précédente si elle existe
      if (unsubscribe) {
        unsubscribe();
      }

      isListening.value = true;

      // Créer une requête pour écouter les signalements de l'utilisateur
      const constraints: QueryConstraint[] = [
        where('userId', '==', auth.currentUser.uid)
      ];

      const q = query(
        collection(db, 'signalements'),
        ...constraints
      );

      // Écouter en temps réel
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const doc = change.doc;
              const data = doc.data() as any;
              const previousData = change.doc.metadata.hasPendingWrites ? null : data;

              // Vérifier si le statut a changé
              if (data.statut && data.statut !== previousData?.statut) {
                const statusMessages: { [key: string]: string } = {
                  'EN_ATTENTE': 'Votre signalement est en attente de traitement',
                  'EN_TRAITEMENT': 'Votre signalement est en traitement',
                  'TRAITE': 'Votre signalement a été traité',
                  'REJETE': 'Votre signalement a été rejeté',
                  'CLOTURE': 'Votre signalement est clos',
                };

                const message = statusMessages[data.statut] || `Statut changé: ${data.statut}`;

                // Ajouter à la liste des notifications
                notifications.value.unshift({
                  id: doc.id,
                  signalementId: doc.id,
                  userId: auth.currentUser!.uid,
                  statut: data.statut,
                  message,
                  timestamp: data.updatedAt || Timestamp.now(),
                  isRead: false,
                });

                unreadCount.value++;

                // Afficher une notification locale
                showNotification(
                  'Mise à jour signalement',
                  message,
                  doc.id
                );
              }
            }
          });
        },
        (error) => {
          console.error('Erreur écoute signalements:', error);
          isListening.value = false;
        }
      );
    } catch (err) {
      console.error('Erreur initialisation écoute:', err);
      isListening.value = false;
    }
  };

  /**
   * Arrête l'écoute des changements
   */
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      isListening.value = false;
    }
  };

  /**
   * Marque une notification comme lue
   */
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  };

  /**
   * Réinitialise les notifications
   */
  const resetNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  /**
   * Initialise les notifications au montage du composable
   */
  const initialize = async () => {
    const permission = await requestNotificationPermission();
    if (permission) {
      await listenToSignalementUpdates();
    }
  };

  return {
    notifications,
    unreadCount,
    isListening,
    requestNotificationPermission,
    showNotification,
    listenToSignalementUpdates,
    stopListening,
    markAsRead,
    resetNotifications,
    initialize,
  };
}
