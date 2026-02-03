<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>Détails du signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="isLoading" class="loading-overlay">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="signalement">
        <!-- Informations principales -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ signalement.description.split(']')[1]?.trim() || signalement.description }}</ion-card-title>
            <ion-card-subtitle>
              <ion-badge :color="getStatusColor(signalement.id_statut)">
                {{ signalement.id_statut || 'EN_ATTENTE' }}
              </ion-badge>
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <strong>Surface:</strong><br>{{ signalement.surface }} m²
                </ion-col>
                <ion-col size="6">
                  <strong>Budget:</strong><br>{{ signalement.budget }} €
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="12">
                  <strong>Entreprise concernée:</strong><br>{{ signalement.entreprise_concerne || 'Non spécifiée' }}
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="12">
                  <strong>Date:</strong><br>{{ formatDate(signalement.date_signalement) }}
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="12">
                  <strong>Position:</strong><br>{{ signalement.latitude.toFixed(6) }}, {{ signalement.longitude.toFixed(6) }}
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Carte du signalement -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Localisation</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div ref="mapElement" style="height: 300px; border-radius: 8px;"></div>
          </ion-card-content>
        </ion-card>

        <!-- Photos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Photos ({{ photos.length }})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="photos.length === 0" style="text-align: center; color: #999;">
              <p>Aucune photo</p>
            </div>
            <ion-grid v-else>
              <ion-row>
                <ion-col size="6" v-for="(photo, index) in photos" :key="index">
                  <img 
                    :src="photo.url" 
                    :alt="`Photo ${index + 1}`"
                    style="width: 100%; border-radius: 8px; cursor: pointer;"
                    @click="openPhotoModal(photo.url)"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Historique des changements de statut -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Historique des statuts</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="statusChanges.length === 0" style="text-align: center; color: #999;">
              <p>Aucun changement de statut</p>
            </div>
            <ion-list v-else>
              <ion-item v-for="change in statusChanges" :key="change.id">
                <ion-label>
                  <h3>{{ change.ancienStatut }} → {{ change.nouveauStatut }}</h3>
                  <p>{{ formatDate(change.dateChangement) }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Bouton de suppression si c'est mon signalement -->
        <div v-if="isMine" style="padding: 16px;">
          <ion-button expand="block" color="danger" @click="deleteSignalement">
            <ion-icon :icon="trashOutline" slot="start"></ion-icon>
            Supprimer le signalement
          </ion-button>
        </div>
      </div>

      <div v-else style="text-align: center; padding: 20px;">
        <p>Signalement non trouvé</p>
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

    <!-- Modal photo -->
    <ion-modal :is-open="showPhotoModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="end">
            <ion-button @click="showPhotoModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <img v-if="selectedPhotoUrl" :src="selectedPhotoUrl" style="width: 100%; height: auto; border-radius: 8px;" />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import L from 'leaflet'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon, IonSpinner, IonToast,
  IonBadge, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, IonModal
} from '@ionic/vue'
import { trashOutline, closeOutline } from 'ionicons/icons'
import { 
  getDoc, 
  doc, 
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore'
import { auth, getPhotosForSignalement } from '@/firebase/firebase'

const router = useRouter()
const route = useRoute()
const db = getFirestore()
const mapElement = ref<HTMLDivElement>()
let map: L.Map | null = null

// État
const signalement = ref<any>(null)
const photos = ref<any[]>([])
const statusChanges = ref<any[]>([])
const isLoading = ref<boolean>(true)
const errorMessage = ref<string>('')
const isMine = ref<boolean>(false)
const showPhotoModal = ref<boolean>(false)
const selectedPhotoUrl = ref<string>('')

/**
 * Charge les détails du signalement
 */
const loadSignalement = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const signalementId = route.params.id as string

    // Récupérer le signalement
    const sigRef = doc(db, 'signalements', signalementId)
    const sigSnap = await getDoc(sigRef)

    if (!sigSnap.exists()) {
      errorMessage.value = 'Signalement non trouvé'
      return
    }

    signalement.value = {
      id: sigSnap.id,
      latitude: sigSnap.data().location?.latitude || 0,
      longitude: sigSnap.data().location?.longitude || 0,
      ...sigSnap.data()
    }

    // Vérifier si c'est mon signalement
    isMine.value = auth.currentUser?.uid === signalement.value.id_utilisateur

    // Charger les photos
    const photosData = await getPhotosForSignalement(signalementId)
    photos.value = photosData as any[]

    // Charger l'historique des changements de statut
    const changesQ = query(
      collection(db, 'statut_changes'),
      where('signalementId', '==', signalementId)
    )
    const changesSnap = await getDocs(changesQ)
    statusChanges.value = changesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Initialiser la carte
    setTimeout(() => {
      initializeMap()
    }, 500)
  } catch (err: any) {
    console.error('Erreur chargement signalement:', err)
    errorMessage.value = `Erreur: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

/**
 * Initialise la carte Leaflet
 */
const initializeMap = () => {
  if (!mapElement.value || !signalement.value || map) return

  map = L.map(mapElement.value).setView(
    [signalement.value.latitude, signalement.value.longitude],
    16
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // Marqueur du signalement
  L.marker([signalement.value.latitude, signalement.value.longitude], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  }).addTo(map).bindPopup(signalement.value.description)
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

/**
 * Retourne la couleur du badge en fonction du statut
 */
const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    'EN_ATTENTE': 'warning',
    'EN_TRAITEMENT': 'primary',
    'TRAITE': 'success',
    'REJETE': 'danger',
    'CLOTURE': 'medium'
  }
  return colors[status] || 'medium'
}

/**
 * Ouvre le modal photo
 */
const openPhotoModal = (url: string) => {
  selectedPhotoUrl.value = url
  showPhotoModal.value = true
}

/**
 * Supprime le signalement
 */
const deleteSignalement = async () => {
  if (!isMine.value || !signalement.value) return

  try {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement?')
    if (!confirmed) return

    await deleteDoc(doc(db, 'signalements', signalement.value.id))

    // Supprimer les photos aussi
    for (const photo of photos.value) {
      await deleteDoc(doc(db, 'photos', photo.id))
    }

    router.back()
  } catch (err: any) {
    errorMessage.value = `Erreur suppression: ${err.message}`
    console.error(err)
  }
}

// Cycle de vie
onMounted(() => {
  loadSignalement()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

ion-card {
  margin: 16px 8px;
}

img {
  width: 100%;
  height: auto;
}
</style>
