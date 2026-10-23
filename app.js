let db = loadDB(); db.categories=db.categories||["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"];
function loadDB(){try{const d=JSON.parse(localStorage.getItem(DB_KEY))||{};d.freights=d.freights||[];d.expenses=d.expenses||[];d.employees=d.employees||[...new Set(d.freights.map(f=>f.driver).filter(Boolean))].map((name,i)=>({id:uidSafe('emp'+i),name,role:'Motorista',phone:'',active:true}));d.categories=d.categories||["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"];d.trucks=d.trucks||['Caminhão 01','Caminhão 02','Caminhão 03','Caminhão 04','Caminhão 05'].map((name,i)=>({id:uidSafe('truck'+i),name,plate:'',active:true}));return d}catch{return{freights:[],expenses:[],employees:[],trucks:[]}}}
function uidSafe(s){return s+'_'+Math.random().toString(36).slice(2,8)}
function saveDB(){if(document.body.classList.contains("read-only")){toast("Perfil visitante: somente visualização.",true);return}localStorage.setItem(DB_KEY,JSON.stringify(db));renderAll();if(typeof cloud!=="undefined"&&cloud&&typeof cloud.save==="function")cloud.save();}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function toast(msg,error=false){const el=$("toast");el.textContent=msg;el.className="toast show"+(error?" error":"");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className="toast",2800)}
window.setReadOnlyMode = function(readOnly){
 document.body.classList.toggle("read-only",!!readOnly);
 const notice=$("readOnlyNotice");
 if(notice)notice.hidden=!readOnly;
};
document.addEventListener("submit",event=>{
 if(document.body.classList.contains("read-only")&&event.target.id!=="loginForm"){
  event.preventDefault();event.stopImmediatePropagation();toast("Perfil visitante: alterações não são permitidas.",true);
 }
},true);
document.addEventListener("click",event=>{
 if(!document.body.classList.contains("read-only"))return;
 const button=event.target.closest("button");
 if(!button)return;
 if(button.closest("#loginScreen")||button.matches(".nav-item,.menu-toggle,.refresh-btn,#logoutButton,[data-close]")||button.matches(".text-btn[data-goto]"))return;
 event.preventDefault();event.stopImmediatePropagation();toast("Perfil visitante: somente visualização.",true);
},true);

function statusPill(status){const cls=status==="Pago"||status==="Paga"?"paid":status==="Atrasada"?"overdue":status==="Parcial"?"partial":"pending";return `<span class="pill ${cls}">${escapeHtml(status)}</span>`}
function paidAmount(exp){return (exp.installments||[]).reduce((s,i)=>s+Number(i.paid||0),0)}
function openAmount(exp){return Math.max(0,Number(exp.value)-paidAmount(exp))}
function freightBase(f){return Math.max(0,Number(f.value||0)-Number(f.discount||0)-(f.deductToll?Number(f.toll||0):0))}
function freightCommission(f){const base=freightBase(f);return f.commissionType==="fixed"?Number(f.commission||0):base*Number(f.commission||0)/100}
function freightBonus(f){return Number(f.bonus||0)}
function freightCost(f){return freightCommission(f)+freightBonus(f)+(Number(f.toll||0))+Number(f.fuelActual||0)+Number(f.otherCosts||0)}
function freightProfit(f){return Number(f.value||0)-Number(f.discount||0)-Number(f.toll||0)-Number(f.fuelActual||0)-freightCommission(f)-freightBonus(f)-Number(f.otherCosts||0)}
function freightNet(f){return Number(f.value||0)-Number(f.discount||0)-freightCommission(f)-(f.deductToll?Number(f.toll||0):0)+freightBonus(f)}
function freightStatus(f){const received=Number(f.received||0);return received>=Number(f.value)?"Pago":received>0?"Parcial":"Pendente"}
function installmentStatus(i){if(Number(i.paid||0)>=Number(i.value))return "Paga";if(i.due<todayISO())return "Atrasada";if(Number(i.paid||0)>0)return "Parcial";return "Em aberto"}
function installmentPaid(i){return Number(i.paid||0)}
function dueTotalFor(exp){return (exp.installments||[]).reduce((s,i)=>s+Math.max(0,Number(i.value)-installmentPaid(i)),0)}
function dateAddMonths(date,months){const d=parseDate(date);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function openDialog(id){$(id).showModal();document.body.classList.add("modal-open")}
function closeDialog(id){$(id).close();document.body.classList.remove("modal-open")}
function goPage(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const titles={dashboard:"Balanço geral",freights:"Fretes",expenses:"Despesas e manutenção",payments:"Contas a pagar",receivables:"Contas a receber",reports:"Relatórios",cadastros:"Cadastros da empresa"};$("pageTitle").textContent=titles[page]||"Visão geral";$("sidebar").classList.remove("open");if(page==="reports")renderReport();if(page==="payments")renderPayments();if(page==="receivables")renderReceivables();if(page==="cadastros"){resetEmployeeForm();resetTruckForm();setRegistrationTab("employees");renderRegistrations()}}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>goPage(b.dataset.goto)));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeDialog(b.dataset.close)));
$("today").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(".","");
$("dashMonth").value=monthISO();$("freightMonth").value=monthISO();$("expenseMonth").value=monthISO();$("paymentMonth").value=monthISO();$("reportMonth").value=monthISO();
$("quickAdd").addEventListener("click",()=>openFreight());$("addFreight").addEventListener("click",()=>openFreight());$("addExpense").addEventListener("click",()=>openExpense(null,"expense"));$("addPaymentExpense").addEventListener("click",()=>openExpense(null,"manual"));
function openFreight(f=null){refreshMasterDropdowns();$("freightForm").reset();$("freightId").value=f?.id||"";$("freightModalTitle").textContent=f?"Editar frete":"Cadastrar frete";$("fDate").value=f?.date||"";$("fDriver").value=f?.driver||"";if($("fCustomer"))$("fCustomer").value=f?.customer||"";$("fOrigin").value=f?.origin||"";$("fDestination").value=f?.destination||"";$("fValue").value=f?.value??"";$("fToll").value=f?.toll??"";$("fDiscount").value=f?.discount??0;$("fCommissionType").value=f?.commissionType||"";$("fCommission").value=f?.commission??"";$("fBonus").value=f?.bonus??0;$("fKm").value=f?.km??"";$("fDieselPrice").value=f?.dieselPrice??"";$("fLiters").value=f?.liters??"";$("fFuelActual").value=f?.fuelActual??"";$("fStatus").value=f?freightStatus(f):"";$("fReceived").value=f?.received??"";$("fBalanceCurrent").value=f?Math.max(0,Number(f.value||0)-Number(f.received||0)-Number(f.discount||0)):"";$("fBalanceCurrent").dataset.manual=f?"true":"false";const driver=db.employees.find(x=>x.name===f?.driver);const savedTruck=db.trucks.find(t=>t.id===f?.truckId)||db.trucks.find(t=>t.name===f?.truck);$("fTruck").value=savedTruck?.id||"";$("fDeductToll").checked=f?!!f.deductToll:!!driver?.deductToll;$("fNotes").value=f?.notes||"";updateFreightCalc();openDialog("freightDialog")}
["fValue","fToll","fDiscount","fCommission","fCommissionType","fBonus","fDieselPrice","fLiters","fFuelActual","fDeductToll","fReceived"].forEach(id=>$(id).addEventListener("input",updateFreightCalc));
$("fBalanceCurrent").addEventListener("input",()=>{$("fBalanceCurrent").dataset.manual="true";updateFreightCalc()});
$("freightDialog").querySelectorAll('input[type="number"]').forEach(input=>input.addEventListener("wheel",e=>{e.preventDefault();input.blur()},{passive:false}));
function updateFreightCalc(){
 const valueEl=$("fValue"),receivedEl=$("fReceived"),balanceEl=$("fBalanceCurrent");
 const received=receivedEl.value===""?0:num("fReceived"),v=valueEl.value===""?0:num("fValue"),t=num("fToll"),discount=num("fDiscount"),c=num("fCommission"),type=$("fCommissionType").value;
 const autoBalance=Math.max(0,v-received-discount);
 if(balanceEl.dataset.manual!=="true"&&valueEl.value!=="")balanceEl.value=autoBalance.toFixed(2);
 const currentBalance=balanceEl.value===""?autoBalance:num("fBalanceCurrent");
 const base=Math.max(0,v-discount-($("fDeductToll").checked?t:0)),commission=type==="fixed"?c:base*c/100,bonus=num("fBonus"),estimated=num("fDieselPrice")*num("fLiters"),fuelActual=num("fFuelActual");
 const mismatch=valueEl.value!==""&&Math.abs(received+currentBalance+discount-v)>0.009;
 balanceEl.classList.toggle("input-error",mismatch);valueEl.classList.toggle("input-error",mismatch);receivedEl.classList.toggle("input-error",mismatch);
 const validation=$("balanceValidation");validation.hidden=!mismatch;validation.textContent=mismatch?"Os valores não conferem: frete deve ser igual a adiantamento + saldo atual + descontos. Corrija os campos em vermelho.":"";
 $("fuelEstimate").textContent=money(estimated);
 const totalCost=discount+t+fuelActual+commission+bonus,tripProfit=v-totalCost;
 const calcItems=[["Base da comissão",money(base)],["Comissão estimada",money(commission)],["Bônus",money(bonus)],["Total motorista (comissão + bônus)",money(commission+bonus)],["Adiantamento recebido",money(received)],["Saldo atual a receber",money(currentBalance)],["Custo total da viagem",money(totalCost)],["Lucro estimado da viagem",money(tripProfit)]];
 $("freightCalc").innerHTML='<div class="freight-calculations-grid">'+calcItems.map(([label,val],i)=>'<div class="freight-calculation-item'+(i===6?' cost-total':'')+(i===7?' profit-total':'')+'"><span>'+label+'</span><strong>'+val+'</strong></div>').join("")+'</div>';
}
$("fDriver").addEventListener("change",()=>{const emp=db.employees.find(x=>x.name===$("fDriver").value);$("fTruck").value=emp?.truckId&&activeTrucks().some(t=>t.id===emp.truckId)?emp.truckId:"";if(emp){$("fCommissionType").value=emp.commissionType||"";$("fCommission").value=emp.commissionValue??"";$("fDeductToll").checked=!!emp.deductToll}else{$("fCommissionType").value="";$("fCommission").value="";$("fDeductToll").checked=false}updateFreightCalc()});
$("freightForm").addEventListener("submit",e=>{e.preventDefault();const id=$("freightId").value,received=num("fReceived"),balanceText=$("fBalanceCurrent").value;let freightValue=num("fValue");if($("fValue").value===""&&balanceText!=="")freightValue=received+num("fBalanceCurrent");if(balanceText!==""&&$("fValue").value!==""&&Math.abs(received+num("fBalanceCurrent")+num("fDiscount")-freightValue)>0.009){updateFreightCalc();toast("Os valores em vermelho não conferem. O adiantamento + saldo atual + descontos deve ser igual ao valor do frete.",true);return}const selectedTruck=db.trucks.find(t=>t.id===$("fTruck").value);if(!$("fTruck").value||!selectedTruck){toast("Selecione um caminhão para este frete.",true);return}const f={id:id||uid(),date:$("fDate").value,driver:$("fDriver").value.trim(),truckId:selectedTruck.id,truck:selectedTruck.name,customer:$("fCustomer")?.value.trim()||"",origin:$("fOrigin").value.trim(),destination:$("fDestination").value.trim(),value:freightValue,toll:num("fToll"),discount:num("fDiscount"),commissionType:$("fCommissionType").value,commission:num("fCommission"),bonus:num("fBonus"),km:num("fKm"),dieselPrice:num("fDieselPrice"),liters:num("fLiters"),fuelEstimated:num("fDieselPrice")*num("fLiters"),fuelActual:num("fFuelActual"),received, deductToll:$("fDeductToll").checked,notes:$("fNotes").value.trim()};
 if(f.value<=0||received<0||received>f.value){toast("Confira o valor do frete, o adiantamento e o saldo a receber.",true);return}
 if(id){const old=db.freights.find(x=>x.id===id);if(old){f.receipts=old.receipts||[];if(Number(f.received)>Number(old.received||0))f.receipts.push({amount:f.received-Number(old.received||0),date:todayISO(),method:"Ajuste no frete"});else if(Number(f.received)<Number(old.received||0)){toast("Para reduzir recebimentos anteriores, ajuste o histórico financeiro do frete.",true);return}}}else if(f.received>0)f.receipts=[{amount:f.received,date:todayISO(),method:"Adiantamento inicial"}];
 if(id)db.freights=db.freights.map(x=>x.id===id?f:x);else db.freights.unshift(f);saveDB();closeDialog("freightDialog");toast(id?"Frete atualizado.":"Frete cadastrado.")});
