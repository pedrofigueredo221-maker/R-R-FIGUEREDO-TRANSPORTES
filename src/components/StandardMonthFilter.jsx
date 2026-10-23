import { UI_LABELS } from "../design-system/standards.js";

/** Seletor mensal reutilizável para painéis e relatórios. */
export default function StandardMonthFilter({ value, onChange, label = UI_LABELS.period, className = "" }) {
  return <label className={["month-picker", "rr-standard-month-filter", className].filter(Boolean).join(" ")}>
    <span className="rr-standard-filter-label">{label}</span>
    <span className="rr-standard-month-input">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>
      <input aria-label={label} type="month" value={value} onChange={(event) => onChange(event.target.value)} />
    </span>
  </label>;
}
