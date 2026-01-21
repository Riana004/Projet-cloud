import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ reports }) {
  return (
    <MapContainer
      center={[-18.8792, 47.5079]}
      zoom={13}
      style={{ height: "90vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
        >
          <Popup>
            <strong>{r.description}</strong>
            <br />
            📅 Date : {new Date(r.date).toLocaleDateString()}
            <br />
            🏷 Statut : {r.statut}
            <br />
            📐 Surface : {r.surfaceM2} m²
            <br />
            💰 Budget : {r.budget.toLocaleString()} Ar
            <br />
            🏗 Entreprise : {r.entreprise}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  // const tileUrl = "http://localhost:8080/styles/basic/{z}/{x}/{y}.png";

  );
}
