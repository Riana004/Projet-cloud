// src/pages/manager/ManageReports.jsx
import { useState } from "react";
import { reports as data } from "../../data/reports.mock";

export default function ManageReports() {
  const [reports, setReports] = useState(data);

  const updateStatus = (id, status) => {
    setReports(r =>
      r.map(rep =>
        rep.id === id ? { ...rep, status } : rep
      )
    );
  };

  return (
    <div>
      <h2>Gestion des signalements</h2>
      {/* tableau + boutons */}
    </div>
  );
}
