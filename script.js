// إعدادات Firebase الخاصة بمشروعك (إبراهيم) - ثابته ومحمية
const firebaseConfig = {
  apiKey: "AIzaSyDlv0ygMBeIVLQo2AzDIrHzGb_AeDDh-q0",
  authDomain: "ibrahim-f988d.firebaseapp.com",
  databaseURL: "https://ibrahim-f988d-default-rtdb.firebaseio.com",
  projectId: "ibrahim-f988d",
  storageBucket: "ibrahim-f988d.firebasestorage.app",
  messagingSenderId: "244171133502",
  appId: "1:244171133502:web:eff38819fd52402960f76f",
  measurementId: "G-XMWFJ3HGNP"
};

firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('asfour_data');

let db = [];
let whs = ["المخزن الرئيسي"];
let logs = [];
let reservations = [];
let tempInvoice = { in: [], out: [] };

let selectedStockItem = null;
let selectedInventoryItem = null;

function login() {
    const passInput = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');
    if (passInput === "000") { 
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        errorMsg.style.display = 'none';
        renderData();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('adminPass').value = '';
        document.getElementById('adminPass').focus();
    }
}

dbRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        db = data.items || [];
        whs = data.warehouses || ["المخزن الرئيسي"];
        logs = data.logs || [];
        reservations = data.reservations || [];
        if (document.getElementById('main-app').style.display === 'block') {
            renderData(); 
        }
    }
});

function save() {
    dbRef.set({
        items: db,
        warehouses: whs,
        logs: logs,
        reservations: reservations
    });
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('inDate')) document.getElementById('inDate').value = today;
    if(document.getElementById('outDate')) document.getElementById('outDate').value = today;
}

function kbNav(e, nextId) { 
    if (e.key === 'Enter') { 
        e.preventDefault(); 
        if (nextId === 'SUBMIT_IN') {
            addToInvoice('in');
            document.getElementById('inName').focus();
        } else if (nextId === 'SUBMIT_OUT') {
            addToInvoice('out');
            document.getElementById('outName').focus();
        } else if (nextId === 'SUBMIT_RES') {
            addReservation();
            document.getElementById('resName').focus();
        } else {
            document.getElementById(nextId).focus(); 
        }
    } 
}

function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    if(btn) btn.classList.add('active');
    renderData();
}

function addNewItem() {
    const val = document.getElementById('newProdItem').value.trim();
    if(!val || db.find(i => i.name === val)) return;
    db.push({name: val, stocks: {}, weights: {}}); 
    document.getElementById('newProdItem').value = '';
    save();
}

function addNewWH() {
    const val = document.getElementById('newWHName').value.trim();
    if(!val || whs.includes(val)) return;
    whs.push(val);
    document.getElementById('newWHName').value = '';
    save();
}

function addToInvoice(type) {
    const name = document.getElementById(type+'Name').value.trim();
    const qty = parseInt(document.getElementById(type+'Qty').value) || 0;
    const wh = document.getElementById(type+'WH').value;
    const weight = parseFloat(document.getElementById(type+'Weight').value) || 0;
    const sender = document.getElementById(type+'Sender').value.trim();
    const notes = document.getElementById(type+'Notes').value.trim();
    
    let rawDate = document.getElementById(type+'Date').value;
    if(!rawDate) rawDate = new Date().toISOString().split('T')[0];
    const formattedDate = rawDate.split('-').reverse().join('/');

    if(!db.find(i => i.name === name) || qty <= 0) return alert("اختر مادة وكمية صحيحة");
    
    tempInvoice[type].push({ name, qty, wh, weight, sender, notes, date: formattedDate });
    ['Name', 'Qty', 'Weight', 'Notes'].forEach(f => document.getElementById(type+f).value = '');
    renderInvoice(type);
}

