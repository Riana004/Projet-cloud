// src/pages/map/MapPage.jsx
import { useState } from "react";
import { reports as mockReports } from "../../data/reports.mock";
import MapView from "../../components/Map/MapView";

export default function MapPage() {
  const [reports, setReports] = useState(mockReports);
  return <MapView reports={reports} />;
}
