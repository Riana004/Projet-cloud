<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tests de Diagnostic</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h1>🧪 Tests Applicatif</h1>
      
      <div class="test-section">
        <h2>1. Test API Backend</h2>
        <ion-button @click="testAPI" color="primary">
          Tester connexion API
        </ion-button>
        <div v-if="apiTest.status" :class="apiTest.success ? 'success' : 'error'">
          <p>{{ apiTest.status }}</p>
        </div>
      </div>

      <div class="test-section">
        <h2>2. Test Signalements</h2>
        <ion-button @click="testSignalements" color="primary">
          Charger signalements
        </ion-button>
        <div v-if="signalementTest.data" class="success">
          <p>✅ {{ signalementTest.data.length }} signalements chargés</p>
        </div>
        <div v-if="signalementTest.error" class="error">
          <p>❌ {{ signalementTest.error }}</p>
        </div>
      </div>

      <div class="test-section">
        <h2>3. Navigation</h2>
        <ion-button @click="goToCarte" color="success">
          Aller à CartePage
        </ion-button>
      </div>

      <div class="debug-info">
        <h3>Info Debug</h3>
        <p>API URL: {{ apiUrl }}</p>
        <p>Environment: {{ environment }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue'
import signalementApi from '../api/signalement.api'
import { API_CONFIG } from '../config'

const router = useRouter()

const apiUrl = ref(API_CONFIG.API_BASE_URL)
const environment = ref(import.meta.env.MODE)

const apiTest = ref({
  status: '',
  success: false
})

const signalementTest = ref({
  data: null as any,
  error: ''
})

const testAPI = async () => {
  try {
    apiTest.value.status = '⏳ Test en cours...'
    const response = await signalementApi.getAllSignalements()
    apiTest.value.status = '✅ API connectée avec succès'
    apiTest.value.success = true
    console.log('API Response:', response.data)
  } catch (error: any) {
    apiTest.value.status = `❌ Erreur API: ${error.message}`
    apiTest.value.success = false
    console.error('API Error:', error)
  }
}

const testSignalements = async () => {
  try {
    signalementTest.value.error = ''
    signalementTest.value.data = null
    const response = await signalementApi.getAllSignalements()
    signalementTest.value.data = response.data
    console.log('Signalements:', response.data)
  } catch (error: any) {
    signalementTest.value.error = error.message
    console.error('Signalements Error:', error)
  }
}

const goToCarte = () => {
  router.push('/carte')
}

onMounted(() => {
  console.log('✅ TestPage montée')
  console.log('API URL:', apiUrl.value)
})
</script>

<style scoped>
h1 {
  text-align: center;
  color: #007bff;
  margin-bottom: 20px;
}

h2 {
  color: #333;
  font-size: 16px;
  margin-top: 10px;
}

.test-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.debug-info {
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  font-family: monospace;
  font-size: 12px;
}

ion-button {
  width: 100%;
}
</style>
