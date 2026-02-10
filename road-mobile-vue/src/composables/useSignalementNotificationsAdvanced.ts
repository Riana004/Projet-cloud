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
  QueryConstraint,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { auth, getStatusLabel, getUserNotifications } from '../firebase/firebase';

// Ensure a minimal global notifications bridge exists so console commands
// won't fail if a component hasn't attached the real API yet. The bridge
// forwards calls to the real API when it becomes available.
try {
  if (!(window as any).__notifApi) {
    Object.defineProperty(window, '__notifApi', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: {
        async refreshFromServer() {
          const real = (window as any).__notifApi_real || (window as any).__notifApi_actual;
          if (real && real.refreshFromServer) return real.refreshFromServer();
          return { ok: false, error: 'notif api not ready' };
        },
        async markAsReadPersist(id: string) {
          const real = (window as any).__notifApi_real || (window as any).__notifApi_actual;
          if (real && real.markAsReadPersist) return real.markAsReadPersist(id);
          return { ok: false, error: 'notif api not ready' };
        },
        async toggleReadPersist(id: string, toRead: boolean) {
          const real = (window as any).__notifApi_real || (window as any).__notifApi_actual;
          if (real && real.toggleReadPersist) return real.toggleReadPersist(id, toRead);
          return { ok: false, error: 'notif api not ready' };
        },
        get unreadCount() {
          const real = (window as any).__notifApi_real || (window as any).__notifApi_actual;
          return real && real.unreadCount ? real.unreadCount : { value: 0 };
        }
      }
    });
  }
} catch (e) { /* ignore */ }

export interface SignalementNotification {
  id: string;
  signalementId: string;
  userId: string;
  statut: string;
  ancienStatutId?: string;
  nouveauStatutId?: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
}

/**
 * Composable pour gérer les notifications de changement de statut
 */
