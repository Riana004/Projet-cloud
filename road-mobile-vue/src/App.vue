<template>
  <router-view />
</template>

<script setup>
import { defineComponent } from 'vue';
import { useAuth } from './firebase/firebase';

export default defineComponent({
  setup() {
    const { user } = useAuth();
    return { user };
  },
});
</script>

<style>
/* Add your styles here */
</style>
