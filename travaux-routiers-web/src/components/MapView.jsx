import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ reports }) {
  const tileUrl = "http://localhost:8080/styles/basic/{z}/{x}/{y}.png";
  // const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = "© OpenStreetMap contributors (offline tiles)";
  const mockReports = [
    {
      id: "sig-1",
      lat: -18.9097,
      lng: 47.5255,
      description: "Nid de poule - Avenue de l'Indépendance",
      date: "2026-01-12",
      status: "nouveau",
      surfaceM2: 12.5,
      budget: 1200000,
      entreprise: "Rivo TP",
    },
    {
      id: "sig-2",
      lat: -18.8735,
      lng: 47.5119,
      description: "Chaussée dégradée - Ankorondrano",
      date: "2026-01-08",
      status: "en cours",
      surfaceM2: 45.0,
      budget: 4500000,
      entreprise: "Saha Routes",
    },
    {
      id: "sig-3",
      lat: -18.8792,
      lng: 47.5042,
      description: "Tranchée ouverte - Tsaralalana",
      date: "2025-12-28",
      status: "terminé",
      surfaceM2: 8.2,
      budget: 900000,
      entreprise: "Tanà Infra",
    },
  ];
  const items = reports && reports.length > 0 ? reports : mockReports;

  const totalPoints = items.length;
  const totalSurface = items.reduce(
    (sum, item) => sum + (Number(item.surfaceM2) || 0),
    0
  );
  const totalBudget = items.reduce(
    (sum, item) => sum + (Number(item.budget) || 0),
    0
  );
  const completedCount = items.filter((item) => item.status === "terminé").length;
  const progressPercent = totalPoints === 0 ? 0 : Math.round((completedCount / totalPoints) * 100);
  const formatMoney = (value) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
  const formatSurface = (value) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div>
          <strong>Nb de points</strong>
          <div>{totalPoints}</div>
        </div>
        <div>
          <strong>Total surface</strong>
          <div>{formatSurface(totalSurface)} m²</div>
        </div>
        <div>
          <strong>Avancement</strong>
          <div>{progressPercent}%</div>
        </div>
        <div>
          <strong>Total budget</strong>
          <div>{formatMoney(totalBudget)} Ar</div>
        </div>
      </div>

      <MapContainer
        center={[-18.8792, 47.5079]}
        zoom={13}
        style={{ height: "90vh", width: "100%" }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />

        {items.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div style={{ fontSize: 12 }}>
                <div><strong>{r.description}</strong></div>
                <div>Date : {r.date}</div>
                <div>Statut : {r.status}</div>
                <div>Surface : {formatSurface(r.surfaceM2)} m²</div>
                <div>Budget : {formatMoney(r.budget)} Ar</div>
                <div>Entreprise : {r.entreprise}</div>
              </div>
            </Tooltip>
            <Popup>
              <strong>{r.description}</strong>
              <br />
              Statut : {r.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
