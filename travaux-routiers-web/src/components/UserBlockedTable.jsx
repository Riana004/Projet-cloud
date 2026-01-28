<<<<<<< HEAD
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
=======
import { fetchBlockedUsers, unlockUser } from "../api/manager.api";
import { useEffect, useState } from "react";

export default function UserBlockedTable() {
  const [users, setUsers] = useState([]);

  const load = () =>
    fetchBlockedUsers().then(res => setUsers(res.data));

  useEffect(load, []);

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5>🔒 Utilisateurs bloqués</h5>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() =>
                      unlockUser(u.id).then(load)
                    }
                  >
                    Débloquer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7
      </div>
    </div>
  );
}
