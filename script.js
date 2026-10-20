// Sistema de Gestão R.R. Figueredo Transportes - Unificado & Inteligente

let motoristasPadrao = [
    { id: 1, nome: 'Motorista 1', cpf: '111.222.333-44', telefone: '(19) 99111-2233', comissao: 10.0 },
    { id: 2, nome: 'Motorista 2', cpf: '222.333.444-55', telefone: '(19) 99222-3344', comissao: 10.0 },
    { id: 3, nome: 'Motorista 3', cpf: '333.444.555-66', telefone: '(19) 99333-4455', comissao: 12.0 },
    { id: 4, nome: 'Motorista 4', cpf: '444.555.666-77', telefone: '(19) 99444-5566', comissao: 12.0 },
    { id: 5, nome: 'Motorista 5', cpf: '555.666.777-88', telefone: '(19) 99555-6677', comissao: 12.0 }
];

let frotaPadrao = [
    { id: 1, modelo: 'Caminhão 01 (Carreta TEGMA)', placa: 'ABC-1001', operacao: 'TEGMA (Carreta Alugada)', motoristaId: 1 },
    { id: 2, modelo: 'Caminhão 02 (Carreta TEGMA)', placa: 'ABC-1002', operacao: 'TEGMA (Carreta Alugada)', motoristaId: 2 },
    { id: 3, modelo: 'Caminhão 03 (Sider 7 Eixos)', placa: 'DEF-2001', operacao: 'SIDER (7 Eixos)', motoristaId: 3 },
    { id: 4, modelo: 'Caminhão 04 (Sider 7 Eixos)', placa: 'DEF-2002', operacao: 'SIDER (7 Eixos)', motoristaId: 4 },
    { id: 5, modelo: 'Caminhão 05 (Sider 7 Eixos)', placa: 'DEF-2003', operacao: 'SIDER (7 Eixos)', motoristaId: 5 }
];

let motoristas = JSON.parse(localStorage.getItem('rr_motoristas')) || motoristasPadrao;
let frota = JSON.parse(localStorage.getItem('rr_frota')) || frotaPadrao;
let fretes = JSON.parse(localStorage.getItem('rr_fretes')) || [];
let despesas = JSON.parse(localStorage.getItem('rr_despesas')) || [];

document.addEventListener('DOMContentLoaded', () => {
    salvarMotoristas();
    salvarFrota();

    const hoje = new Date();
    document.getElementById('dataFrete').valueAsDate = hoje;
    document.getElementById('expPrimeiroVenc').valueAsDate = hoje;
    document.getElementById('filtroMes').value = hoje.toISOString().slice(0, 7);

    carregarSelects();
    renderizarTabelaFretes();
    renderizarTabelaDespesas();
    renderizarContasPagar();
    renderizarMotoristas();
    renderizarFrota();
    inicializarTabelaLote();
    renderizarDashboard();
});

function mudarAba(nomeAba) {
    document.querySelectorAll('.aba-conteudo').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`conteudo-${nomeAba}`).classList.remove('hidden');
    document.getElementById(`tab-${nomeAba}`).classList.add('active');

    const titulos = {
        dashboard: 'Visão Geral do Sistema',
        fretes: 'Gestão de Fretes & Viagens',
        lote: 'Lançamento em Lote de Viagens',
        despesas: 'Controle de Despesas & Manutenção',
        pagamentos: 'Contas a Pagar & Parcelas',
        frota: 'Gestão de Frota & Veículos',
        motoristas: 'Gestão de Motoristas',
        relatorios: 'Relatórios Operacionais'
    };

    document.getElementById('tituloPagina').innerText = titulos[nomeAba] || 'Gestão de Transportes';

    if (nomeAba === 'dashboard') renderizarDashboard();
}

function salvarMotoristas() { localStorage.setItem('rr_motoristas', JSON.stringify(motoristas)); }
function salvarFrota() { localStorage.setItem('rr_frota', JSON.stringify(frota)); }
function salvarFretes() { localStorage.setItem('rr_fretes', JSON.stringify(fretes)); }
function salvarDespesas() { localStorage.setItem('rr_despesas', JSON.stringify(despesas)); }

