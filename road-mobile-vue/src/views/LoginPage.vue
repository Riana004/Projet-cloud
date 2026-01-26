<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input type="email" v-model="email" placeholder="Email" required />
      <input type="password" v-model="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '../firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const email = ref('');
const password = ref('');

const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // Handle successful login
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>

<style>
/* Add your styles here */
</style>