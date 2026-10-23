export default function RefreshButton({ onRefresh, loading = false }) {
  return <button type="button" className="rr-refresh-button" onClick={onRefresh} disabled={loading || typeof onRefresh !== "function"} aria-label="Atualizar dados" title="Atualizar dados">
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.5 9a7.5 7.5 0 0 1 12.7-2L20 12M4 12l1.8 5a7.5 7.5 0 0 0 12.7-2"/></svg>
  </button>;
}
