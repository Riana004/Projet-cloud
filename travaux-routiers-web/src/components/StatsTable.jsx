export default function StatsTable({ reports }) {
  const totalPoints = reports.length;

  const totalSurface = reports.reduce(
    (sum, r) => sum + (r.surface || 0),
    0
  );

  const totalBudget = reports.reduce(
    (sum, r) => sum + (r.budget || 0),
    0
  );

  const completed = reports.filter(
    (r) => r.statut === "TERMINE"
  ).length;

  const avancement =
    totalPoints === 0
      ? 0
      : Math.round((completed / totalPoints) * 100);

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>📊 Récapitulatif des travaux routiers</h4>

      <div style={styles.statsRow}>
        <div style={styles.card}>
          <span>🗺 Points</span>
          <strong>{totalPoints}</strong>
        </div>

        <div style={styles.card}>
          <span>📐 Surface</span>
          <strong>{totalSurface.toLocaleString()} m²</strong>
        </div>

        <div style={styles.card}>
          <span>💰 Budget</span>
          <strong>{totalBudget.toLocaleString()} Ar</strong>
        </div>

        <div style={styles.card}>
          <span>✅ Avancement</span>
          <strong>{avancement} %</strong>
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    padding: "15px",
    background: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    margin: "10px auto",
    borderRadius: "10px",
    maxWidth: "900px",
  },
  title: {
    textAlign: "center",
    marginBottom: "15px",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1",
    minWidth: "180px",
    background: "#f8f9fa",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    boxShadow: "0 0 5px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
  },
};
