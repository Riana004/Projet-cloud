const map = L.map("map", {
  zoomControl: true,
  minZoom: 4,
  maxZoom: 16,
});

const center = [-18.8792, 47.5079];
const homeZoom = 12;

map.setView(center, homeZoom);

const tiles = L.tileLayer("http://localhost:8080/styles/basic/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
  maxZoom: 16,
});

tiles.addTo(map);

const homeButton = document.getElementById("btn-home");
const toggleButton = document.getElementById("btn-toggle");
const latLabel = document.getElementById("lat");
const lngLabel = document.getElementById("lng");
const zoomLabel = document.getElementById("zoom");

homeButton.addEventListener("click", () => {
  map.setView(center, homeZoom, { animate: true });
});

let tilesVisible = true;

toggleButton.addEventListener("click", () => {
  if (tilesVisible) {
    map.removeLayer(tiles);
    toggleButton.textContent = "Afficher routes";
  } else {
    map.addLayer(tiles);
    toggleButton.textContent = "Masquer routes";
  }
  tilesVisible = !tilesVisible;
});

map.on("moveend", () => {
  const currentCenter = map.getCenter();
  latLabel.textContent = currentCenter.lat.toFixed(5);
  lngLabel.textContent = currentCenter.lng.toFixed(5);
  zoomLabel.textContent = map.getZoom();
});

map.fire("moveend");