export function useSignalementNotificationsAdvanced() {
  // Module-level shared map so UI + console helpers always see the same data
  // even if listeners are started from different places.
  const __globalNotifMap: Map<string, any> = ((window as any).__globalNotifMap || new Map());
  try { (window as any).__globalNotifMap = __globalNotifMap; } catch (e) { /* ignore */ }

  // Use a module-level singleton store so multiple composable instances
  // (component + console-created) share the same reactive data and helpers.
  if ((window as any).__notifSingleton) {
    return (window as any).__notifSingleton;
  }

  const db = getFirestore();
  const notifications = ref<SignalementNotification[]>([]);
  const unreadCount = ref<number>(0);
  const isListening = ref<boolean>(false);
  let unsubscribe: (() => void) | null = null;
  // additional unsubscribes for signalement-based queries
  let extraUnsubscribes: Array<() => void> = [];
  const lastStatuses: Record<string, any> = {};

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
   * Force-refresh notifications directly from server and populate the
   * composable `notifications` list. Useful when listeners fail to deliver.
   */
  const refreshFromServerGlobal = async (): Promise<any> => {
    try {
      if (!auth.currentUser) return { ok: false, error: 'not authenticated' };
      const uid = auth.currentUser.uid;
      const fetched = await getUserNotifications(uid).catch(() => []);
      if (!fetched || fetched.length === 0) {
        notifications.value = [];
        unreadCount.value = 0;
        return { ok: true, count: 0 };
      }
      const normalized = fetched.map((d: any) => {
        const ancienId = d.ancien_statut_id || d.ancienStatut || d.ancien || null;
        const nouveauId = d.nouveau_statut_id || d.nouveauStatut || d.nouveau || d.statut || null;
        const statutLabel = nouveauId ? getStatusLabel(nouveauId) : (d.statut || d.status || '');
        return {
          id: d.id,
          signalementId: d.signalementId || d.signalement_id || d.signalement || null,
          id_avancement: d.id_avancement || d.avancementId || d.avancement || null,
          userId: d.userId || d.user_id || d.uid || uid,
          ancienStatutId: ancienId,
          nouveauStatutId: nouveauId,
          statut: statutLabel,
          message: d.message || statutLabel || '',
          timestamp: d.timestamp || d.dateChangement || Timestamp.now(),
          isRead: d.isRead ?? d.is_read ?? false,
        } as SignalementNotification;
      });
      normalized.sort((a, b) => {
        const ta = (a.timestamp && (a.timestamp as any).toMillis) ? (a.timestamp as any).toMillis() : 0;
        const tb = (b.timestamp && (b.timestamp as any).toMillis) ? (b.timestamp as any).toMillis() : 0;
        return tb - ta;
      });
      notifications.value = normalized;
      unreadCount.value = notifications.value.filter(n => !n.isRead).length;
      return { ok: true, count: normalized.length };
    } catch (e) {
      console.error('refreshFromServerGlobal failed:', e);
      return { ok: false, error: String(e) };
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
   * Écoute la collection `notifications` pour l'utilisateur courant
   * et transforme les documents en notifications locales.
   */
  const listenToSignalementUpdates = async (): Promise<void> => {
    if (!auth.currentUser || isListening.value) return;

    try {
      // cleanup previous listeners
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      if (extraUnsubscribes.length) { extraUnsubscribes.forEach(u => u()); extraUnsubscribes = []; }
      isListening.value = true;

      const currentUid = auth.currentUser.uid;
      // Load or initialize user's lastNotificationSeen timestamp so we
      // can treat existing notifications as "old/read" and only new
      // notifications after this moment will be considered unread.
      let lastSeen: any = null;
      try {
        const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const userRef = doc(db, 'users', currentUid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || !userSnap.data()?.lastNotificationSeen) {
          // First time for this user (or field missing): set it to now
          await setDoc(userRef, { lastNotificationSeen: serverTimestamp() }, { merge: true });
          lastSeen = Timestamp.now();
        } else {
          lastSeen = userSnap.data().lastNotificationSeen;
        }
      } catch (e) {
        console.warn('Could not read/set user lastNotificationSeen:', e);
      }

      // Primary query: notifications where userId == currentUid
      const qUser = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUid),
        orderBy('timestamp', 'desc')
      );

      // We'll keep a map of notifications from all sources to dedupe and merge
      // Use the module-level map so console helpers see the same entries.
      const notifMap: Map<string, any> = __globalNotifMap;

      let pendingInitial = 1; // number of initial snapshots to wait for (qUser + extra queries)

      const rebuildNotifications = () => {
        console.debug('[notif] rebuildNotifications — notifMap size=', notifMap.size);
        const arr = Array.from(notifMap.values()).map(d => ({ id: d.id, data: d.data }));
        // normalize and sort by timestamp desc
        const normalized = arr.map(item => {
          const d = item.data;
          const ancienId = d.ancien_statut_id || d.ancienStatut || d.ancien || null;
          const nouveauId = d.nouveau_statut_id || d.nouveauStatut || d.nouveau || d.statut || null;
          const statutLabel = nouveauId ? getStatusLabel(nouveauId) : (d.statut || d.status || '');
          return {
            id: item.id,
            signalementId: d.signalementId || d.signalement_id || d.signalement || null,
            id_avancement: d.id_avancement || d.avancementId || d.avancement || null,
            userId: d.userId || d.user_id || d.uid || currentUid,
            ancienStatutId: ancienId,
            nouveauStatutId: nouveauId,
            statut: statutLabel,
            message: d.message || statutLabel || '',
            timestamp: d.timestamp || d.dateChangement || Timestamp.now(),
            isRead: d.isRead ?? d.is_read ?? false,
          } as SignalementNotification;
        });
        normalized.sort((a, b) => {
          const ta = (a.timestamp && (a.timestamp as any).toMillis) ? (a.timestamp as any).toMillis() : 0;
          const tb = (b.timestamp && (b.timestamp as any).toMillis) ? (b.timestamp as any).toMillis() : 0;
          return tb - ta;
        });
        notifications.value = normalized;
        unreadCount.value = notifications.value.filter(n => !n.isRead).length;
      };
      try { (window as any).__refreshNotifications = refreshFromServer; } catch (e) { /* ignore */ }

      // Helper: ensure we include any docs that may have been missed by listeners
      const ensureInitialDocs = async () => {
        try {
          const { getDocs } = await import('firebase/firestore');
          // fetch user notifications once
          const snap = await getDocs(qUser);
          snap.docs.forEach(d => notifMap.set(d.id, { id: d.id, data: d.data() }));

          // fetch user's signalement ids and then notification batches
          try {
            const sigQ_local = query(collection(db, 'signalements'), where('id_utilisateur', '==', currentUid));
            const sigSnap_local = await getDocs(sigQ_local);
            const sigIds_local = sigSnap_local.docs.map(d => d.id);
            const localBatches: string[][] = [];
            for (let i = 0; i < sigIds_local.length; i += 10) localBatches.push(sigIds_local.slice(i, i + 10));
            for (const batch of localBatches) {
              const qSigFetch = query(collection(db, 'notifications'), where('signalementId', 'in', batch));
              const s = await getDocs(qSigFetch);
              s.docs.forEach(d => notifMap.set(d.id, { id: d.id, data: d.data() }));
            }
          } catch (e) {
            // ignore per-signalement fetch errors
          }

          rebuildNotifications();
          console.debug('[notif] ensureInitialDocs completed');
        } catch (e) {
          // ignore errors from fallback fetch
          console.warn('ensureInitialDocs failed:', e);
        }
      };

      const userSnapUnsub = onSnapshot(qUser, (snapshot) => {
        snapshot.docs.forEach(d => notifMap.set(d.id, { id: d.id, data: d.data() }));
        // show local notifications only after initial load
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && pendingInitial <= 0) {
            const d = change.doc.data() as any;
            const nouveauId = d.nouveau_statut_id || d.nouveauStatut || d.statut || null;
            const msg = d.message || (`Statut changé: ${getStatusLabel(nouveauId)}`);
            showNotification('Mise à jour signalement', msg, d.signalementId || d.signalement_id || '');
          }
        });
        pendingInitial = Math.max(0, pendingInitial - 1);
        rebuildNotifications();
      }, (err) => {
        console.error('Erreur écoute notifications (user):', err);
      });
      unsubscribe = userSnapUnsub;

      // (fallback fetch will be run after we establish signalement batches below)

      // Expose debug helpers to window for runtime inspection in DevTools
      try {
        (window as any).__notifMap = notifMap;
        (window as any).__getNotifications = () => notifications.value;
        (window as any).__rebuildNotifications = rebuildNotifications;
        // Bridge API: make core helpers available even when component didn't set __notifApi
        try {
          (window as any).__notifApi = (window as any).__notifApi || {
            refreshFromServer,
            toggleReadPersist: (id: string, toRead: boolean) => toggleReadPersist(id, toRead),
            markAsReadPersist: (id: string) => markAsReadPersist(id),
            unreadCount
          };
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore in restricted envs */ }

      // Secondary: notifications for signalements owned by the user
      // Fetch user's signalements ids
      const sigQ = query(collection(db, 'signalements'), where('id_utilisateur', '==', currentUid));
      const sigSnap = await getDocs(sigQ);
      const sigIds = sigSnap.docs.map(d => d.id);

      // batch into groups of max 10 for 'in' queries
      const batches: string[][] = [];
      for (let i = 0; i < sigIds.length; i += 10) batches.push(sigIds.slice(i, i + 10));
      pendingInitial += batches.length;

      for (const batch of batches) {
        const qSig = query(collection(db, 'notifications'), where('signalementId', 'in', batch));
        const unsub = onSnapshot(qSig, (snapshot) => {
          snapshot.docs.forEach(d => notifMap.set(d.id, { id: d.id, data: d.data() }));
          // local notifications only after initial loads
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' && pendingInitial <= 0) {
              const d = change.doc.data() as any;
              const nouveauId = d.nouveau_statut_id || d.nouveauStatut || d.statut || null;
              const msg = d.message || (`Statut changé: ${getStatusLabel(nouveauId)}`);
              showNotification('Mise à jour signalement', msg, d.signalementId || d.signalement_id || '');
            }
          });
          pendingInitial = Math.max(0, pendingInitial - 1);
          rebuildNotifications();
        }, (err) => {
          console.error('Erreur écoute notifications (signalement batch):', err);
        });
        extraUnsubscribes.push(unsub);
      }

      // Run fallback fetch now that batches are known
      try { await ensureInitialDocs(); } catch (e) { /* ignore */ }

      // After we've ensured initial docs are present, mark older notifications
      // as read based on the user's `lastNotificationSeen` timestamp so that
      // existing notifications become permanently read and only new ones
      // remain unread until explicitly marked.
      try {
        if (lastSeen) {
          const { updateDoc, doc } = await import('firebase/firestore');
          for (const [id, item] of notifMap) {
            const d = item.data as any;
            const ts = d.timestamp || d.dateChangement || null;
            const isReadVal = d.isRead ?? d.is_read ?? false;
            try {
              if (ts && ts.toMillis && lastSeen && lastSeen.toMillis && ts.toMillis() <= lastSeen.toMillis()) {
                if (!isReadVal) {
                  // persist read flag
                  await updateDoc(doc(db, 'notifications', id), { isRead: true });
                  item.data.isRead = true;
                }
              }
            } catch (e) {
              console.warn('Could not mark notification read for', id, e);
            }
          }
          rebuildNotifications();
        }
      } catch (e) {
        console.warn('marking old notifications failed:', e);
      }

      // If the listeners and fallback fetch somehow returned no notifications
      // (e.g., security rules, query mismatch), proactively fetch via
      // `getUserNotifications` as a last-resort and merge results into notifMap.
      try {
        if (notifMap.size === 0) {
          const fetched = await getUserNotifications(currentUid).catch(() => []);
          if (fetched && fetched.length > 0) {
            fetched.forEach((d: any) => notifMap.set(d.id, { id: d.id, data: d }));
            rebuildNotifications();
            console.log('Fallback: merged', fetched.length, 'notifications from getUserNotifications');
          }
        }
      } catch (e) {
        console.warn('fallback getUserNotifications failed:', e);
      }

      // Expose a helper to force-refresh notifications directly from server
      const refreshFromServer = async () => {
        try {
          const fetched = await getUserNotifications(currentUid).catch(() => []);
          if (fetched && fetched.length > 0) {
            fetched.forEach((d: any) => notifMap.set(d.id, { id: d.id, data: d }));
            rebuildNotifications();
            console.debug('[notif] refreshFromServer merged', fetched.length, 'docs');
            return { ok: true, count: fetched.length };
          }
          // If no docs fetched, do not clear existing UI list (avoid flicker)
          console.debug('[notif] refreshFromServer found 0 docs — leaving current list untouched');
          return { ok: true, count: 0 };
        } catch (e) {
          console.warn('refreshFromServer failed:', e);
          return { ok: false, error: String(e) };
        }
      };

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

  // Persist read flag to Firestore
  const markAsReadPersist = async (notificationId: string) => {
    try {
      const notification = notifications.value.find(n => n.id === notificationId);
      if (!notification) return { ok: false, error: 'not found' };
      // local update
      if (!notification.isRead) {
        notification.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      // persist
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      return { ok: true };
    } catch (e) {
      console.error('markAsReadPersist failed:', e);
      return { ok: false, error: String(e) };
    }
  };

  /**
   * Mark a notification as unread (persist false). Useful to toggle state.
   */
  const markAsUnreadPersist = async (notificationId: string) => {
    try {
      const notification = notifications.value.find(n => n.id === notificationId);
      if (!notification) return { ok: false, error: 'not found' };
      // local update
      if (notification.isRead) {
        notification.isRead = false;
        unreadCount.value = Math.max(0, unreadCount.value + 1);
      }
      // persist
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: false });
      return { ok: true };
    } catch (e) {
      console.error('markAsUnreadPersist failed:', e);
      return { ok: false, error: String(e) };
    }
  };

  /**
   * Toggle read state helper
   */
  const toggleReadPersist = async (notificationId: string, toRead: boolean) => {
    if (toRead) return await markAsReadPersist(notificationId);
    return await markAsUnreadPersist(notificationId);
  };

  /**
   * Mark all notifications for current user as read and update
   * user's `lastNotificationSeen` timestamp. Persisted until deleted.
   */
  const markAllAsRead = async () => {
    if (!auth.currentUser) return { ok: false, error: 'not authenticated' };
    const uid = auth.currentUser.uid;
    try {
      const { collection, query, where, getDocs, updateDoc, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const q = query(collection(db, 'notifications'), where('userId', '==', uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as any;
        if (!data.isRead) {
          try { await updateDoc(doc(db, 'notifications', d.id), { isRead: true }); } catch (e) { console.warn('markAllAsRead update failed for', d.id, e); }
        }
      }
      // update user's lastNotificationSeen
      try { await setDoc(doc(db, 'users', uid), { lastNotificationSeen: serverTimestamp() }, { merge: true }); } catch (e) { console.warn('Could not set lastNotificationSeen:', e); }
      // refresh local view
      rebuildNotifications();
      return { ok: true };
    } catch (e) {
      console.error('markAllAsRead failed:', e);
      return { ok: false, error: String(e) };
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
    // If auth not ready yet, wait for sign-in then start listeners so
    // we always attach listeners as soon as we have a current user.
    if (!auth.currentUser) {
      // Wait for a user to sign in before starting listeners.
      // Use promise + dynamic import without `await` inside the Promise executor.
      try {
        await new Promise<void>((resolve) => {
          import('firebase/auth').then(({ onAuthStateChanged }) => {
            const unsub = onAuthStateChanged(auth, (u) => {
              if (u) {
                try { unsub(); } catch (e) { /* ignore */ }
                resolve();
              }
            });
          }).catch(() => {
            // If import fails, resolve to avoid blocking
            resolve();
          });
        });
      } catch {
        // ignore
      }
    }
    // Start listening to Firestore notifications regardless of local notification
    // permission so the in-app notification list is populated even if the
    // user denies OS-level notifications. Request OS permission in parallel.
    listenToSignalementUpdates().catch(e => console.warn('listenToSignalementUpdates failed:', e));
    // Request permission for local (OS) notifications but do not gate the
    // Firestore listeners on it.
    requestNotificationPermission().catch(e => console.warn('requestNotificationPermission failed:', e));
  };

  // Publish the real API to the window so console callers can directly use it
  try {
    const realApi = {
      refreshFromServer: refreshFromServerGlobal,
      toggleReadPersist,
      markAsReadPersist,
      markAsUnreadPersist,
      unreadCount,
      notifications,
      initialize,
    };
    try { (window as any).__notifApi_actual = realApi; } catch (e) { /* ignore */ }
    try { (window as any).__notifApi = realApi; } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }

  return {
    notifications,
    unreadCount,
    isListening,
    requestNotificationPermission,
    showNotification,
    listenToSignalementUpdates,
    stopListening,
    markAsRead,
    markAsReadPersist,
    markAsUnreadPersist,
    toggleReadPersist,
    markAllAsRead,
    resetNotifications,
    initialize,
    // force-refresh helper
    refreshFromServer: refreshFromServerGlobal,
  };
}

// Compatibilité: certaines vues importent l'ancien nom `useSignalementNotifications`.
// On exporte un alias pour éviter de casser les imports existants.
export { useSignalementNotificationsAdvanced as useSignalementNotifications };
