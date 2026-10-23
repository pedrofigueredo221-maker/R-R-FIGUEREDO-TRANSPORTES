import { isRecordNavigable } from "../design-system/standards.js";

/**
 * Duplo clique abre o registro de origem. A ação depende da permissão
 * e da capacidade da tela destino de exibir o registro.
 */
export default function StandardRecordRow({ record, onOpen, children, className = "", ...props }) {
  const canOpen = typeof onOpen === "function" && isRecordNavigable(record);
  return <tr {...props} className={[className, canOpen ? "rr-record-row" : ""].filter(Boolean).join(" ")}
    title={canOpen ? "Duplo clique para abrir" : undefined}
    onDoubleClick={canOpen ? () => onOpen(record) : undefined}>
    {children}
  </tr>;
}
