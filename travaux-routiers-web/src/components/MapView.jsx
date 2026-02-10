import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ reports }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

  const mockReports = [
    {
      id: "sig-1",
      latitude: -18.9097,
      longitude: 47.5255,
      description: "Nid de poule - Avenue de l'Indépendance",
      date: "2026-01-12",
      statut: "nouveau",
      surfaceM2: 12.5,
      budget: 1200000,
      entreprise: "Rivo TP",
    },
  ];

  const items = reports?.length ? reports : mockReports;

  const [apiReports, setApiReports] = useState([]);
  const [photosByReport, setPhotosByReport] = useState({});
  const [apiError, setApiError] = useState("");

  // ================= LOAD SIGNALMENTS =================
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/signalements`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const list = await res.json();
        setApiReports(Array.isArray(list) ? list : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setApiReports([]);
          setApiError(e.message);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [apiBaseUrl]);

  // ================= LOAD PHOTOS =================
  const loadPhotos = async (id) => {
    if (photosByReport[id]) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/signalements/${id}/photo`);
      if (!res.ok) throw new Error("Erreur photos");

      const data = await res.json();

      setPhotosByReport((prev) => ({
        ...prev,
        [id]: data,
      }));
    } catch (e) {
      console.error("Photos error:", e);
      setPhotosByReport((prev) => ({
        ...prev,
        [id]: [],
      }));
    }
  };

  const activeItems = apiReports.length ? apiReports : items;

  // ================= MAP =================
  return (
    <MapContainer
      center={[-18.8792, 47.5079]}
      zoom={13}
      style={{ height: "90vh", width: "100%" }}
    >
      <TileLayer
        // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        url="http://localhost:8082/styles/basic/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {activeItems.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
          eventHandlers={{
            click: () => loadPhotos(r.id),
          }}
        >
          <Popup>
            <strong>{r.description}</strong>
            <br />
            📅 Date : {new Date(r.dateSignalement).toLocaleDateString()}
            <br />
            🏷 Statut : {r.statut.statut} - {r.statut.pourcentage}
            <br />
            📐 Surface : {r.surface} m²
          <br />
          🏢 Niveau : {r.niveau}
          <br />
          💰 Prix/m² : {r.prix_par_m2?.toLocaleString()} Ar
          <br />
          💵 Budget : {r.surface * r.niveau * r.prix_par_m2} Ar
          <br />
            🏗 Entreprise : {r.entrepriseConcerne}

            <hr />
            <strong>Photos :</strong>

            {!photosByReport[r.id] ? (
              <p>Chargement...</p>
            ) : photosByReport[r.id].length === 0 ? (
              <p>Aucune photo</p>
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {photosByReport[r.id].map((p) => (
                  <img
                    key={p.id}
                    src={p.url}
                    alt="photo"
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