function openExpense(exp=null,source="expense"){refreshMasterDropdowns();$("expenseForm").reset();$("expenseId").value=exp?.id||"";$("eSource").value=exp?.source||source;$("expenseModalTitle").textContent=(exp?.source==="manual"||source==="manual")?(exp?"Editar conta a pagar":"Adicionar conta a pagar"):(exp?"Editar despesa":"Nova despesa");$("eDescription").value=exp?.description||"";$("eCategory").value=exp?.category||"Manutenção";$("eTruck").value=exp?.truck||"Caminhão 01";$("eSupplier").value=exp?.supplier||"";$("eValue").value=exp?.baseValue??((Number(exp?.discount||0)||Number(exp?.additional||0))?Number(exp?.value||0)+Number(exp?.discount||0)-Number(exp?.additional||0):(exp?.value??""));$("eDiscount").value=exp?.discount??0;$("eAdditional").value=exp?.additional??0;$("eMethod").value=exp?.method||"Pix";$("eInstallments").value=exp?.installments?.length||1;$("eFirstDue").value=exp?.installments?.[0]?.due||(($("eMethod").value==="Boleto"&&!exp)?dateAddDays(todayISO(),1):todayISO());updateInstallmentControls(exp);$("ePaidInitial").value=exp?paidAmount(exp):0;$("eNotes").value=exp?.notes||"";$("eInstallments").disabled=!!exp;$("ePaidInitial").disabled=!!exp;openDialog("expenseDialog")}
$("eMethod").addEventListener("change",()=>{updateInstallmentControls();if(!["Boleto","Cartão"].includes($("eMethod").value))$("eInstallments").value="1";if($("eMethod").value==="Boleto")$("eFirstDue").value=dateAddDays(todayISO(),1);else if(["Pix","Dinheiro","Transferência"].includes($("eMethod").value))$("eFirstDue").value=todayISO();renderInstallmentDates()});
$("eInstallments").addEventListener("change",renderInstallmentDates);$("eFirstDue").addEventListener("change",renderInstallmentDates);
function updateInstallmentControls(exp=null){const method=$("eMethod").value,allowed=["Boleto","Cartão"].includes(method);$("installmentsField").hidden=!allowed;$("eInstallments").disabled=!!exp||!allowed;if(!allowed)$("eInstallments").value="1";renderInstallmentDates(exp)}
function renderInstallmentDates(exp=null){const n=["Boleto","Cartão"].includes($("eMethod").value)?Number($("eInstallments").value):1,first=$("eFirstDue").value||todayISO(),saved=exp?.installments||[],el=$("installmentDates");if(!el)return;el.hidden=n<=1;el.innerHTML=n<=1?"":`<div class="installment-date-grid">${Array.from({length:n},(_,i)=>`<div><label for="installmentDue${i}">Vencimento da parcela ${i+1}</label><input type="date" id="installmentDue${i}" data-installment-due="${i}" value="${escapeHtml(saved[i]?.due||dateAddMonths(first,i))}" required></div>`).join("")}</div>`;el.querySelectorAll("input[data-installment-due]").forEach(input=>input.addEventListener("change",()=>{if(input.dataset.installmentDue==="0")$("eFirstDue").value=input.value;input.dataset.manuallyChanged="true"}))}
function dateAddDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
$("expenseForm").addEventListener("submit",e=>{e.preventDefault();const id=$("expenseId").value,baseValue=num("eValue"),discount=num("eDiscount"),additional=num("eAdditional"),v=Math.max(0,baseValue-discount+additional),n=["Boleto","Cartão"].includes($("eMethod").value)?Number($("eInstallments").value):1;
 if(v<=0){toast("O valor final da despesa precisa ser maior que zero.",true);return}
 if(id){const old=db.expenses.find(x=>x.id===id);if(old){
 const count=(old.installments||[]).length||1,base=Math.floor(v/count*100)/100;let remaining=Math.round(v*100);const next=[];
 for(let i=0;i<count;i++){const value=i===count-1?remaining/100:base;remaining-=Math.round(value*100);const prior=old.installments[i]||{due:dateAddMonths($("eFirstDue").value,i),paid:0,payments:[]};if(Number(prior.paid||0)>value+0.001){toast("O novo valor deixaria uma parcela menor que o valor já pago. Ajuste o parcelamento manualmente ou mantenha o valor atual.",true);return}next.push({...prior,value,due:$("installmentDue"+i)?.value||prior.due,paid:Number(prior.paid||0),payments:prior.payments||[]})}
 old.description=$("eDescription").value.trim();old.source=old.source||$("eSource").value||"expense";old.category=$("eCategory").value;old.truck=$("eTruck").value;old.supplier=$("eSupplier").value.trim();old.notes=$("eNotes").value.trim();old.baseValue=baseValue;old.discount=discount;old.additional=additional;old.method=$("eMethod").value;old.value=v;old.installments=next;old.type=count===1?"avista":"parcelado";
}}
 else{const base=Math.floor(v/n*100)/100;let remaining=Math.round(v*100);const installments=[];for(let i=0;i<n;i++){const val=i===n-1?remaining/100:base;remaining-=Math.round(val*100);installments.push({value:val,paid:0,due:$("installmentDue"+i)?.value||dateAddMonths($("eFirstDue").value,i),payments:[]})}
 let initial=Math.min(num("ePaidInitial"),v);for(let i=0;i<n&&initial>0;i++){const pay=Math.min(installments[i].value,initial);installments[i].paid=pay;installments[i].payments.push({amount:pay,date:todayISO(),method:$("eMethod").value});initial-=pay}
 db.expenses.unshift({id:uid(),source:$("eSource").value||"expense",description:$("eDescription").value.trim(),category:$("eCategory").value,truck:$("eTruck").value,supplier:$("eSupplier").value.trim(),value:v,baseValue,discount,additional,method:$("eMethod").value,type:n===1?"avista":"parcelado",installments,notes:$("eNotes").value.trim(),created:todayISO()})}
 saveDB();closeDialog("expenseDialog");toast(id?"Despesa atualizada.":"Despesa cadastrada.")});
