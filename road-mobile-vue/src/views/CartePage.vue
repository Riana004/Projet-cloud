<!---<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showFilters = !showFilters">
            <ion-icon :icon="filterOutline"></ion-icon>
          </ion-button>
          <ion-button router-link="/signalement">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Filtres -->
      <!---<ion-toolbar v-if="showFilters">
        <ion-segment v-model="filterMode" @ionChange="applyFilter">
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mine">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="map"></div>

      <!-- Bouton de recentrage -->
      <!---<ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="centerOnUser">
          <ion-icon :icon="locateOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonFab, IonFabButton, IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue'
import { filterOutline, addOutline, locateOutline } from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, auth } from '@/firebase/firebase'

// Fix des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

let map: L.Map
let userMarker: L.Marker | null = null
let userPosition: { lat: number; lng: number } | null = null
const signalementMarkers: L.Marker[] = []

const showFilters = ref(false)
const filterMode = ref('all')

// Icônes personnalisées pour les signalements
const signalementIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const mySignalementIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

onMounted(async () => {
  // Initialisation de la carte
  map = L.map('map').setView([-18.8792, 47.5079], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map)

  // Récupération et affichage de la position utilisateur
  try {
    const position = await getCurrentPosition()
    userPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }

    userMarker = L.marker([userPosition.lat, userPosition.lng])
      .addTo(map)
      .bindPopup('📍 Vous êtes ici')
      .openPopup()

    map.setView([userPosition.lat, userPosition.lng], 15)
  } catch (error) {
    console.error('Erreur GPS:', error)
    alert('Impossible de récupérer votre position. Veuillez activer le GPS.')
  }

  // Charger les signalements
  await loadSignalements()
})

// Promisifier la géolocalisation
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })
  })
}