function renderInvoice(type) {
    let totalInvoiceWeight = tempInvoice[type].reduce((sum, item) => sum + item.weight, 0);
    
    let tableBody = tempInvoice[type].map((item, idx) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.qty} ق</td>
            <td>${item.wh}</td>
            <td style="font-weight:bold; color:var(--asfour-yellow);">${item.weight.toFixed(2)} كجم</td>
            <td onclick="editInvoiceItem('${type}', ${idx})" style="cursor:pointer; color:var(--orange); font-weight:bold;">📝 تعديل</td>
        </tr>
    `).join('');

    if(tempInvoice[type].length > 0) {
        tableBody += `
            <tr style="background: #222; font-weight: bold; color: var(--asfour-yellow);">
                <td colspan="3" style="text-align: left;">⚖️ الإجمالي:</td>
                <td colspan="2" style="color: lightgreen;">${totalInvoiceWeight.toFixed(2)} كجم</td>
            </tr>`;
    }
    document.querySelector(`#${type}InvoiceTable tbody`).innerHTML = tableBody;
}

function editInvoiceItem(type, idx) {
    const item = tempInvoice[type][idx];
    document.getElementById(type+'Name').value = item.name;
    document.getElementById(type+'Qty').value = item.qty;
    document.getElementById(type+'WH').value = item.wh;
    document.getElementById(type+'Weight').value = item.weight;
    document.getElementById(type+'Sender').value = item.sender;
    document.getElementById(type+'Notes').value = item.notes;
    
    if(item.date) {
        const parts = item.date.split('/');
        document.getElementById(type+'Date').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    tempInvoice[type].splice(idx, 1); 
    renderInvoice(type);
    document.getElementById(type+'Qty').focus(); 
}

function saveFinalInvoice(type) {
    if(tempInvoice[type].length === 0) return;
    let hasError = false;

    if (type === 'out') {
        tempInvoice[type].forEach(invItem => {
            const item = db.find(i => i.name === invItem.name);
            let currentStock = item && item.stocks && item.stocks[invItem.wh] ? item.stocks[invItem.wh] : 0;
            if (currentStock < invItem.qty) {
                alert(`🚨 خطأ!\n[ ${invItem.name} ] رصيده في [ ${invItem.wh} ] هو (${currentStock}) فقط.`);
                hasError = true;
            }
        });
    }

    if (hasError) return;

    tempInvoice[type].forEach(invItem => {
        const item = db.find(i => i.name === invItem.name);
        if(!item.stocks) item.stocks = {};
        if(!item.weights) item.weights = {};
        if(!item.stocks[invItem.wh]) item.stocks[invItem.wh] = 0;
        if(!item.weights[invItem.wh]) item.weights[invItem.wh] = 0;
        
        if(type === 'in') {
            item.stocks[invItem.wh] += invItem.qty;
            item.weights[invItem.wh] += invItem.weight;
        } else {
            item.stocks[invItem.wh] -= invItem.qty;
            item.weights[invItem.wh] -= invItem.weight;
        }
        
        logs.unshift({ ...invItem, type: type === 'in' ? 'داخل' : 'خارج' });
    });
    tempInvoice[type] = [];
    renderInvoice(type);
    save();
    setDefaultDates();
    alert("تم حفظ الفاتورة سحابياً!");
}

function addReservation() {
    const name = document.getElementById('resName').value.trim();
    const qty = parseInt(document.getElementById('resQty').value) || 0;
    const customer = document.getElementById('resCustomer').value.trim();
    const notes = document.getElementById('resNotes').value.trim();
    
    const item = db.find(i => i.name === name);
    if(!item || qty <= 0) return alert("اختر مادة صحيحة");
    
    let targetWH = whs[0] || "المخزن الرئيسي";
    let currentStock = item.stocks && item.stocks[targetWH] ? item.stocks[targetWH] : 0;

    if (currentStock < qty) {
        return alert(`🚨 عذراً! الرصيد لا يكفي الحجز.`);
    }

    if (!item.stocks) item.stocks = {};
    if (!item.stocks[targetWH]) item.stocks[targetWH] = 0;

    item.stocks[targetWH] -= qty;
    
    const todayDate = new Date().toLocaleDateString('ar-EG');
    reservations.push({ name, qty, customer, notes, wh: targetWH, date: todayDate });
    ['resName', 'resQty', 'resCustomer', 'resNotes'].forEach(id => document.getElementById(id).value = '');
    save();
}

function removeReservation(idx) {
    if(confirm('هل تريد إلغاء الحجز وإعادة المواد للمستودع؟')) {
        const res = reservations[idx];
        const item = db.find(i => i.name === res.name);
        if(item && item.stocks) {
            let targetWH = res.wh || whs[0] || "المخزن الرئيسي";
            if(!item.stocks[targetWH]) item.stocks[targetWH] = 0;
            item.stocks[targetWH] += res.qty; 
        }
        reservations.splice(idx, 1);
        save();
    }
}

// تعديل: الحذف هنا يمسح الحركة من جدول الأرشيف العام فقط ولا يؤثر على المخازن نهائياً
function deleteLogItem(idx) {
    if(confirm("هل أنت متأكد من مسح هذه الحركة نهائياً من الأرشيف؟ (لن يؤثر على رصيد المخزن الحالي)")) {
        logs.splice(idx, 1); 
        save();
        alert("تم مسح بند الحركة من الأرشيف بنجاح!");
    }
}

function exportInventoryToExcel() {
    let csv = "\uFEFFالمادة;المستودع;الرصيد;الوزن\n";
    let itemsToExport = db;
    if (selectedStockItem) {
        itemsToExport = db.filter(i => i.name === selectedStockItem);
    }
    itemsToExport.forEach(i => {
        whs.forEach(w => {
            let q = i.stocks && i.stocks[w] ? i.stocks[w] : 0;
            let wt = i.weights && i.weights[w] ? i.weights[w] : 0;
            if (q !== 0 || wt !== 0) {
                csv += `${i.name};${w};${q};${wt.toFixed(2)}\n`;
            }
        });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    let fileName = selectedStockItem ? `جرد_${selectedStockItem}` : "تقرير_الجرد";
    link.download = `${fileName}_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
}

function exportToExcel() {
    let csv = "\uFEFFالتاريخ;النوع;المادة;العدد;المستودع;الوزن;الجهة;ملاحظات\n";
    logs.forEach(l => {
        csv += `${l.date};${l.type};${l.name};${l.qty};${l.wh};${l.weight};${l.sender};${(l.notes||"")}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `أرشيف_الحركات.csv`;
    link.click();
}

function renderData() {
    if((document.getElementById('inDate') && !document.getElementById('inDate').value) || (document.getElementById('outDate') && !document.getElementById('outDate').value)) {
        setDefaultDates();
    }

    document.getElementById('itemsList').innerHTML = db.map(i => `<option value="${i.name}">`).join('');
    const whOptions = whs.map(w => `<option value="${w}">${w}</option>`).join('');
    if(document.getElementById('inWH')) document.getElementById('inWH').innerHTML = whOptions;
    if(document.getElementById('outWH')) document.getElementById('outWH').innerHTML = whOptions;

    document.getElementById('manageBody').innerHTML = db.map((i, idx) => `
        <tr>
            <td style="font-weight:bold;">${i.name}</td>
            <td><span onclick="if(confirm('حذف الصنف نهائياً؟')){db.splice(${idx},1);save()}" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️ حذف</span></td>
        </tr>
    `).join('');

    const stockSearchQuery = document.getElementById('stockSearch') ? document.getElementById('stockSearch').value.toLowerCase() : '';
    let filteredStockDb = db.filter(i => i.name.toLowerCase().includes(stockSearchQuery));
    if (selectedStockItem) {
        filteredStockDb = filteredStockDb.filter(i => i.name === selectedStockItem);
    }

    let globalTotalWeight = 0; 

    document.getElementById('stockBody').innerHTML = filteredStockDb.map(i => {
        let totalPieces = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        let itemTotalWeight = Object.values(i.weights || {}).reduce((a, b) => a + b, 0);
        globalTotalWeight += itemTotalWeight; 
        
        let piecesDetail = Object.entries(i.stocks || {}).map(([n, v]) => v !== 0 ? `<div style="margin-bottom:2px;">📍 ${n}: <b>${v} ق</b></div>` : '').join('');
        let weightsDetail = Object.entries(i.weights || {}).map(([n, w]) => w !== 0 ? `<div style="margin-bottom:2px; color:var(--asfour-yellow);">⚖️ ${n}: <b>${w.toFixed(1)} كج</b></div>` : '').join('');
        
        let nameDisplay = selectedStockItem 
            ? `${i.name} <span onclick="selectedStockItem=null; renderData(); event.stopPropagation();" style="color:var(--orange); font-size:11px; cursor:pointer;">[إلغاء]</span>`
            : `<span style="cursor:pointer; color:#3498db;">${i.name}</span>`;

        return `
            <tr onclick="if(!selectedStockItem){ selectedStockItem='${i.name}'; renderData(); }">
                <td style="font-weight:bold;">${nameDisplay}</td>
                <td>${piecesDetail || '-'}</td>
                <td>${weightsDetail || '-'}</td>
                <td><b>${totalPieces} ق</b><br><small style="color:var(--asfour-yellow);">${itemTotalWeight.toFixed(1)} كج</small></td>
            </tr>`;
    }).join('');

    if(document.getElementById('grandTotalWeight')) {
        document.getElementById('grandTotalWeight').innerText = globalTotalWeight.toFixed(1) + " كجم";
    }

    document.getElementById('resBody').innerHTML = reservations.map((r, idx) => `<tr><td>${r.name}</td><td>${r.qty} ق</td><td>${r.customer}</td><td onclick="removeReservation(${idx})" style="cursor:pointer; color:red;">🗑️ إلغاء</td></tr>`).join('');
    
    document.getElementById('logsBody').innerHTML = logs.map((l, idx) => `
        <tr>
            <td>${l.date}</td>
            <td style="color:${l.type==='داخل'?'lightgreen':'coral'}">${l.type}</td>
            <td>${l.name}</td>
            <td>${l.qty}</td>
            <td>${l.wh}</td>
            <td>${l.weight.toFixed(1)}</td>
            <td>${l.sender}</td>
            <td><span onclick="deleteLogItem(${idx})" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️</span></td>
        </tr>`).join('');
        
    renderInventory();
}

function renderInventory() {
    const q = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    let gQty = 0, gRes = 0;
    
    let filteredInvDb = db.filter(i => i.name.toLowerCase().includes(q));
    if (selectedInventoryItem) {
        filteredInvDb = filteredInvDb.filter(i => i.name === selectedInventoryItem);
    }

    document.getElementById('invBody').innerHTML = filteredInvDb.map(i => {
        let totalQty = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        let itemRes = reservations.filter(r => r.name === i.name).reduce((sum, curr) => sum + curr.qty, 0);
        
        gQty += (totalQty + itemRes); 
        gRes += itemRes;
        let netAvailable = totalQty; 
        
        let nameDisplay = selectedInventoryItem 
            ? `${i.name} <span onclick="selectedInventoryItem=null; renderData(); event.stopPropagation();" style="color:var(--orange); font-size:11px; cursor:pointer;">[إلغاء]</span>`
            : `<span style="cursor:pointer; color:#3498db;">${i.name}</span>`;

        return `
            <tr onclick="if(!selectedInventoryItem){ selectedInventoryItem='${i.name}'; renderData(); }">
                <td style="font-weight:bold;">${nameDisplay}</td>
                <td>${totalQty + itemRes} ق</td>
                <td style="font-weight:bold; color:${netAvailable < 0 ? 'var(--danger)' : 'lightgreen'}">${netAvailable} ق</td>
            </tr>`;
    }).join('');
    
    document.getElementById('grandTotalQty').innerText = gQty + " قطعة";
    document.getElementById('grandTotalRes').innerText = gRes + " قطعة";
}