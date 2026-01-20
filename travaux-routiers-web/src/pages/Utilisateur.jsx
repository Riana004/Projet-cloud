import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import { fetchReports } from "../api/map.api";

export default function Utilisateur() {
    const [reports, setReports] = useState([]);
    useEffect(() => {
      fetchReports()
        .then((res) => setReports(res.data))
        .catch(console.error);
    }, []);
  return (
    <>
      <div className="container mt-4">
        <h2 className="mb-4">Espace Utilisateur</h2>

        <div className="alert alert-info">
          Vous êtes connecté en tant qu’<strong>Utilisateur</strong>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Fonctionnalités disponibles</h5>

            <ul>
              <li>Consulter la carte des travaux</li>
              <li>Créer un signalement</li>
              <li>Voir mes signalements</li>
            </ul>

            <button className="btn btn-success mt-3">
              ➕ Signaler un problème
            </button>

            <p className="text-muted mt-3">
              (Le formulaire sera ajouté plus tard)
            </p>
          </div>
        </div>
      </div>
      <MapView reports={reports} />
    </>
  );
}