function openPay(expId,index,source="expense"){const exp=db.expenses.find(x=>x.id===expId&&(x.source||"expense")===source),i=exp?.installments[index];if(!exp||!i)return;const remaining=Math.max(0,i.value-i.paid);$("payExpenseId").value=expId;$("payInstallmentIndex").value=index;$("paySource").value=source;$("paySubtitle").textContent=`${exp.description} · parcela ${Number(index)+1}/${exp.installments.length} · falta ${money(remaining)}`;$("payAmount").value=remaining.toFixed(2);$("payAmount").max=remaining;$("payDate").value=todayISO();$("payMethod").value="Pix";openDialog("payDialog")}
$("payForm").addEventListener("submit",e=>{e.preventDefault();const source=$("paySource").value||"expense",exp=db.expenses.find(x=>x.id===$("payExpenseId").value&&(x.source||"expense")===source),i=exp?.installments[Number($("payInstallmentIndex").value)],amount=num("payAmount");if(!i||amount<=0||amount>i.value-i.paid+0.001){toast("Confira o valor restante da parcela.",true);return}i.paid=Math.round((i.paid+amount)*100)/100;i.payments=i.payments||[];i.payments.push({amount,date:$("payDate").value,method:$("payMethod").value});saveDB();closeDialog("payDialog");toast("Pagamento registrado.")});
function renderAll(){refreshMasterDropdowns();renderDashboard();renderFreights();renderExpenses();renderPayments();renderReceivables();renderReport();refreshDriverFilters();if($("page-cadastros")?.classList.contains("active"))renderRegistrations()}
function activeEmployees(){return (db.employees||[]).filter(e=>e.active!==false)}
function activeTrucks(){return (db.trucks||[]).filter(t=>t.active!==false)}
function refreshMasterDropdowns(){
  const currentDriver=$("fDriver")?.value||"",currentFreightTruck=$("fTruck")?.value||"";
  if($("fDriver")){const names=[...new Set([...activeEmployees().filter(e=>e.role==="Motorista"||!e.role).map(e=>e.name),...db.freights.map(f=>f.driver).filter(Boolean)])].sort();$("fDriver").innerHTML='<option value="">Selecione um motorista</option>'+names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');if(names.includes(currentDriver))$("fDriver").value=currentDriver}
  if($("fTruck")){$("fTruck").innerHTML='<option value="">Selecione um caminhão</option>'+activeTrucks().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}${t.plate?" — "+escapeHtml(t.plate):""}</option>`).join('');if([...$("fTruck").options].some(o=>o.value===currentFreightTruck))$("fTruck").value=currentFreightTruck}
 const currentTruck=$("eTruck")?.value||"";
 if($("eTruck")){const names=[...new Set([...activeTrucks().map(t=>t.name),...db.expenses.map(e=>e.truck).filter(t=>t&&t!=="Não definido")])];$("eTruck").innerHTML=names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')+'<option>Não definido</option>';if(names.includes(currentTruck))$("eTruck").value=currentTruck}
 const cats=[...new Set([...(db.categories||[]),...db.expenses.map(e=>e.category).filter(Boolean)])].sort();
 ["eCategory","expenseCategoryFilter"].forEach(id=>{const el=$(id);if(!el)return;const old=el.value;el.innerHTML=(id==="expenseCategoryFilter"?'<option value="">Todas as categorias</option>':'')+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");if(cats.includes(old))el.value=old});
 const filter=$("expenseTruckFilter");if(filter){const old=filter.value;filter.innerHTML='<option value="">Todos os caminhões</option>'+[...new Set([...activeTrucks().map(t=>t.name),...db.expenses.map(e=>e.truck).filter(Boolean)])].map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')+'<option>Não definido</option>';if([...filter.options].some(o=>o.value===old))filter.value=old}
}
function refreshDriverFilters(){const drivers=[...new Set([...activeEmployees().filter(e=>e.role==="Motorista"||!e.role).map(e=>e.name),...db.freights.map(f=>f.driver).filter(Boolean)])].sort();const fill=(id,allLabel)=>{const el=$(id),old=el.value;el.innerHTML=`<option value="">${allLabel}</option>`+drivers.map(d=>`<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");if(drivers.includes(old))el.value=old};fill("freightDriverFilter","Todos os motoristas");fill("reportDriver","Todos")}
// Cadastro centralizado de funcionários/motoristas e caminhões
function renderRegistrations(){
 const emps=(db.employees||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
 const trucks=(db.trucks||[]).slice().sort((a,b)=>a.name.localeCompare(b.name));
 const employeeTruck=$("employeeTruckId"), truckDriver=$("truckDriverId");
 if(employeeTruck){const old=employeeTruck.value;employeeTruck.innerHTML='<option value="">Sem caminhão vinculado</option>'+trucks.filter(t=>t.active!==false).map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}${t.plate?" — "+escapeHtml(t.plate):""}</option>`).join("");if([...employeeTruck.options].some(o=>o.value===old))employeeTruck.value=old}
 if(truckDriver){const old=truckDriver.value;truckDriver.innerHTML='<option value="">Sem motorista vinculado</option>'+emps.filter(e=>e.active!==false&&(e.role==="Motorista"||!e.role)).map(e=>`<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join("");if([...truckDriver.options].some(o=>o.value===old))truckDriver.value=old}
 const visibleEmps=emps.filter(e=>$("showInactiveEmployees")?.checked || e.active!==false);
 $("employeeRows").innerHTML=visibleEmps.map(e=>{const t=trucks.find(x=>x.id===e.truckId);return `<tr data-view-employee="${e.id}" title="Dê dois cliques para visualizar o cadastro"><td class="select-column"><input type="checkbox" class="registration-select" data-select-employee="${e.id}" aria-label="Selecionar ${escapeHtml(e.name)}"></td><td><strong>${escapeHtml(e.name)}</strong>${e.phone?`<span class="subtext">${escapeHtml(e.phone)}</span>`:""}</td><td>${escapeHtml(e.role||"Motorista")}${(e.role||"Motorista")==="Motorista"?`<span class="subtext">${e.commissionType==="fixed"?"Fixo: "+money(e.commissionValue):Number(e.commissionValue??10)+"%"}</span>`:""}</td><td>${escapeHtml(t?.name||"—")}</td><td><span class="${e.active===false?'status-inactive':'status-active'}">${e.active===false?'Inativo':'Ativo'}</span></td><td><div class="register-actions"><button class="icon-btn" title="Editar" data-edit-employee="${e.id}">✎</button><button class="icon-btn delete-registration-btn" title="Excluir permanentemente" data-delete-employee="${e.id}">🗑</button><label class="deactivate-check"><input type="checkbox" data-toggle-employee="${e.id}" ${e.active===false?'checked':''} aria-label="Desativar ${escapeHtml(e.name)}"><span>Inativo</span></label></div></td></tr>`}).join("");
 $("employeeEmpty").hidden=emps.length>0;
 const visibleTrucks=trucks.filter(t=>$("showInactiveTrucks")?.checked || t.active!==false);
 $("truckRows").innerHTML=visibleTrucks.map(t=>{const driver=emps.find(e=>e.id===t.driverId);return `<tr data-view-truck="${t.id}" title="Dê dois cliques para visualizar o cadastro"><td class="select-column"><input type="checkbox" class="registration-select" data-select-truck="${t.id}" aria-label="Selecionar ${escapeHtml(t.name)}"></td><td><strong>${escapeHtml(t.name)}</strong></td><td>${escapeHtml(t.plate||"—")}</td><td>${escapeHtml(driver?.name||"—")}</td><td><span class="${t.active===false?'status-inactive':'status-active'}">${t.active===false?'Inativo':'Ativo'}</span></td><td><div class="register-actions"><button class="icon-btn" title="Editar" data-edit-truck="${t.id}">✎</button><button class="icon-btn delete-registration-btn" title="Excluir permanentemente" data-delete-truck="${t.id}">🗑</button><label class="deactivate-check"><input type="checkbox" data-toggle-truck="${t.id}" ${t.active===false?'checked':''} aria-label="Desativar ${escapeHtml(t.name)}"><span>Inativo</span></label></div></td></tr>`}).join("");
 $("employeeEmpty").hidden=visibleEmps.length>0;
 $("employeeEmpty").textContent=$("showInactiveEmployees")?.checked?"Nenhum funcionário encontrado.":"Nenhum funcionário ativo. Marque INATIVOS para consultar os desativados.";
 $("truckEmpty").hidden=visibleTrucks.length>0;
 $("truckEmpty").textContent=$("showInactiveTrucks")?.checked?"Nenhum caminhão encontrado.":"Nenhum caminhão ativo. Marque INATIVOS para consultar os desativados.";
 updateRegistrationSelection("employee");updateRegistrationSelection("truck");
 const cats=db.categories||[];$("categoryRows").innerHTML=cats.slice().sort((a,b)=>a.localeCompare(b)).map((c,i)=>{const count=db.expenses.filter(e=>e.category===c).length;return `<tr><td><strong>${escapeHtml(c)}</strong>${(db.categoryDescriptions||{})[c]?`<span class="subtext">${escapeHtml(db.categoryDescriptions[c])}</span>`:""}</td><td>${count} lançamento(s)</td><td><div class="register-actions"><button class="icon-btn" title="Editar" data-edit-category="${escapeHtml(c)}">✎</button><button class="icon-btn" title="${count?"Desativar (mantém histórico)":"Excluir"}" data-delete-category="${escapeHtml(c)}">×</button></div></td></tr>`}).join("");
 document.querySelectorAll("[data-view-employee]").forEach(row=>row.ondblclick=event=>{if(event.target.closest("button,input,label,select,textarea,a"))return;const e=db.employees.find(x=>x.id===row.dataset.viewEmployee);if(e)openEmployeeRegistration(e,"view")});
 document.querySelectorAll("[data-view-truck]").forEach(row=>row.ondblclick=event=>{if(event.target.closest("button,input,label,select,textarea,a"))return;const t=db.trucks.find(x=>x.id===row.dataset.viewTruck);if(t)openTruckRegistration(t,"view")});
 document.querySelectorAll("[data-edit-employee]").forEach(b=>b.onclick=()=>{const e=db.employees.find(x=>x.id===b.dataset.editEmployee);if(e)openEmployeeRegistration(e,"edit")});
 document.querySelectorAll("[data-toggle-employee]").forEach(b=>b.onchange=()=>{const e=db.employees.find(x=>x.id===b.dataset.toggleEmployee);if(!e)return;e.active=!b.checked;saveDB();toast(e.active?"Funcionário reativado.":"Funcionário desativado.")});
 document.querySelectorAll("[data-edit-truck]").forEach(b=>b.onclick=()=>{const t=db.trucks.find(x=>x.id===b.dataset.editTruck);if(t)openTruckRegistration(t,"edit")});
 document.querySelectorAll("[data-toggle-truck]").forEach(b=>b.onchange=()=>{const t=db.trucks.find(x=>x.id===b.dataset.toggleTruck);if(!t)return;t.active=!b.checked;saveDB();toast(t.active?"Caminhão reativado.":"Caminhão desativado.")});
}
function selectedRegistrationIds(type){return [...document.querySelectorAll(`[data-select-${type}]:checked`)].map(el=>el.dataset[`select${type[0].toUpperCase()+type.slice(1)}`]);}
function updateRegistrationSelection(type){
 const boxes=[...document.querySelectorAll(`[data-select-${type}]`)];
 const selected=boxes.filter(el=>el.checked).length;
 const count=$(type==="employee"?"selectedEmployeesCount":"selectedTrucksCount");
 const all=$(type==="employee"?"selectAllEmployees":"selectAllTrucks");
 if(count)count.textContent=`${selected} selecionado(s)`;
 if(all){all.checked=boxes.length>0&&selected===boxes.length;all.indeterminate=selected>0&&selected<boxes.length}
}
function deleteEmployees(ids){
 const list=db.employees.filter(e=>ids.includes(e.id));
 if(!list.length)return;
 if(!confirm(`Excluir permanentemente ${list.length} cadastro(s) de funcionário/motorista? Essa ação não pode ser desfeita. Os lançamentos históricos serão mantidos, mas os cadastros serão removidos.`))return;
 const idSet=new Set(ids);
 db.trucks.forEach(t=>{if(idSet.has(t.driverId))delete t.driverId});
 db.employees=db.employees.filter(e=>!idSet.has(e.id));
 if(idSet.has($("employeeId").value))resetEmployeeForm();
 saveDB();renderRegistrations();toast(`${list.length} cadastro(s) excluído(s).`);
}
function deleteTrucks(ids){
 const list=db.trucks.filter(t=>ids.includes(t.id));
 if(!list.length)return;
 if(!confirm(`Excluir permanentemente ${list.length} caminhão(ões)? Essa ação não pode ser desfeita. Os lançamentos históricos serão mantidos, mas os cadastros serão removidos.`))return;
 const idSet=new Set(ids);
 db.trucks.forEach(t=>{if(idSet.has(t.id)&&t.driverId){const e=db.employees.find(x=>x.id===t.driverId);if(e&&e.truckId===t.id)delete e.truckId}});
 db.employees.forEach(e=>{if(idSet.has(e.truckId))delete e.truckId});
 db.trucks=db.trucks.filter(t=>!idSet.has(t.id));
 if(idSet.has($("truckId").value))resetTruckForm();
 saveDB();renderRegistrations();toast(`${list.length} caminhão(ões) excluído(s).`);
}
$("selectAllEmployees")?.addEventListener("change",e=>{document.querySelectorAll("[data-select-employee]").forEach(b=>b.checked=e.target.checked);updateRegistrationSelection("employee")});
$("selectAllTrucks")?.addEventListener("change",e=>{document.querySelectorAll("[data-select-truck]").forEach(b=>b.checked=e.target.checked);updateRegistrationSelection("truck")});
$("deleteSelectedEmployees")?.addEventListener("click",()=>deleteEmployees(selectedRegistrationIds("employee")));
$("deleteSelectedTrucks")?.addEventListener("click",()=>deleteTrucks(selectedRegistrationIds("truck")));
document.addEventListener("change",e=>{
 if(e.target.matches("[data-select-employee]"))updateRegistrationSelection("employee");
 if(e.target.matches("[data-select-truck]"))updateRegistrationSelection("truck");
});
document.addEventListener("click",e=>{
 const delEmployee=e.target.closest("[data-delete-employee]"),delTruck=e.target.closest("[data-delete-truck]");
 if(delEmployee)deleteEmployees([delEmployee.dataset.deleteEmployee]);
 if(delTruck)deleteTrucks([delTruck.dataset.deleteTruck]);
});
$("showInactiveEmployees")?.addEventListener("change",renderRegistrations);
$("showInactiveTrucks")?.addEventListener("change",renderRegistrations);
function setRegistrationTab(type){document.querySelectorAll("[data-registration-tab]").forEach(b=>{const active=b.dataset.registrationTab===type;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active))});document.querySelectorAll("[data-registration-panel]").forEach(p=>{p.hidden=p.dataset.registrationPanel!==type})}
function setRegistrationDialogMode(type,mode){const form=$(type==="employees"?"employeeForm":"truckForm"),save=$(type==="employees"?"employeeSave":"truckSave"),cancel=$(type==="employees"?"employeeCancel":"truckCancel");const viewing=mode==="view";form.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=viewing);save.hidden=viewing;cancel.textContent=viewing?"Fechar":"Cancelar";cancel.hidden=false;}
function openEmployeeRegistration(e,mode="edit"){resetEmployeeForm();$("employeeForm").hidden=false;setRegistrationTab("employees");$("employeeDialogTitle").textContent=mode==="view"?"Visualizar funcionário":"Editar funcionário";openDialog("employeeDialog");$("employeeId").value=e.id;$("employeeName").value=e.name||"";$("employeeRole").value=e.role||"Motorista";$("employeePhone").value=e.phone||"";if($("employeeTruckId"))$("employeeTruckId").value=e.truckId||"";$("employeeCommissionType").value=e.commissionType||"percent";$("employeeCommissionValue").value=e.commissionValue??10;$("employeeDeductToll").checked=!!e.deductToll;$("employeeSave").textContent="Salvar alterações";setRegistrationDialogMode("employees",mode);if(mode!=="view")$("employeeName").focus();}
function openTruckRegistration(t,mode="edit"){resetTruckForm();$("truckForm").hidden=false;setRegistrationTab("trucks");$("truckDialogTitle").textContent=mode==="view"?"Visualizar caminhão":"Editar caminhão";openDialog("truckDialog");$("truckId").value=t.id;$("truckName").value=t.name||"";$("truckPlate").value=t.plate||"";if($("truckDriverId"))$("truckDriverId").value=t.driverId||"";$("truckSave").textContent="Salvar alterações";setRegistrationDialogMode("trucks",mode);if(mode!=="view")$("truckName").focus();}
function showRegistrationForm(type){setRegistrationTab(type);const form=$(type==="employees"?"employeeForm":"truckForm");form.hidden=false;const dialog=type==="employees"?"employeeDialog":"truckDialog";$(dialog+"Title").textContent=type==="employees"?"Adicionar funcionário":"Adicionar caminhão";openDialog(dialog);const field=$(type==="employees"?"employeeName":"truckName");field?.focus()}
function resetEmployeeForm(){if($("employeeDialog")?.open)closeDialog("employeeDialog");$("employeeForm").reset();$("employeeForm").hidden=true;$("employeeForm").querySelectorAll("input,select,textarea").forEach(el=>el.disabled=false);$("employeeId").value="";$("employeeRole").value="Motorista";$("employeeCommissionType").value="percent";$("employeeCommissionValue").value="10";$("employeeDeductToll").checked=false;if($("employeeTruckId"))$("employeeTruckId").value="";$("employeeSave").hidden=false;$("employeeSave").textContent="＋ Adicionar funcionário";$("employeeCancel").textContent="Cancelar";$("employeeCancel").hidden=false}
function resetTruckForm(){if($("truckDialog")?.open)closeDialog("truckDialog");$("truckForm").reset();$("truckForm").hidden=true;$("truckForm").querySelectorAll("input,select,textarea").forEach(el=>el.disabled=false);$("truckId").value="";if($("truckDriverId"))$("truckDriverId").value="";$("truckSave").hidden=false;$("truckSave").textContent="＋ Adicionar caminhão";$("truckCancel").textContent="Cancelar";$("truckCancel").hidden=false}
$("employeesTab").addEventListener("click",()=>setRegistrationTab("employees"));
$("trucksTab").addEventListener("click",()=>setRegistrationTab("trucks"));
$("addEmployeeBtn").addEventListener("click",()=>{resetEmployeeForm();showRegistrationForm("employees")});
$("addTruckBtn").addEventListener("click",()=>{resetTruckForm();showRegistrationForm("trucks")});
function linkEmployeeToTruck(employee, truckId){
  const previous=db.trucks.find(t=>t.id===employee.truckId);
  if(previous && previous.driverId===employee.id) delete previous.driverId;
  if(truckId){
    const truck=db.trucks.find(t=>t.id===truckId);
    if(truck){
      const other=db.employees.find(e=>e.id===truck.driverId && e.id!==employee.id);
      if(other) delete other.truckId;
      const previousDriver=db.employees.find(e=>e.truckId===truck.id && e.id!==employee.id);
      if(previousDriver) delete previousDriver.truckId;
      truck.driverId=employee.id;
      employee.truckId=truck.id;
    } else delete employee.truckId;
  } else delete employee.truckId;
}
function linkTruckToDriver(truck, driverId){
  const previousDriver=db.employees.find(e=>e.id===truck.driverId);
  if(previousDriver && previousDriver.truckId===truck.id) delete previousDriver.truckId;
  if(driverId){
    const driver=db.employees.find(e=>e.id===driverId);
    if(driver){
      const otherTruck=db.trucks.find(t=>t.id===driver.truckId && t.id!==truck.id);
      if(otherTruck && otherTruck.driverId===driver.id) delete otherTruck.driverId;
      const otherDriver=db.employees.find(e=>e.truckId===truck.id && e.id!==driver.id);
      if(otherDriver) delete otherDriver.truckId;
      truck.driverId=driver.id;
      driver.truckId=truck.id;
    } else delete truck.driverId;
  } else delete truck.driverId;
}
$("employeeForm").addEventListener("submit",e=>{e.preventDefault();const id=$("employeeId").value,name=$("employeeName").value.trim();if(!name)return;const old=id?db.employees.find(x=>x.id===id):null;if(db.employees.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase())){toast("Já existe um cadastro com esse nome.",true);return}
 const commissionType=$("employeeCommissionType").value,commissionValue=Number($("employeeCommissionValue").value||0),deductToll=$("employeeDeductToll").checked,truckId=$("employeeTruckId")?.value||"";
 let employee=old;
 if(old){const previous=old.name;old.name=name;old.role=$("employeeRole").value;old.phone=$("employeePhone").value.trim();old.commissionType=commissionType;old.commissionValue=commissionValue;old.deductToll=deductToll;db.freights.forEach(f=>{if(f.driver===previous)f.driver=name})}
 else {employee={id:uid(),name,role:$("employeeRole").value,phone:$("employeePhone").value.trim(),commissionType,commissionValue,deductToll,active:true};db.employees.push(employee)}
 linkEmployeeToTruck(employee,truckId);
 saveDB();resetEmployeeForm();toast(old?"Cadastro atualizado e vínculo ajustado.":"Funcionário cadastrado.")});
