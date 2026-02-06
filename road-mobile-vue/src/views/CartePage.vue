<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Signalements routiers</ion-title>
        <ion-buttons slot="end">
          <ion-badge v-if="unreadNotifications > 0" color="danger" style="margin-right: 8px;">
            {{ unreadNotifications }}
          </ion-badge>
          <ion-button @click="showNotifications = true">
            <ion-icon :icon="notificationsOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Contrôles -->
      <div class="controls-container">
        <ion-row>
          <ion-col size="4">
            <ion-button 
              expand="block" 
              fill="outline"
              @click="router.push('/signalement')"
            >
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              Nouveau
            </ion-button>
          </ion-col>
          <ion-col size="4">
            <ion-button 
              expand="block"
              :color="showOnlyMine ? 'primary' : 'medium'"
              @click="toggleMySignalements"
            >
              <ion-icon :icon="filterOutline" slot="start"></ion-icon>
              {{ showOnlyMine ? 'Mes sig.' : 'Tous' }}
            </ion-button>
          </ion-col>
          <ion-col size="4">
            <ion-button 
              expand="block"
              fill="outline"
              @click="centerMapOnUser"
            >
              <ion-icon :icon="navigateOutline" slot="start"></ion-icon>
              Me localiser
            </ion-button>
          </ion-col>
        </ion-row>
      </div>

      <!-- Carte interactive -->
      <div id="mapContainer" class="map-wrapper">
        <div ref="mapElement" style="height: 100%; width: 100%;"></div>
      </div>

      <!-- Légende -->
      <div class="legend">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          Types de signalements:
        </div>
        <div style="font-size: 12px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            🔴 Nid de poule
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            🟠 Feu cassé
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            🔵 Autres problèmes
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner></ion-spinner>
      </div>

      <!-- Toast messages -->
      <ion-toast
        :is-open="!!errorMessage"
        :message="errorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="errorMessage = ''"
      ></ion-toast>
    </ion-content>

    <!-- Modal pour les notifications -->
    <ion-modal :is-open="showNotifications">
      <ion-header>
        <ion-toolbar>
          <ion-title>Notifications</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showNotifications = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div v-if="notifications.length === 0" style="text-align: center; margin-top: 20px;">
          <p style="color: #999;">Aucune notification</p>
        </div>
        <ion-list v-else>
          <ion-item 
            v-for="notif in notifications" 
            :key="notif.id"
            button
          >
            <ion-label>
              <h3>{{ notif.message }}</h3>
              <p>{{ formatDate(notif.timestamp) }}</p>
            </ion-label>
            <ion-badge slot="end" color="primary">{{ notif.statut }}</ion-badge>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBadge,
  IonButton, IonButtons, IonMenuButton, IonIcon, IonRow, IonCol,
  IonSpinner, IonToast, IonModal, IonList, IonItem, IonLabel
} from '@ionic/vue'
import { 
  addCircleOutline, 
  filterOutline, 
  navigateOutline, 
  notificationsOutline,
  closeOutline 
} from 'ionicons/icons'
import { auth, getAllSignalements, getUserSignalements, initMessaging, saveFcmToken, onForegroundMessageListener, onAuthStateChangeListener } from '@/firebase/firebase'
import { useGeolocationMap } from '@/composables/useGeolocationMap'
import { useSignalementNotifications } from '@/composables/useSignalementNotificationsAdvanced'

const router = useRouter()
const mapElement = ref<HTMLDivElement>()
let map: L.Map | null = null
const markers = ref<Map<string, L.Marker>>(new Map())

// Géolocalisation
const { latitude, longitude } = useGeolocationMap()

// Notifications avancées
const { 
  notifications, 
  unreadCount, 
  initialize: initNotifications,
  sendLocalNotification
} = useSignalementNotifications()

// État
const signalements = ref<any[]>([])
const userSignalements = ref<any[]>([])
const isLoading = ref<boolean>(false)
const errorMessage = ref<string>('')
const FILTER_KEY = 'showOnlyMine'
const showOnlyMine = ref<boolean>(false)
const showNotifications = ref<boolean>(false)

// Notifications
const unreadNotifications = computed(() => unreadCount.value)

/**
 * Initialise la carte Leaflet
 */
const initializeMap = () => {
  if (!mapElement.value || map) return

  // Créer la carte centrée sur la position actuelle ou Madagascar par défaut (Antananarivo)
  const startLat = latitude.value || -18.8792
  const startLng = longitude.value || 47.5079

  map = L.map(mapElement.value).setView([startLat, startLng], 13)

  // Ajouter la couche OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    crossOrigin: true,
  }).addTo(map)

  // Marqueur de la position actuelle
  if (latitude.value && longitude.value) {
    L.marker([latitude.value, longitude.value], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: 'Ma position',
    }).addTo(map).bindPopup('Votre position actuelle')
  }

  // Charger et afficher les signalements
  loadSignalements()
}

