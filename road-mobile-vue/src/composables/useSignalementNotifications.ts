import { ref, onUnmounted } from 'vue'
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { LocalNotifications } from '@capacitor/local-notifications'
import { auth } from '@/firebase/firebase'

export interface SignalementStatusUpdate {
  signalementId: string
  oldStatus: string
  newStatus: string
  timestamp: Date
  message: string
}

export function useSignalementNotifications() {
  const db = getFirestore()
  const notifications = ref<SignalementStatusUpdate[]>([])
  const isListening = ref(false)
  const error = ref<string>('')
  let unsubscribe: Unsubscribe | null = null

  /**
   * Initialiser les notifications locales
   */
  const initializeLocalNotifications = async () => {
    try {
      // Demander la permission pour les notifications
      const permission = await LocalNotifications.requestPermissions()
      if (permission.display !== 'granted') {
        error.value = 'Permissions de notification refusées'
        return false
      }
      return true
    } catch (err: any) {
      console.error('Erreur initialisation notifications:', err)
      error.value = 'Impossible d\'initialiser les notifications'
      return false
    }
  }

  /**
   * Écouter les changements de statut des signalements de l'utilisateur
   */
  const listenToStatusUpdates = async () => {
    if (!auth.currentUser) {
      error.value = 'Vous devez être connecté'
      return
    }

    if (isListening.value) {
      return // Déjà en cours d'écoute
    }

    try {
      // Initialiser les notifications
      const initialized = await initializeLocalNotifications()
      if (!initialized) {
        console.warn('Notifications non initialisées, continuant sans notifications locales')
      }

      // Créer une requête pour tous les signalements de l'utilisateur
      const q = query(
        collection(db, 'signalements'),
        where('id_utilisateur', '==', auth.currentUser.uid)
      )

      // Écouter les changements en temps réel
      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified') {
              const oldData = change.doc.data()
              const newData = oldData

              // Vérifier les changements de statut
              if (change.doc.metadata.hasPendingWrites === false) {
                const statusUpdate: SignalementStatusUpdate = {
                  signalementId: change.doc.id,
                  oldStatus: oldData.id_statut || 'Non défini',
                  newStatus: newData.id_statut || 'Non défini',
                  timestamp: new Date(),
                  message: `Votre signalement a été mis à jour (Status: ${newData.id_statut || 'Nouveau'})`,
                }

                notifications.value.push(statusUpdate)

                // Envoyer une notification locale
                try {
                  await LocalNotifications.schedule({
                    notifications: [
                      {
                        id: Math.floor(Math.random() * 10000),
                        title: 'Mise à jour du signalement',
                        body: statusUpdate.message,
                        smallIcon: 'ic_stat_icon_config_sample',
                        iconColor: '#488AFF',
                      },
                    ],
                  })
                } catch (notifErr) {
                  console.warn('Impossible d\'envoyer la notification locale:', notifErr)
                }
              }
            }
          })
        },
        (err: any) => {
          console.error('Erreur lors de l\'écoute des signalements:', err)
          error.value = 'Erreur lors de l\'écoute des changements'
        }
      )

      isListening.value = true
    } catch (err: any) {
      console.error('Erreur listenToStatusUpdates:', err)
      error.value = err.message || 'Erreur lors de la mise en place de l\'écoute'
    }
  }

  /**
   * Arrêter l'écoute des changements
   */
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    isListening.value = false
  }

  /**
   * Afficher une notification locale manuelle
   */
  const sendLocalNotification = async (title: string, message: string) => {
    try {
      const initialized = await initializeLocalNotifications()
      if (initialized) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 10000),
              title,
              body: message,
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#488AFF',
            },
          ],
        })
      }
    } catch (err) {
      console.error('Erreur envoi notification:', err)
    }
  }

  /**
   * Nettoyer lors du démontage du composant
   */
  onUnmounted(() => {
    stopListening()
  })

  return {
    notifications,
    isListening,
    error,
    listenToStatusUpdates,
    stopListening,
    sendLocalNotification,
  }
}
