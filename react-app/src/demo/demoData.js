// Dados fictícios usados somente quando a URL contém ?demo=1.
// Não copiar dados reais da empresa para este arquivo.
export const DEMO_STORAGE_KEY = "rr-figueredo-react-demo-v1";

export const DEMO_DATA = {
  freights: [
    {
      id: "demo-freight-1", date: "2026-10-21", customer: "Cliente Exemplo Ltda",
      driver: "Motorista Teste", truck: "Caminhão Demonstração 01",
      origin: "Cidade A - SP", destination: "Cidade B - SP", value: 12500,
      discount: 250, toll: 620, deductToll: false, commissionType: "percent",
      commission: 13, bonus: 300, km: 850, liters: 220, dieselPrice: 6.3,
      fuelEstimated: 1386, fuelActual: 1500, received: 5000,
      receipts: [{ date: "2026-10-21", amount: 5000, method: "PIX" }],
      notes: "Registro fictício para testar a tela React"
    },
    {
      id: "demo-freight-2", date: "2026-10-18", customer: "Transportadora Modelo",
      driver: "Motorista Exemplo", truck: "Caminhão Demonstração 02",
      origin: "Cidade C - SP", destination: "Cidade D - SP", value: 8400,
      discount: 0, toll: 350, deductToll: true, commissionType: "percent",
      commission: 12, bonus: 0, km: 540, liters: 145, dieselPrice: 6.2,
      fuelEstimated: 899, fuelActual: 930, received: 0, receipts: [],
      notes: "Frete fictício pendente de recebimento"
    }
  ],
  expenses: [
    {
      id: "demo-expense-1", created: "2026-10-02", description: "Manutenção preventiva (DEMO)",
      category: "Manutenção", truck: "Caminhão Demonstração 01",
      supplier: "Oficina Exemplo", value: 1800, due: "2026-10-10",
      notes: "Despesa fictícia", installments: [
        { due: "2026-10-10", value: 900, paid: 900, payments: [{ date: "2026-10-10", amount: 900, method: "PIX" }] },
        { due: "2026-11-10", value: 900, paid: 0, payments: [] }
      ]
    }
  ],
  receivables: [],
  employees: [
    { id: "demo-employee-1", name: "Motorista Teste", role: "Motorista", phone: "", commissionType: "percent", commissionValue: 13, active: true },
    { id: "demo-employee-2", name: "Motorista Exemplo", role: "Motorista", phone: "", commissionType: "percent", commissionValue: 12, active: true },
    { id: "demo-employee-3", name: "Gerente Demonstração", role: "Gerente", phone: "", commissionType: "percent", commissionValue: 0, active: true }
  ],
  trucks: [
    { id: "demo-truck-1", name: "Caminhão Demonstração 01", plate: "ABC1D23", driverId: "demo-employee-1", active: true },
    { id: "demo-truck-2", name: "Caminhão Demonstração 02", plate: "XYZ4E56", driverId: "demo-employee-2", active: true }
  ],
  categories: ["Combustível", "Pedágio", "Manutenção", "Pneus", "Oficina", "Despesas gerais", "Outros"]
};
