import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';

/**
 * Composable pour gérer la carte Leaflet et les signalements sur la carte
 */
export function useMapSignalement() {
  const map = ref<L.Map | null>(null);
  const markers = ref<Map<string, L.Marker>>(new Map());
  const selectedLat = ref<number | null>(null);
  const selectedLng = ref<number | null>(null);
  const selectedMarker = ref<L.Marker | null>(null);

  /**
   * Initialise la carte Leaflet
   */
  const initializeMap = (elementId: string, lat: number = 48.8566, lng: number = 2.3522, zoom: number = 13) => {
    if (map.value) return; // Éviter la double initialisation

    // Créer la carte
    map.value = L.map(elementId).setView([lat, lng], zoom);

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map.value as any);

    // Gérer les clics sur la carte
    map.value.on('click', (e: L.LeafletMouseEvent) => {
      selectedLat.value = e.latlng.lat;
      selectedLng.value = e.latlng.lng;

      // Supprimer l'ancien marqueur de sélection
      if (selectedMarker.value) {
        map.value?.removeLayer(selectedMarker.value as any);
      }

      // Créer un nouveau marqueur pour la position sélectionnée
      selectedMarker.value = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
        title: 'Position sélectionnée',
      }).addTo(map.value! as any);

      selectedMarker.value.bindPopup('Position sélectionnée');
    });

    return map.value;
  };

  /**
   * Ajoute un marqueur de signalement sur la carte
   */
  const addSignalementMarker = (
    signalementId: string,
    lat: number,
    lng: number,
    type: string,
    description: string,
    onClick?: () => void
  ) => {
    if (!map.value) return;

    // Déterminer la couleur du marqueur en fonction du type
    let markerColor = 'blue';
    if (type.includes('Nid de poule') || type.includes('poule')) markerColor = 'red';
    if (type.includes('Feu cassé') || type.includes('feu')) markerColor = 'orange';
    if (type.includes('Accident')) markerColor = 'darkred';
    if (type.includes('bloquée') || type.includes('Embouteillage')) markerColor = 'purple';

    const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`;

    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      title: type,
    }).addTo(map.value as any);

    const popupContent = `
      <div style="font-size: 12px; width: 200px;">
        <strong>${type}</strong><br>
        ${description.substring(0, 60)}${description.length > 60 ? '...' : ''}
      </div>
    `;

    marker.bindPopup(popupContent);

    if (onClick) {
      marker.on('click', onClick);
    }

    markers.value.set(signalementId, marker);
    return marker;
  };

  /**
   * Supprime un marqueur de la carte
   */
  const removeSignalementMarker = (signalementId: string) => {
    const marker = markers.value.get(signalementId);
    if (marker && map.value) {
      map.value.removeLayer(marker as any);
      markers.value.delete(signalementId);
    }
  };

  /**
   * Centre la carte sur une position
   */
  const centerMap = (lat: number, lng: number, zoom: number = 13) => {
    if (map.value) {
      map.value.setView([lat, lng], zoom);
    }
  };

  /**
   * Zoom sur tous les marqueurs
   */
  const fitBounds = () => {
    if (!map.value || markers.value.size === 0) return;

    const markerArray = Array.from(markers.value.values());
    const group = L.featureGroup(markerArray as any);
    map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
  };

  /**
   * Nettoie la carte
   */
  const cleanup = () => {
    if (map.value) {
      map.value.remove();
      map.value = null;
    }
    markers.value.clear();
  };

  return {
    map,
    markers,
    selectedLat,
    selectedLng,
    selectedMarker,
    initializeMap,
    addSignalementMarker,
    removeSignalementMarker,
    centerMap,
    fitBounds,
    cleanup,
  };
}
