import { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import MapView from "../components/MapView";
import { fetchReports } from "../api/map.api";

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
      <MapView reports={reports} />
    </>
  );
}
