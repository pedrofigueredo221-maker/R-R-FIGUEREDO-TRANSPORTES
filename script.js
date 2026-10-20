// Lógica principal do controle de fretes
let fretes = JSON.parse(localStorage.getItem('fretes_db')) || [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar data padrão no filtro de mês e no formulário
    const hoje = new Date();
    document.getElementById('filtroMes').value = hoje.toISOString().slice(0, 7);
    document.getElementById('dataFrete').valueAsDate = hoje;
    
    renderizarTabela();
});

// Cadastro de novo frete
document.getElementById('formFrete').addEventListener('submit', function(e) {
    e.preventDefault();

    const valorFrete = parseFloat(document.getElementById('valorFrete').value) || 0;
    const valorPedagio = parseFloat(document.getElementById('valorPedagio').value) || 0;
    const percComissao = parseFloat(document.getElementById('percComissao').value) || 0;
    const descontarPedagio = document.getElementById('descontarPedagio').checked;

    // Cálculo da base da comissão
    let baseComissao = valorFrete;
    if (descontarPedagio) {
        baseComissao = valorFrete - valorPedagio;
    }
    const comissaoCalculada = baseComissao > 0 ? (baseComissao * (percComissao / 100)) : 0;

    const novoFrete = {
        id: Date.now(),
        data: document.getElementById('dataFrete').value,
        motorista: document.getElementById('motorista').value,
        origem: document.getElementById('origem').value,
        destino: document.getElementById('destino').value,
        valorFrete: valorFrete,
        valorPedagio: valorPedagio,
        percComissao: percComissao,
        descontarPedagio: descontarPedagio,
        valorComissao: comissaoCalculada,
        status: document.getElementById('statusPagamento').value
    };

    fretes.push(novoFrete);
    salvarDados();
    renderizarTabela();
    this.reset();

    // Resetar valores padrão
    document.getElementById('dataFrete').valueAsDate = new Date();
    document.getElementById('percComissao').value = '10';
});

// Persistência em LocalStorage
function salvarDados() {
    localStorage.setItem('fretes_db', JSON.stringify(fretes));
}

// Alterar Status (Pago / Pendente)
function alternarStatus(id) {
    fretes = fretes.map(f => {
        if (f.id === id) {
            f.status = f.status === 'Pago' ? 'Pendente' : 'Pago';
        }
        return f;
    });
    salvarDados();
    renderizarTabela();
}

// Excluir registro
function excluirFrete(id) {
    if (confirm('Tem certeza que deseja excluir este frete?')) {
        fretes = fretes.filter(f => f.id !== id);
        salvarDados();
        renderizarTabela();
    }
}

// Renderização e Atualização das Métricas
function renderizarTabela() {
    const tbody = document.getElementById('tabelaFretes');
    const filtroMotorista = document.getElementById('filtroMotorista').value;
    const filtroMes = document.getElementById('filtroMes').value;
    const filtroStatus = document.getElementById('filtroStatus').value;

    tbody.innerHTML = '';

    let totalFrete = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let totalComissao = 0;
    let count = 0;

    const fretesFiltrados = fretes.filter(f => {
        const matchMotorista = !filtroMotorista || f.motorista === filtroMotorista;
        const matchMes = !filtroMes || f.data.startsWith(filtroMes);
        const matchStatus = !filtroStatus || f.status === filtroStatus;
        return matchMotorista && matchMes && matchStatus;
    });

    fretesFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    fretesFiltrados.forEach(f => {
        totalFrete += f.valorFrete;
        totalComissao += f.valorComissao;

        if (f.status === 'Pago') {
            totalPago += f.valorFrete;
        } else {
            totalPendente += f.valorFrete;
        }
        count++;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b";

        const dataFormatada = f.data.split('-').reverse().join('/');
        const statusClass = f.status === 'Pago' 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-amber-100 text-amber-800 border-amber-300';

        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-700">${dataFormatada}</td>
            <td class="p-3 font-bold text-slate-800">${f.motorista}</td>
            <td class="p-3">${f.origem} → ${f.destino}</td>
            <td class="p-3 font-extrabold text-slate-800">R$ ${f.valorFrete.toFixed(2)}</td>
            <td class="p-3 text-slate-500">R$ ${f.valorPedagio.toFixed(2)}</td>
            <td class="p-3 text-purple-700 font-bold">R$ ${f.valorComissao.toFixed(2)} <span class="text-slate-400 text-[10px]">(${f.percComissao}%)</span></td>
            <td class="p-3">
                <button onclick="alternarStatus(${f.id})" class="px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${statusClass}">
                    ${f.status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                </button>
            </td>
            <td class="p-3 text-center">
                <button onclick="excluirFrete(${f.id})" class="text-red-500 hover:text-red-700 font-bold text-xs p-1">
                    🗑️ Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Atualização dos quadros de métricas
    document.getElementById('cardTotalFrete').innerText = `R$ ${totalFrete.toFixed(2)}`;
    document.getElementById('cardTotalPago').innerText = `R$ ${totalPago.toFixed(2)}`;
    document.getElementById('cardTotalPendente').innerText = `R$ ${totalPendente.toFixed(2)}`;
    document.getElementById('cardTotalComissao').innerText = `R$ ${totalComissao.toFixed(2)}`;
    document.getElementById('contadorFretes').innerText = `${count} registros encontrados`;
}

// Exportação para Excel (CSV)
function exportarCSV() {
    if (fretes.length === 0) {
        alert('Nenhum dado disponível para exportação.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data;Motorista;Origem;Destino;Valor Frete;Pedagio;Comissao;Status\n";

    fretes.forEach(f => {
        csvContent += `${f.data};${f.motorista};${f.origem};${f.destino};${f.valorFrete};${f.valorPedagio};${f.valorComissao};${f.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_fretes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}