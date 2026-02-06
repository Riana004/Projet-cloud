<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/carte"></ion-back-button>
        </ion-buttons>
        <ion-title>Nouveau signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- État de la géolocalisation -->
      <ion-card v-if="geoStatus" :color="geoStatus === 'success' ? 'success' : 'warning'">
        <ion-card-content>
          <ion-icon 
            :icon="geoStatus === 'success' ? checkmarkCircle : warningOutline"
            style="margin-right: 8px"
          ></ion-icon>
          {{ geoMessage }} 
        </ion-card-content>
      </ion-card>

      <!-- Carte interactive Leaflet -->
      <div class="map-container" v-if="!showFormOnly">
        <div id="map" ref="mapElement" style="height: 300px; margin-bottom: 16px; border-radius: 8px;"></div>
        <p style="font-size: 12px; color: #666; text-align: center;">
          Cliquez sur la carte pour sélectionner la position du problème
        </p>
      </div>

      <!-- Position GPS sélectionnée -->
      <ion-card v-if="selectedLat && selectedLng">
        <ion-card-header>
          <ion-card-title>Position sélectionnée</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>
            <strong>Latitude:</strong> {{ selectedLat.toFixed(6) }}<br>
            <strong>Longitude:</strong> {{ selectedLng.toFixed(6) }}<br>
            <strong>Précision:</strong> {{ geoAccuracy ? `${Math.round(geoAccuracy)}m` : 'N/A' }}
          </p>
          <ion-button expand="block" fill="outline" size="small" @click="useCurrentLocation">
            <ion-icon :icon="navigateOutline" slot="start"></ion-icon>
            Utiliser ma position actuelle
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Type de problème -->
      <ion-item>
        <ion-label position="floating">Type de problème *</ion-label>
        <ion-select v-model="problemType" interface="action-sheet" placeholder="Choisir">
          <ion-select-option value="Nid de poule">🕳️ Nid de poule</ion-select-option>
          <ion-select-option value="Feu cassé">🚦 Feu cassé</ion-select-option>
          <ion-select-option value="Accident">💥 Accident</ion-select-option>
          <ion-select-option value="Embouteillage">🚗 Embouteillage</ion-select-option>
          <ion-select-option value="Route bloquée">🚫 Route bloquée</ion-select-option>
          <ion-select-option value="Travaux">🏗️ Travaux</ion-select-option>
          <ion-select-option value="Autre">❓ Autre</ion-select-option>
        </ion-select>
      </ion-item>

      <!-- Description -->
      <ion-item>
        <ion-label position="floating">Description *</ion-label>
        <ion-textarea
          v-model="description"
          :rows="3"
          placeholder="Décrivez le problème en détail..."
        ></ion-textarea>
      </ion-item>

      <!-- Surface et Budget -->
      <ion-row>
        <ion-col size="6">
          <ion-item>
            <ion-label position="floating">Surface (m²) *</ion-label>
            <ion-input v-model.number="surface" type="number" placeholder="Estimation"></ion-input>
          </ion-item>
        </ion-col>
        <ion-col size="6">
          <ion-item>
            <ion-label position="floating">Budget (€) *</ion-label>
            <ion-input v-model.number="budget" type="number" placeholder="Estimation"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>

      <!-- Entreprise concernée -->
      <ion-item>
        <ion-label position="floating">Entreprise concernée</ion-label>
        <ion-input v-model="entreprise" type="text" placeholder="Optionnel"></ion-input>
      </ion-item>

      <!-- Ajouter des photos -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Photos ({{ photosCount }}/5)</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="6">
              <ion-button 
                expand="block" 
                fill="outline"
                @click="capturePhoto"
                :disabled="photosCount >= 5 || isUploadingPhotos"
              >
                <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
                Prendre photo
              </ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button 
                expand="block"
                fill="outline"
                @click="selectPhotoFromGallery"
                :disabled="photosCount >= 5 || isUploadingPhotos"
              >
                <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                Galerie
              </ion-button>
            </ion-col>
          </ion-row>

          <!-- Afficher les photos -->
          <div v-if="photos.length > 0" style="margin-top: 16px;">
            <ion-grid>
              <ion-row>
                <ion-col size="4" v-for="(photo, index) in photos" :key="photo.id">
                  <div class="photo-preview">
                    <img :src="photo.url" :alt="`Photo ${index + 1}`" />
                    <ion-button 
                      size="small"
                      fill="clear"
                      color="danger"
                      @click="removePhoto(photo.id)"
                      style="margin: 0; position: absolute; top: 0; right: 0;"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </div>

          <ion-text v-if="uploadError" color="danger">
            <p>{{ uploadError }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <!-- Message d'erreur général -->
      <ion-text v-if="errorMessage" color="danger">
        <p>{{ errorMessage }}</p>
      </ion-text>

      <!-- Bouton d'envoi -->
      <ion-button 
        expand="block" 
        @click="submitSignalement"
        :disabled="!isFormValid || loading"
        style="margin-top: 20px; margin-bottom: 20px;"
        size="large"
      >
        <ion-spinner v-if="loading" name="crescent" style="margin-right: 8px;"></ion-spinner>
        <span v-else>Envoyer le signalement</span>
      </ion-button>

      <!-- Toast de succès -->
      <ion-toast
        :is-open="showSuccessToast"
        message="✅ Signalement envoyé avec succès!"
        :duration="2000"
        color="success"
        @didDismiss="showSuccessToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonSelect, IonSelectOption, IonTextarea,
  IonButton, IonButtons, IonBackButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonIcon, IonText, IonSpinner, IonToast,
  IonInput, IonRow, IonCol, IonGrid
} from '@ionic/vue'
import {
  checkmarkCircle, warningOutline, refreshOutline, cameraOutline,
  imageOutline, closeOutline, navigateOutline
} from 'ionicons/icons'
import { auth, createSignalement, updateSignalementWithPhotos } from '@/firebase/firebase'
import { useGeolocationMap } from '@/composables/useGeolocationMap'
import { useSignalementPhotos } from '@/composables/useSignalementPhotos'

