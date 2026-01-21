import StatsTable from "../components/StatsTable";
import MapView from "../components/MapView";
import Navbar from "../components/NavBar";
import { fetchReports } from "../api/map.api";
import { useEffect, useState } from "react";

export default function Home() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports()
      .then((res) => setReports(res.data))
      .catch(console.error);
  }, []);

  return (
    <>
      <Navbar />

      <StatsTable reports={reports} />

      <MapView reports={reports} />
    </>
  );
}
