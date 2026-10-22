import { useMemo, useState } from "react";

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
    </select> : <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "checkbox" ? e.target.checked : e.target.value)} required={required} min={min} step={step} placeholder={placeholder} />}
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

export default function EditablePage({ page, data, onSave, readOnly, loading }) {
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
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
    setError(""); setEditingId(null); setForm(kind === "freight" ? blankFreight() : kind === "expense" ? blankExpense() : kind === "employee" ? blankEmployee() : kind === "truck" ? blankTruck() : { name: "" });
  };
  const startEdit = (kind, record) => {
    setError(""); setEditingId(record.id); setForm(kind === "freight" ? { ...blankFreight(), ...record, value: String(record.value ?? ""), discount: String(record.discount ?? 0), toll: String(record.toll ?? 0), bonus: String(record.bonus ?? 0), commission: String(record.commission ?? 13), received: String(record.received ?? 0) } : kind === "expense" ? { ...blankExpense(), ...record, value: String(record.value ?? ""), installmentsCount: String((record.installments || []).length || 1) } : { ...record });
  };
  const commit = async (next) => {
    setSaving(true); setError("");
    try { await onSave(next); setForm(null); setEditingId(null); setPayment(null); }
    catch (e) { setError(e?.message || "Não foi possível salvar. Os dados locais foram preservados."); }
    finally { setSaving(false); }
  };
  const remove = async (key, record) => {
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
    const value = { ...form, id: editingId || uid(), value: number(form.value), discount: number(form.discount), toll: number(form.toll), bonus: number(form.bonus), commission: number(form.commission), received: number(form.received), km: number(form.km), liters: number(form.liters), dieselPrice: number(form.dieselPrice), fuelActual: number(form.fuelActual) };
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

  if (page === "freights") return <section className="panel">
    <div className="panel-heading"><div><h3>Fretes</h3><p>Cadastre e edite fretes e custos relacionados.</p></div><button className="primary-button" disabled={loading || saving} onClick={() => startCreate("freight")}>+ Novo frete</button></div>
    {showError}{form && <RecordForm title={editingId ? "Editar frete" : "Novo frete"} value={form} setValue={setForm} saving={saving} onCancel={() => setForm(null)} onSubmit={saveFreight} fields={[
      {key:"date",label:"Data",type:"date",required:true},{key:"customer",label:"Cliente"},{key:"driver",label:"Motorista",options:[{value:"",label:"Selecione"},...(data.employees||[]).filter(e=>e.role==="Motorista"&&e.active!==false).map(e=>({value:e.name,label:e.name}))]},{key:"truck",label:"Caminhão",options:[{value:"",label:"Selecione"},...(data.trucks||[]).filter(t=>t.active!==false).map(t=>({value:t.name,label:t.name}))]},
      {key:"origin",label:"Origem"},{key:"destination",label:"Destino"},{key:"value",label:"Valor do frete (R$)",type:"number",min:"0",step:"0.01",required:true},{key:"discount",label:"Descontos gerais (R$)",type:"number",min:"0",step:"0.01"},{key:"toll",label:"Pedágio (R$)",type:"number",min:"0",step:"0.01"},{key:"deductToll",label:"Descontar pedágio da base?",type:"checkbox"},{key:"commissionType",label:"Tipo de comissão",options:[{value:"percent",label:"Percentual"},{value:"fixed",label:"Valor fixo"}]},{key:"commission",label:"Comissão (% ou R$)",type:"number",min:"0",step:"0.01"},{key:"bonus",label:"Bônus (R$)",type:"number",min:"0",step:"0.01"},{key:"km",label:"Quilometragem",type:"number",min:"0",step:"1"},{key:"liters",label:"Litros estimados",type:"number",min:"0",step:"0.01"},{key:"dieselPrice",label:"Preço do diesel (R$/L)",type:"number",min:"0",step:"0.01"},{key:"fuelActual",label:"Combustível real (R$)",type:"number",min:"0",step:"0.01"},{key:"received",label:"Total já recebido (R$)",type:"number",min:"0",step:"0.01"},{key:"notes",label:"Observações"}]} />}
    {toolbar}<div className="table-scroll"><table><thead><tr><th>Data</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor</th><th>Recebido</th><th>Ações</th></tr></thead><tbody>{filteredFreights.map((f)=><tr key={f.id}><td>{dateLabel(f.date)}</td><td>{f.customer||"—"}</td><td>{f.driver||"—"}</td><td>{[f.origin,f.destination].filter(Boolean).join(" → ")||"—"}</td><td>{money(f.value)}</td><td>{money(f.received)}</td><td><Actions onEdit={()=>startEdit("freight",f)} onDelete={()=>remove("freights",f)} /><button className="secondary-button" type="button" onClick={()=>{setPayment({kind:"receive",record:f});setPaymentAmount("");setPaymentDate(today());}}>Registrar recebimento</button></td></tr>)}</tbody></table></div>
    {payment?.kind==="receive" && <div className="record-editor"><h3>Recebimento do frete</h3><p>Saldo em aberto: {money(number(payment.record.value)-number(payment.record.received))}</p><div className="editor-grid"><Field label="Valor recebido (R$)" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={setPaymentAmount} required/><Field label="Data" type="date" value={paymentDate} onChange={setPaymentDate} required/><Field label="Forma de recebimento" value={paymentMethod} onChange={setPaymentMethod} options={["PIX","Transferência","Dinheiro","Boleto","Adiantamento inicial","Outro"]}/></div><button className="primary-button" disabled={saving||number(paymentAmount)<=0} onClick={()=>{const current=allFreights.find(f=>f.id===payment.record.id);const amount=number(paymentAmount);if(amount>Math.max(0,number(current.value)-number(current.received))&&!window.confirm("O valor informado ultrapassa o saldo. Deseja registrar mesmo assim?"))return;const receipts=[...(current.receipts||[]),{date:paymentDate,amount,method:paymentMethod}];commit({...data,freights:allFreights.map(f=>f.id===current.id?{...f,received:number(f.received)+amount,receipts}:f)});}}>Salvar recebimento</button><button className="secondary-button" onClick={()=>setPayment(null)}>Cancelar</button></div>}
  </section>;

  if (page === "expenses" || page === "payments") return <section className="panel">
    <div className="panel-heading"><div><h3>{page==="payments"?"Contas a pagar":"Despesas e manutenção"}</h3><p>Cadastre despesas e registre pagamentos por parcela.</p></div><button className="primary-button" disabled={saving||loading} onClick={()=>startCreate("expense")}>+ Nova despesa</button></div>
    {showError}{form && <RecordForm title={editingId?"Editar despesa":"Nova despesa"} value={form} setValue={setForm} saving={saving} onCancel={()=>setForm(null)} onSubmit={saveExpense} fields={[
      {key:"created",label:"Data do lançamento",type:"date",required:true},{key:"description",label:"Descrição",required:true},{key:"category",label:"Categoria",options:categories},{key:"truck",label:"Caminhão",options:[{value:"",label:"Não vinculado"},...(data.trucks||[]).map(t=>({value:t.name,label:t.name}))]},{key:"supplier",label:"Fornecedor"},{key:"value",label:"Valor total (R$)",type:"number",min:"0.01",step:"0.01",required:true},{key:"due",label:"Vencimento da primeira parcela",type:"date",required:true},{key:"installmentsCount",label:"Quantidade de parcelas",type:"number",min:"1",step:"1",required:true},{key:"notes",label:"Observações"}]} />}
    {toolbar}<div className="table-scroll"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Caminhão</th><th>Total</th><th>Pago</th><th>Em aberto</th><th>Ações</th></tr></thead><tbody>{filteredExpenses.map((e)=><tr key={e.id}><td>{e.description}</td><td>{e.category}</td><td>{e.truck||"—"}</td><td>{money(e.value)}</td><td>{money((e.installments||[]).reduce((s,i)=>s+number(i.paid),0))}</td><td>{money(Math.max(0,number(e.value)-(e.installments||[]).reduce((s,i)=>s+number(i.paid),0)))}</td><td><Actions onEdit={()=>startEdit("expense",e)} onDelete={()=>remove("expenses",e)} /></td></tr>)}</tbody></table></div>
    {filteredExpenses.map((e)=><details className="installment-details" key={e.id}><summary>{e.description} — {e.installments?.length||0} parcela(s)</summary><div className="table-scroll"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Pago</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{(e.installments||[]).map((i,index)=><tr key={index}><td>{index+1}/{e.installments.length}</td><td>{dateLabel(i.due)}</td><td>{money(i.value)}</td><td>{money(i.paid)}</td><td>{number(i.paid)>=number(i.value)?"Paga":number(i.paid)>0?"Parcial":"Em aberto"}</td><td><button className="secondary-button" type="button" disabled={number(i.paid)>=number(i.value)} onClick={()=>{setPayment({kind:"expense",expense:e,index,installment:i});setPaymentAmount(String(Math.max(0,number(i.value)-number(i.paid))));setPaymentDate(today());}}>Registrar pagamento</button></td></tr>)}</tbody></table></div></details>)}
    {payment?.kind==="expense" && <div className="record-editor"><h3>Registrar pagamento</h3><p>{payment.expense.description} — parcela {payment.index+1}</p><div className="editor-grid"><Field label="Valor pago (R$)" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={setPaymentAmount} required/><Field label="Data do pagamento" type="date" value={paymentDate} onChange={setPaymentDate} required/><Field label="Forma de pagamento" value={paymentMethod} onChange={setPaymentMethod} options={["PIX","Transferência","Dinheiro","Boleto","Débito","Crédito","Outro"]}/></div><button className="primary-button" disabled={saving||number(paymentAmount)<=0} onClick={()=>{const amount=number(paymentAmount);const fresh=allExpenses.find(x=>x.id===payment.expense.id);const items=(fresh.installments||[]).map((i,index)=>index!==payment.index?i:{...i,paid:number(i.paid)+amount,payments:[...(i.payments||[]),{date:paymentDate,amount,method:paymentMethod}]});commit({...data,expenses:allExpenses.map(x=>x.id===fresh.id?{...fresh,installments:items}:x)});}}>Salvar pagamento</button><button className="secondary-button" onClick={()=>setPayment(null)}>Cancelar</button></div>}
  </section>;

  if (page === "receivables") return <section className="panel"><div className="panel-heading"><div><h3>Contas a receber</h3><p>Registre recebimentos parciais ou totais vinculados aos fretes.</p></div></div>{showError}{toolbar}<div className="table-scroll"><table><thead><tr><th>Data</th><th>Cliente</th><th>Rota</th><th>Valor</th><th>Recebido</th><th>Saldo</th><th>Ação</th></tr></thead><tbody>{filteredFreights.map((f)=><tr key={f.id}><td>{dateLabel(f.date)}</td><td>{f.customer||"—"}</td><td>{[f.origin,f.destination].filter(Boolean).join(" → ")||"—"}</td><td>{money(f.value)}</td><td>{money(f.received)}</td><td>{money(Math.max(0,number(f.value)-number(f.received)))}</td><td><button className="secondary-button" onClick={()=>{setPayment({kind:"receive",record:f});setPaymentAmount("");setPaymentDate(today());}}>Registrar recebimento</button></td></tr>)}</tbody></table></div></section>;

  if (page === "cadastros") {
    const rows = tab==="employees" ? employees : tab==="trucks" ? trucks : categories.filter((c)=>!query||c.toLocaleLowerCase("pt-BR").includes(query)).map((name)=>({id:name,name}));
    const kind = tab==="employees"?"employee":tab==="trucks"?"truck":"category";
    return <section className="panel"><div className="panel-heading"><div><h3>Cadastros da empresa</h3><p>Gerencie funcionários, caminhões e categorias.</p></div><button className="primary-button" onClick={()=>startCreate(kind)}>+ Adicionar</button></div>{showError}
      <div className="tabs-row"><button className={tab==="employees"?"active":""} onClick={()=>setTab("employees")}>Funcionários ({employees.length})</button><button className={tab==="trucks"?"active":""} onClick={()=>setTab("trucks")}>Caminhões ({trucks.length})</button><button className={tab==="categories"?"active":""} onClick={()=>setTab("categories")}>Categorias ({categories.length})</button></div>
      {form && <RecordForm title={editingId?"Editar cadastro":"Novo cadastro"} value={form} setValue={setForm} saving={saving} onCancel={()=>setForm(null)} onSubmit={()=>{if(kind==="employee"||tab==="employees"){const row={...form,id:editingId||uid(),commissionValue:number(form.commissionValue)};commit({...data,employees:editingId?(data.employees||[]).map(x=>x.id===editingId?row:x):[row,...(data.employees||[])]});}else if(kind==="truck"||tab==="trucks"){const row={...form,id:editingId||uid()};commit({...data,trucks:editingId?(data.trucks||[]).map(x=>x.id===editingId?row:x):[row,...(data.trucks||[])]});}else{const old=editingId;const name=String(form.name||"").trim();if(!name)return setError("Informe o nome da categoria.");if(categories.includes(name)&&name!==old)return setError("Essa categoria já existe.");if(old&&(data.expenses||[]).some(e=>e.category===old))return setError("Essa categoria está vinculada a despesas. Preserve-a para manter o histórico.");const next=old?categories.map(c=>c===old?name:c):[...categories,name];commit({...data,categories:next});}}} fields={tab==="employees"?[{key:"name",label:"Nome completo",required:true},{key:"role",label:"Função",options:["Motorista","Diretor","Gerente","Outro"]},{key:"phone",label:"Telefone"},{key:"commissionType",label:"Tipo de comissão",options:[{value:"percent",label:"Percentual"},{value:"fixed",label:"Valor fixo"}]},{key:"commissionValue",label:"Comissão (% ou R$)",type:"number",min:"0",step:"0.01"},{key:"active",label:"Ativo",type:"checkbox"}]:tab==="trucks"?[{key:"name",label:"Nome do caminhão",required:true},{key:"plate",label:"Placa"},{key:"driverId",label:"Motorista",options:[{value:"",label:"Não vinculado"},...(data.employees||[]).filter(e=>e.role==="Motorista").map(e=>({value:e.id,label:e.name}))]},{key:"active",label:"Ativo",type:"checkbox"}]:[{key:"name",label:"Nome da categoria",required:true}]} />}
      {toolbar}
      {tab==="employees" && <div className="table-scroll"><table><thead><tr><th>Nome</th><th>Função</th><th>Telefone</th><th>Comissão</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.role||"Motorista"}</td><td>{e.phone||"—"}</td><td>{e.commissionType==="fixed"?money(e.commissionValue):`${number(e.commissionValue??13)}%`}</td><td>{e.active===false?"Inativo":"Ativo"}</td><td><Actions onEdit={()=>startEdit("employee",e)} onDelete={()=>remove("employees",e)}/></td></tr>)}</tbody></table></div>}
      {tab==="trucks" && <div className="table-scroll"><table><thead><tr><th>Caminhão</th><th>Placa</th><th>Motorista</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{t.name}</td><td>{t.plate||"—"}</td><td>{(data.employees||[]).find(e=>e.id===t.driverId)?.name||"—"}</td><td>{t.active===false?"Inativo":"Ativo"}</td><td><Actions onEdit={()=>startEdit("truck",t)} onDelete={()=>remove("trucks",t)}/></td></tr>)}</tbody></table></div>}
      {tab==="categories" && <div className="table-scroll"><table><thead><tr><th>Categoria</th><th>Ações</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td>{c.name}</td><td><Actions onEdit={()=>{setEditingId(c.name);setForm({name:c.name});}} onDelete={()=>{if((data.expenses||[]).some(e=>e.category===c.name)){setError("Essa categoria está vinculada a despesas e não pode ser excluída.");return;}if(window.confirm("Excluir esta categoria?"))commit({...data,categories:categories.filter(x=>x!==c.name)});}}/></td></tr>)}</tbody></table></div>}
    </section>;
  }
  return <section className="panel"><h3>Área não editável</h3><p>Esta área é apenas para consulta nesta etapa.</p></section>;
}
