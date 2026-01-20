// src/components/Map/MapView.jsx
import { MapContainer, TileLayer } from "react-leaflet";
import MarkerItem from "./MarkerItem";

export default function MapView({ reports }) {
  return (
    <MapContainer center={[-18.8792, 47.5079]} zoom={13}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map(r => (
        <MarkerItem key={r.id} report={r} />
      ))}
    </MapContainer>
  );
}
