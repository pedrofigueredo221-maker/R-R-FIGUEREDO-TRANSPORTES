import Despesas from "./Despesas.jsx";

// A estrutura visual e os formulários de parcelas são compartilhados,
// mas o controlador envia page="payments" para aplicar os rótulos e filtros corretos.
export default function ContasAPagar({ controller }) {
  return <Despesas controller={controller} />;
}
