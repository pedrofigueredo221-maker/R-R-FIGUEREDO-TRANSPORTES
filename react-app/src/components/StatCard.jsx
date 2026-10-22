export default function StatCard({ label, value, hint, tone = "" }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}