$("employeeCancel").addEventListener("click",resetEmployeeForm);
$("truckForm").addEventListener("submit",e=>{e.preventDefault();const id=$("truckId").value,name=$("truckName").value.trim(),plate=$("truckPlate").value.trim().toUpperCase(),driverId=$("truckDriverId")?.value||"";if(!name)return;const old=id?db.trucks.find(x=>x.id===id):null;if(db.trucks.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase())){toast("Já existe um caminhão com esse nome.",true);return}
 let truck=old;
 if(old){const previous=old.name;old.name=name;old.plate=plate;db.expenses.forEach(ex=>{if(ex.truck===previous)ex.truck=name})}
 else {truck={id:uid(),name,plate,active:true};db.trucks.push(truck)}
 linkTruckToDriver(truck,driverId);
 saveDB();resetTruckForm();toast(old?"Caminhão atualizado e vínculo ajustado.":"Caminhão cadastrado.")});
$("truckCancel").addEventListener("click",resetTruckForm);


// Categorias de despesas personalizáveis, preservando referências históricas.
function resetCategoryForm(){$("categoryForm").reset();$("categoryId").value="";$("categorySave").textContent="＋ Adicionar categoria";$("categoryCancel").hidden=false;$("categoryForm").hidden=true;$("showCategoryForm").hidden=false}
$("showCategoryForm").addEventListener("click",()=>{$("categoryForm").hidden=false;$("showCategoryForm").hidden=true;$("categoryName").focus()});$("categoryForm").addEventListener("submit",e=>{e.preventDefault();const old=$("categoryId").value,name=$("categoryName").value.trim(),description=$("categoryDescription").value.trim();if(!name)return;db.categoryDescriptions=db.categoryDescriptions||{};const exists=(db.categories||[]).some(c=>c.toLowerCase()===name.toLowerCase()&&c!==old);if(exists){toast("Essa categoria já existe.",true);return}
 if(old){db.categories=db.categories.map(c=>c===old?name:c);db.expenses.forEach(ex=>{if(ex.category===old)ex.category=name});if(old!==name)delete db.categoryDescriptions[old]}else{db.categories=db.categories||[];db.categories.push(name)}db.categoryDescriptions[name]=description;saveDB();resetCategoryForm();renderRegistrations();toast(old?"Categoria atualizada.":"Categoria cadastrada.")});
