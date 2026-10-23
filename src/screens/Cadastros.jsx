import FormularioFuncionario from "./FormularioFuncionario.jsx";

export default function Cadastros({ controller }) {
  const {
    data, readOnly, saving, form, setForm, editingId, setEditingId, startCreate,
    startEdit, showError, toolbar, Actions, RecordForm, remove, number, commit,
    setError, categories, employees, trucks, tab, setTab, query, uid, money
  } = controller;

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const rows = tab === "employees"
    ? employees
    : tab === "trucks"
      ? trucks
      : categories
        .filter((category) => !normalizedQuery || category.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
        .map((name) => ({ id: name, name }));
  const kind = tab === "employees" ? "employee" : tab === "trucks" ? "truck" : "category";

  const employeeFields = [
    { key: "name", label: "Nome completo", required: true, placeholder: "Nome e sobrenome" },
    { key: "role", label: "Função", options: ["Motorista", "Diretor", "Gerente", "Outro"] },
    { key: "phone", label: "Telefone", placeholder: "(00) 00000-0000" },
    { key: "commissionType", label: "Tipo de comissão", options: [{ value: "percent", label: "Percentual" }, { value: "fixed", label: "Valor fixo" }] },
    { key: "commissionValue", label: "Comissão (% ou R$)", type: "number", min: "0", step: "0.01" },
    { key: "active", label: "Funcionário ativo", type: "checkbox" }
  ];
  const truckFields = [
    { key: "name", label: "Nome do caminhão", required: true },
    { key: "plate", label: "Placa" },
    { key: "driverId", label: "Motorista", options: [{ value: "", label: "Não vinculado" }, ...employees.filter((employee) => employee.role === "Motorista").map((employee) => ({ value: employee.id, label: employee.name }))] },
    { key: "active", label: "Ativo", type: "checkbox" }
  ];
  const categoryFields = [{ key: "name", label: "Nome da categoria", required: true }];

  const saveRecord = () => {
    if (tab === "employees") {
      const row = { ...form, id: editingId || uid(), commissionValue: number(form.commissionValue) };
      return commit({ ...data, employees: editingId
        ? (data.employees || []).map((employee) => employee.id === editingId ? row : employee)
        : [row, ...(data.employees || [])] });
    }

    if (tab === "trucks") {
      const row = { ...form, id: editingId || uid() };
      return commit({ ...data, trucks: editingId
        ? (data.trucks || []).map((truck) => truck.id === editingId ? row : truck)
        : [row, ...(data.trucks || [])] });
    }

    const oldName = editingId;
    const name = String(form.name || "").trim();
    if (!name) return setError("Informe o nome da categoria.");
    if (categories.includes(name) && name !== oldName) return setError("Essa categoria já existe.");
    if (oldName && (data.expenses || []).some((expense) => expense.category === oldName)) {
      return setError("Essa categoria está vinculada a despesas. Preserve-a para manter o histórico.");
    }
    const next = oldName ? categories.map((category) => category === oldName ? name : category) : [...categories, name];
    return commit({ ...data, categories: next });
  };

  const deleteCategory = (category) => {
    if ((data.expenses || []).some((expense) => expense.category === category.name)) {
      setError("Essa categoria está vinculada a despesas e não pode ser excluída.");
      return;
    }
    if (window.confirm("Excluir esta categoria?")) {
      commit({ ...data, categories: categories.filter((name) => name !== category.name) });
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div><h3>Cadastros da empresa</h3><p>Gerencie funcionários, caminhões e categorias.</p></div>
        {!readOnly && <button className="primary-button" type="button" onClick={() => startCreate(kind)}>+ Adicionar {tab === "employees" ? "funcionário" : tab === "trucks" ? "caminhão" : "categoria"}</button>}
      </div>
      {showError}

      <div className="tabs-row" role="tablist" aria-label="Tipos de cadastro">
        <button type="button" role="tab" aria-selected={tab === "employees"} className={tab === "employees" ? "active" : ""} onClick={() => { setForm(null); setTab("employees"); }}>Funcionários ({employees.length})</button>
        <button type="button" role="tab" aria-selected={tab === "trucks"} className={tab === "trucks" ? "active" : ""} onClick={() => { setForm(null); setTab("trucks"); }}>Caminhões ({trucks.length})</button>
        <button type="button" role="tab" aria-selected={tab === "categories"} className={tab === "categories" ? "active" : ""} onClick={() => { setForm(null); setTab("categories"); }}>Categorias ({categories.length})</button>
      </div>

      {!readOnly && form && tab === "employees" && (
        <FormularioFuncionario
          title={editingId ? "Editar funcionário" : "Adicionar funcionário"}
          fields={employeeFields} value={form} setValue={setForm} saving={saving}
          onCancel={() => { setForm(null); setEditingId(null); }}
          onSubmit={saveRecord}
        />
      )}
      {!readOnly && form && tab !== "employees" && (
        <RecordForm
          title={editingId ? (tab === "trucks" ? "Editar caminhão" : "Editar categoria") : (tab === "trucks" ? "Adicionar caminhão" : "Adicionar categoria")}
          value={form} setValue={setForm} saving={saving}
          onCancel={() => { setForm(null); setEditingId(null); }}
          onSubmit={saveRecord}
          fields={tab === "trucks" ? truckFields : categoryFields}
        />
      )}

      {toolbar}
      {tab === "employees" && (
        <div className="table-scroll"><table><thead><tr><th>Nome</th><th>Função</th><th>Telefone</th><th>Comissão</th><th>Status</th>{!readOnly && <th>Ações</th>}</tr></thead>
          <tbody>{rows.map((employee) => <tr key={employee.id}>
            <td>{employee.name}</td><td>{employee.role || "Motorista"}</td><td>{employee.phone || "—"}</td>
            <td>{employee.commissionType === "fixed" ? money(employee.commissionValue) : `${number(employee.commissionValue ?? 13)}%`}</td>
            <td>{employee.active === false ? "Inativo" : "Ativo"}</td>
            {!readOnly && <td><Actions onEdit={() => startEdit("employee", employee)} onDelete={() => remove("employees", employee)} /></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      {tab === "trucks" && (
        <div className="table-scroll"><table><thead><tr><th>Caminhão</th><th>Placa</th><th>Motorista</th><th>Status</th>{!readOnly && <th>Ações</th>}</tr></thead>
          <tbody>{rows.map((truck) => <tr key={truck.id}>
            <td>{truck.name}</td><td>{truck.plate || "—"}</td><td>{(data.employees || []).find((employee) => employee.id === truck.driverId)?.name || "—"}</td>
            <td>{truck.active === false ? "Inativo" : "Ativo"}</td>
            {!readOnly && <td><Actions onEdit={() => startEdit("truck", truck)} onDelete={() => remove("trucks", truck)} /></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      {tab === "categories" && (
        <div className="table-scroll"><table><thead><tr><th>Categoria</th>{!readOnly && <th>Ações</th>}</tr></thead>
          <tbody>{rows.map((category) => <tr key={category.id}>
            <td>{category.name}</td>{!readOnly && <td><Actions onEdit={() => { setEditingId(category.name); setForm({ name: category.name }); }} onDelete={() => deleteCategory(category)} /></td>}
          </tr>)}</tbody>
        </table></div>
      )}
    </section>
  );
}
