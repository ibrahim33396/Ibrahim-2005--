// إعدادات Firebase الخاصة بمشروعك (إبراهيم) - ثابتة ومحمية
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

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('asfour_data');

// المتغيرات العامة للنظام
let db = [];
let whs = ["المخزن الرئيسي"];
let logs = [];
let reservations = [];
let tempInvoice = { in: [], out: [] };

let selectedStockItem = null;
let selectedInventoryItem = null;

// مؤشر للتنقل بالأسهم داخل القوائم المنسدلة
let currentDropdownFocusIndex = -1;

// دالة تسجيل الدخول
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

// الاستماع للتغييرات في قاعدة البيانات جلب البيانات فورياً
dbRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        db = data.items || [];
        whs = data.warehouses || ["المخزن الرئيسي"];
        logs = data.logs || [];
        reservations = data.reservations || [];
        
        // تحديث منسدلة فلاتر المستودعات في الشاشات المختلفة
        updateWHDropdownFilter();

        if (document.getElementById('main-app').style.display === 'block') {
            renderData(); 
        }
    }
});

// دالة تحديث منسدلة المستودعات
function updateWHDropdownFilter() {
    const stockFilterEl = document.getElementById('stockWHFilter');
    if(stockFilterEl) {
        const currentVal = stockFilterEl.value;
        let options = '<option value="ALL">🌍 كل المستودعات</option>';
        whs.forEach(w => {
            options += `<option value="${w}">📍 ${w}</option>`;
        });
        stockFilterEl.innerHTML = options;
        stockFilterEl.value = currentVal; 
    }

    const invFilterEl = document.getElementById('invWHFilter');
    if(invFilterEl) {
        const currentVal = invFilterEl.value;
        let options = '<option value="ALL">🌍 كل المستودعات</option>';
        whs.forEach(w => {
            options += `<option value="${w}">📍 ${w}</option>`;
        });
        invFilterEl.innerHTML = options;
        invFilterEl.value = currentVal; 
    }
}

// دالة حفظ البيانات إلى السحابة
function save() {
    dbRef.set({
        items: db,
        warehouses: whs,
        logs: logs,
        reservations: reservations
    });
}

// تعيين تاريخ اليوم كقيمة افتراضية للحقول
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('inDate')) document.getElementById('inDate').value = today;
    if(document.getElementById('outDate')) document.getElementById('outDate').value = today;
}

// دالة التنقل السريع بلوحة المفاتيح والـ Enter مع ميزة الإضافة الفورية للفواتير عند الضغط على زر الإضافة
function kbNav(e, nextId) { 
    if (e.key === 'Enter') { 
        e.preventDefault(); 
        
        // إذا كان العنصر القادم هو زر الإضافة لـ (داخل) أو (خارج)
        if (nextId === 'btn_SUBMIT_IN') {
            addToInvoice('in');
            return;
        }
        if (nextId === 'btn_SUBMIT_OUT') {
            addToInvoice('out');
            return;
        }

        // للتنقل العادي بين الحقول الأخرى
        const nextEl = document.getElementById(nextId);
        if(nextEl) {
            nextEl.focus();
        }
    } 
}

// نظام متقدم للتحكم والنزول بالأسهم واختيار المواد داخل القوائم المنسدلة الذكية
function handleDropdownNavigation(e, type) {
    let dropdownId = type + 'Dropdown';
    if(type === 'resGlobal') dropdownId = 'resSearchDropdown';
    if(type === 'logGlobal') dropdownId = 'logSearchDropdown';

    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.getElementsByClassName('custom-dropdown-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentDropdownFocusIndex++;
        if (currentDropdownFocusIndex >= items.length) currentDropdownFocusIndex = 0;
        setActiveDropdownItem(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentDropdownFocusIndex--;
        if (currentDropdownFocusIndex < 0) currentDropdownFocusIndex = items.length - 1;
        setActiveDropdownItem(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentDropdownFocusIndex > -1 && items[currentDropdownFocusIndex]) {
            items[currentDropdownFocusIndex].click();
        } else if (items.length > 0) {
            items[0].click(); // اختيار الخيار الأول تلقائياً في حال لم يتم النزول بالأسهم
        }
    } else if (e.key === 'Escape') {
        closeAllDropdowns();
    }
}

function setActiveDropdownItem(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('focused');
    }
    if (items[currentDropdownFocusIndex]) {
        items[currentDropdownFocusIndex].classList.add('focused');
        items[currentDropdownFocusIndex].scrollIntoView({ block: 'nearest' });
    }
}

