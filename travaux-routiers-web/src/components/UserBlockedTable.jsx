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
      </div>
    </div>
  );
}
