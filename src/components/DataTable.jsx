export function DataTable({ columns, rows, emptyLabel = "Nenhum registro encontrado." }) {
  return rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.id ?? row.key ?? index}>{columns.map((column) => <td key={column.key} className={column.numeric ? "numeric" : ""}>{column.render ? column.render(row) : (row[column.key] ?? "—")}</td>)}</tr>)}</tbody>
  </table></div> : <div className="empty-state"><strong>{emptyLabel}</strong></div>;
}
