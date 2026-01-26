<template>
  <div>
    <h1>Map</h1>
    <div id="map" style="height: 500px;"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import L from 'leaflet';

onMounted(() => {
  const map = L.map('map').setView([-18.8792, 47.5079], 13); // Center on Antananarivo

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Add markers or other map features here
});
</script>

<style>
/* Add your styles here */
</style>