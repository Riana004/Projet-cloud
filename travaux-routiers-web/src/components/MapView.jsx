import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ reports }) {
  const tileUrl = "http://localhost:8080/styles/basic/{z}/{x}/{y}.png";
  // const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = "© OpenStreetMap contributors (offline tiles)";
  const items = reports ?? [];

  return (
    <MapContainer
      center={[-18.8792, 47.5079]}
      zoom={13}
      style={{ height: "90vh", width: "100%" }}
    >
      <TileLayer url={tileUrl} attribution={attribution} />

      {items.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]}>
          <Popup>
            <strong>{r.description}</strong>
            <br />
            Statut : {r.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