function carregarSelects() {
    const selectVeiculoForm = document.getElementById('selectVeiculoForm');
    const expVeiculo = document.getElementById('expVeiculo');
    const filtroVeiculo = document.getElementById('filtroVeiculo');
    const veicMotorista = document.getElementById('veicMotorista');
    const filtroMotorista = document.getElementById('filtroMotorista');

    selectVeiculoForm.innerHTML = '<option value="">Selecione o veículo...</option>';
    expVeiculo.innerHTML = '<option value="">Todos / Não Definido</option>';
    filtroVeiculo.innerHTML = '<option value="">Todos os Veículos</option>';
    veicMotorista.innerHTML = '<option value="">Nenhum vinculado</option>';
    filtroMotorista.innerHTML = '<option value="">Todos os Motoristas</option>';

    frota.forEach(v => {
        selectVeiculoForm.innerHTML += `<option value="${v.id}">${v.modelo} - ${v.placa}</option>`;
        expVeiculo.innerHTML += `<option value="${v.id}">${v.modelo} - ${v.placa}</option>`;
        filtroVeiculo.innerHTML += `<option value="${v.id}">${v.modelo} - ${v.placa}</option>`;
    });

    motoristas.forEach(m => {
        veicMotorista.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
        filtroMotorista.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
    });
}

function atualizarMotoristaForm() {
    const veiculoId = parseInt(document.getElementById('selectVeiculoForm').value);
    const veiculo = frota.find(v => v.id === veiculoId);
    
    if (veiculo) {
        const motorista = motoristas.find(m => m.id === veiculo.motoristaId);
        if (motorista) {
            document.getElementById('motoristaFormDisplay').value = motorista.nome;
            document.getElementById('percComissao').value = motorista.comissao;
        } else {
            document.getElementById('motoristaFormDisplay').value = "Sem motorista fixo";
        }
    } else {
        document.getElementById('motoristaFormDisplay').value = "";
    }
    calcularPreviaFrete();
}

function calcularPreviaFrete() {
    const v = parseFloat(document.getElementById('valorFrete').value) || 0;
    const t = parseFloat(document.getElementById('valorPedagio').value) || 0;
    const c = parseFloat(document.getElementById('percComissao').value) || 0;
    const descontar = document.getElementById('descontarPedagio').checked;

    let base = v;
    if (descontar) base = v - t;
    const comissao = base > 0 ? (base * (c / 100)) : 0;
    const liquido = v - comissao - (descontar ? t : 0);

    document.getElementById('prevComissao').innerText = `R$ ${comissao.toFixed(2)}`;
    document.getElementById('prevPedagio').innerText = `R$ ${(descontar ? t : 0).toFixed(2)}`;
    document.getElementById('prevLiquido').innerText = `R$ ${liquido.toFixed(2)}`;
}

document.getElementById('formFrete').addEventListener('submit', function(e) {
    e.preventDefault();

    const editId = document.getElementById('freightId').value;
    const veiculoId = parseInt(document.getElementById('selectVeiculoForm').value);
    const veiculo = frota.find(v => v.id === veiculoId);
    const motorista = veiculo ? motoristas.find(m => m.id === veiculo.motoristaId) : null;

    const valorFrete = parseFloat(document.getElementById('valorFrete').value) || 0;
    const valorPedagio = parseFloat(document.getElementById('valorPedagio').value) || 0;
    const percComissao = parseFloat(document.getElementById('percComissao').value) || 0;
    const valorRecebido = parseFloat(document.getElementById('valorRecebido').value) || 0;
    const descontarPedagio = document.getElementById('descontarPedagio').checked;

    let baseComissao = valorFrete;
    if (descontarPedagio) baseComissao = valorFrete - valorPedagio;
    const comissaoCalculada = baseComissao > 0 ? (baseComissao * (percComissao / 100)) : 0;
    const liquidoMotorista = valorFrete - comissaoCalculada - (descontarPedagio ? valorPedagio : 0);

    let status = 'Pendente';
    if (valorRecebido >= valorFrete) status = 'Pago';
    else if (valorRecebido > 0) status = 'Parcial';

    const dadosFrete = {
        id: editId ? parseInt(editId) : Date.now(),
        data: document.getElementById('dataFrete').value,
        veiculoId: veiculoId,
        veiculoPlaca: veiculo ? veiculo.placa : 'N/A',
        motoristaId: motorista ? motorista.id : null,
        motoristaNome: motorista ? motorista.nome : 'N/A',
        cliente: document.getElementById('cliente').value || 'Não Informado',
        origem: document.getElementById('origem').value,
        destino: document.getElementById('destino').value,
        valorFrete: valorFrete,
        valorPedagio: valorPedagio,
        percComissao: percComissao,
        descontarPedagio: descontarPedagio,
        valorComissao: comissaoCalculada,
        liquidoMotorista: liquidoMotorista,
        valorRecebido: valorRecebido,
        status: status
    };

    if (editId) {
        fretes = fretes.map(f => f.id === parseInt(editId) ? dadosFrete : f);
    } else {
        fretes.push(dadosFrete);
    }

    salvarFretes();
    renderizarTabelaFretes();
    renderizarDashboard();
    this.reset();
    document.getElementById('freightId').value = '';
    document.getElementById('dataFrete').valueAsDate = new Date();
    document.getElementById('percComissao').value = '10.0';
    calcularPreviaFrete();
    alert('Frete salvo com sucesso!');
});

