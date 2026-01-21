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
      <!-- Indicateur de position GPS -->
      <ion-card v-if="gpsStatus" :color="gpsStatus === 'success' ? 'success' : 'warning'">
        <ion-card-content>
          <ion-icon :icon="gpsStatus === 'success' ? checkmarkCircle : warningOutline"></ion-icon>
          {{ gpsMessage }}
        </ion-card-content>
      </ion-card>

      <!-- Type de problème -->
      <ion-item>
        <ion-label position="floating">Type de problème *</ion-label>
        <ion-select v-model="type" interface="action-sheet" placeholder="Choisir">
          <ion-select-option value="Nid de poule">Nid de poule</ion-select-option>
          <ion-select-option value="Feu cassé">Feu cassé</ion-select-option>
          <ion-select-option value="Accident">Accident</ion-select-option>
          <ion-select-option value="Embouteillage">Embouteillage</ion-select-option>
          <ion-select-option value="Route bloquée">Route bloquée</ion-select-option>
          <ion-select-option value="Travaux">Travaux</ion-select-option>
          <ion-select-option value="Autre">Autre</ion-select-option>
        </ion-select>
      </ion-item>

      <!-- Description -->
      <ion-item>
        <ion-label position="floating">Description *</ion-label>
        <ion-textarea
          v-model="description"
          :rows="4"
          placeholder="Décrivez le problème..."
        ></ion-textarea>
      </ion-item>

      <!-- Position GPS -->
      <ion-item v-if="latitude && longitude">
        <ion-label>
          <h3>Position GPS</h3>
          <p>Lat: {{ latitude.toFixed(6) }}</p>
          <p>Lng: {{ longitude.toFixed(6) }}</p>
        </ion-label>
        <ion-button slot="end" fill="clear" @click="refreshPosition">
          <ion-icon :icon="refreshOutline"></ion-icon>
        </ion-button>
      </ion-item>

      <!-- Message d'erreur -->
      <ion-text v-if="errorMessage" color="danger">
        <p>{{ errorMessage }}</p>
      </ion-text>

      <!-- Bouton d'envoi -->
      <ion-button 
        expand="block" 
        @click="send"
        :disabled="loading || !latitude || !longitude"
        style="margin-top: 20px"
      >
        <ion-spinner v-if="loading" name="crescent"></ion-spinner>
        <span v-else>Envoyer le signalement</span>
      </ion-button>

      <!-- Message de succès -->
      <ion-toast
        :is-open="showSuccessToast"
        message="✅ Signalement envoyé avec succès !"
        :duration="2000"
        color="success"
        @didDismiss="showSuccessToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonSelect, IonSelectOption, IonTextarea,
  IonButton, IonButtons, IonBackButton, IonCard, IonCardContent,
  IonIcon, IonText, IonSpinner, IonToast
} from '@ionic/vue'
import { checkmarkCircle, warningOutline, refreshOutline } from 'ionicons/icons'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase/firebase'

const router = useRouter()

const type = ref('')
const description = ref('')
const latitude = ref(0)
const longitude = ref(0)
const errorMessage = ref('')
const loading = ref(false)
const gpsStatus = ref<'loading' | 'success' | 'error' | null>('loading')
const gpsMessage = ref('Récupération de votre position...')
const showSuccessToast = ref(false)

onMounted(() => {
  getPosition()
})

async function getPosition() {
  gpsStatus.value = 'loading'
  gpsMessage.value = 'Récupération de votre position...'

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    latitude.value = position.coords.latitude
    longitude.value = position.coords.longitude
    gpsStatus.value = 'success'
    gpsMessage.value = `📍 Position récupérée (précision: ${Math.round(position.coords.accuracy)}m)`
    
  } catch (error) {
    console.error('Erreur GPS:', error)
    gpsStatus.value = 'error'
    gpsMessage.value = '⚠️ Impossible de récupérer votre position. Activez le GPS.'
    errorMessage.value = 'GPS requis pour créer un signalement'
  }
}

async function refreshPosition() {
  await getPosition()
}

async function send() {
  errorMessage.value = ''

  // Validation des champs
  if (!type.value || type.value.trim() === '') {
    errorMessage.value = 'Veuillez sélectionner un type de problème'
    return
  }

  if (!description.value || description.value.trim() === '') {
    errorMessage.value = 'Veuillez entrer une description'
    return
  }

  if (!latitude.value || !longitude.value) {
    errorMessage.value = 'Position GPS non disponible'
    return
  }

  if (!auth.currentUser) {
    errorMessage.value = 'Vous devez être connecté'
    return
  }

  loading.value = true

  try {
    // Préparation des données
    const signalementData = {
      type: type.value.trim(),
      description: description.value.trim(),
      latitude: latitude.value,
      longitude: longitude.value,
      status: 'nouveau',
      date: Timestamp.now(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email || 'Anonyme'
    }

    // Enregistrement dans Firebase
    await addDoc(collection(db, 'signalements'), signalementData)

    console.log('✅ Signalement enregistré:', signalementData)

    // Réinitialisation du formulaire
    type.value = ''
    description.value = ''
    showSuccessToast.value = true

    // Retour à la carte après 1.5s
    setTimeout(() => {
      router.push('/carte')
    }, 1500)

  } catch (error) {
    console.error('❌ Erreur enregistrement:', error)
    errorMessage.value = 'Erreur réseau. Vérifiez votre connexion internet.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
ion-card {
  margin: 0 0 16px 0;
}

ion-card ion-icon {
  margin-right: 8px;
  vertical-align: middle;
}

ion-item {
  margin-bottom: 16px;
}
</style>