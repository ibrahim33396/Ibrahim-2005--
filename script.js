// --- إعدادات الحماية ---
const PASSWORD = "123"; // يمكنك تغيير الرقم السري من هنا

function login() {
    const input = document.getElementById('adminPass').value;
    const error = document.getElementById('loginError');
    if (input === PASSWORD) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        sessionStorage.setItem('asfour_auth', 'true');
        renderData();
    } else {
        error.style.display = 'block';
        document.getElementById('adminPass').value = '';
    }
}

// فحص الجلسة عند فتح الصفحة
window.onload = function() {
    if (sessionStorage.getItem('asfour_auth') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        renderData();
    }
}

// --- بقية منطق النظام الأصلي ---
let db = JSON.parse(localStorage.getItem('asfour_v21_db')) || [];
let whs = JSON.parse(localStorage.getItem('asfour_v21_whs')) || ["المخزن الرئيسي"];
let logs = JSON.parse(localStorage.getItem('asfour_v21_logs')) || [];
let reservations = JSON.parse(localStorage.getItem('asfour_v21_res')) || [];
let tempInvoice = { in: [], out: [] };

function kbNav(e, nextId) { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(nextId).focus(); } }

function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    btn.classList.add('active');
    renderData();
}

function addNewItem() {
    const val = document.getElementById('newProdItem').value.trim();
    if(!val || db.find(i => i.name === val)) return;
    db.push({name: val, stocks: {}});
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
    const name = document.getElementById(type+'Name').value;
    const qty = parseInt(document.getElementById(type+'Qty').value) || 0;
    const wh = document.getElementById(type+'WH').value;
    const weight = parseFloat(document.getElementById(type+'Weight').value) || 0;
    const sender = document.getElementById(type+'Sender').value;
    const notes = document.getElementById(type+'Notes').value;
    if(!db.find(i => i.name === name) || qty <= 0) return alert("تأكد من اختيار مادة صحيحة وكمية أكبر من صفر");
    tempInvoice[type].push({ name, qty, wh, weight, sender, notes });
    ['Name', 'Qty', 'Weight', 'Notes'].forEach(f => document.getElementById(type+f).value = '');
    document.getElementById(type+'Name').focus();
    renderInvoice(type);
}

function renderInvoice(type) {
    document.querySelector(`#${type}InvoiceTable tbody`).innerHTML = tempInvoice[type].map((item, idx) => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.wh}</td><td onclick="tempInvoice['${type}'].splice(${idx},1);renderInvoice('${type}')" style="cursor:pointer; color:red;">✖</td></tr>`).join('');
}

function saveFinalInvoice(type) {
    if(tempInvoice[type].length === 0) return;
    tempInvoice[type].forEach(invItem => {
        const item = db.find(i => i.name === invItem.name);
        if(!item.stocks) item.stocks = {};
        if(!item.stocks[invItem.wh]) item.stocks[invItem.wh] = 0;
        if(type === 'in') item.stocks[invItem.wh] += invItem.qty;
        else item.stocks[invItem.wh] -= invItem.qty;
        logs.unshift({ date: new Date().toLocaleString('ar-EG'), ...invItem, type: type === 'in' ? 'داخل' : 'خارج' });
    });
    tempInvoice[type] = [];
    renderInvoice(type);
    save();
}

function addReservation() {
    const name = document.getElementById('resName').value;
    const qty = parseInt(document.getElementById('resQty').value) || 0;
    const customer = document.getElementById('resCustomer').value;
    if(!db.find(i => i.name === name) || qty <= 0) return;
    reservations.push({ name, qty, customer, date: new Date().toLocaleString('ar-EG') });
    save();
}

function exportToExcel() {
    let csv = "\uFEFFالتاريخ;النوع;المادة;العدد;المستودع;الجهة;الوزن;ملاحظات\n";
    logs.forEach(l => {
        csv += `${l.date};${l.type};${l.name};${l.qty};${l.wh};${l.sender};${l.weight};${(l.notes||"").replace(/;/g, "-")}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `عصفور_ستيل_سجل_الحركات.csv`;
    link.click();
}

function save() {
    localStorage.setItem('asfour_v21_db', JSON.stringify(db));
    localStorage.setItem('asfour_v21_whs', JSON.stringify(whs));
    localStorage.setItem('asfour_v21_logs', JSON.stringify(logs));
    localStorage.setItem('asfour_v21_res', JSON.stringify(reservations));
    renderData();
}

function renderData() {
    if (sessionStorage.getItem('asfour_auth') !== 'true') return;
    
    document.getElementById('itemsList').innerHTML = db.map(i => `<option value="${i.name}">`).join('');
    const whOptions = whs.map(w => `<option value="${w}">${w}</option>`).join('');
    if(document.getElementById('inWH')) document.getElementById('inWH').innerHTML = whOptions;
    if(document.getElementById('outWH')) document.getElementById('outWH').innerHTML = whOptions;

    document.getElementById('manageBody').innerHTML = db.map((i, idx) => {
        let total = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        let whDetail = Object.entries(i.stocks || {}).map(([n, v]) => v !== 0 ? `<span class="wh-badge">${n}: ${v}</span>` : '').join('');
        return `<tr><td>${i.name}</td><td>${whDetail}</td><td>${total}</td><td><span onclick="if(confirm('حذف؟')){db.splice(${idx},1);save()}" style="cursor:pointer;">🗑️</span></td></tr>`;
    }).join('');

    document.getElementById('resBody').innerHTML = reservations.map((r, idx) => `<tr><td>${r.name}</td><td>${r.qty}</td><td>${r.customer}</td><td onclick="reservations.splice(${idx},1);save()">🗑️</td></tr>`).join('');
    document.getElementById('logsBody').innerHTML = logs.map(l => `<tr><td>${l.date}</td><td>${l.type}</td><td>${l.name}</td><td>${l.qty}</td><td>${l.wh}</td><td>${l.sender}</td></tr>`).join('');
    renderInventory();
}

function renderInventory() {
    const q = document.getElementById('invSearch').value.toLowerCase();
    let gQty = 0, gRes = 0;
    document.getElementById('invBody').innerHTML = db.filter(i => i.name.toLowerCase().includes(q)).map(i => {
        let total = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        let itemRes = reservations.filter(r => r.name === i.name).reduce((sum, curr) => sum + curr.qty, 0);
        let whDetail = Object.entries(i.stocks || {}).map(([n, v]) => v !== 0 ? `<span class="wh-badge">${n}: ${v}</span>` : '').join('');
        gQty += total; gRes += itemRes;
        return `<tr><td>${i.name}</td><td>${whDetail}</td><td style="font-weight:bold; color:${(total-itemRes)<0?'red':'white'}">${total - itemRes}</td></tr>`;
    }).join('');
    document.getElementById('grandTotalQty').innerText = gQty;
    document.getElementById('grandTotalRes').innerText = gRes;
}