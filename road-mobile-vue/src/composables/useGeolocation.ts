import { ref } from 'vue';

export function useGeolocation() {
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);
  const error = ref<string>('');
  const isLoading = ref<boolean>(false);

  const getLocation = () => {
    error.value = '';
    isLoading.value = true;

    if (!navigator.geolocation) {
      error.value = 'La géolocalisation n\'est pas supportée par ce navigateur';
      isLoading.value = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        isLoading.value = false;
      },
      (err) => {
        error.value = `Erreur de géolocalisation: ${err.message}`;
        isLoading.value = false;
      }
    );
  };

  const watchLocation = (callback: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      error.value = 'La géolocalisation n\'est pas supportée par ce navigateur';
      return;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        latitude.value = position.coords.latitude;
        longitude.value = position.coords.longitude;
        callback(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        error.value = `Erreur de géolocalisation: ${err.message}`;
      }
    );
  };

  return {
    latitude,
    longitude,
    error,
    isLoading,
    getLocation,
    watchLocation,
  };
}
