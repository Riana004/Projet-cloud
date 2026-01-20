import NavbarRegister from "../components/NavBarRegister";
import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import { fetchReports } from "../api/map.api";
export default function Manager() {
    const [reports, setReports] = useState([]);
        useEffect(() => {
          fetchReports()
            .then((res) => setReports(res.data))
            .catch(console.error);
        }, []);
  return (
    <>
      <NavbarRegister />
      <div className="container mt-4">
        <h2 className="mb-4">Espace Manager</h2>

        <div className="alert alert-warning">
          Vous êtes connecté en tant que <strong>Manager</strong>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Gestion des travaux routiers</h5>

            <ul>
              <li>Voir tous les signalements</li>
              <li>Modifier le statut (nouveau, en cours, terminé)</li>
              <li>Mettre à jour budget, surface, entreprise</li>
              <li>Supprimer un signalement</li>
            </ul>

            <p className="text-muted">
              (Les fonctionnalités seront reliées à l’API plus tard)
            </p>
          </div>
        </div>
      </div>
      <MapView reports={reports} />
    </>
  );
}