// دالة التنقل بين الشاشات (التبويبات)
function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    if(btn) btn.classList.add('active');
    
    // إعادة تصفير فلاتر البحث والـ Index التعديلي لراحة المستخدم
    selectedStockItem = null;
    selectedInventoryItem = null;
    document.getElementById('editResIndex').value = "-1";
    if(document.getElementById('btn_SUBMIT_RES')) document.getElementById('btn_SUBMIT_RES').innerText = "🔒 تثبيت الحجز";
    
    if(document.getElementById('stockSearch')) document.getElementById('stockSearch').value = '';
    if(document.getElementById('invSearch')) document.getElementById('invSearch').value = '';

    closeAllDropdowns();
    renderData();
}

// ==================== نظام البحث واختيار المواد في الفواتير والحجوزات ====================
function showDropdown(type) {
    closeAllDropdowns();
    currentDropdownFocusIndex = -1;
    const dropdown = document.getElementById(type + 'Dropdown');
    const inputVal = document.getElementById(type + 'NameSearch').value.toLowerCase();
    
    let filtered = db.filter(item => item.name.toLowerCase().includes(inputVal));
    if(filtered.length === 0) filtered = db;

    dropdown.innerHTML = filtered.map(item => `
        <div class="custom-dropdown-item" onclick="selectDropdownItem('${type}', '${item.name}')">${item.name}</div>
    `).join('');
    
    dropdown.style.display = 'block';
}

