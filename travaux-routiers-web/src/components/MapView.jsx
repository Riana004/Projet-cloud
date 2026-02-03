import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ reports }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

  const [apiReports, setApiReports] = useState([]);
  const [photosByReport, setPhotosByReport] = useState({}); // cache photos
  const [apiError, setApiError] = useState("");

  // Charger les signalements
  useEffect(() => {
    const controller = new AbortController();

    const loadReports = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/signalements`, {
          signal: controller.signal,
          mode: "cors",
        });

        if (!res.ok) throw new Error(`API: ${res.status}`);

        const list = await res.json();
        setApiReports(Array.isArray(list) ? list : []);
        setApiError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setApiReports([]);
          setApiError(error.message || "Erreur API");
        }
      }
    };

    loadReports();
    return () => controller.abort();
  }, [apiBaseUrl]);

  // Charger photos d’un signalement
  const loadPhotos = async (signalementId) => {
    // évite de recharger si déjà en cache
    if (photosByReport[signalementId]) return;

    try {
      const res = await fetch(
        `${apiBaseUrl}/api/signalements/${signalementId}/photos`
      );

      if (!res.ok) throw new Error("Erreur chargement photos");

      const photos = await res.json();

      setPhotosByReport((prev) => ({
        ...prev,
        [signalementId]: photos,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const activeItems = apiReports.length > 0 ? apiReports : reports;

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
            📅 Date : {new Date(r.date).toLocaleDateString()}
            <br />
            🏷 Statut : {r.statut}
            <br />
            📐 Surface : {r.surfaceM2} m²
            <br />
            💰 Budget : {r.budget?.toLocaleString()} Ar
            <br />
            🏗 Entreprise : {r.entreprise}

            <hr />

            <strong>Photos :</strong>

            {photosByReport[r.id] ? (
              photosByReport[r.id].length > 0 ? (
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
              ) : (
                <p>Aucune photo</p>
              )
            ) : (
              <p>Chargement...</p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