const router = useRouter()
const mapElement = ref<HTMLDivElement>()
let map: L.Map | null = null
let marker: L.Marker | null = null

// Géolocalisation
const { 
  latitude: geoLat, 
  longitude: geoLng, 
  accuracy: geoAccuracy,
  isLoading: geoLoading,
  error: geoError,
  getCurrentPosition
} = useGeolocationMap()

// Photos
const {
  photos,
  photosCount,
  isUploading: isUploadingPhotos,
  uploadError,
  capturePhoto: capturePhotoAction,
  selectPhotoFromGallery: selectPhotoAction,
  uploadAllPhotos,
  removePhoto: removePhotoAction,
  getUploadedPhotoUrls
} = useSignalementPhotos()

// Formulaire
const problemType = ref('')
const description = ref('')
const surface = ref<number | null>(null)
const budget = ref<number | null>(null)
const entreprise = ref('')
const selectedLat = ref<number | null>(null)
const selectedLng = ref<number | null>(null)
const errorMessage = ref('')
const loading = ref(false)
const showSuccessToast = ref(false)
const showFormOnly = ref(true)
const geoStatus = ref<'loading' | 'success' | 'error' | null>('loading')
const geoMessage = ref('Récupération de votre position...')

const isFormValid = computed(() => {
  return (
    problemType.value &&
    description.value.trim() &&
    surface.value && surface.value > 0 &&
    budget.value && budget.value > 0 &&
    selectedLat.value &&
    selectedLng.value &&
    auth.currentUser
  )
})

onMounted(async () => {
  try {
    // Récupérer la position GPS
    const pos = await getCurrentPosition()
    
    if (pos && pos.latitude && pos.longitude) {
      selectedLat.value = pos.latitude
      selectedLng.value = pos.longitude
      geoStatus.value = 'success'
      geoMessage.value = `✅ Position récupérée (précision: ${Math.round(geoAccuracy.value || 0)}m)`
      
      // Initialiser la carte
      setTimeout(() => {
        initializeMap()
      }, 100)
    } else {
      geoStatus.value = 'error'
      geoMessage.value = '⚠️ Impossible de récupérer votre position'
    }
  } catch (err) {
    console.error('Erreur initialisation:', err)
    geoStatus.value = 'error'
    geoMessage.value = '⚠️ Géolocalisation indisponible. Utilisez la carte pour sélectionner votre position.'
  }
})

