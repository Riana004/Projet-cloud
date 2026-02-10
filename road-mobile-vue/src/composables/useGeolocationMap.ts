import { ref, computed } from 'vue'
import { Geolocation } from '@capacitor/geolocation'

export function useGeolocationMap() {
  const latitude = ref<number | null>(null)
  const longitude = ref<number | null>(null)
  const accuracy = ref<number | null>(null)
  const altitude = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string>('')
  const watchId = ref<string | null>(null)

  const hasPosition = computed(() => latitude.value !== null && longitude.value !== null)

  /**
   * Obtenir une position GPS unique avec haute précision
   */
  const getCurrentPosition = async () => {
    isLoading.value = true
    error.value = ''

    try {
      // Utiliser Capacitor pour meilleure précision sur mobile
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })

      latitude.value = position.coords.latitude
      longitude.value = position.coords.longitude
      accuracy.value = position.coords.accuracy
      altitude.value = position.coords.altitude

      return { latitude: latitude.value, longitude: longitude.value }
    } catch (err: any) {
      // Fallback vers Geolocation API du navigateur
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          })
        })

        latitude.value = position.coords.latitude
        longitude.value = position.coords.longitude
        accuracy.value = position.coords.accuracy
        altitude.value = position.coords.altitude

        return { latitude: latitude.value, longitude: longitude.value }
      } catch (fallbackErr: any) {
        // Géolocalisation refusée ou indisponible - utiliser position par défaut (Madagascar/Antananarivo)
        console.warn('⚠️ Géolocalisation refusée ou indisponible. Utilisation de la position par défaut (Madagascar).')
        latitude.value = -18.8792
        longitude.value = 47.5079
        error.value = 'Géolocalisation refusée. Position par défaut utilisée (Madagascar).'
        return { latitude: latitude.value, longitude: longitude.value }
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Surveiller les changements de position en temps réel
   */
  const watchPosition = () => {
    if (watchId.value) return // Déjà en cours de suivi

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          latitude.value = position.coords.latitude
          longitude.value = position.coords.longitude
          accuracy.value = position.coords.accuracy
          altitude.value = position.coords.altitude
          error.value = ''
        },
        (err) => {
          console.error('Erreur suivi position:', err)
          error.value = 'Erreur lors du suivi de position'
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      )

      watchId.value = String(id)
    } catch (err: any) {
      error.value = 'Impossible de surveiller la position'
      console.error('Erreur watchPosition:', err)
    }
  }

  /**
   * Arrêter la surveillance de position
   */
  const stopWatching = () => {
    if (watchId.value) {
      navigator.geolocation.clearWatch(Number(watchId.value))
      watchId.value = null
    }
  }

  /**
   * Formater les coordonnées pour affichage
   */
  const getFormattedCoordinates = () => {
    if (!hasPosition.value) return ''
    return `${latitude.value?.toFixed(6)}, ${longitude.value?.toFixed(6)}`
  }

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  const getDistance = (lat2: number, lon2: number): number => {
    if (!hasPosition.value) return 0

    const R = 6371 // Rayon terrestre en km
    const dLat = ((lat2 - latitude.value!) * Math.PI) / 180
    const dLon = ((lon2 - longitude.value!) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latitude.value! * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return {
    latitude,
    longitude,
    accuracy,
    altitude,
    isLoading,
    error,
    hasPosition,
    getCurrentPosition,
    watchPosition,
    stopWatching,
    getFormattedCoordinates,
    getDistance,
  }
}
