// إعدادات Firebase الخاصة بمشروعك (إبراهيم) - ثابتة ومحمية كما هي
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

// بدء تشغيل وتفعيل اتصال Firebase السحابي
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('asfour_data');

let db = [];
let whs = ["المخزن الرئيسي"];
let logs = [];
let reservations = [];
let tempInvoice = { in: [], out: [] };

// متغيرات حفظ المادة المختار عزلها بالماوس
let selectedStockItem = null;
let selectedInventoryItem = null;

// دالة تسجيل الدخول والتحقق من كلمة المرور
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

// الاستماع للبيانات من السحابة وتحديث الواجهة تلقائياً
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

// حفظ البيانات في السحابة
function save() {
    dbRef.set({
        items: db,
        warehouses: whs,
        logs: logs,
        reservations: reservations
    });
}

// دالة الملاحة الذكية بالكيبورد (Enter ينقلك للخانة التالية فوراً)
function kbNav(e, nextId) { 
    if (e.key === 'Enter') { 
        e.preventDefault(); 
        document.getElementById(nextId).focus(); 
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
    
    if(!db.find(i => i.name === name) || qty <= 0) return alert("اختر مادة مسجلة صحيحة وكمية قطع أكبر من الصفر");
    
    tempInvoice[type].push({ name, qty, wh, weight, sender, notes });
    
    ['Name', 'Qty', 'Weight', 'Notes'].forEach(f => document.getElementById(type+f).value = '');
    document.getElementById(type+'Name').focus();
    renderInvoice(type);
}

function renderInvoice(type) {
    document.querySelector(`#${type}InvoiceTable tbody`).innerHTML = tempInvoice[type].map((item, idx) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.qty} قطعة</td>
            <td>${item.wh}</td>
            <td style="font-weight:bold; color:var(--asfour-yellow);">${item.weight.toFixed(2)} كجم</td>
            <td onclick="editInvoiceItem('${type}', ${idx})" style="cursor:pointer; color:var(--orange); font-weight:bold;">📝 تعديل/إرجاع</td>
        </tr>
    `).join('');
}

function editInvoiceItem(type, idx) {
    const item = tempInvoice[type][idx];
    document.getElementById(type+'Name').value = item.name;
    document.getElementById(type+'Qty').value = item.qty;
    document.getElementById(type+'WH').value = item.wh;
    document.getElementById(type+'Weight').value = item.weight;
    document.getElementById(type+'Sender').value = item.sender;
    document.getElementById(type+'Notes').value = item.notes;
    
    tempInvoice[type].splice(idx, 1); 
    renderInvoice(type);
    document.getElementById(type+'Qty').focus(); 
}

function saveFinalInvoice(type) {
    if(tempInvoice[type].length === 0) return;
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
        
        logs.unshift({ 
            date: new Date().toLocaleString('ar-EG'), 
            ...invItem, 
            type: type === 'in' ? 'داخل' : 'خارج' 
        });
    });
    tempInvoice[type] = [];
    renderInvoice(type);
    save();
    alert("تم ترحيل الفاتورة وحفظ الأوزان والقطع سحابياً بنجاح!");
}

function addReservation() {
    const name = document.getElementById('resName').value.trim();
    const qty = parseInt(document.getElementById('resQty').value) || 0;
    const customer = document.getElementById('resCustomer').value.trim();
    const notes = document.getElementById('resNotes').value.trim();
    
    if(!db.find(i => i.name === name) || qty <= 0) return alert("اختر مادة صحيحة وعدد حقيقي");
    
    reservations.push({ name, qty, customer, notes, date: new Date().toLocaleString('ar-EG') });
    ['resName', 'resQty', 'resCustomer', 'resNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('resName').focus();
    save();
}

// 🎯 دالة التصدير الذكية والمحدثة: تقوم بالتصدير بناءً على ما هو معروض (الصنف المختار فقط أو كل الأصناف)
function exportInventoryToExcel() {
    let csv = "\uFEFFالمادة;المستودع;الرصيد الحالي (قطع);الوزن الحالي (كجم)\n";
    
    // إذا كان هناك مادة مختارة بالماوس، نُصدّرها هي فقط، وإلا نُصدّر قاعدة البيانات كاملة
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
    
    // تخصيص اسم الملف ليحمل اسم المادة لو كانت معزولة ومحددة
    let fileName = selectedStockItem ? `جرد_مادة_${selectedStockItem}` : "عصفور_ستيل_تقرير_الجرد_الأوزان";
    link.download = `${fileName}_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
}

function exportToExcel() {
    let csv = "\uFEFFالتاريخ;النوع;المادة;العدد الكلي;المستودع;الوزن (كجم);الجهة/الزبون;ملاحظات\n";
    logs.forEach(l => {
        csv += `${l.date};${l.type};${l.name};${l.qty};${l.wh};${l.weight};${l.sender};${(l.notes||"")}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `عصفور_ستيل_سجل_الحركات.csv`;
    link.click();
}

function renderData() {
    document.getElementById('itemsList').innerHTML = db.map(i => `<option value="${i.name}">`).join('');
    const whOptions = whs.map(w => `<option value="${w}">${w}</option>`).join('');
    if(document.getElementById('inWH')) document.getElementById('inWH').innerHTML = whOptions;
    if(document.getElementById('outWH')) document.getElementById('outWH').innerHTML = whOptions;

    // 1. جدول إدارة التعريفات والمواد
    document.getElementById('manageBody').innerHTML = db.map((i, idx) => `
        <tr>
            <td style="font-weight:bold;">${i.name}</td>
            <td><span onclick="if(confirm('هل تريد حذف المادة نهائياً من السيستم؟')){db.splice(${idx},1);save()}" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️ حذف الصنف</span></td>
        </tr>
    `).join('');

    // 2. جدول جرد المواد والأوزان التفصيلي مع ميزة عزل صنف واحد لرؤية تفاصيله
    const stockSearchQuery = document.getElementById('stockSearch') ? document.getElementById('stockSearch').value.toLowerCase() : '';
    
    let filteredStockDb = db.filter(i => i.name.toLowerCase().includes(stockSearchQuery));
    if (selectedStockItem) {
        filteredStockDb = filteredStockDb.filter(i => i.name === selectedStockItem);
    }

    document.getElementById('stockBody').innerHTML = filteredStockDb.map(i => {
        let totalPieces = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        
        let piecesDetail = Object.entries(i.stocks || {}).map(([n, v]) => v !== 0 ? `<div style="margin-bottom:3px;">📍 ${n}: <b>${v} قطعة</b></div>` : '').join('');
        let weightsDetail = Object.entries(i.weights || {}).map(([n, w]) => w !== 0 ? `<div style="margin-bottom:3px; color:var(--asfour-yellow); font-weight:bold;">⚖️ ${n}: <b>${w.toFixed(2)} كجم</b></div>` : '').join('');
        
        let nameDisplay = selectedStockItem 
            ? `${i.name} <span onclick="selectedStockItem=null; renderData(); event.stopPropagation();" style="color:var(--orange); font-size:12px; cursor:pointer; background:#222; padding:2px 6px; border-radius:4px; margin-right:10px;">❌ إلغاء الاختيار</span>`
            : `<span style="cursor:pointer; color:#3498db; text-decoration:underline;">${i.name}</span>`;

        return `
            <tr onclick="if(!selectedStockItem){ selectedStockItem='${i.name}'; renderData(); }">
                <td style="font-weight:bold; font-size:16px;">${nameDisplay}</td>
                <td>${piecesDetail || '<span style="color:gray;">لا توجد قطع</span>'}</td>
                <td>${weightsDetail || '<span style="color:gray;">لا يوجد وزن</span>'}</td>
                <td style="font-weight:bold; font-size:15px; color:white;">${totalPieces} قطعة إجمالي</td>
            </tr>`;
    }).join('');

    document.getElementById('resBody').innerHTML = reservations.map((r, idx) => `<tr><td>${r.name}</td><td>${r.qty} قطعة</td><td>${r.customer}</td><td onclick="if(confirm('إلغاء الحجز؟')){reservations.splice(${idx},1);save()}" style="cursor:pointer; color:red;">🗑️ إلغاء</td></tr>`).join('');
    document.getElementById('logsBody').innerHTML = logs.map(l => `<tr><td>${l.date}</td><td style="color:${l.type==='داخل'?'lightgreen':'coral'}">${l.type}</td><td>${l.name}</td><td>${l.qty}</td><td>${l.wh}</td><td style="font-weight:bold;">${l.weight.toFixed(2)} كجم</td><td>${l.sender}</td></tr>`).join('');
    renderInventory();
}

// 3. جدول الرصيد المتاح للبيع الفعلي
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
        gQty += totalQty; 
        gRes += itemRes;
        let netAvailable = totalQty - itemRes;
        
        let nameDisplay = selectedInventoryItem 
            ? `${i.name} <span onclick="selectedInventoryItem=null; renderData(); event.stopPropagation();" style="color:var(--orange); font-size:12px; cursor:pointer; background:#222; padding:2px 6px; border-radius:4px; margin-right:10px;">❌ إلغاء الاختيار</span>`
            : `<span style="cursor:pointer; color:#3498db; text-decoration:underline;">${i.name}</span>`;

        return `
            <tr onclick="if(!selectedInventoryItem){ selectedInventoryItem='${i.name}'; renderData(); }">
                <td style="font-weight:bold; font-size:16px;">${nameDisplay}</td>
                <td>${totalQty} قطعة متوفرة</td>
                <td style="font-weight:bold; font-size:15px; color:${netAvailable < 0 ? 'var(--danger)' : 'lightgreen'}">${netAvailable} قطعة جاهزة للبيع</td>
            </tr>`;
    }).join('');
    
    document.getElementById('grandTotalQty').innerText = gQty + " قطعة بالهناقر";
    document.getElementById('grandTotalRes').innerText = gRes + " قطعة محجوزة";
}