function filterDropdown(type) {
    currentDropdownFocusIndex = -1;
    const dropdown = document.getElementById(type + 'Dropdown');
    const inputVal = document.getElementById(type + 'NameSearch').value.toLowerCase();
    
    const filtered = db.filter(item => item.name.toLowerCase().includes(inputVal));
    
    if(filtered.length > 0) {
        dropdown.innerHTML = filtered.map(item => `
            <div class="custom-dropdown-item" onclick="selectDropdownItem('${type}', '${item.name}')">${item.name}</div>
        `).join('');
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// ==================== نظام فلاتر البحث في شاشات العرض والجرد (أعلى الجداول) ====================
function showGlobalSearchDropdown(view) {
    closeAllDropdowns();
    currentDropdownFocusIndex = -1;
    let dropdownId = view + 'Dropdown';
    let inputId = view + 'Search';
    
    if(view === 'res') { dropdownId = 'resSearchDropdown'; inputId = 'resSearchQuery'; }
    if(view === 'log') { dropdownId = 'logSearchDropdown'; inputId = 'logCustomerSearch'; }
    
    const dropdown = document.getElementById(dropdownId);
    const inputVal = document.getElementById(inputId).value.toLowerCase();
    
    let listItems = [];
    if(view === 'stock' || view === 'inv') {
        listItems = db.map(i => i.name);
    } else if(view === 'res') {
        let uniqueCustomers = [...new Set(reservations.map(r => r.customer).filter(Boolean))];
        let uniqueItems = [...new Set(reservations.map(r => r.name).filter(Boolean))];
        listItems = [...uniqueCustomers, ...uniqueItems];
    } else if(view === 'log') {
        listItems = [...new Set(logs.map(l => l.sender).filter(Boolean))];
    }

    let filtered = listItems.filter(name => name.toLowerCase().includes(inputVal));
    if(filtered.length === 0) filtered = listItems.slice(0, 15);

    dropdown.innerHTML = filtered.map(name => `
        <div class="custom-dropdown-item" onclick="selectGlobalSearchItem('${view}', '${name}')">${name}</div>
    `).join('');
    
    dropdown.style.display = 'block';
}

function filterGlobalSearch(view) {
    currentDropdownFocusIndex = -1;
    let dropdownId = view + 'Dropdown';
    let inputId = view + 'Search';
    
    if(view === 'res') { dropdownId = 'resSearchDropdown'; inputId = 'resSearchQuery'; }
    if(view === 'log') { dropdownId = 'logSearchDropdown'; inputId = 'logCustomerSearch'; }
    
    const dropdown = document.getElementById(dropdownId);
    const inputVal = document.getElementById(inputId).value.toLowerCase();
    
    let listItems = [];
    if(view === 'stock' || view === 'inv') {
        listItems = db.map(i => i.name);
    } else if(view === 'res') {
        let uniqueCustomers = [...new Set(reservations.map(r => r.customer).filter(Boolean))];
        let uniqueItems = [...new Set(reservations.map(r => r.name).filter(Boolean))];
        listItems = [...uniqueCustomers, ...uniqueItems];
    } else if(view === 'log') {
        listItems = [...new Set(logs.map(l => l.sender).filter(Boolean))];
    }

    let filtered = listItems.filter(name => name.toLowerCase().includes(inputVal));
    
    if(filtered.length > 0) {
        dropdown.innerHTML = filtered.map(name => `
            <div class="custom-dropdown-item" onclick="selectGlobalSearchItem('${view}', '${name}')">${name}</div>
        `).join('');
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
    
    if(!inputVal) {
        if(view === 'stock') selectedStockItem = null;
        if(view === 'inv') selectedInventoryItem = null;
    }
    renderData();
}

function selectGlobalSearchItem(view, value) {
    let dropdownId = view + 'Dropdown';
    let inputId = view + 'Search';
    
    if(view === 'res') { dropdownId = 'resSearchDropdown'; inputId = 'resSearchQuery'; }
    if(view === 'log') { dropdownId = 'logSearchDropdown'; inputId = 'logCustomerSearch'; }
    
    document.getElementById(inputId).value = value;
    document.getElementById(dropdownId).style.display = 'none';
    currentDropdownFocusIndex = -1;
    
    if(view === 'stock') selectedStockItem = value;
    if(view === 'inv') selectedInventoryItem = value;
    
    renderData();
}

function closeAllDropdowns() {
    document.querySelectorAll('.custom-dropdown-list').forEach(d => d.style.display = 'none');
    currentDropdownFocusIndex = -1;
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.searchable-select-container')) {
        closeAllDropdowns();
    }
});

function selectDropdownItem(type, value) {
    document.getElementById(type + 'NameSearch').value = value;
    document.getElementById(type + 'Name').value = value;
    document.getElementById(type + 'Dropdown').style.display = 'none';
    currentDropdownFocusIndex = -1;
    
    if(document.getElementById(type + 'Qty')) {
        document.getElementById(type + 'Qty').focus();
    }
}

// ==================== وظائف إعدادات المواد والمستودعات ====================
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

// تعديل اسم المستودع مع ترحيل البيانات السحابية القديمة تلقائياً
function editWHName(oldName) {
    const newName = prompt(`تعديل اسم المستودع الحالي [ ${oldName} ] إلى:`, oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    
    if (whs.includes(newName.trim())) {
        return alert("🚨 هذا الاسم موجود بالفعل لمستودع آخر.");
    }

    const index = whs.indexOf(oldName);
    if (index !== -1) {
        whs[index] = newName.trim();

        // ترحيل أرصدة المواد للمستودع الجديد
        db.forEach(item => {
            if (item.stocks && item.stocks[oldName] !== undefined) {
                item.stocks[newName.trim()] = item.stocks[oldName];
                delete item.stocks[oldName];
            }
            if (item.weights && item.weights[oldName] !== undefined) {
                item.weights[newName.trim()] = item.weights[oldName];
                delete item.weights[oldName];
            }
        });

        // ترحيل الهوية داخل أرشيف الحركات
        logs.forEach(l => {
            if (l.wh === oldName) l.wh = newName.trim();
        });

        // ترحيل المحجوزات
        reservations.forEach(r => {
            if (r.wh === oldName) r.wh = newName.trim();
        });

        save();
        alert("✅ تم تعديل اسم المستودع وتحديث كافة البيانات المرتبطة به سحابياً!");
    }
}

// حذف مستودع نهائياً مع تصفير أرصدته وتنبيه المدير
function removeWH(whName) {
    if (confirm(`⚠️ تحذير صارم:\nهل أنت متأكد من حذف مستودع [ ${whName} ] نهائياً؟\nسيتم حذف الأرصدة والأسطر التابعة له فقط ولن تتأثر أسماء المواد.`)) {
        const index = whs.indexOf(whName);
        if (index !== -1) {
            whs.splice(index, 1);

            db.forEach(item => {
                if (item.stocks) delete item.stocks[whName];
                if (item.weights) delete item.weights[whName];
            });

            save();
            alert(`✅ تم حذف مستودع [ ${whName} ] وتطهير الأرصدة السحابية التابعة له.`);
        }
    }
}

// مستمع لحدث الضغط على Enter داخل أزرار الإضافة نفسها لمنع التكرار العشوائي
document.addEventListener('DOMContentLoaded', function() {
    ['btn_SUBMIT_IN', 'btn_SUBMIT_OUT'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const type = btnId === 'btn_SUBMIT_IN' ? 'in' : 'out';
                    addToInvoice(type);
                }
            });
        }
    });
});

