import NavbarRegister from "../components/NavBarRegister";
import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import StatsTable from "../components/StatsTable";
import ReportTable from "../components/ReportTable";
import UserBlockedTable from "../components/UserBlockedTable";
import { fetchReports } from "../api/map.api";
import { syncFirebase, syncLocal } from "../api/manager.api";
import DashboardStats from "../components/DashboardStats";
export default function Manager() {
  const [reports, setReports] = useState([]);

  const loadReports = () =>
    fetchReports().then(res => setReports(res.data));

  useEffect(loadReports, []);

  return (
    <>
      <NavbarRegister />

      <div className="container mt-4">
        <h2>🧑‍💼 Espace Manager</h2>
       <DashboardStats />
        <button
          className="btn btn-primary mb-3"
          onClick={() =>
            syncFirebase()
              .then(() => alert("Synchronisation réussie"))
          }
        >
          🔄 Synchroniser Firebase to Local
        </button>

        <button
          className="btn btn-primary mb-3"
          onClick={() =>
            syncLocal()
              .then(() => alert("Synchronisation réussie"))
          }
        >
          🔄 Synchronise Local to Firebase
        </button>

        <StatsTable reports={reports} />

        <ReportTable
          reports={reports}
          refresh={loadReports}
        />

        <UserBlockedTable />
      </div>

      <MapView reports={reports} />
    </>
  );
}
