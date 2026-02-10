import { useState } from "react";
import { updateReport, deleteReport } from "../api/manager.api";

function Toast({ message, type, onClose }) {
  if (!message) return null;

  return (
    <div
      className={`alert alert-${type} position-fixed top-0 end-0 m-3 shadow`}
      style={{ zIndex: 1055 }}
    >
      {message}
      <button className="btn-close ms-3" onClick={onClose} />
    </div>
  );
}

// NEW → fonction pour date ISO
const nowISO = () => {
  const d = new Date();
  return d.toISOString().slice(0, 16); // format datetime-local
};

export default function ReportTable({ reports, refresh }) {
  const [editedReports, setEditedReports] = useState({});
  const [savedRow, setSavedRow] = useState(null);
  const [toast, setToast] = useState(null);

  const handleEdit = (id, field, value) => {
    setEditedReports(prev => ({
      ...prev,
      [id]: {
        dateModification: prev[id]?.dateModification || nowISO(), // NEW
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleConfirm = (id) => {
    updateReport(id, editedReports[id])
      .then(() => {
        setToast({ message: "Signalement mis à jour ✅", type: "success" });
        setSavedRow(id);

        setEditedReports(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        refresh();
        setTimeout(() => setSavedRow(null), 1500);
      })
      .catch(() => {
        setToast({ message: "Erreur lors de la mise à jour ❌", type: "danger" });
      });
  };

  const handleCancel = (id) => {
    setEditedReports(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getRowClass = (id) => {
    if (savedRow === id) return "table-success";
    if (editedReports[id]) return "table-warning";
    return "";
  };

  return (
    <>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <div className="card mt-4">
        <div className="card-body">
          <h5>📋 Gestion des signalements</h5>

          <table className="table table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Statut</th>
                <th>Surface</th>
                <th>Budget</th>
                <th>Entreprise</th>
                <th>Date modif</th> {/* NEW */}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {reports.map(r => {
                const edited = editedReports[r.id] || r;

                return (
                  <tr key={r.id} className={getRowClass(r.id)}>
                    <td>{r.id}</td>

                    <td>
                      <select
                        value={edited.statut}
                        onChange={e =>
                          handleEdit(r.id, "statut", e.target.value)
                        }
                        className="form-select form-select-sm"
                      >
                        <option value="Nouveau">Nouveau</option>
                        <option value="En cours">En cours</option>
                        <option value="Résolu">Résolu</option>
                        <option value="Rejeté">Rejeté</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        value={edited.surfaceM2}
                        className="form-control form-control-sm"
                        onChange={e =>
                          handleEdit(r.id, "surfaceM2", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={edited.budget}
                        className="form-control form-control-sm"
                        onChange={e =>
                          handleEdit(r.id, "budget", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={edited.entreprise}
                        className="form-control form-control-sm"
                        onChange={e =>
                          handleEdit(r.id, "entreprise", e.target.value)
                        }
                      />
                    </td>

                    {/* NEW → champ date */}
                    <td>
                      <input
                        type="datetime-local"
                        value={edited.dateModification || nowISO()}
                        className="form-control form-control-sm"
                        onChange={e =>
                          handleEdit(r.id, "dateModification", e.target.value)
                        }
                      />
                    </td>

                    <td className="d-flex gap-1">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirm(r.id)}
                        disabled={!editedReports[r.id]}
                      >
                        ✔
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancel(r.id)}
                        disabled={!editedReports[r.id]}
                      >
                        ✖
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          deleteReport(r.id).then(() => {
                            setToast({
                              message: "Signalement supprimé 🗑",
                              type: "success"
                            });
                            refresh();
                          })
                        }
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