// Charger les signalements depuis Firebase
async function loadSignalements() {
  try {
    // Supprimer les anciens marqueurs
    signalementMarkers.forEach(marker => marker.remove())
    signalementMarkers.length = 0

    let q
    if (filterMode.value === 'mine' && auth.currentUser) {
      // Filtrer par utilisateur connecté
      q = query(
        collection(db, 'signalements'),
        where('userId', '==', auth.currentUser.uid)
      )
    } else {
      // Tous les signalements
      q = collection(db, 'signalements')
    }

    const snapshot = await getDocs(q)

    snapshot.forEach(doc => {
      const data = doc.data()
      
      // Vérifier si c'est un signalement de l'utilisateur connecté
      const isMine = auth.currentUser && data.userId === auth.currentUser.uid
      const icon = isMine ? mySignalementIcon : signalementIcon

      const marker = L.marker([data.latitude, data.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${isMine ? '#3880ff' : '#eb445a'};">
              ${data.type}
            </h3>
            <p style="margin: 4px 0;"><strong>Description:</strong> ${data.description}</p>
            <p style="margin: 4px 0;"><strong>Statut:</strong> ${data.status || 'nouveau'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${data.date ? new Date(data.date.seconds * 1000).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </p>
            ${isMine ? '<p style="margin: 4px 0; color: #3880ff; font-weight: bold;">🔵 Votre signalement</p>' : ''}
          </div>
        `)

      signalementMarkers.push(marker)
    })

    console.log(`✅ ${snapshot.size} signalement(s) chargé(s)`)
  } catch (error) {
    console.error('❌ Erreur chargement signalements:', error)
    alert('Erreur lors du chargement des signalements')
  }
}

// Appliquer le filtre
function applyFilter() {
  loadSignalements()
}

// Recentrer sur l'utilisateur
function centerOnUser() {
  if (userPosition) {
    map.setView([userPosition.lat, userPosition.lng], 15)
    if (userMarker) {
      userMarker.openPopup()
    }
  } else {
    alert('Position non disponible')
  }
}
</script>

<style scoped>
#map {
  height: 100%;
  width: 100%;
}
</style>-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonFab, IonFabButton, IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue'
import { filterOutline, addOutline, locateOutline } from 'ionicons/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

let map: L.Map
let userMarker: L.Marker | null = null
let userPosition: { lat: number; lng: number } | null = null
const signalementMarkers: L.Marker[] = []

const showFilters = ref(false)
const filterMode = ref('all')

// DONNÉES EN DUR POUR TEST
const mockUser = {
  uid: 'user-test-123',
  email: 'test@example.com'
}

// Signalements de test
const mockSignalements = [
  {
    id: 'sig-1',
    type: 'Nid de poule',
    description: 'Grand nid de poule sur la route principale, dangereux pour les véhicules',
    latitude: -18.8792,
    longitude: 47.5079,
    status: 'nouveau',
    date: '2024-01-15T10:30:00Z',
    userId: 'user-test-123',
    userEmail: 'test@example.com'
  },
  {
    id: 'sig-2',
    type: 'Feu cassé',
    description: 'Feu tricolore ne fonctionne plus au carrefour',
    latitude: -18.8800,
    longitude: 47.5085,
    status: 'en cours',
    date: '2024-01-14T14:20:00Z',
    userId: 'user-456',
    userEmail: 'autre@example.com'
  },
  {
    id: 'sig-3',
    type: 'Embouteillage',
    description: 'Embouteillage important due à un accident',
    latitude: -18.8785,
    longitude: 47.5065,
    status: 'résolu',
    date: '2024-01-13T08:15:00Z',
    userId: 'user-test-123',
    userEmail: 'test@example.com'
  },
  {
    id: 'sig-4',
    type: 'Travaux',
    description: 'Travaux de voirie en cours, circulation réduite',
    latitude: -18.8810,
    longitude: 47.5090,
    status: 'nouveau',
    date: '2024-01-16T09:00:00Z',
    userId: 'user-789',
    userEmail: 'travaux@example.com'
  },
  {
    id: 'sig-5',
    type: 'Route bloquée',
    description: 'Arbre tombé sur la route, passage impossible',
    latitude: -18.8770,
    longitude: 47.5050,
    status: 'en cours',
    date: '2024-01-15T16:45:00Z',
    userId: 'user-999',
    userEmail: 'urgence@example.com'
  }
]

// Icônes personnalisées
const signalementIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const mySignalementIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

onMounted(async () => {
  // Initialiser localStorage avec les données de test
  if (!localStorage.getItem('mockSignalements')) {
    localStorage.setItem('mockSignalements', JSON.stringify(mockSignalements))
  }

  // Initialisation de la carte
  map = L.map('map').setView([-18.8792, 47.5079], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map)

  // Position utilisateur en dur
  userPosition = {
    lat: -18.8792,
    lng: 47.5079
  }

  userMarker = L.marker([userPosition.lat, userPosition.lng])
    .addTo(map)
    .bindPopup('📍 Vous êtes ici')
    .openPopup()

  map.setView([userPosition.lat, userPosition.lng], 15)

  // Charger les signalements
  await loadSignalements()
})

// Charger les signalements depuis localStorage
async function loadSignalements() {
  try {
    // Supprimer les anciens marqueurs
    signalementMarkers.forEach(marker => marker.remove())
    signalementMarkers.length = 0

    // Récupérer les signalements depuis localStorage
    const savedSignalements = JSON.parse(localStorage.getItem('mockSignalements') || '[]')
    let signalementsToShow = savedSignalements

    // Appliquer le filtre
    if (filterMode.value === 'mine') {
      signalementsToShow = savedSignalements.filter(
        (sig: any) => sig.userId === mockUser.uid
      )
    }

    // Ajouter les marqueurs
    signalementsToShow.forEach((sig: any) => {
      const isMine = sig.userId === mockUser.uid
      const icon = isMine ? mySignalementIcon : signalementIcon

      const marker = L.marker([sig.latitude, sig.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${isMine ? '#3880ff' : '#eb445a'};">
              ${sig.type}
            </h3>
            <p style="margin: 4px 0;"><strong>Description:</strong> ${sig.description}</p>
            <p style="margin: 4px 0;"><strong>Statut:</strong> ${sig.status || 'nouveau'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${sig.date ? new Date(sig.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </p>
            ${isMine ? '<p style="margin: 4px 0; color: #3880ff; font-weight: bold;">🔵 Votre signalement</p>' : ''}
          </div>
        `)

      signalementMarkers.push(marker)
    })

    console.log(`✅ ${signalementsToShow.length} signalement(s) chargé(s)`)
  } catch (error) {
    console.error('❌ Erreur chargement signalements:', error)
    alert('Erreur lors du chargement des signalements')
  }
}

// Appliquer le filtre
function applyFilter() {
  loadSignalements()
}

// Recentrer sur l'utilisateur
function centerOnUser() {
  if (userPosition) {
    map.setView([userPosition.lat, userPosition.lng], 15)
    if (userMarker) {
      userMarker.openPopup()
    }
  } else {
    alert('Position non disponible')
  }
}
</script>