const initializeMap = () => {
  if (!mapElement.value || !selectedLat.value || !selectedLng.value) return

  if (map) {
    map.remove()
  }

  map = L.map(mapElement.value).setView([selectedLat.value, selectedLng.value], 16)

  // Couche OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // Marker pour la position sélectionnée
  addMarker(selectedLat.value, selectedLng.value)

  // Événement clic pour sélectionner une position
  map.on('click', (e: any) => {
    selectedLat.value = e.latlng.lat
    selectedLng.value = e.latlng.lng
    addMarker(e.latlng.lat, e.latlng.lng)
  })

  showFormOnly.value = false
}

const addMarker = (lat: number, lng: number) => {
  if (!map) return

  if (marker) {
    map.removeLayer(marker)
  }

  marker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    })
  }).addTo(map)
  
  marker.bindPopup(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
}

const useCurrentLocation = async () => {
  try {
    await getCurrentPosition()
    if (geoLat.value && geoLng.value) {
      selectedLat.value = geoLat.value
      selectedLng.value = geoLng.value
      if (map) {
        map.setView([geoLat.value, geoLng.value], 16)
        addMarker(geoLat.value, geoLng.value)
      }
    }
  } catch (err) {
    errorMessage.value = 'Impossible de récupérer votre position actuelle'
  }
}

const capturePhoto = async () => {
  try {
    await capturePhotoAction()
  } catch (err) {
    console.error('Erreur capture:', err)
  }
}

const selectPhotoFromGallery = async () => {
  try {
    await selectPhotoAction()
  } catch (err) {
    console.error('Erreur galerie:', err)
  }
}

const removePhoto = (photoId: string) => {
  removePhotoAction(photoId)
}

const submitSignalement = async () => {
  errorMessage.value = ''

  if (!isFormValid.value) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires'
    return
  }

  if (!auth.currentUser) {
    errorMessage.value = 'Vous devez être connecté'
    return
  }

  loading.value = true

  try {
    // Créer le signalement
    const signalementId = await createSignalement({
      id_utilisateur: auth.currentUser.uid,
      description: `[${problemType.value}] ${description.value.trim()}`,
      latitude: selectedLat.value!,
      longitude: selectedLng.value!,
      surface: surface.value || 0,
      budget: budget.value || 0,
      entreprise_concerne: entreprise.value.trim() || 'Non spécifiée',
      id_statut: null,
      is_dirty: false
    })

    // Uploader les photos et mettre à jour le signalement
    let photoUrls: string[] = []
    if (photos.value.length > 0) {
      photoUrls = await uploadAllPhotos(signalementId)
      await updateSignalementWithPhotos(signalementId, photoUrls)
    }

    // Log final pour confirmer l'envoi du signalement et des photos
    try {
      console.log('✅ Signalement envoyé avec succès', { signalementId, photoUrls, uploadedFromClient: getUploadedPhotoUrls() })
    } catch (e) {
      console.warn('⚠️ Impossible d\'afficher le log final du signalement:', e)
    }

    // Réinitialiser le formulaire
    problemType.value = ''
    description.value = ''
    surface.value = null
    budget.value = null
    entreprise.value = ''
    showSuccessToast.value = true

    // Redirection
    setTimeout(() => {
      router.push('/carte')
    }, 1500)
  } catch (error: any) {
    console.error('Erreur:', error)
    errorMessage.value = `Erreur: ${error.message || 'Impossible de créer le signalement'}`
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-container {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

.photo-preview {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 8px;
}

.photo-preview img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

ion-card {
  margin: 16px 0;
}

ion-item {
  margin-bottom: 12px;
}

ion-row {
  margin-bottom: 12px;
}
</style>