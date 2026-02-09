import { useEffect, useState } from "react";
import { fetchDashboardStats } from "../api/manager.api";

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (!stats) return <div className="text-center py-10 text-red-500">Erreur de chargement</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Délai moyen global</h3>
        <p className="text-3xl font-bold text-indigo-600">{stats.global.delaiMoyenHeures.toFixed(1)} h</p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Délai minimum</h3>
        <p className="text-2xl font-bold text-green-600">{stats.global.delaiMinHeures.toFixed(1)} h</p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Délai maximum</h3>
        <p className="text-2xl font-bold text-red-600">{stats.global.delaiMaxHeures.toFixed(1)} h</p>
      </div>
      {/* Tableau par entreprise */}
      <div className="md:col-span-2 lg:col-span-3 bg-white shadow-md rounded-lg p-6 border border-gray-200 mt-4">
        <h3 className="text-lg font-semibold mb-4">Détails par entreprise</h3>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Entreprise</th>
              <th className="border px-4 py-2 text-right">Délai moyen (h)</th>
              <th className="border px-4 py-2 text-right">Total terminés</th>
            </tr>
          </thead>
          <tbody>
            {stats.entreprises.map((ent, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border px-4 py-2">{ent.entreprise}</td>
                <td className="border px-4 py-2 text-right">{ent.delaiMoyen.toFixed(1)}</td>
                <td className="border px-4 py-2 text-right">{ent.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