// ==================== دالة التعديل السريع المباشر للمادة من جدول المتاح للبيع ====================
function quickEditItem(itemName) {
    const item = db.find(i => i.name === itemName);
    if (!item) return;

    const selectedWHFilter = document.getElementById('invWHFilter') ? document.getElementById('invWHFilter').value : 'ALL';
    let targetWH = selectedWHFilter === 'ALL' ? (whs[0] || "المخزن الرئيسي") : selectedWHFilter;
    
    if (!item.stocks) item.stocks = {};
    if (!item.weights) item.weights = {};

    let currentQty = item.stocks[targetWH] || 0;
    let currentWeight = item.weights[targetWH] || 0;

    let newQtyInput = prompt(`تعديل رصيد [ ${itemName} ] في [ ${targetWH} ]:\nالكمية الحالية هي (${currentQty} قطعة).\nأدخل الكمية الجديدة المطلوبة:`, currentQty);
    if (newQtyInput === null) return; 
    
    let newWeightInput = prompt(`أدخل الوزن الإجمالي الجديد بالـ (كجم) لنفس الصنف:\nالوزن الحالي هو (${currentWeight} كجم):`, currentWeight);
    if (newWeightInput === null) return; 

    let newQty = parseInt(newQtyInput);
    let newWeight = parseFloat(newWeightInput);

    if (isNaN(newQty) || isNaN(newWeight)) {
        return alert("🚨 خطأ: يرجى إدخل أرقام صحيحة.");
    }

    item.stocks[targetWH] = newQty;
    item.weights[targetWH] = newWeight;

    logs.unshift({
        date: new Date().toLocaleDateString('ar-EG').split('-').reverse().join('/'),
        type: "تعديل رصيد",
        name: itemName,
        qty: newQty,
        wh: targetWH,
        weight: newWeight,
        sender: "المدير (تعديل مباشر)",
        notes: `تم تصحيح الرصيد يدوياً من المتاح للبيع`
    });

    save();
    alert("✅ تم التعديل والتحديث السحابي بنجاح!");
}

