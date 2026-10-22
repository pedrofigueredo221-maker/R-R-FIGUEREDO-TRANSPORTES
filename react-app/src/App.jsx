const migrationSteps = [
  {
    title: "Preservar o sistema atual",
    description:
      "O HTML, o CSS, o JavaScript de produção e a sincronização continuam sendo a referência funcional."
  },
  {
    title: "Migrar uma parte por vez",
    description:
      "Cada componente será isolado e comparado com o comportamento atual antes de substituir qualquer tela."
  },
  {
    title: "Validar antes de integrar",
    description:
      "Login, fretes, cálculos financeiros e sincronização precisam continuar funcionando antes de avançar."
  }
];

export default function App() {
  return (
    <main className="migration-page">
      <header className="migration-header">
        <div className="brand-mark" aria-hidden="true">R&amp;R</div>
        <div>
          <p className="eyebrow">R&amp;R FIGUEREDO TRANSPORTES</p>
          <h1>Base de migração para React</h1>
        </div>
      </header>

      <section className="intro" aria-labelledby="migration-title">
        <p className="status-label">ETAPA INICIAL</p>
        <h2 id="migration-title">Uma mudança por vez, sem perder o que já funciona.</h2>
        <p>
          Esta é uma área técnica isolada para preparar a migração. O sistema
          atual continua separado e não depende desta tela para funcionar.
        </p>
      </section>

      <section className="steps" aria-label="Princípios da migração">
        {migrationSteps.map((step, index) => (
          <article className="step-card" key={step.title}>
            <span className="step-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="migration-footer">
        Esta base ainda não acessa nem modifica os dados do sistema.
      </footer>
    </main>
  );
}
