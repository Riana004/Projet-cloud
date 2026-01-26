import { useEffect, useState } from "react";
import { fetchBlockedUsers, unlockUser } from "../api/manager.api";

export default function UserBlockedTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlockingIds, setUnlockingIds] = useState([]);

  // 🔄 Charger les utilisateurs bloqués
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchBlockedUsers();
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur récupération utilisateurs bloqués :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔓 Débloquer un utilisateur
  const handleUnlock = async (userId) => {
    setUnlockingIds((prev) => [...prev, userId]);
    try {
      await unlockUser(userId);
      await load(); // recharger la liste
    } catch (err) {
      console.error("Erreur lors du déblocage :", err);
    } finally {
      setUnlockingIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">🔒 Utilisateurs bloqués</h5>

        {loading ? (
          <p>Chargement...</p>
        ) : users.length === 0 ? (
          <p>Aucun utilisateur bloqué.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.blocked ? (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={unlockingIds.includes(u.id)}
                          onClick={() => handleUnlock(u.id)}
                        >
                          {unlockingIds.includes(u.id) ? "Déblocage..." : "Débloquer"}
                        </button>
                      ) : (
                        <span className="text-muted">Déjà débloqué</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
