<template>
  <ion-page>
    <ion-content class="ion-padding">

      <ion-input
        :value="email"
        @ionInput="email = $event.target.value"
        type="email"
        placeholder="Email"
        fill="outline"
        label="Email"
        label-placement="floating"
      />

      <ion-input
        :value="password"
        @ionInput="password = $event.target.value"
        type="password"
        placeholder="Mot de passe"
        fill="outline"
        label="Mot de passe"
        label-placement="floating"
        style="margin-top: 16px"
      />

      <ion-button expand="block" @click="login" style="margin-top: 20px">
        Se connecter
      </ion-button>

      <p v-if="errorMessage" style="color: red; margin-top: 10px">
        {{ errorMessage }}
      </p>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import { useRouter } from 'vue-router'
import type { FirebaseError } from 'firebase/app'
import { IonPage, IonContent, IonInput, IonButton } from '@ionic/vue'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()

const login = async () => {
  errorMessage.value = ''

  console.log('EMAIL:', email.value)
  console.log('PASSWORD:', password.value)

  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs'
    return
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value
    )

    console.log('✅ Connexion réussie!')
    router.push('/carte')

  } catch (error) {
    const err = error as FirebaseError
    console.error(' Erreur:', err.code, err.message)

    switch (err.code) {
      case 'auth/user-not-found':
        errorMessage.value = "Aucun compte n'existe avec cet email"
        break
      case 'auth/wrong-password':
        errorMessage.value = 'Mot de passe incorrect'
        break
      case 'auth/invalid-email':
        errorMessage.value = 'Email invalide'
        break
      case 'auth/invalid-credential':
        errorMessage.value = 'Email ou mot de passe incorrect'
        break
      default:
        errorMessage.value = `Erreur de connexion: ${err.code}`
    }
  }
}
</script>