/**
 * Charge les signalements depuis Firebase
 */
const loadSignalements = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [all, mine] = await Promise.all([
      getAllSignalements(),
      auth.currentUser ? getUserSignalements() : Promise.resolve([])
    ])

    signalements.value = all
    userSignalements.value = mine

    // Afficher les signalements sur la carte
    displaySignalements()
  } catch (err: any) {
    errorMessage.value = `Erreur chargement signalements: ${err.message}`
    console.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

/**
 * Affiche les signalements sur la carte
 */
const displaySignalements = () => {
  // Nettoyer les anciens marqueurs
  markers.value.forEach(marker => {
    if (map) map.removeLayer(marker)
  })
  markers.value.clear()

  // Afficher les signalements appropriés
  const signalemsToDisplay = showOnlyMine.value ? userSignalements.value : signalements.value

  signalemsToDisplay.forEach(sig => {
    const isMine = auth.currentUser?.uid === sig.id_utilisateur

    // Déterminer la couleur du marqueur
    let markerColor = 'blue'
    if (sig.description?.includes('Nid de poule')) markerColor = 'red'
    else if (sig.description?.includes('Feu cassé')) markerColor = 'orange'
    else if (sig.description?.includes('Accident')) markerColor = 'darkred'

    const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`

    const marker = L.marker([sig.latitude, sig.longitude], {
      icon: L.icon({
        iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: sig.description,
    }).addTo(map!)

    // Popup avec informations
    const popupContent = `
      <div style="width: 250px;">
        <strong>${sig.description}</strong><br>
        <p style="margin: 8px 0; font-size: 12px;">
          ${sig.description?.substring(0, 50) || 'Pas de description'}...
        </p>
        <small style="color: #999;">
          Statut: ${sig.id_statut || 'En attente'}<br>
          ${isMine ? '<strong style="color: #0070cc;">C\'est mon signalement</strong>' : ''}
        </small>
      </div>
    `

    marker.bindPopup(popupContent)

    markers.value.set(sig.id, marker)
  })
}

/**
 * Bascule le filtre pour afficher uniquement mes signalements
 */
const toggleMySignalements = () => {
  showOnlyMine.value = !showOnlyMine.value
  try { localStorage.setItem(FILTER_KEY, String(showOnlyMine.value)) } catch {}
  displaySignalements()
}

/**
 * Centre la carte sur la position de l'utilisateur
 */
const centerMapOnUser = () => {
  if (map && latitude.value && longitude.value) {
    map.setView([latitude.value, longitude.value], 13)
  }
}

/**
 * Formate une date Timestamp
 */
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate?.() || new Date(timestamp)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Cycle de vie
onMounted(async () => {
  // Attendre que la géolocalisation soit prête
  setTimeout(() => {
    initializeMap()
  }, 500)

  // Initialiser les notifications
  await initNotifications()

  // Restaurer le filtre depuis localStorage
  try {
    const raw = localStorage.getItem(FILTER_KEY)
    if (raw !== null) showOnlyMine.value = raw === 'true'
  } catch {}

  // Initialiser FCM web token et l'enregistrer côté serveur (si VAPID key présente)
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
    if (vapidKey && auth.currentUser) {
      const token = await initMessaging(vapidKey)
      if (token) {
        await saveFcmToken(auth.currentUser.uid, token)
      }
    }
  } catch (err) {
    console.warn('FCM init/register failed:', err)
  }
  // Listen to foreground FCM messages and show local notification
  try {
    onForegroundMessageListener((payload: any) => {
      const title = payload?.notification?.title || 'Mise à jour signalement'
      const body = payload?.notification?.body || payload?.data?.message || ''
      try { sendLocalNotification(title, body) } catch (e) { console.warn('sendLocalNotification failed', e) }
    })
  } catch (err) {
    console.warn('Could not register foreground message listener:', err)
  }
})

// Recharger les signalements lorsque l'utilisateur change (login/logout)
onAuthStateChangeListener(async () => {
  try { await loadSignalements() } catch (e) { console.warn('reload signalements after auth change failed', e) }
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  markers.value.clear()
})
</script>

<style scoped>
.controls-container {
  padding: 8px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.map-wrapper {
  height: calc(100vh - 200px);
  width: 100%;
}

.legend {
  position: absolute;
  bottom: 20px;
  left: 10px;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 400;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 500;
}
</style>
