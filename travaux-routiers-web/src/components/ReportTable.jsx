import { updateReport, deleteReport } from "../api/manager.api";

export default function ReportTable({ reports, refresh }) {

  const handleChange = (id, field, value) => {
    updateReport(id, { [field]: value })
      .then(refresh)
      .catch(console.error);
  };

  return (
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>

                <td>
                  <select
                    value={r.statut}
                    onChange={e =>
                      handleChange(r.id, "statut", e.target.value)
                    }
                    className="form-select form-select-sm"
                  >
                    <option>NOUVEAU</option>
                    <option>EN_COURS</option>
                    <option>TERMINE</option>
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    defaultValue={r.surfaceM2}
                    className="form-control form-control-sm"
                    onBlur={e =>
                      handleChange(r.id, "surfaceM2", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    defaultValue={r.budget}
                    className="form-control form-control-sm"
                    onBlur={e =>
                      handleChange(r.id, "budget", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="text"
                    defaultValue={r.entreprise}
                    className="form-control form-control-sm"
                    onBlur={e =>
                      handleChange(r.id, "entreprise", e.target.value)
                    }
                  />
                </td>

                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      deleteReport(r.id).then(refresh)
                    }
                  >
                    🗑
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