$("categoryCancel").addEventListener("click",resetCategoryForm);
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit-category]"),del=e.target.closest("[data-delete-category]");if(edit){const name=edit.dataset.editCategory;$("categoryId").value=name;$("categoryName").value=name;$("categoryDescription").value=(db.categoryDescriptions||{})[name]||"";$("categoryForm").hidden=false;$("showCategoryForm").hidden=true;$("categorySave").textContent="Salvar alterações";$("categoryCancel").hidden=false;$("categoryName").focus()}if(del){const name=del.dataset.deleteCategory,used=db.expenses.some(ex=>ex.category===name);if(used){toast("A categoria já foi usada e será mantida no histórico. Edite o nome se necessário.",true);return}if(confirm(`Excluir a categoria "${name}"?`)){db.categories=db.categories.filter(c=>c!==name);saveDB();renderRegistrations();toast("Categoria excluída.")}}});

function selectedMonth(id){return $(id).value||monthISO()}
function inMonth(date,month){return String(date||"").startsWith(month)}
function renderDashboard(){const m=selectedMonth("dashMonth"),fs=db.freights.filter(f=>inMonth(f.date,m)),es=db.expenses;const received=fs.reduce((s,f)=>s+Number(f.received||0),0),freightValue=fs.reduce((s,f)=>s+Number(f.value||0),0);const paidMonth=es.flatMap(e=>(e.installments||[]).flatMap(i=>(i.payments||[]).map(p=>({...p,expense:e})))).filter(p=>inMonth(p.date,m)).reduce((s,p)=>s+p.amount,0);const receivable=fs.reduce((s,f)=>s+Math.max(0,Number(f.value||0)-Number(f.received||0)),0);const payable=es.reduce((s,e)=>s+openAmount(e),0);const profit=fs.reduce((s,f)=>s+freightProfit(f),0)-es.filter(e=>inMonth(e.created,m)).reduce((s,e)=>s+Number(e.value||0),0);$("statFreight").textContent=money(freightValue);$("statFreightCount").textContent=`${fs.length} frete(s) registrado(s)`;$("statReceived").textContent=money(received);$("statReceivable").textContent=money(receivable)+" a receber";$("statPaid").textContent=money(paidMonth);$("statPayable").textContent=money(payable)+" em aberto";$("statResult").textContent=money(profit);$("statResult").style.color=profit<0?"#b33c43":"#17634d";
const recent=fs.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);$("recentFreights").innerHTML=recent.map(f=>`<tr><td>${dateBR(f.date)}</td><td><span class="route">${escapeHtml(f.origin)} → ${escapeHtml(f.destination)}</span></td><td>${escapeHtml(f.driver)}</td><td><strong>${money(f.value)}</strong></td><td>${statusPill(freightStatus(f))}</td></tr>`).join("")||`<tr><td colspan="5" class="empty-state">Nenhum frete neste mês.</td></tr>`;
const due=es.flatMap(e=>(e.installments||[]).map((i,index)=>({...i,index,expense:e}))).filter(i=>i.value>i.paid).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5);$("upcomingBills").innerHTML=due.map(i=>`<div class="bill-item"><div class="bill-date"><b>${parseDate(i.due)?.getDate()||"—"}</b><small>${monthName(i.due)}</small></div><div class="bill-info"><b>${escapeHtml(i.expense.description)}</b><small>${escapeHtml(i.expense.supplier||i.expense.category)} · ${statusPill(installmentStatus(i))}</small></div><div class="bill-amount">${money(i.value-i.paid)}</div></div>`).join("")||`<div class="empty-state">Nenhuma conta pendente. Bom trabalho!</div>`;
const cats={};es.forEach(e=>(e.installments||[]).forEach(i=>(i.payments||[]).forEach(p=>{if(inMonth(p.date,m))cats[e.category]=(cats[e.category]||0)+p.amount})));const max=Math.max(1,...Object.values(cats));$("categoryBars").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`<div><div class="bar-label"><span>${escapeHtml(cat)}</span><strong>${money(val)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${val/max*100}%"></div></div></div>`).join("")||`<div class="empty-state">Ainda não há despesas pagas neste mês.</div>`}
function renderFreights(){const m=$("freightMonth").value,driver=$("freightDriverFilter").value,status=$("freightStatusFilter").value,q=$("freightSearch").value.toLowerCase();const list=db.freights.filter(f=>(!m||inMonth(f.date,m))&&(!driver||f.driver===driver)&&(!status||freightStatus(f)===status)&&(`${f.customer||""} ${f.driver} ${f.origin} ${f.destination} ${f.notes||""}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));$("freightRows").innerHTML=list.map(f=>`<tr data-view-freight="${f.id}" title="Dê dois cliques para editar este frete"><td>${dateBR(f.date)}</td><td><span class="route">${escapeHtml(f.origin)} → ${escapeHtml(f.destination)}</span>${f.notes?`<span class="subtext">${escapeHtml(f.notes)}</span>`:""}</td><td>${escapeHtml(f.driver)}</td><td><strong>${money(f.value)}</strong></td><td>${money(f.toll)}</td><td>${money(freightCommission(f))}<span class="subtext">${f.commissionType==="fixed"?"Valor fixo":" "+f.commission+"%"}</span>${f.bonus?`<span class="subtext">Bônus: ${money(f.bonus)}</span>`:""}</td><td><strong>${money(freightProfit(f))}</strong><span class="subtext">lucro estimado</span></td><td>${statusPill(freightStatus(f))}<span class="subtext">${money(f.received)} recebido</span></td><td><div class="row-actions"><button class="icon-btn" title="Editar" data-edit-freight="${f.id}">✎</button><button class="icon-btn" title="Registrar recebimento" data-receive="${f.id}">＋</button><button class="icon-btn" title="Excluir" data-delete-freight="${f.id}">×</button></div></td></tr>`).join("");$("freightEmpty").hidden=list.length>0;$("freightTotal").textContent=money(list.reduce((s,f)=>s+f.value,0));$("commissionTotal").textContent=money(list.reduce((s,f)=>s+freightCommission(f)+freightBonus(f),0));$("freightOpen").textContent=money(list.reduce((s,f)=>s+Math.max(0,f.value-f.received),0));$("freightRows").querySelectorAll("[data-edit-freight]").forEach(b=>b.onclick=()=>openFreight(db.freights.find(f=>f.id===b.dataset.editFreight)));$("freightRows").querySelectorAll("[data-view-freight]").forEach(row=>row.ondblclick=e=>{if(!e.target.closest("button,input,label,select,textarea,a"))openFreight(db.freights.find(f=>f.id===row.dataset.viewFreight))});$("freightRows").querySelectorAll("[data-delete-freight]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este frete? Essa ação não pode ser desfeita.")){db.freights=db.freights.filter(f=>f.id!==b.dataset.deleteFreight);saveDB();toast("Frete excluído.")}});$("freightRows").querySelectorAll("[data-receive]").forEach(b=>b.onclick=()=>recordFreightReceipt(b.dataset.receive))}
function renderExpenses(){const q=$("expenseSearch").value.toLowerCase(),cat=$("expenseCategoryFilter").value,truck=$("expenseTruckFilter").value,m=$("expenseMonth").value;const list=db.expenses.filter(e=>(e.source||"expense")!=="manual"&&(!cat||e.category===cat)&&(!truck||e.truck===truck)&&(!m||(e.installments||[]).some(i=>inMonth(i.due,m)||(i.payments||[]).some(p=>inMonth(p.date,m))))&&(`${e.description} ${e.supplier||""} ${e.notes||""}`.toLowerCase().includes(q)));$("expenseRows").innerHTML=list.map(e=>{const paid=paidAmount(e),open=openAmount(e);return `<tr><td><strong>${escapeHtml(e.description)}</strong><span class="subtext">${escapeHtml(e.supplier||"Sem fornecedor")} · ${escapeHtml(e.notes||"")}</span></td><td>${escapeHtml(e.category)}</td><td>${escapeHtml(e.truck)}</td><td><strong>${money(e.value)}</strong>${e.discount||e.additional?`<span class="subtext">Base ${money(e.baseValue??e.value)} · desc. ${money(e.discount)} · adicional ${money(e.additional)}</span>`:""}</td><td>${e.type==="parcelado"?"Parcelado":"À vista"}<span class="subtext">${e.installments.length} parcela(s)</span></td><td>${money(paid)}</td><td>${money(open)}</td><td><div class="row-actions"><button class="icon-btn" title="Ver parcelas" data-expand-expense="${e.id}">▤</button><button class="icon-btn" title="Editar" data-edit-expense="${e.id}">✎</button><button class="icon-btn" title="Excluir" data-delete-expense="${e.id}">×</button></div></td></tr><tr class="installment-detail" id="detail-${e.id}" hidden><td colspan="8"><div class="installment-list">${e.installments.map((i,idx)=>`<div class="installment-row"><span><strong>${idx+1}/${e.installments.length}</strong> · Venc. ${dateBR(i.due)}</span><span>${money(i.value)}</span><span>${statusPill(installmentStatus(i))}</span><span>Pago: ${money(i.paid)}</span>${i.value>i.paid?`<button class="btn btn-secondary" data-pay-expense="${e.id}" data-pay-index="${idx}">Registrar pagamento</button>`:`<span class="subtext">Quitada</span>`}</div>`).join("")}</div></td></tr>`}).join("");$("expenseEmpty").hidden=list.length>0;$("expenseTotal").textContent=money(list.reduce((s,e)=>s+e.value,0));$("expensePaid").textContent=money(list.reduce((s,e)=>s+paidAmount(e),0));$("expenseOpen").textContent=money(list.reduce((s,e)=>s+openAmount(e),0));
$("expenseRows").querySelectorAll("[data-expand-expense]").forEach(b=>b.onclick=()=>{const tr=$("detail-"+b.dataset.expandExpense);tr.hidden=!tr.hidden});$("expenseRows").querySelectorAll("[data-edit-expense]").forEach(b=>b.onclick=()=>openExpense(db.expenses.find(e=>e.id===b.dataset.editExpense)));$("expenseRows").querySelectorAll("[data-delete-expense]").forEach(b=>b.onclick=()=>{if(confirm("Excluir esta despesa e suas parcelas? Essa ação não pode ser desfeita.")){db.expenses=db.expenses.filter(e=>e.id!==b.dataset.deleteExpense);saveDB();toast("Despesa excluída.")}});$("expenseRows").querySelectorAll("[data-pay-expense]").forEach(b=>b.onclick=()=>openPay(b.dataset.payExpense,Number(b.dataset.payIndex)))}
function allInstallments(){return db.expenses.flatMap(e=>(e.installments||[]).map((i,index)=>({...i,index,expense:e,source:e.source||"expense"})))}
function renderReceivables(){
 const q=($("receivableSearch")?.value||"").toLowerCase(),status=$("receivableStatus")?.value||"",m=$("receivableMonth")?.value||"";
 const list=db.freights.filter(f=>(!m||inMonth(f.date,m))&&(!status||freightStatus(f)===status)&&(`${f.customer||""} ${f.driver||""} ${f.origin||""} ${f.destination||""}`.toLowerCase().includes(q))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $("receivableRows").innerHTML=list.map(f=>`<tr><td>${dateBR(f.date)}</td><td><strong>${escapeHtml(f.customer||"Cliente não informado")}</strong><span class="subtext">${escapeHtml(f.origin)} → ${escapeHtml(f.destination)}</span></td><td>${escapeHtml(f.driver)}</td><td>${money(f.value)}</td><td>${money(f.received||0)}</td><td><strong>${money(Math.max(0,f.value-(f.received||0)))}</strong></td><td>${statusPill(freightStatus(f))}</td><td><div class="row-actions">${Number(f.received||0)<Number(f.value||0)?`<button class="icon-btn" title="Registrar recebimento" data-receive="${f.id}">＋</button>`:""}<button class="icon-btn" title="Editar frete" data-edit-receivable="${f.id}">✎</button></div></td></tr>`).join("");
 $("receivableEmpty").hidden=list.length>0;$("receivableTotal").textContent=money(list.reduce((s,f)=>s+Number(f.value||0),0));$("receivablePaid").textContent=money(list.reduce((s,f)=>s+Number(f.received||0),0));$("receivableOpen").textContent=money(list.reduce((s,f)=>s+Math.max(0,Number(f.value||0)-Number(f.received||0)),0));
 $("receivableRows").querySelectorAll("[data-edit-receivable]").forEach(b=>b.onclick=()=>openFreight(db.freights.find(f=>f.id===b.dataset.editReceivable)));
 $("receivableRows").querySelectorAll("[data-receive]").forEach(b=>b.onclick=()=>recordFreightReceipt(b.dataset.receive));
}
function recordFreightReceipt(id){const f=db.freights.find(x=>x.id===id);if(!f)return;const left=Number(f.value||0)-Number(f.received||0);if(left<=0){toast("Este frete já está totalmente recebido.");return}const answer=prompt(`Quanto foi recebido? Falta ${money(left)}.`,left.toFixed(2));if(answer===null)return;const amount=Number(answer.replace(",","."));if(!(amount>0)||amount>left){toast("Informe um valor válido até o saldo pendente.",true);return}f.received=Math.round((Number(f.received||0)+amount)*100)/100;f.receipts=f.receipts||[];f.receipts.push({amount,date:todayISO(),method:"Recebimento manual"});saveDB();toast("Recebimento registrado.")}

function renderPayments(){const q=$("paymentSearch").value.toLowerCase(),filter=$("paymentStatusFilter").value,m=$("paymentMonth").value;const all=allInstallments();const list=all.filter(i=>`${i.expense.description} ${i.expense.supplier||""} ${i.expense.category||""} ${i.expense.truck||""}`.toLowerCase().includes(q)&&(!m||inMonth(i.due,m)||(i.payments||[]).some(p=>inMonth(p.date,m)))&&(!filter||(filter==="atrasada"&&installmentStatus(i)==="Atrasada")||(filter==="aberta"&&i.paid<i.value&&installmentStatus(i)!=="Atrasada")||(filter==="paga"&&i.paid>=i.value))).sort((a,b)=>a.due.localeCompare(b.due));
 $("paymentRows").innerHTML=list.map(i=>{const payments=i.payments||[],history=payments.length?payments.map(p=>`${dateBR(p.date)} · ${escapeHtml(p.method||"Pagamento")} · ${money(p.amount)}`).join("<br>"):'<span class="subtext">Sem pagamento registrado</span>';return `<tr><td>${dateBR(i.due)}</td><td><strong>${escapeHtml(i.expense.description)}</strong><span class="subtext">${escapeHtml(i.expense.supplier||i.expense.category)} · ${escapeHtml(i.expense.truck||"Conta geral")}${i.source==="manual"?' · Conta manual':' · Despesa / manutenção'}</span></td><td>${i.index+1}/${i.expense.installments.length}</td><td><strong>${money(i.value)}</strong><span class="subtext">Total da conta: ${money(i.expense.value)}</span><span class="subtext">Pago nesta parcela: ${money(i.paid)} · Saldo: ${money(Math.max(0,i.value-i.paid))}</span></td><td>${statusPill(installmentStatus(i))}</td><td><span class="subtext">${history}</span></td><td><div class="row-actions">${i.paid<i.value?`<button class="btn btn-secondary" data-pay-expense="${i.expense.id}" data-pay-index="${i.index}" data-pay-source="${i.source}">Pagar</button>`:""}<button class="icon-btn" title="Editar conta" data-edit-payable="${i.expense.id}" data-pay-source="${i.source}">✎</button><button class="icon-btn" title="Excluir conta" data-delete-payable="${i.expense.id}" data-pay-source="${i.source}">×</button></div></td></tr>`}).join("");$("paymentEmpty").hidden=list.length>0;
 const monthRows=all.filter(i=>!m||inMonth(i.due,m));$("monthPayableTotal").textContent=money(monthRows.reduce((s,i)=>s+Number(i.value||0),0));$("monthPayablePaid").textContent=money(all.reduce((s,i)=>s+(i.payments||[]).filter(p=>!m||inMonth(p.date,m)).reduce((t,p)=>t+Number(p.amount||0),0),0));$("monthPayableOpen").textContent=money(monthRows.reduce((s,i)=>s+Math.max(0,Number(i.value||0)-Number(i.paid||0)),0));$("overdueTotal").textContent=money(all.filter(i=>i.due<todayISO()&&i.paid<i.value).reduce((s,i)=>s+i.value-i.paid,0));$("dueTotal").textContent=money(all.filter(i=>i.due>=todayISO()&&i.due<=dateAddMonths(todayISO(),1)&&i.paid<i.value).reduce((s,i)=>s+i.value-i.paid,0));$("openInstallments").textContent=all.filter(i=>i.paid<i.value).length;$("paymentRows").querySelectorAll("[data-pay-expense]").forEach(b=>b.onclick=()=>openPay(b.dataset.payExpense,Number(b.dataset.payIndex),b.dataset.paySource||"expense"));$("paymentRows").querySelectorAll("[data-edit-payable]").forEach(b=>b.onclick=()=>openExpense(db.expenses.find(e=>e.id===b.dataset.editPayable),b.dataset.paySource||"expense"));$("paymentRows").querySelectorAll("[data-delete-payable]").forEach(b=>b.onclick=()=>{const exp=db.expenses.find(e=>e.id===b.dataset.deletePayable&&(e.source||"expense")===(b.dataset.paySource||"expense"));if(!exp)return;if(confirm("Excluir esta conta e todo o histórico de parcelas e pagamentos? Esta ação não pode ser desfeita.")){db.expenses=db.expenses.filter(e=>e.id!==exp.id);saveDB();toast("Conta excluída.")}})}
function renderReport(){const m=$("reportMonth").value||monthISO(),driver=$("reportDriver").value;const fs=db.freights.filter(f=>inMonth(f.date,m)&&(!driver||f.driver===driver));const es=db.expenses;const inst=allInstallments().filter(i=>inMonth(i.due,m));const paid=es.flatMap(e=>e.installments.flatMap(i=>i.payments||[])).filter(p=>inMonth(p.date,m)).reduce((s,p)=>s+p.amount,0);$("repFreight").textContent=money(fs.reduce((s,f)=>s+f.value,0));$("repReceived").textContent=money(fs.reduce((s,f)=>s+f.received,0));$("repExpenses").textContent=money(paid);$("repOpen").textContent=money(inst.reduce((s,i)=>s+Math.max(0,i.value-i.paid),0));const drivers=[...new Set(fs.map(f=>f.driver))].sort();$("driverReportRows").innerHTML=drivers.map(d=>{const rows=fs.filter(f=>f.driver===d);return `<tr><td><strong>${escapeHtml(d)}</strong></td><td>${rows.length}</td><td>${money(rows.reduce((s,f)=>s+f.value,0))}</td><td>${money(rows.reduce((s,f)=>s+freightCommission(f),0))}</td><td>${money(rows.reduce((s,f)=>s+f.value-f.received,0))}</td></tr>`}).join("")||`<tr><td colspan="5" class="empty-state">Sem fretes para este filtro.</td></tr>`;const cats=[...new Set(es.map(e=>e.category))];$("expenseReportRows").innerHTML=cats.map(cat=>{const group=es.filter(e=>e.category===cat);return `<tr><td>${escapeHtml(cat)}</td><td>${money(group.reduce((s,e)=>s+e.value,0))}</td><td>${money(group.reduce((s,e)=>s+paidAmount(e),0))}</td><td>${money(group.reduce((s,e)=>s+openAmount(e),0))}</td></tr>`}).join("")||`<tr><td colspan="4" class="empty-state">Sem despesas cadastradas.</td></tr>`}
function csvDownload(name,rows){const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
$("exportFreights").addEventListener("click",()=>csvDownload(`fretes-${$("reportMonth").value||monthISO()}.csv`,[["Data","Motorista","Origem","Destino","Valor","Pedágio","Descontos","Tipo de comissão","Comissão configurada","Comissão calculada","Bônus","Descontar pedágio","Líquido motorista","Lucro estimado","KM rodados","Combustível real","Recebido","A receber","Status","Observações"],...db.freights.filter(f=>inMonth(f.date,$("reportMonth").value||monthISO())&&(!$("reportDriver").value||f.driver===$("reportDriver").value)).map(f=>[f.date,f.driver,f.origin,f.destination,f.value,f.toll,f.discount||0,f.commissionType==="fixed"?"Fixo":"Percentual",f.commission,freightCommission(f),f.bonus||0,f.deductToll?"Sim":"Não",freightNet(f),freightProfit(f),f.km||0,f.fuelActual||0,f.received,f.value-f.received,freightStatus(f),f.notes])]));$("exportExpenses").addEventListener("click",()=>csvDownload(`despesas-${$("reportMonth").value||monthISO()}.csv`,[["Descrição","Categoria","Caminhão","Fornecedor","Valor total","Tipo","Parcela","Vencimento","Valor parcela","Pago","Em aberto","Status"],...db.expenses.flatMap(e=>e.installments.map((i,idx)=>[e.description,e.category,e.truck,e.supplier,e.value,e.type,`${idx+1}/${e.installments.length}`,i.due,i.value,i.paid,i.value-i.paid,installmentStatus(i)])).filter(row=>inMonth(row[7],$("reportMonth").value||monthISO()))]));$("refreshReport").addEventListener("click",renderReport);
["dashMonth"].forEach(id=>$(id).addEventListener("change",renderDashboard));
["freightSearch","freightDriverFilter","freightMonth","freightStatusFilter"].forEach(id=>$(id).addEventListener("input",renderFreights));
["expenseSearch","expenseCategoryFilter","expenseTruckFilter","expenseMonth"].forEach(id=>$(id).addEventListener("input",renderExpenses));
["paymentSearch","paymentStatusFilter","paymentMonth"].forEach(id=>$(id).addEventListener("input",renderPayments));
["receivableSearch","receivableStatus","receivableMonth"].forEach(id=>$(id).addEventListener("input",renderReceivables));
document.querySelectorAll("[data-refresh]").forEach(b=>b.addEventListener("click",async()=>{renderAll();try{if(typeof cloud!=="undefined"&&cloud&&typeof cloud.pull==="function"){await cloud.pull();renderAll()}}catch(error){console.warn("Falha ao sincronizar ao atualizar:",error)}toast("Dados atualizados.")}));
// O botão de carga de exemplos foi removido para evitar lançamentos demonstrativos acidentais.
// Importação em lote de fretes via Excel/CSV e leitura assistida de foto
const FREIGHT_HEADERS=["Data","Motorista","Origem","Destino","Valor","Pedágio","Comissão (%)","Recebido","Observações"];
function importStatus(msg,error=false){const el=$("ocrStatus");el.hidden=false;el.textContent=msg;el.style.background=error?"#fff0ef":"#eef7f1";el.style.color=error?"#a61b1b":"#245b3c"}
function csvCell(v){const s=String(v??"");return /[;\"\n]/.test(s)?'"'+s.replace(/\"/g,'\"\"')+'"':s}
function previewRows(rows){$("importText").value=rows.map(r=>r.map(csvCell).join(";")).join("\n");$("importReview").hidden=false;$("importValidation").innerHTML="";$("importReview").scrollIntoView({behavior:"smooth",block:"nearest"})}
$("downloadFreightTemplate").addEventListener("click",()=>{const rows=[FREIGHT_HEADERS,[todayISO(),"Nome do motorista","Cidade de origem","Cidade de destino","1500,00","120,00","10","0,00","Apague esta linha de exemplo"]];if(window.XLSX){const ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:14},{wch:24},{wch:22},{wch:22},{wch:14},{wch:14},{wch:16},{wch:14},{wch:32}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Fretes");XLSX.writeFile(wb,"modelo-fretes-rr-figueredo.xlsx")}else{const blob=new Blob(["\ufeff"+rows.map(r=>r.map(csvCell).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="modelo-fretes.csv";a.click();URL.revokeObjectURL(a.href)}});
function nh(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9%]/g,"")}
function impDate(v){if(v instanceof Date&&!Number.isNaN(v.getTime()))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;if(typeof v==="number"&&window.XLSX){const p=XLSX.SSF.parse_date_code(v);if(p)return `${p.y}-${String(p.m).padStart(2,"0")}-${String(p.d).padStart(2,"0")}`}let s=String(v??"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:""}
function impMoney(v){if(typeof v==="number")return v;let s=String(v??"").trim().replace(/R\$/gi,"").replace(/\s/g,"");if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(",",".");return s===""?0:Number(s)}
function excelToRows(matrix){const hi=matrix.findIndex(r=>r.some(v=>nh(v)==="data")&&r.some(v=>["motorista","condutor"].includes(nh(v))));if(hi<0)throw Error("Não encontrei as colunas Data e Motorista. Use o modelo do sistema.");const hs=matrix[hi].map(nh),col=names=>hs.findIndex(x=>names.includes(x));const ix={d:col(["data"]),m:col(["motorista","condutor"]),o:col(["origem","cidadeorigem"]),t:col(["destino","cidadedestino"]),v:col(["valor","frete","valorfrete"]),p:col(["pedagio","valorpedagio"]),c:col(["comissao","comissaopercentual","comissao%"]),r:col(["recebido","valorrecebido"]),n:col(["observacoes","obs"])};if(ix.m<0||ix.v<0)throw Error("A planilha precisa ter Motorista e Valor.");const out=[FREIGHT_HEADERS];matrix.slice(hi+1).forEach(r=>{if(!r.some(v=>String(v??"").trim()))return;const g=k=>ix[k]>=0?r[ix[k]]:"";out.push([impDate(g("d")),g("m"),g("o"),g("t"),g("v"),g("p")||0,g("c")===""?10:g("c"),g("r")||0,g("n")])});if(out.length<2)throw Error("Não encontrei fretes na planilha.");return out}
$("freightExcelFile").addEventListener("change",async e=>{const f=e.target.files?.[0];if(!f)return;try{if(!window.XLSX)throw Error("Leitor Excel indisponível. Verifique a internet e tente novamente.");const wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true});previewRows(excelToRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:"",raw:true})));importStatus(`Planilha ${f.name} carregada. Revise antes de importar.`)}catch(err){importStatus(err.message||"Não foi possível ler a planilha.",true)}e.target.value=""});
$("freightPhotoFile").addEventListener("change",async e=>{const f=e.target.files?.[0];if(!f)return;try{if(!window.Tesseract)throw Error("Leitor de foto indisponível. Verifique a internet.");importStatus("Lendo a foto… a leitura de escrita à mão pode conter erros.");const result=await Tesseract.recognize(f,"por+eng",{logger:m=>{if(m.status==="recognizing text")importStatus(`Lendo a foto… ${Math.round((m.progress||0)*100)}%`)}});const text=(result.data.text||"").trim();if(!text)throw Error("Não reconheci texto. Tire uma foto reta, clara e bem iluminada.");const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);let rows=[FREIGHT_HEADERS];for(const line of lines){const parts=line.split(/[;|\t]/).map(s=>s.trim());if(parts.length>=5)rows.push(parts.slice(0,9).concat(Array(Math.max(0,9-parts.length)).fill("" )).slice(0,9))}if(rows.length===1)rows.push([todayISO(),"REVISAR MOTORISTA","REVISAR ORIGEM","REVISAR DESTINO","","0","10","0","Preencher com base no texto reconhecido"]);previewRows(rows);$("importValidation").innerHTML='<p><strong>Texto reconhecido da foto (referência para conferir):</strong></p><textarea id="ocrRawText" rows="5" readonly></textarea>';$("ocrRawText").value=text;importStatus("Leitura concluída. Confira e corrija todos os campos antes de importar.")}catch(err){importStatus(err.message||"Falha na leitura da foto.",true)}e.target.value=""});
function splitImport(line){let out=[],s="",q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'&&q){s+='"';i++}else if(ch==='"')q=!q;else if((ch===';'||ch==='|'||ch==='\t')&&!q){out.push(s.trim());s=""}else s+=ch}out.push(s.trim());return out}
$("confirmFreightImport").addEventListener("click",()=>{const rows=$("importText").value.split(/\r?\n/).filter(s=>s.trim()).map(splitImport),hi=rows.findIndex(r=>r.some(v=>nh(v)==="data")&&r.some(v=>["motorista","condutor"].includes(nh(v))));if(hi<0){$("importValidation").innerHTML='<p class="error-line">O cabeçalho precisa conter Data e Motorista.</p>';return}const imported=[],errors=[];rows.slice(hi+1).forEach((r,i)=>{const line=hi+i+2;if(!r.some(x=>x.trim()))return;const date=impDate(r[0]),driver=(r[1]||"").trim(),value=impMoney(r[4]),toll=impMoney(r[5]),commission=r[6]===""||r[6]==null?10:impMoney(r[6]),received=impMoney(r[7]);if(!date||!driver||!Number.isFinite(value)||value<=0||!Number.isFinite(toll)||toll<0||!Number.isFinite(commission)||commission<0||!Number.isFinite(received)||received<0||received>value){errors.push(`Linha ${line}: confira data, motorista, valor, pedágio, comissão e recebido.`);return}imported.push({id:uid(),date,driver,origin:(r[2]||"").trim(),destination:(r[3]||"").trim(),value,toll,commission,received,deductToll:false,notes:(r[8]||"").trim()})});if(errors.length){$("importValidation").innerHTML='<p class="error-line"><strong>Corrija antes de importar:</strong></p><ul>'+errors.map(x=>`<li>${escapeHtml(x)}</li>`).join("")+'</ul>';return}if(!imported.length){$("importValidation").textContent="Nenhuma linha válida encontrada.";return}if(!confirm(`Adicionar ${imported.length} frete(s) ao sistema?`))return;db.freights=[...imported,...db.freights];saveDB();$("importReview").hidden=true;$("ocrStatus").hidden=true;toast(`${imported.length} frete(s) importado(s).`)});
$("cancelFreightImport").addEventListener("click",()=>{$("importReview").hidden=true;$("importValidation").innerHTML=""});

// Ordenação genérica: clicar no título de qualquer coluna ordena a grade; clicar novamente inverte.
(function enableGridSorting(){
 const sortStates=new WeakMap();
 const normalize=value=>String(value||"").replace(/\s+/g," ").trim();
 const parseValue=value=>{
   const s=normalize(value);if(!s)return {type:"empty",value:""};
   const date=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
   if(date){let year=Number(date[3]);if(year<100)year+=2000;return {type:"number",value:year*10000+Number(date[2])*100+Number(date[1])}}
   const numeric=s.replace(/[R$\s%]/g,"").replace(/\./g,"").replace(",",".");
   if(/^-?\d+(?:\.\d+)?$/.test(numeric))return {type:"number",value:Number(numeric)};
   return {type:"text",value:s.toLocaleLowerCase("pt-BR")};
 };
 document.addEventListener("click",event=>{
   const th=event.target.closest("table thead th");
   if(!th || !th.textContent.trim() || th.colSpan>1) return;
   const table=th.closest("table"), headerRow=th.closest("tr");
   if(!table || !headerRow) return;
   const col=[...headerRow.children].indexOf(th), body=table.tBodies[0];
   if(col<0||!body)return;
   const rows=[...body.rows].filter(r=>r.cells.length>col&&!r.querySelector("td[colspan]"));
   if(rows.length<2)return;
   const previous=sortStates.get(table),direction=previous&&previous.col===col&&previous.direction==="asc"?"desc":"asc";
   const decorated=rows.map((r,index)=>({r,index,v:parseValue(r.cells[col].innerText||r.cells[col].textContent)}));
   decorated.sort((a,b)=>{
     if(a.v.type==="empty"&&b.v.type!=="empty")return 1;
     if(b.v.type==="empty"&&a.v.type!=="empty")return -1;
     let result=a.v.type==="number"&&b.v.type==="number"?a.v.value-b.v.value:String(a.v.value).localeCompare(String(b.v.value),"pt-BR",{numeric:true,sensitivity:"base"});
     return (direction==="asc"?result:-result)||a.index-b.index;
   });
   decorated.forEach(item=>body.appendChild(item.r));
   sortStates.set(table,{col,direction});
   headerRow.querySelectorAll("th").forEach(cell=>{cell.removeAttribute("aria-sort");cell.classList.remove("grid-sort-asc","grid-sort-desc");const old=cell.querySelector(".grid-sort-indicator");if(old)old.remove()});
   th.setAttribute("aria-sort",direction==="asc"?"ascending":"descending");th.classList.add(direction==="asc"?"grid-sort-asc":"grid-sort-desc");
   const indicator=document.createElement("span");indicator.className="grid-sort-indicator";indicator.setAttribute("aria-hidden","true");indicator.textContent=direction==="asc"?" ▲":" ▼";th.appendChild(indicator);
 });
 document.querySelectorAll("table thead th").forEach(th=>{if(th.textContent.trim()&&!th.querySelector("button,input,select")){th.title="Clique para ordenar por esta coluna";th.classList.add("grid-sortable")}});
})();

renderAll();


// Busca de municípios brasileiros (IBGE) nos campos de origem e destino.
// A lista é carregada uma vez e armazenada localmente para evitar consultar a API a cada tecla.
(function initBrazilianCityAutocomplete(){
  const API_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";
  const CACHE_KEY = "rr_ibge_municipios_v1";
  let cities = [];
  let loadPromise = null;
  const normalizeCity = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  function loadCities(){
    if(cities.length) return Promise.resolve(cities);
    if(loadPromise) return loadPromise;
    loadPromise = (async()=>{
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if(cached){
          const parsed = JSON.parse(cached);
          if(parsed.savedAt && Date.now()-parsed.savedAt < 30*24*60*60*1000 && Array.isArray(parsed.data) && parsed.data.length > 5000){
            cities = parsed.data.map(item=>({...item,label:`${item.name} - ${item.uf}`,search:normalizeCity(`${item.name} ${item.uf}`)})); return cities;
          }
        }
      } catch(_) {}
      const response = await fetch(API_URL, {headers:{Accept:"application/json"}});
      if(!response.ok) throw new Error("Não foi possível consultar a lista de municípios do IBGE.");
      const data = await response.json();
      cities = data.map(item=>({id:item.id, name:item.nome, uf:item.microrregiao?.mesorregiao?.UF?.sigla || item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla || ""}))
        .filter(item=>item.name && item.uf)
        .map(item=>({...item, label:`${item.name} - ${item.uf}`, search:normalizeCity(`${item.name} ${item.uf}`)}))
        .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:Date.now(),data:cities.map(({id,name,uf})=>({id,name,uf}))})); } catch(_) {}
      return cities;
    })().catch(error=>{loadPromise=null;throw error;});
    return loadPromise;
  }
  function attach(input){
    if(!input || input.dataset.cityAutocomplete === "1") return;
    input.dataset.cityAutocomplete = "1";
    const wrapper = document.createElement("div"); wrapper.className="city-autocomplete";
    input.parentNode.insertBefore(wrapper,input); wrapper.appendChild(input);
    const list=document.createElement("div"); list.className="city-suggestions"; list.hidden=true; list.setAttribute("role","listbox"); wrapper.appendChild(list);
    let matches=[], active=-1, request=0;
    function close(){list.hidden=true;active=-1;}
    function choose(city){input.value=city.label;input.dataset.cityId=String(city.id);close();input.dispatchEvent(new Event("change",{bubbles:true}));}
    function render(query){
      const q=normalizeCity(query);
      if(q.length<2){close();return;}
      matches=cities.filter(city=>city.search.includes(q)).slice(0,10);
      if(!matches.length){list.innerHTML='<div class="city-no-results">Nenhum município encontrado</div>';list.hidden=false;return;}
      list.innerHTML=matches.map((city,index)=>`<button type="button" role="option" aria-selected="false" class="city-option" data-city-index="${index}"><span>${city.name}</span><small>${city.uf}</small></button>`).join("");
      list.hidden=false;
      list.querySelectorAll("[data-city-index]").forEach(button=>button.addEventListener("mousedown",event=>{event.preventDefault();choose(matches[Number(button.dataset.cityIndex)]);}));
    }
    input.addEventListener("input",async()=>{
      delete input.dataset.cityId;
      const current=++request, query=input.value;
      if(normalizeCity(query).length<2){close();return;}
      if(!cities.length){list.innerHTML='<div class="city-no-results">Buscando municípios do IBGE…</div>';list.hidden=false;try{await loadCities();}catch(_){list.innerHTML='<div class="city-no-results">Não foi possível carregar a lista. Verifique a conexão e tente novamente.</div>';return;}}
      if(current===request) render(query);
    });
    input.addEventListener("keydown",event=>{
      if(list.hidden || !matches.length) return;
      if(event.key==="ArrowDown"){event.preventDefault();active=Math.min(active+1,matches.length-1);}
      else if(event.key==="ArrowUp"){event.preventDefault();active=Math.max(active-1,0);}
      else if(event.key==="Enter" && active>=0){event.preventDefault();choose(matches[active]);return;}
      else if(event.key==="Escape"){close();return;} else return;
      list.querySelectorAll(".city-option").forEach((button,index)=>{button.classList.toggle("active",index===active);button.setAttribute("aria-selected",String(index===active));});
    });
    input.addEventListener("blur",()=>setTimeout(close,150));
    input.addEventListener("focus",()=>{if(input.value.trim().length>=2 && cities.length)render(input.value);});
  }
  attach(document.getElementById("fOrigin"));
  attach(document.getElementById("fDestination"));
})();
