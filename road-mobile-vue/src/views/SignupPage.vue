<template>
  <div class="signup-container">
    <h1>Inscription</h1>
    <form @submit.prevent="signup">
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Votre email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Mot de passe:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Votre mot de passe"
          required
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirmer le mot de passe:</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="Confirmez votre mot de passe"
          required
        />
      </div>
      <div class="form-group">
        <label for="fullName">Nom complet:</label>
        <input
          id="fullName"
          v-model="fullName"
          type="text"
          placeholder="Votre nom complet"
          required
        />
      </div>
      <button type="submit">S'inscrire</button>
      <router-link to="/login">Déjà inscrit ? Se connecter</router-link>
    </form>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../firebase/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const fullName = ref('');
const error = ref('');
const successMessage = ref('');

const signup = async () => {
  // Inscription in-app désactivée : utiliser le manager web
  error.value = 'Inscription désactivée dans l\'application. Utilisez le manager web pour créer des comptes.';
  successMessage.value = '';
  return;
};
</script>

<style scoped>
.signup-container {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:hover {
  background-color: #0056b3;
}

a {
  text-align: center;
  margin-top: 15px;
  text-decoration: none;
  color: #007bff;
}

a:hover {
  text-decoration: underline;
}

.error-message {
  color: red;
  margin-top: 15px;
  padding: 10px;
  background-color: #ffe6e6;
  border-radius: 4px;
}

.success-message {
  color: green;
  margin-top: 15px;
  padding: 10px;
  background-color: #e6ffe6;
  border-radius: 4px;
}
</style>