// ==================== نظام إدارة الفواتير والترحيل للمخازن ====================
function addToInvoice(type) {
    const name = document.getElementById(type+'Name').value;
    const qty = parseInt(document.getElementById(type+'Qty').value) || 0;
    const wh = document.getElementById(type+'WH').value;
    const weight = parseFloat(document.getElementById(type+'Weight').value) || 0;
    const sender = document.getElementById(type+'Sender').value.trim();
    const notes = document.getElementById(type+'Notes').value.trim();
    
    let rawDate = document.getElementById(type+'Date').value;
    if(!rawDate) rawDate = new Date().toISOString().split('T')[0];
    const formattedDate = rawDate.split('-').reverse().join('/');

    if(!name || qty <= 0) return alert("اختر مادة وكمية صحيحة");
    
    tempInvoice[type].push({ name, qty, wh, weight, sender, notes, date: formattedDate });
    ['NameSearch', 'Name', 'Qty', 'Weight', 'Notes'].forEach(f => document.getElementById(type+f).value = '');
    renderInvoice(type);
    
    const nextSearchInput = document.getElementById(type + 'NameSearch');
    if (nextSearchInput) nextSearchInput.focus();
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
    document.getElementById(type+'NameSearch').value = item.name;
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

// ==================== نظام التثبيت والتحكم في المحجوزات ====================
function addReservation() {
    const name = document.getElementById('resName').value;
    const qty = parseInt(document.getElementById('resQty').value) || 0;
    const customer = document.getElementById('resCustomer').value.trim();
    const notes = document.getElementById('resNotes').value.trim();
    const editIndex = parseInt(document.getElementById('editResIndex').value);
    
    const item = db.find(i => i.name === name);
    if(!item || qty <= 0) return alert("اختر مادة صحيحة");
    
    let targetWH = whs[0] || "المخزن الرئيسي";
    if (!item.stocks) item.stocks = {};

    if(editIndex > -1) {
        const oldRes = reservations[editIndex];
        const oldItem = db.find(i => i.name === oldRes.name);
        if(oldItem && oldItem.stocks) {
            let oldWH = oldRes.wh || whs[0] || "المخزن الرئيسي";
            oldItem.stocks[oldWH] = (oldItem.stocks[oldWH] || 0) + oldRes.qty;
        }
        
        let currentStock = item.stocks[targetWH] || 0;
        if (currentStock < qty) {
            if(oldItem && oldItem.stocks) {
                let oldWH = oldRes.wh || whs[0] || "المخزن الرئيسي";
                oldItem.stocks[oldWH] -= oldRes.qty;
            }
            return alert(`🚨 عذراً! الرصيد لا يكفي الحجز المحدث.`);
        }

        item.stocks[targetWH] -= qty;
        reservations[editIndex] = { name, qty, customer, notes, wh: targetWH, date: oldRes.date };
        
        document.getElementById('editResIndex').value = "-1";
        document.getElementById('btn_SUBMIT_RES').innerText = "🔒 تثبيت الحجز";
    } else {
        let currentStock = item.stocks[targetWH] || 0;
        if (currentStock < qty) return alert(`🚨 عذراً! الرصيد لا يكفي الحجز.`);
        
        item.stocks[targetWH] -= qty;
        const todayDate = new Date().toLocaleDateString('ar-EG');
        reservations.push({ name, qty, customer, notes, wh: targetWH, date: todayDate });
    }

    ['resNameSearch', 'resName', 'resQty', 'resCustomer', 'resNotes'].forEach(id => document.getElementById(id).value = '');
    save();
    alert("✅ تم الحفظ وتحديث الحجز بنجاح!");
    if(document.getElementById('resNameSearch')) document.getElementById('resNameSearch').focus();
}

function editReservation(idx) {
    const resQuery = document.getElementById('resSearchQuery').value.toLowerCase();
    let filteredRes = reservations;
    if(resQuery) {
        filteredRes = reservations.filter(r => 
            (r.customer && r.customer.toLowerCase().includes(resQuery)) || 
            (r.name && r.name.toLowerCase().includes(resQuery))
        );
    }
    const targetRes = filteredRes[idx];
    const actualIndex = reservations.indexOf(targetRes);

    if (actualIndex !== -1) {
        const res = reservations[actualIndex];
        document.getElementById('resNameSearch').value = res.name;
        document.getElementById('resName').value = res.name;
        document.getElementById('resQty').value = res.qty;
        document.getElementById('resCustomer').value = res.customer || '';
        document.getElementById('resNotes').value = res.notes || '';
        
        document.getElementById('editResIndex').value = actualIndex;
        document.getElementById('btn_SUBMIT_RES').innerText = "📝 حفظ التعديل";
        document.getElementById('resQty').focus();
    }
}

function removeReservation(idx) {
    if(confirm('هل تريد إلغاء الحجز وإعادة المواد للمستودع؟')) {
        const resQuery = document.getElementById('resSearchQuery').value.toLowerCase();
        let filteredRes = reservations;
        if(resQuery) {
            filteredRes = reservations.filter(r => 
                (r.customer && r.customer.toLowerCase().includes(resQuery)) || 
                (r.name && r.name.toLowerCase().includes(resQuery))
            );
        }
        const actualResItem = filteredRes[idx];
        const actualIndexInMain = reservations.indexOf(actualResItem);

        if(actualIndexInMain !== -1) {
            const res = reservations[actualIndexInMain];
            const item = db.find(i => i.name === res.name);
            if(item && item.stocks) {
                let targetWH = res.wh || whs[0] || "المخزن الرئيسي";
                if(!item.stocks[targetWH]) item.stocks[targetWH] = 0;
                item.stocks[targetWH] += res.qty; 
            }
            reservations.splice(actualIndexInMain, 1);
            save();
        }
    }
}

// ==================== نظام مسح وتصدير تقارير الأرشيف الجاهز والسلس للإكسل ====================
function deleteLogItem(idx) {
    if(confirm("هل أنت متأكد من مسح هذه الحركة نهائياً من الأرشيف?")) {
        const customerQuery = document.getElementById('logCustomerSearch').value.toLowerCase();
        let filteredLogs = logs;
        if(customerQuery) {
            filteredLogs = logs.filter(l => l.sender && l.sender.toLowerCase().includes(customerQuery));
        }
        const actualItem = filteredLogs[idx];
        const actualIndexInMainLogs = logs.indexOf(actualItem);
        
        if(actualIndexInMainLogs !== -1) {
            logs.splice(actualIndexInMainLogs, 1); 
            save();
            alert("تم مسح بند الحركة بنجاح!");
        }
    }
}

function exportInventoryToExcel() {
    const stockSearchQuery = document.getElementById('stockSearch') ? document.getElementById('stockSearch').value.toLowerCase() : '';
    const selectedWHFilter = document.getElementById('stockWHFilter') ? document.getElementById('stockWHFilter').value : 'ALL';
    
    let filteredStockDb = db.filter(i => !selectedStockItem ? i.name.toLowerCase().includes(stockSearchQuery) : i.name === selectedStockItem);

    if (filteredStockDb.length === 0) {
        alert("⚠️ لا توجد بيانات جرد لتصديرها.");
        return;
    }

    let csvContent = "\uFEFFالمادة;المستودع;الرصيد المتاح (قطع);الوزن الحالي (كجم)\n";

    filteredStockDb.forEach(i => {
        if (selectedWHFilter === 'ALL') {
            whs.forEach(w => {
                let q = i.stocks && i.stocks[w] ? i.stocks[w] : 0;
                let wt = i.weights && i.weights[w] ? i.weights[w] : 0;
                if (q !== 0 || wt !== 0) {
                    csvContent += `"${i.name}";"${w}";${q};${wt.toFixed(2)}\n`;
                }
            });
        } else {
            let q = i.stocks && i.stocks[selectedWHFilter] ? i.stocks[selectedWHFilter] : 0;
            let wt = i.weights && i.weights[selectedWHFilter] ? i.weights[selectedWHFilter] : 0;
            if (q !== 0 || wt !== 0) {
                csvContent += `"${i.name}";"${selectedWHFilter}";${q};${wt.toFixed(2)}\n`;
            }
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const today = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
    
    link.href = URL.createObjectURL(blob);
    link.download = `كشف_الجرد_المنظم_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function exportAvailableToExcel() {
    const q = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    const selectedWHFilter = document.getElementById('invWHFilter') ? document.getElementById('invWHFilter').value : 'ALL';
    let filteredInvDb = db.filter(i => !selectedInventoryItem ? i.name.toLowerCase().includes(q) : i.name === selectedInventoryItem);

    if (filteredInvDb.length === 0) {
        alert("⚠️ لا توجد بيانات متاحة للتصدير حالياً.");
        return;
    }

    let csvContent = "\uFEFFاسم المادة;إجمالي الداخل (قطع);إجمالي الخارج (قطع);الرصيد الكلي (قطع);الصافي للبيع (قطع)\n";

    filteredInvDb.forEach(i => {
        let totalQty = 0;
        if(selectedWHFilter === 'ALL') {
            totalQty = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
        } else {
            totalQty = i.stocks && i.stocks[selectedWHFilter] ? i.stocks[selectedWHFilter] : 0;
        }

        let itemRes = reservations.filter(r => r.name === i.name && (selectedWHFilter === 'ALL' || r.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);
        
        let totalInFromLogs = logs.filter(l => l.name === i.name && l.type === 'داخل' && (selectedWHFilter === 'ALL' || l.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);
        let totalOutFromLogs = logs.filter(l => l.name === i.name && l.type === 'خارج' && (selectedWHFilter === 'ALL' || l.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);

        let totalBalance = totalQty + itemRes; 
        let netAvailable = totalQty;           

        csvContent += `"${i.name}";${totalInFromLogs};${totalOutFromLogs};${totalBalance};${netAvailable}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const today = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
    
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_المتاح_للبيع_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function exportToExcel() {
    const customerQuery = document.getElementById('logCustomerSearch').value.toLowerCase();
    let logsToExport = logs;
    if(customerQuery) logsToExport = logs.filter(l => l.sender && l.sender.toLowerCase().includes(customerQuery));

    let csv = "\uFEFFالتاريخ;النوع;المادة;العدد;المستودع;الوزن;الجهة/الزبون;ملاحظات\n";
    logsToExport.forEach(l => {
        csv += `${l.date};${l.type};${l.name};${l.qty};${l.wh};${l.weight};${l.sender};${(l.notes||"")}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `أرشيف_الحركات.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ==================== عمليات بناء الجداول والعرض الفوري الفلاتر ====================
function renderData() {
    if((document.getElementById('inDate') && !document.getElementById('inDate').value) || (document.getElementById('outDate') && !document.getElementById('outDate').value)) {
        setDefaultDates();
    }
    const whOptions = whs.map(w => `<option value="${w}">${w}</option>`).join('');
    if(document.getElementById('inWH')) document.getElementById('inWH').innerHTML = whOptions;
    if(document.getElementById('outWH')) document.getElementById('outWH').innerHTML = whOptions;

    if(document.getElementById('manageBody')) {
        document.getElementById('manageBody').innerHTML = db.map((i, idx) => `
            <tr>
                <td style="font-weight:bold;">${i.name}</td>
                <td><span onclick="if(confirm('حذف الصنف نهائياً؟')){db.splice(${idx},1);save()}" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️ حذف</span></td>
            </tr>
        `).join('');
    }

    // بناء وإدارة جدول المستودعات داخل تبويب الإعدادات
    if(document.getElementById('manageWHBody')) {
        document.getElementById('manageWHBody').innerHTML = whs.map((w) => `
            <tr>
                <td style="font-weight:bold; color:var(--asfour-yellow);">📍 ${w}</td>
                <td>
                    <span onclick="editWHName('${w}')" style="cursor:pointer; color:var(--orange); font-weight:bold; margin-left:15px;">📝 تعديل الاسم</span>
                    <span onclick="removeWH('${w}')" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️ حذف المستودع</span>
                </td>
            </tr>
        `).join('');
    }

    const stockSearchQuery = document.getElementById('stockSearch') ? document.getElementById('stockSearch').value.toLowerCase() : '';
    const selectedWHFilter = document.getElementById('stockWHFilter') ? document.getElementById('stockWHFilter').value : 'ALL';
    
    let filteredStockDb = db.filter(i => !selectedStockItem ? i.name.toLowerCase().includes(stockSearchQuery) : i.name === selectedStockItem);

    if(document.getElementById('stockBody')) {
        document.getElementById('stockBody').innerHTML = filteredStockDb.map(i => {
            let totalPieces = 0;
            let itemTotalWeight = 0;
            let piecesDetail = '';
            let weightsDetail = '';

            if(selectedWHFilter === 'ALL') {
                totalPieces = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
                itemTotalWeight = Object.values(i.weights || {}).reduce((a, b) => a + b, 0);
                piecesDetail = Object.entries(i.stocks || {}).map(([n, v]) => v !== 0 ? `<div>📍 ${n}: <b>${v} ق</b></div>` : '').join('');
                weightsDetail = Object.entries(i.weights || {}).map(([n, w]) => w !== 0 ? `<div style="color:var(--asfour-yellow);">⚖️ ${n}: <b>${w.toFixed(1)} كج</b></div>` : '').join('');
            } else {
                totalPieces = i.stocks && i.stocks[selectedWHFilter] ? i.stocks[selectedWHFilter] : 0;
                itemTotalWeight = i.weights && i.weights[selectedWHFilter] ? i.weights[selectedWHFilter] : 0;
                if(totalPieces !== 0) piecesDetail = `<div>📍 ${selectedWHFilter}: <b>${totalPieces} ق</b></div>`;
                if(itemTotalWeight !== 0) weightsDetail = `<div style="color:var(--asfour-yellow);">⚖️ ${selectedWHFilter}: <b>${itemTotalWeight.toFixed(1)} كج</b></div>`;
            }
            
            return `<tr><td style="font-weight:bold; color:#3498db;">${i.name}</td><td>${piecesDetail || '-'}</td><td>${weightsDetail || '-'}</td><td><b>${totalPieces} ق</b><br><small style="color:var(--asfour-yellow);">${itemTotalWeight.toFixed(1)} كج</small></td></tr>`;
        }).join('');
    }

    const resQuery = document.getElementById('resSearchQuery') ? document.getElementById('resSearchQuery').value.toLowerCase() : '';
    let filteredRes = reservations.filter(r => !resQuery || (r.customer && r.customer.toLowerCase().includes(resQuery)) || (r.name && r.name.toLowerCase().includes(resQuery)));

    if(document.getElementById('resBody')) {
        document.getElementById('resBody').innerHTML = filteredRes.map((r, idx) => `
            <tr>
                <td><span style="font-weight:bold; color:var(--asfour-yellow);">${r.customer || 'بدون اسم'}</span><br><small style="color:var(--text-muted); font-size:10px;">📅 ${r.date || ''}</small></td>
                <td><span style="font-weight:600;">${r.name}</span>${r.notes ? `<br><small style="color:var(--orange); font-size:11px;">📝 ${r.notes}</small>` : ''}</td>
                <td style="font-weight:bold; text-align:center; color:lightgreen;">${r.qty} ق</td>
                <td>
                    <span onclick="editReservation(${idx})" style="cursor:pointer; color:var(--asfour-yellow); font-weight:bold; margin-left:12px;">📝 تعديل</span>
                    <span onclick="removeReservation(${idx})" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️ إلغاء</span>
                </td>
            </tr>
        `).join('');
    }
    
    const customerQuery = document.getElementById('logCustomerSearch') ? document.getElementById('logCustomerSearch').value.toLowerCase() : '';
    let filteredLogs = logs.filter(l => !customerQuery || (l.sender && l.sender.toLowerCase().includes(customerQuery)) || (l.name && l.name.toLowerCase().includes(customerQuery)));

    if(document.getElementById('logsBody')) {
        document.getElementById('logsBody').innerHTML = filteredLogs.map((l, idx) => `
            <tr><td>${l.date}</td><td style="color:${l.type==='داخل'?'lightgreen':(l.type==='خارج'?'coral':'#3498db')}">${l.type}</td><td>${l.name}</td><td>${l.qty}</td><td>${l.wh}</td><td>${l.weight.toFixed(1)}</td><td style="font-weight:bold; color:var(--asfour-yellow);">${l.sender || '-'}</td><td><span onclick="deleteLogItem(${idx})" style="cursor:pointer; color:var(--danger); font-weight:bold;">🗑️</span></td></tr>
        `).join('');
    }
        
    renderInventory();
}

function renderInventory() {
    const q = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    const selectedWHFilter = document.getElementById('invWHFilter') ? document.getElementById('invWHFilter').value : 'ALL';
    let filteredInvDb = db.filter(i => !selectedInventoryItem ? i.name.toLowerCase().includes(q) : i.name === selectedInventoryItem);

    let currentFilteredQty = 0, currentFilteredRes = 0, currentFilteredWeight = 0;

    if(document.getElementById('invBody')) {
        document.getElementById('invBody').innerHTML = filteredInvDb.map(i => {
            let totalQty = 0;
            let itemWeight = 0;

            if (selectedWHFilter === 'ALL') {
                totalQty = Object.values(i.stocks || {}).reduce((a, b) => a + b, 0);
                itemWeight = Object.values(i.weights || {}).reduce((a, b) => a + b, 0);
            } else {
                totalQty = i.stocks && i.stocks[selectedWHFilter] ? i.stocks[selectedWHFilter] : 0;
                itemWeight = i.weights && i.weights[selectedWHFilter] ? i.weights[selectedWHFilter] : 0;
            }

            // تصفية المحجوزات والحركات حسب المستودع المختار للوصول إلى دقة متناهية
            let itemRes = reservations.filter(r => r.name === i.name && (selectedWHFilter === 'ALL' || r.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);
            let totalInFromLogs = logs.filter(l => l.name === i.name && l.type === 'داخل' && (selectedWHFilter === 'ALL' || l.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);
            let totalOutFromLogs = logs.filter(l => l.name === i.name && l.type === 'خارج' && (selectedWHFilter === 'ALL' || l.wh === selectedWHFilter)).reduce((sum, curr) => sum + curr.qty, 0);

            currentFilteredQty += (totalQty + itemRes); 
            currentFilteredRes += itemRes; 
            currentFilteredWeight += itemWeight;

            return `
                <tr>
                    <td style="font-weight:bold; color:#3498db;">${i.name}</td>
                    <td style="color: lightgreen;">📥 ${totalInFromLogs} ق</td>
                    <td style="color: coral;">📤 ${totalOutFromLogs} ق</td>
                    <td>${totalQty + itemRes} ق</td>
                    <td style="font-weight:bold; color:lightgreen">${totalQty} ق</td>
                    <td>
                        <span onclick="quickEditItem('${i.name}')" style="cursor:pointer; color:var(--orange); font-weight:bold;">📝 تعديل</span>
                    </td>
                </tr>`;
        }).join('');
    }
    
    if(document.getElementById('grandTotalQty')) document.getElementById('grandTotalQty').innerText = currentFilteredQty + " قطعة";
    if(document.getElementById('grandTotalRes')) document.getElementById('grandTotalRes').innerText = currentFilteredRes + " قطعة";
    if(document.getElementById('grandTotalWeight')) document.getElementById('grandTotalWeight').innerText = currentFilteredWeight.toFixed(1) + " كجم";
}