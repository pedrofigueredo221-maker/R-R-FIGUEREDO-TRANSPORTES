import { useMemo, useState } from "react";
import FreightsPage from "./screens/FreightsPage.jsx";
import ExpensesPage from "./screens/ExpensesPage.jsx";
import ReceivablesPage from "./screens/ReceivablesPage.jsx";
import PayablesPage from "./screens/PayablesPage.jsx";
import CadastrosPage from "./screens/CadastrosPage.jsx";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => globalThis.crypto?.randomUUID?.() || `rr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const number = (value) => Math.max(0, Number(value) || 0);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number(value));
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const defaultCategories = ["Combustível", "Pedágio", "Óleo e lubrificantes", "Mecânico", "Oficina", "Pneus", "Elétrica", "Peças", "Documentação", "Seguro", "Lavagem", "Manutenção", "Despesas gerais", "Outros"];
const blankFreight = () => ({ date: today(), customer: "", driver: "", truck: "", origin: "", destination: "", value: "", discount: "0", toll: "0", deductToll: false, commissionType: "percent", commission: "13", bonus: "0", km: "", liters: "", dieselPrice: "", fuelActual: "0", notes: "", received: "0" });
const blankExpense = () => ({ created: today(), description: "", category: "Despesas gerais", truck: "", supplier: "", value: "", due: today(), installmentsCount: "1", notes: "" });
const blankEmployee = () => ({ name: "", role: "Motorista", phone: "", commissionType: "percent", commissionValue: "13", active: true });
const blankTruck = () => ({ name: "", plate: "", driverId: "", active: true });

function Field({ label, value, onChange, type = "text", required = false, min, step, options, placeholder }) {
  return <label className="editor-field">{label}
    {options ? <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required}>
      {options.map((item) => typeof item === "string" ? <option key={item} value={item}>{item}</option> : <option key={item.value} value={item.value}>{item.label}</option>)}
    </select> : <input type={type} value={type === "checkbox" ? undefined : (value ?? "")} checked={type === "checkbox" ? Boolean(value) : undefined} onChange={(e) => onChange(type === "checkbox" ? e.target.checked : e.target.value)} required={required} min={min} step={step} placeholder={placeholder} />}
  </label>;
}

function RecordForm({ title, fields, value, setValue, onSubmit, onCancel, saving }) {
  return <form className="record-editor" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <div className="editor-heading"><h3>{title}</h3><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button></div>
    <div className="editor-grid">{fields.map((field) => <Field key={field.key} {...field} value={value[field.key]} onChange={(next) => setValue((old) => ({ ...old, [field.key]: next }))} />)}</div>
    <div className="editor-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button></div>
  </form>;
}

function Actions({ onEdit, onDelete }) {
  return <div className="record-actions"><button className="secondary-button" type="button" onClick={onEdit}>Editar</button><button className="danger-button" type="button" onClick={onDelete}>Excluir</button></div>;
}

export default function EditablePage({ page, data, onSave, readOnly, loading, version }) {
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formVersion, setFormVersion] = useState(version);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState("employees");
  const [payment, setPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const startCreate = (kind) => {
    setError(""); setEditingId(null); setFormVersion(version); setForm(kind === "freight" ? blankFreight() : kind === "expense" ? blankExpense() : kind === "employee" ? blankEmployee() : kind === "truck" ? blankTruck() : { name: "" });
  };
  const startEdit = (kind, record) => {
    setError(""); setEditingId(record.id); setFormVersion(version); setForm(kind === "freight" ? { ...blankFreight(), ...record, value: String(record.value ?? ""), discount: String(record.discount ?? 0), toll: String(record.toll ?? 0), bonus: String(record.bonus ?? 0), commission: String(record.commission ?? 13), received: String(record.received ?? 0) } : kind === "expense" ? { ...blankExpense(), ...record, value: String(record.value ?? ""), installmentsCount: String((record.installments || []).length || 1) } : { ...record });
  };
  const commit = async (next, expectedVersion = (form ? formVersion : version)) => {
    setSaving(true); setError("");
    try { await onSave(next, expectedVersion); setForm(null); setEditingId(null); setPayment(null); }
    catch (e) { const message = e?.message || "Não foi possível salvar. Os dados locais foram preservados."; setError(message); if (message.includes("mudaram") || message.includes("alterou os dados")) { setForm(null); setEditingId(null); setPayment(null); } }
    finally { setSaving(false); }
  };
  const remove = async (key, record) => {
    if (key === "freights" && (number(record.received) > 0 || (record.receipts || []).length > 0)) {
      setError("Este frete já possui recebimentos registrados. Preserve o histórico financeiro; não é possível excluí-lo por esta tela.");
      return;
    }
    if (key === "expenses" && (record.installments || []).some((item) => number(item.paid) > 0 || (item.payments || []).length > 0)) {
      setError("Esta despesa já possui pagamentos registrados. Preserve o histórico financeiro; não é possível excluí-la por esta tela.");
      return;
    }
    if (!window.confirm("Confirma excluir este registro? Esta ação será salva no banco compartilhado.")) return;
    await commit({ ...data, [key]: data[key].filter((item) => item.id !== record.id) });
  };
  const filter = (rows, fields) => rows.filter((row) => (!query || fields.some((key) => String(row[key] ?? "").toLocaleLowerCase("pt-BR").includes(query))) && (!month || !row.date || String(row.date).startsWith(month)));
  const allFreights = data.freights || [];
  const allExpenses = data.expenses || [];
  const filteredFreights = filter(allFreights, ["customer", "driver", "truck", "origin", "destination", "notes"]);
  const filteredExpenses = allExpenses.filter((row) => (!query || ["description", "category", "truck", "supplier", "notes"].some((key) => String(row[key] || "").toLocaleLowerCase("pt-BR").includes(query))) && (!month || String(row.created || "").startsWith(month) || (row.installments || []).some((i) => String(i.due || "").startsWith(month))));
  const categories = data.categories?.length ? data.categories : defaultCategories;
  const employees = (data.employees || []).filter((row) => !query || ["name", "role", "phone"].some((key) => String(row[key] || "").toLocaleLowerCase("pt-BR").includes(query)));
  const trucks = (data.trucks || []).filter((row) => !query || ["name", "plate"].some((key) => String(row[key] || "").toLocaleLowerCase("pt-BR").includes(query)));

  const saveFreight = () => {
    const original = editingId ? allFreights.find((freight) => freight.id === editingId) : null;
    const value = { ...form, id: editingId || uid(), value: number(form.value), discount: number(form.discount), toll: number(form.toll), bonus: number(form.bonus), commission: number(form.commission), received: original ? number(original.received) : number(form.received), km: number(form.km), liters: number(form.liters), dieselPrice: number(form.dieselPrice), fuelActual: number(form.fuelActual) };
    value.fuelEstimated = number(value.liters) * number(value.dieselPrice);
    value.receipts = Array.isArray(form.receipts) ? form.receipts : (editingId ? (allFreights.find((f) => f.id === editingId)?.receipts || []) : []);
    return commit({ ...data, freights: editingId ? allFreights.map((f) => f.id === editingId ? value : f) : [value, ...allFreights] });
  };
  const saveExpense = () => {
    const value = number(form.value);
    const count = Math.max(1, Math.min(120, Math.floor(number(form.installmentsCount) || 1)));
    const old = allExpenses.find((e) => e.id === editingId);
    let installments = old?.installments || [];
    if (!editingId || count !== installments.length || value !== number(old?.value)) {
      const part = Math.round((value / count) * 100) / 100;
      let assigned = 0;
      installments = Array.from({ length: count }, (_, index) => {
        const due = new Date(`${form.due || today()}T12:00:00`);
        due.setMonth(due.getMonth() + index);
        const amount = index === count - 1 ? Math.round((value - assigned) * 100) / 100 : part;
        assigned += amount;
        return { due: due.toISOString().slice(0, 10), value: amount, paid: 0, payments: [] };
      });
      if (old?.installments?.some((i) => number(i.paid) > 0)) {
        setError("Esta despesa já tem pagamentos. Para preservar o histórico, edite a descrição/categoria sem alterar valor ou quantidade de parcelas.");
        return;
      }
    }
    const expense = { ...form, id: editingId || uid(), value, installments, installmentsCount: undefined };
    delete expense.due; delete expense.installmentsCount;
    return commit({ ...data, expenses: editingId ? allExpenses.map((e) => e.id === editingId ? expense : e) : [expense, ...allExpenses] });
  };

  if (readOnly) return <section className="panel"><div className="panel-heading"><div><h3>Perfil somente leitura</h3><p>O perfil visitante pode consultar os dados, mas não pode cadastrar, editar, excluir ou registrar pagamentos.</p></div></div></section>;
  const toolbar = <div className="page-filters"><input aria-label="Buscar registros" placeholder="Buscar registros..." value={query} onChange={(e) => setQuery(e.target.value)} /><label>Período<input aria-label="Filtrar por mês" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label><button className="secondary-button" onClick={() => { setQuery(""); setMonth(""); }} type="button">Limpar filtros</button></div>;
  const showError = error && <div className="error-banner" role="alert">{error}</div>;

  const controller = {
    page, data, loading, saving, form, setForm, editingId, setEditingId,
    startCreate, startEdit, saveFreight, saveExpense, showError, toolbar,
    filteredFreights, filteredExpenses, dateLabel, money, Actions, RecordForm, Field,
    remove, payment, setPayment, setPaymentAmount, setPaymentDate, paymentAmount,
    paymentDate, paymentMethod, allFreights, allExpenses, number, commit, setError,
    categories, employees, trucks, tab, setTab, query, uid, today
  };
  if (page === "freights") return <FreightsPage controller={controller} />;
  if (page === "expenses") return <ExpensesPage controller={controller} />;
  if (page === "payments") return <PayablesPage controller={controller} />;
  if (page === "receivables") return <ReceivablesPage controller={controller} />;
  if (page === "cadastros") return <CadastrosPage controller={controller} />;
  return <section className="panel"><h3>Área não editável</h3><p>Esta área é apenas para consulta nesta etapa.</p></section>;
}
