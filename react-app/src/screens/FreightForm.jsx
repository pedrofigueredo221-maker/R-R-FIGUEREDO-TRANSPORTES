import { freightBase, freightCommission, freightProfit, freightDriverPayment, freightOperatingCosts } from "../domain/freightCalculations.js";

const amount = (value) => Math.max(0, Number(value) || 0);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

function FreightField({ label, value, onChange, type = "text", required = false, min, step, options, placeholder, readOnly = false }) {
  return <label className={`editor-field ${type === "checkbox" ? "checkbox-field" : ""}`}>
    <span>{label}</span>
    {options ? <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} disabled={readOnly}>
      {options.map((item) => typeof item === "string" ? <option key={item} value={item}>{item}</option> : <option key={item.value} value={item.value}>{item.label}</option>)}
    </select> : type === "checkbox" ? <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} disabled={readOnly} /> :
    <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} min={min} step={step} placeholder={placeholder} readOnly={readOnly} />}
  </label>;
}

export default function FreightForm({ title, value, setValue, onSubmit, onCancel, saving, employees = [], trucks = [], editing = false }) {
  const patch = (key, next) => setValue((current) => ({ ...current, [key]: next }));
  const estimatedFuel = amount(value.liters) * amount(value.dieselPrice);
  const calculationInput = { ...value, value: amount(value.value), discount: amount(value.discount), toll: amount(value.toll), commission: amount(value.commission), bonus: amount(value.bonus), fuelActual: amount(value.fuelActual) };
  const summary = [
    ["Valor do frete", money(value.value)],
    ["Pagamento estimado ao motorista", money(freightDriverPayment(calculationInput))],
    ["Adiantamento recebido", money(value.received)],
    ["Saldo a receber", money(Math.max(0, amount(value.value) - amount(value.received) - amount(value.discount)))],
    ["Custos totais da viagem", money(freightOperatingCosts(calculationInput) + amount(value.bonus))],
    ["Lucro estimado", money(freightProfit(calculationInput))]
  ];
  const fields = [
    { key: "date", label: "Data do frete", type: "date", required: true },
    { key: "customer", label: "Cliente", placeholder: "Nome do cliente" },
    { key: "driver", label: "Motorista", options: [{ value: "", label: "Selecione o motorista" }, ...employees.filter((employee) => employee.role === "Motorista" && employee.active !== false).map((employee) => ({ value: employee.name, label: employee.name }))] },
    { key: "truck", label: "Caminhão", options: [{ value: "", label: "Selecione o caminhão" }, ...trucks.filter((truck) => truck.active !== false).map((truck) => ({ value: truck.name, label: truck.name }))] },
    { key: "origin", label: "Origem", placeholder: "Cidade de origem" },
    { key: "destination", label: "Destino", placeholder: "Cidade de destino" },
    { key: "value", label: "Valor do frete (R$)", type: "number", min: "0", step: "0.01", required: true },
    { key: "discount", label: "Descontos gerais (R$)", type: "number", min: "0", step: "0.01" },
    { key: "toll", label: "Pedágio (R$)", type: "number", min: "0", step: "0.01" },
    { key: "commissionType", label: "Tipo de comissão", options: [{ value: "percent", label: "Percentual" }, { value: "fixed", label: "Valor fixo" }] },
    { key: "commission", label: "Comissão (% ou R$)", type: "number", min: "0", step: "0.01" },
    { key: "bonus", label: "Bônus (R$)", type: "number", min: "0", step: "0.01" },
    { key: "otherCosts", label: "Outros custos da viagem (R$)", type: "number", min: "0", step: "0.01" },
    { key: "km", label: "Quilometragem", type: "number", min: "0", step: "1" },
    { key: "received", label: "Recebido na viagem (R$)", type: "number", min: "0", step: "0.01" },
    { key: "notes", label: "Observações", placeholder: "Informações adicionais" }
  ];
  return <form className="record-editor freight-editor" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <div className="editor-heading"><h3>{title}</h3><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button></div>
    <div className="editor-grid freight-fields">{fields.filter((field) => field.key !== "received" || !editing).map((field) => <FreightField key={field.key} {...field} value={value[field.key]} onChange={(next) => patch(field.key, next)} />)}</div>
    {!editing && <p className="receipt-sync-note">Se houve pagamento no momento da viagem, informe o valor recebido aqui. Ele será registrado no histórico e o status do frete será atualizado automaticamente.</p>}
    <section className="fuel-section" aria-labelledby="fuel-section-title">
      <div className="fuel-section-heading"><h4 id="fuel-section-title">Combustível</h4><p>Estimativa automática a partir dos litros e do preço por litro.</p></div>
      <div className="fuel-grid">
        <FreightField label="Litros estimados" type="number" min="0" step="0.01" value={value.liters} onChange={(next) => patch("liters", next)} />
        <FreightField label="Preço do diesel (R$/L)" type="number" min="0" step="0.01" value={value.dieselPrice} onChange={(next) => patch("dieselPrice", next)} />
        <FreightField label="Gasto estimado (R$)" value={money(estimatedFuel)} readOnly />
        <FreightField label="Gasto real do combustível (R$)" type="number" min="0" step="0.01" value={value.fuelActual} onChange={(next) => patch("fuelActual", next)} />
      </div>
    </section>
    <div className="toll-checkbox-row">
      <FreightField label="Descontar o pedágio da base da comissão" type="checkbox" value={value.deductToll} onChange={(next) => patch("deductToll", next)} />
      <p>Quando marcado, o pedágio reduz a base usada para calcular a comissão. O pedágio continua contabilizado no custo do frete.</p>
    </div>
    <section className="freight-summary" aria-label="Resumo financeiro estimado">
      <div className="freight-summary-heading"><h4>Resumo financeiro</h4><span>Valores calculados automaticamente</span></div>
      <div className="freight-summary-grid">{summary.map(([label, total]) => <div className="freight-summary-item" key={label}><span>{label}</span><strong>{total}</strong></div>)}</div>
    </section>
    <p className="receipt-sync-note">Os custos informados neste frete já entram no lucro estimado. Não lance o mesmo gasto novamente em Despesas para evitar contá-lo duas vezes.</p>
    <div className="editor-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar frete"}</button></div>
  </form>;
}