function renderizarTabelaFretes() {
    const tbody = document.getElementById('tabelaFretes');
    const fVeiculo = document.getElementById('filtroVeiculo').value;
    const fMotorista = document.getElementById('filtroMotorista').value;
    const fMes = document.getElementById('filtroMes').value;
    const fStatus = document.getElementById('filtroStatus').value;

    tbody.innerHTML = '';

    const filtrados = fretes.filter(f => {
        const matchV = !fVeiculo || f.veiculoId === parseInt(fVeiculo);
        const matchM = !fMotorista || f.motoristaId === parseInt(fMotorista);
        const matchMes = !fMes || f.data.startsWith(fMes);
        const matchS = !fStatus || f.status === fStatus;
        return matchV && matchM && matchMes && matchS;
    });

    filtrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    filtrados.forEach(f => {
        const dataBr = f.data.split('-').reverse().join('/');
        let statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pendente</span>`;
        if (f.status === 'Pago') statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Pago</span>`;
        if (f.status === 'Parcial') statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Parcial</span>`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b";
        tr.innerHTML = `
            <td class="p-3 font-medium">${dataBr}</td>
            <td class="p-3 font-semibold text-slate-800">${f.veiculoPlaca}</td>
            <td class="p-3 text-slate-700">${f.motoristaNome}</td>
            <td class="p-3">${f.origem} → ${f.destino}</td>
            <td class="p-3 font-bold text-slate-900">R$ ${f.valorFrete.toFixed(2)}</td>
            <td class="p-3 text-slate-500">R$ ${f.valorPedagio.toFixed(2)}</td>
            <td class="p-3 text-indigo-700 font-semibold">R$ ${f.valorComissao.toFixed(2)}</td>
            <td class="p-3 text-emerald-800 font-semibold">R$ ${f.liquidoMotorista.toFixed(2)}</td>
            <td class="p-3">${statusBadge} <span class="text-[10px] text-slate-500 block">R$ ${f.valorRecebido.toFixed(2)}</span></td>
            <td class="p-3 text-center space-x-1">
                <button onclick="editarFrete(${f.id})" class="text-blue-600 font-bold hover:underline">Editar</button>
                <button onclick="excluirFrete(${f.id})" class="text-red-600 font-bold hover:underline">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contadorFretes').innerText = `${filtrados.length} registros encontrados`;
}

function editarFrete(id) {
    const f = fretes.find(x => x.id === id);
    if (!f) return;

    document.getElementById('freightId').value = f.id;
    document.getElementById('dataFrete').value = f.data;
    document.getElementById('selectVeiculoForm').value = f.veiculoId;
    document.getElementById('motoristaFormDisplay').value = f.motoristaNome;
    document.getElementById('cliente').value = f.cliente;
    document.getElementById('origem').value = f.origem;
    document.getElementById('destino').value = f.destino;
    document.getElementById('valorFrete').value = f.valorFrete;
    document.getElementById('valorPedagio').value = f.valorPedagio;
    document.getElementById('percComissao').value = f.percComissao;
    document.getElementById('valorRecebido').value = f.valorRecebido;
    document.getElementById('descontarPedagio').checked = f.descontarPedagio;

    calcularPreviaFrete();
}

function excluirFrete(id) {
    if (confirm('Confirma a exclusão deste registro de frete?')) {
        fretes = fretes.filter(f => f.id !== id);
        salvarFretes();
        renderizarTabelaFretes();
        renderizarDashboard();
    }
}

function inicializarTabelaLote() {
    const tbody = document.getElementById('tabelaLoteBody');
    tbody.innerHTML = '';
    for (let i = 0; i < 3; i++) adicionarLinhaLote();
}

function adicionarLinhaLote() {
    const tbody = document.getElementById('tabelaLoteBody');
    const tr = document.createElement('tr');
    tr.className = "lote-row";
    
    let optionsVeiculos = '<option value="">Selecione...</option>';
    frota.forEach(v => { optionsVeiculos += `<option value="${v.id}">${v.placa}</option>`; });

    const hoje = new Date().toISOString().slice(0, 10);

    tr.innerHTML = `
        <td class="p-1.5"><input type="date" value="${hoje}" class="form-input-sm lote-data"></td>
        <td class="p-1.5"><select class="form-input-sm lote-veiculo">${optionsVeiculos}</select></td>
        <td class="p-1.5"><input type="text" placeholder="Origem" class="form-input-sm lote-origem"></td>
        <td class="p-1.5"><input type="text" placeholder="Destino" class="form-input-sm lote-destino"></td>
        <td class="p-1.5"><input type="number" step="0.01" placeholder="0.00" class="form-input-sm lote-valor"></td>
        <td class="p-1.5"><input type="number" step="0.01" placeholder="0.00" class="form-input-sm lote-pedagio"></td>
        <td class="p-1.5"><input type="number" step="0.1" value="10.0" class="form-input-sm lote-comissao"></td>
        <td class="p-1.5 text-center"><button onclick="this.closest('tr').remove()" class="text-red-600 font-bold">X</button></td>
    `;
    tbody.appendChild(tr);
}

function salvarLote() {
    const rows = document.querySelectorAll('.lote-row');
    let adicionados = 0;

    rows.forEach(row => {
        const veiculoId = parseInt(row.querySelector('.lote-veiculo').value);
        const valorFrete = parseFloat(row.querySelector('.lote-valor').value) || 0;
        const origem = row.querySelector('.lote-origem').value;
        const destino = row.querySelector('.lote-destino').value;

        if (veiculoId && valorFrete > 0 && origem && destino) {
            const veiculo = frota.find(v => v.id === veiculoId);
            const motorista = veiculo ? motoristas.find(m => m.id === veiculo.motoristaId) : null;
            const valorPedagio = parseFloat(row.querySelector('.lote-pedagio').value) || 0;
            const percComissao = parseFloat(row.querySelector('.lote-comissao').value) || 10;

            const comissao = valorFrete * (percComissao / 100);

            fretes.push({
                id: Date.now() + Math.random(),
                data: row.querySelector('.lote-data').value,
                veiculoId: veiculoId,
                veiculoPlaca: veiculo ? veiculo.placa : 'N/A',
                motoristaId: motorista ? motorista.id : null,
                motoristaNome: motorista ? motorista.nome : 'N/A',
                cliente: 'Lançamento em Lote',
                origem: origem,
                destino: destino,
                valorFrete: valorFrete,
                valorPedagio: valorPedagio,
                percComissao: percComissao,
                descontarPedagio: false,
                valorComissao: comissao,
                liquidoMotorista: valorFrete - comissao,
                valorRecebido: 0,
                status: 'Pendente'
            });
            adicionados++;
        }
    });

    if (adicionados > 0) {
        salvarFretes();
        renderizarTabelaFretes();
        inicializarTabelaLote();
        alert(`${adicionados} fretes cadastrados com sucesso!`);
        mudarAba('fretes');
    } else {
        alert('Preencha os campos obrigatórios nas linhas que deseja salvar.');
    }
}

function alternarParcelas() {
    const tipo = document.getElementById('expTipo').value;
    document.getElementById('expParcelas').disabled = (tipo === 'avista');
}

document.getElementById('formDespesa').addEventListener('submit', function(e) {
    e.preventDefault();

    const valorTotal = parseFloat(document.getElementById('expValor').value) || 0;
    const tipo = document.getElementById('expTipo').value;
    const numParcelas = tipo === 'avista' ? 1 : parseInt(document.getElementById('expParcelas').value) || 1;
    const valorParcela = valorTotal / numParcelas;
    const vencInicial = document.getElementById('expPrimeiroVenc').value;
    const veiculoId = parseInt(document.getElementById('expVeiculo').value) || null;
    const veiculo = frota.find(v => v.id === veiculoId);

    const parcelas = [];
    for (let i = 0; i < numParcelas; i++) {
        let d = new Date(vencInicial + "T12:00:00");
        d.setMonth(d.getMonth() + i);
        
        parcelas.push({
            id: Date.now() + i,
            num: i + 1,
            vencimento: d.toISOString().slice(0, 10),
            valor: valorParcela,
            pago: 0,
            status: 'Pendente'
        });
    }

    despesas.push({
        id: Date.now(),
        descricao: document.getElementById('expDescricao').value,
        categoria: document.getElementById('expCategoria').value,
        veiculoId: veiculoId,
        veiculoPlaca: veiculo ? veiculo.placa : 'Geral / Não Definido',
        fornecedor: document.getElementById('expFornecedor').value || 'Não Informado',
        valorTotal: valorTotal,
        tipo: tipo,
        parcelas: parcelas,
        notas: document.getElementById('expNotas').value
    });

    salvarDespesas();
    renderizarTabelaDespesas();
    renderizarContasPagar();
    renderizarDashboard();
    this.reset();
    document.getElementById('expPrimeiroVenc').valueAsDate = new Date();
    alert('Despesa cadastrada!');
});

function renderizarTabelaDespesas() {
    const tbody = document.getElementById('tabelaDespesas');
    tbody.innerHTML = '';

    despesas.forEach(d => {
        const totalPago = d.parcelas.reduce((acc, p) => acc + p.pago, 0);
        const saldoAberto = d.valorTotal - totalPago;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b";
        tr.innerHTML = `
            <td class="p-3 font-bold text-slate-800">${d.descricao}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 border">${d.categoria}</span></td>
            <td class="p-3 font-semibold">${d.veiculoPlaca}</td>
            <td class="p-3 font-bold text-slate-900">R$ ${d.valorTotal.toFixed(2)}</td>
            <td class="p-3">${d.tipo === 'avista' ? 'À Vista' : d.parcelas.length + 'x Parcelado'}</td>
            <td class="p-3 text-emerald-700 font-semibold">R$ ${totalPago.toFixed(2)}</td>
            <td class="p-3 text-rose-700 font-semibold">R$ ${saldoAberto.toFixed(2)}</td>
            <td class="p-3 text-center">
                <button onclick="excluirDespesa(${d.id})" class="text-red-600 font-bold hover:underline">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contadorDespesas').innerText = `${despesas.length} registros`;
}

function excluirDespesa(id) {
    if (confirm('Deseja excluir esta despesa e suas parcelas?')) {
        despesas = despesas.filter(d => d.id !== id);
        salvarDespesas();
        renderizarTabelaDespesas();
        renderizarContasPagar();
        renderizarDashboard();
    }
}

function renderizarContasPagar() {
    const tbody = document.getElementById('tabelaContasPagar');
    tbody.innerHTML = '';

    const todasParcelas = [];
    despesas.forEach(d => {
        d.parcelas.forEach(p => {
            todasParcelas.push({
                despesaId: d.id,
                parcelaId: p.id,
                descricao: d.descricao,
                fornecedor: d.fornecedor,
                veiculoPlaca: d.veiculoPlaca,
                numParcela: `${p.num}/${d.parcelas.length}`,
                vencimento: p.vencimento,
                valor: p.valor,
                pago: p.pago,
                status: p.pago >= p.valor ? 'Pago' : 'Pendente'
            });
        });
    });

    todasParcelas.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

    todasParcelas.forEach(p => {
        const dataBr = p.vencimento.split('-').reverse().join('/');
        let badge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pendente</span>`;
        if (p.status === 'Pago') badge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Pago</span>`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b";
        tr.innerHTML = `
            <td class="p-3 font-semibold">${dataBr}</td>
            <td class="p-3 font-bold text-slate-800">${p.descricao} <span class="text-slate-400 font-normal text-[11px]">(${p.fornecedor})</span></td>
            <td class="p-3">${p.veiculoPlaca}</td>
            <td class="p-3">${p.numParcela}</td>
            <td class="p-3 font-bold text-slate-900">R$ ${p.valor.toFixed(2)}</td>
            <td class="p-3">${badge}</td>
            <td class="p-3 text-center">
                ${p.status === 'Pendente' ? `<button onclick="darBaixaParcela(${p.despesaId},${p.parcelaId})" class="text-blue-700 font-bold hover:underline">Dar Baixa</button>` : '—'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function darBaixaParcela(despesaId, parcelaId) {
    const d = despesas.find(x => x.id === despesaId);
    if (!d) return;

    const p = d.parcelas.find(x => x.id === parcelaId);
    if (!p) return;

    const resp = prompt(`Valor pago (Valor da parcela: R$ ${p.valor.toFixed(2)}):`, p.valor.toFixed(2));
    if (resp !== null) {
        p.pago = parseFloat(resp.replace(',', '.')) || 0;
        salvarDespesas();
        renderizarTabelaDespesas();
        renderizarContasPagar();
        renderizarDashboard();
    }
}

function renderizarDashboard() {
    let totalFrete = 0, totalRecebido = 0;
    fretes.forEach(f => {
        totalFrete += f.valorFrete;
        totalRecebido += f.valorRecebido;
    });

    let totalDespesasPagas = 0, totalDespesasAberto = 0;
    despesas.forEach(d => {
        d.parcelas.forEach(p => {
            totalDespesasPagas += p.pago;
            if (p.pago < p.valor) totalDespesasAberto += (p.valor - p.pago);
        });
    });

    document.getElementById('dashTotalFrete').innerText = `R$ ${totalFrete.toFixed(2)}`;
    document.getElementById('dashQtdViagens').innerText = `${fretes.length} viagens registradas`;
    document.getElementById('dashTotalPago').innerText = `R$ ${totalRecebido.toFixed(2)}`;
    document.getElementById('dashPercentPago').innerText = totalFrete > 0 ? `${((totalRecebido/totalFrete)*100).toFixed(1)}% recebido` : '0% recebido';
    document.getElementById('dashTotalDespesas').innerText = `R$ ${totalDespesasPagas.toFixed(2)}`;
    document.getElementById('dashDespesasAberto').innerText = `R$ ${totalDespesasAberto.toFixed(2)} a pagar`;
    document.getElementById('dashResultado').innerText = `R$ ${(totalRecebido - totalDespesasPagas).toFixed(2)}`;

    const tbodyR = document.getElementById('dashRecentFreights');
    tbodyR.innerHTML = '';
    const ultimos = [...fretes].sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    ultimos.forEach(f => {
        const dataBr = f.data.split('-').reverse().join('/');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-2">${dataBr}</td>
            <td class="p-2 font-semibold">${f.origem} → ${f.destino}</td>
            <td class="p-2">${f.veiculoPlaca}</td>
            <td class="p-2 font-bold">R$ ${f.valorFrete.toFixed(2)}</td>
            <td class="p-2">${f.status}</td>
        `;
        tbodyR.appendChild(tr);
    });

    const divB = document.getElementById('dashUpcomingBills');
    divB.innerHTML = '';
    const pendentes = [];
    despesas.forEach(d => {
        d.parcelas.forEach(p => {
            if (p.pago < p.valor) {
                pendentes.push({ descricao: d.descricao, vencimento: p.vencimento, valor: p.valor - p.pago });
            }
        });
    });
    pendentes.sort((a,b) => new Date(a.vencimento) - new Date(b.vencimento));

    pendentes.slice(0, 4).forEach(b => {
        const dataBr = b.vencimento.split('-').reverse().join('/');
        divB.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border rounded text-xs">
                <div>
                    <strong class="block text-slate-800">${b.descricao}</strong>
                    <span class="text-slate-500">Vencimento: ${dataBr}</span>
                </div>
                <span class="font-bold text-rose-700">R$ ${b.valor.toFixed(2)}</span>
            </div>
        `;
    });
}

document.getElementById('formMotorista').addEventListener('submit', function(e) {
    e.preventDefault();
    motoristas.push({
        id: Date.now(),
        nome: document.getElementById('motNome').value,
        cpf: document.getElementById('motCPF').value || 'Não informado',
        telefone: document.getElementById('motTelefone').value || 'Não informado',
        comissao: parseFloat(document.getElementById('motComissao').value) || 10.0
    });
    salvarMotoristas();
    carregarSelects();
    renderizarMotoristas();
    this.reset();
    alert('Motorista salvo!');
});

function renderizarMotoristas() {
    const tbody = document.getElementById('tabelaMotoristasBody');
    tbody.innerHTML = '';
    motoristas.forEach(m => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b";
        tr.innerHTML = `
            <td class="p-3 font-bold text-slate-800">${m.nome}</td>
            <td class="p-3">${m.cpf}</td>
            <td class="p-3">${m.telefone}</td>
            <td class="p-3 font-semibold text-blue-900">${m.comissao}%</td>
            <td class="p-3 text-center">
                <button onclick="excluirMotorista(${m.id})" class="text-red-600 font-bold hover:underline">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('qtdMotoristas').innerText = `${motoristas.length} motoristas`;
}

function excluirMotorista(id) {
    if (confirm('Deseja excluir este motorista?')) {
        motoristas = motoristas.filter(m => m.id !== id);
        salvarMotoristas();
        carregarSelects();
        renderizarMotoristas();
    }
}

document.getElementById('formVeiculo').addEventListener('submit', function(e) {
    e.preventDefault();
    const motId = parseInt(document.getElementById('veicMotorista').value);
    frota.push({
        id: Date.now(),
        modelo: document.getElementById('veicModelo').value,
        placa: document.getElementById('veicPlaca').value,
        operacao: document.getElementById('veicOperacao').value,
        motoristaId: motId || null
    });
    salvarFrota();
    carregarSelects();
    renderizarFrota();
    this.reset();
    alert('Veículo salvo!');
});

function renderizarFrota() {
    const tbody = document.getElementById('tabelaFrotaBody');
    tbody.innerHTML = '';
    frota.forEach(v => {
        const mot = motoristas.find(m => m.id === v.motoristaId);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b";
        tr.innerHTML = `
            <td class="p-3 font-bold text-slate-800">${v.modelo}</td>
            <td class="p-3 font-semibold">${v.placa}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 border">${v.operacao}</span></td>
            <td class="p-3">${mot ? mot.nome : 'Sem motorista fixo'}</td>
            <td class="p-3 text-center">
                <button onclick="excluirVeiculo(${v.id})" class="text-red-600 font-bold hover:underline">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('qtdVeiculos').innerText = `${frota.length} veículos`;
}

function excluirVeiculo(id) {
    if (confirm('Deseja excluir este veículo?')) {
        frota = frota.filter(v => v.id !== id);
        salvarFrota();
        carregarSelects();
        renderizarFrota();
    }
}

function exportarCSV() {
    if (fretes.length === 0) {
        alert('Nenhum dado para exportar.');
        return;
    }

    let csv = "data:text/csv;charset=utf-8,";
    csv += "Data;Placa;Motorista;Cliente;Origem;Destino;Valor Frete;Pedagio;Comissao;Liquido Motorista;Recebido;Status\n";

    fretes.forEach(f => {
        csv += `${f.data};${f.veiculoPlaca};${f.motoristaNome};${f.cliente};${f.origem};${f.destino};${f.valorFrete};${f.valorPedagio};${f.valorComissao};${f.liquidoMotorista};${f.valorRecebido};${f.status}\n`;
    });

    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `relatorio_rr_figueredo_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
