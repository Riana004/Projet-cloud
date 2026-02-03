<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <h1> Signalements Routiers</h1>
        
        <form @submit.prevent="login">
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input
              v-model="email"
              type="email"
              placeholder="votre.email@example.com"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input
              v-model="password"
              type="password"
              placeholder="Votre mot de passe"
              required
            ></ion-input>
          </ion-item>

          <ion-button expand="block" type="submit" :disabled="loading" class="login-btn">
            <span v-if="!loading">Se connecter</span>
            <span v-else>Chargement...</span>
          </ion-button>
        </form>

        <div v-if="error" class="error-message">
          <p style="color: red;">{{ error }}</p>
        </div>

        <div class="separator">
          <p>ou</p>
        </div>

        <ion-button expand="block" fill="outline" @click="goToSignup">
          Créer un compte
        </ion-button>

        <ion-button expand="block" fill="clear" @click="loginAsVisitor">
          Continuer en tant que visiteur
        </ion-button>

        <!-- Bouton de test pour vérifier le statut -->
        <ion-button 
          v-if="email" 
          expand="block" 
          fill="outline" 
          color="warning" 
          @click="checkStatus"
          style="margin-top: 20px;"
        >
          🔍 Vérifier le statut de ce compte
        </ion-button>

        <ion-button
          v-if="email"
          expand="block"
          color="danger"
          @click="forceDisable(true)"
          style="margin-top: 10px;"
        >
           Désactiver ce compte
        </ion-button>

        <ion-button
          v-if="email"
          expand="block"
          color="success"
          @click="forceDisable(false)"
          style="margin-top: 10px;"
        >
           Réactiver ce compte
        </ion-button>

        <div v-if="statusInfo" class="status-info" style="margin-top: 15px; padding: 10px; border-radius: 8px; background: #f0f0f0;">
          <p style="margin: 5px 0;"><strong> Email:</strong> {{ statusInfo.email }}</p>
          <p style="margin: 5px 0;"><strong> Tentatives:</strong> {{ statusInfo.attempts }}/3</p>
          <p style="margin: 5px 0;"><strong> Statut:</strong> 
            <span :style="{ color: statusInfo.disabled ? 'red' : 'green', fontWeight: 'bold' }">
              {{ statusInfo.disabled ? ' BLOQUÉ' : ' ACTIF' }}
            </span>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton
} from '@ionic/vue'
import { auth, registerFailedLogin, resetLoginAttempts, checkUserStatus, updateFirebaseUserStatus } from '@/firebase/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const statusInfo = ref<any>(null)

const MAX_ATTEMPTS = 3

const login = async () => {
  error.value = ''
  loading.value = true

  try {
    const status = await checkUserStatus(email.value)
    if (status.disabled || status.attempts >= MAX_ATTEMPTS) {
      error.value = 'Compte bloqué après plusieurs tentatives. Contactez un administrateur.'
      statusInfo.value = {
        email: email.value,
        attempts: status.attempts,
        disabled: true
      }
      return
    }

    await signInWithEmailAndPassword(auth, email.value, password.value)
    await resetLoginAttempts(email.value)
    statusInfo.value = null
    router.push('/carte')
  } catch (err: any) {
    let recorded: { attempts: number; disabled: boolean } | null = null

    try {
      recorded = await registerFailedLogin(email.value)
      const reachedLimit = recorded.disabled || recorded.attempts >= MAX_ATTEMPTS
      if (reachedLimit) {
        error.value = 'Compte bloqué après plusieurs tentatives. Contactez un administrateur.'
        statusInfo.value = { email: email.value, attempts: recorded.attempts, disabled: true }
        return
      }
    } catch (fnErr) {
      console.error('Erreur lors de l’enregistrement des tentatives:', fnErr)
    }

    if (err.code === 'auth/user-not-found') {
      error.value = 'Utilisateur non trouvé'
    } else if (err.code === 'auth/wrong-password') {
      error.value = 'Mot de passe incorrect'
    } else if (err.code === 'auth/user-disabled') {
      error.value = 'Compte désactivé. Contactez un administrateur.'
    } else if (err.code === 'auth/too-many-requests') {
      error.value = 'Trop de tentatives. Réessayez plus tard ou contactez un administrateur.'
    } else {
      error.value = err.message
    }

    if (recorded && !recorded.disabled) {
      error.value += ` (${recorded.attempts}/${MAX_ATTEMPTS})`
      statusInfo.value = {
        email: email.value,
        attempts: recorded.attempts,
        disabled: false
      }
    }
  } finally {
    loading.value = false
  }
}

const goToSignup = () => {
  router.push('/signup')
}

const loginAsVisitor = () => {
  router.push('/carte')
}

const checkStatus = async () => {
  if (!email.value) {
    error.value = 'Veuillez entrer un email d\'abord'
    return
  }
  
  try {
    statusInfo.value = null
    error.value = ''
    loading.value = true
    
    const status = await checkUserStatus(email.value)

    statusInfo.value = {
      email: email.value,
      attempts: status.attempts,
      disabled: status.disabled
    }

    if (!status.exists) {
      error.value = 'Aucune tentative enregistrée pour ce compte.'
    }

    console.log('Statut complet:', status)
  } catch (err: any) {
    error.value = 'Erreur lors de la vérification: ' + err.message
    console.error('Erreur:', err)
  } finally {
    loading.value = false
  }
}

const forceDisable = async (disable: boolean) => {
  if (!email.value) {
    error.value = 'Veuillez entrer un email d\'abord'
    return
  }

  try {
    loading.value = true
    error.value = ''
    const result = await updateFirebaseUserStatus(email.value, disable)
    statusInfo.value = {
      email: email.value,
      attempts: result.attempts,
      disabled: result.disabled
    }
  } catch (err: any) {
    error.value = 'Erreur mise à jour statut: ' + (err?.message || err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 40px;
}

h1 {
  text-align: center;
  font-size: 28px;
  margin-bottom: 30px;
  color: #007bff;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.login-btn {
  margin-top: 20px;
}

.error-message {
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  background-color: #ffe6e6;
  border-radius: 4px;
}

.separator {
  text-align: center;
  margin: 25px 0;
  position: relative;
}

.separator p {
  margin: 0;
  color: #999;
  font-size: 12px;
}
</style>