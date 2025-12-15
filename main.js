// متغيرات التطبيق
let currentClients = JSON.parse(localStorage.getItem('ماريكتينج_ويف_حالي')) || [];
let summaryClients = JSON.parse(localStorage.getItem('ماريكتينج_ويف_ملخص')) || [];
let currentClientId = null;
let filteredClients = [...currentClients];

// عناصر DOM
const clientsContainer = document.getElementById('clients-container');
const totalAmountElement = document.getElementById('total-amount');
const clientsCountElement = document.getElementById('clients-count');
const pendingAmountElement = document.getElementById('pending-amount');
const addClientBtn = document.getElementById('add-client-btn');
const servicePriceInput = document.getElementById('service-price');
const paidAmountInput = document.getElementById('paid-amount');
const remainingAmountInput = document.getElementById('remaining-amount');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const summaryTableBody = document.getElementById('summary-table-body');
const exportWordBtn = document.getElementById('export-word');
const printSummaryBtn = document.getElementById('print-summary');
const transferToSummaryBtn = document.getElementById('transfer-to-summary');
const viewSummaryPageBtn = document.getElementById('view-summary-page');

// النوافذ المنبثقة
const paymentModal = document.getElementById('payment-modal');
const addModal = document.getElementById('add-modal');
const editModal = document.getElementById('edit-modal');
const statusModal = document.getElementById('status-modal');
const historyModal = document.getElementById('history-modal');

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderClients();
    updateSummaryTable();
    setupEventListeners();
    setupCalculations();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // إضافة عميل جديد
    addClientBtn.addEventListener('click', addNewClient);
    
    // نقل البيانات إلى الملخص
    transferToSummaryBtn.addEventListener('click', transferToSummary);
    viewSummaryPageBtn.addEventListener('click', viewSummaryPage);
    
    // البحث
    searchInput.addEventListener('input', filterClients);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // التصدير والطباعة
    exportWordBtn.addEventListener('click', exportToWord);
    printSummaryBtn.addEventListener('click', printSummary);
    
    // النوافذ المنبثقة
    document.getElementById('payment-cancel').addEventListener('click', () => paymentModal.style.display = 'none');
    document.getElementById('add-cancel').addEventListener('click', () => addModal.style.display = 'none');
    document.getElementById('edit-cancel').addEventListener('click', () => editModal.style.display = 'none');
    document.getElementById('status-cancel').addEventListener('click', () => statusModal.style.display = 'none');
    document.getElementById('history-close').addEventListener('click', () => historyModal.style.display = 'none');
    
    // تأكيد الإجراءات
    document.getElementById('payment-confirm').addEventListener('click', processPayment);
    document.getElementById('add-confirm').addEventListener('click', addToService);
    document.getElementById('edit-confirm').addEventListener('click', editServicePrice);
    document.getElementById('status-confirm').addEventListener('click', changeServiceStatus);
}

// إعداد الحسابات التلقائية
function setupCalculations() {
    servicePriceInput.addEventListener('input', calculateRemaining);
    paidAmountInput.addEventListener('input', calculateRemaining);
}

// حساب المبلغ المتبقي
function calculateRemaining() {
    const servicePrice = parseFloat(servicePriceInput.value) || 0;
    const paidAmount = parseFloat(paidAmountInput.value) || 0;
    const remaining = servicePrice - paidAmount;
    
    remainingAmountInput.value = remaining > 0 ? remaining : 0;
}

// إضافة عميل جديد
function addNewClient() {
    const nameInput = document.getElementById('client-name');
    const phoneInput = document.getElementById('client-phone');
    const priceInput = document.getElementById('service-price');
    const paidInput = document.getElementById('paid-amount');
    const serviceInput = document.getElementById('service-type');
    const statusInput = document.getElementById('service-status');
    const notesInput = document.getElementById('service-notes');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const servicePrice = parseFloat(priceInput.value) || 0;
    const paidAmount = parseFloat(paidInput.value) || 0;
    const serviceType = serviceInput.value;
    const serviceStatus = statusInput.value;
    const notes = notesInput.value.trim();
    const registrationDate = new Date().toLocaleDateString('ar-EG');
    const registrationTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    // التحقق من الحقول المطلوبة
    if (!name || servicePrice <= 0) {
        showNotification('يرجى إدخال اسم العميل وسعر الخدمة', 'error');
        return;
    }
    
    if (paidAmount > servicePrice) {
        showNotification('المبلغ المدفوع لا يمكن أن يكون أكبر من سعر الخدمة', 'error');
        return;
    }
    
    const remainingAmount = servicePrice - paidAmount;
    
    const newClient = {
        id: Date.now(),
        name,
        phone: phone || 'غير مسجل',
        servicePrice,
        paidAmount,
        remainingAmount,
        serviceType,
        serviceStatus,
        registrationDate,
        registrationTime,
        notes: notes || '',
        history: [{
            id: generateId(),
            type: 'new',
            amount: servicePrice,
            paidAmount: paidAmount,
            description: 'تسجيل عميل جديد - ' + serviceType,
            date: `${registrationDate} ${registrationTime}`,
            timestamp: new Date().getTime()
        }]
    };
    
    currentClients.push(newClient);
    filteredClients = [...currentClients];
    saveCurrentClients();
    updateStats();
    renderClients();
    updateSummaryTable();
    
    // إعادة تعيين الحقول
    nameInput.value = '';
    phoneInput.value = '';
    priceInput.value = '';
    paidInput.value = '';
    remainingAmountInput.value = '';
    serviceInput.value = '';
    statusInput.value = 'مكتملة';
    notesInput.value = '';
    
    // عرض رسالة نجاح
    showNotification(`تم إضافة العميل ${name} بنجاح!`, 'success');
}

// توليد معرف فريد
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// عرض العملاء
function renderClients() {
    if (filteredClients.length === 0) {
        clientsContainer.innerHTML = `
            <div class="no-clients">
                <i class="fas fa-users"></i>
                <p>${currentClients.length === 0 ? 'لا توجد عملاء مسجلين في النظام' : 'لا توجد نتائج مطابقة للبحث'}</p>
            </div>
        `;
        return;
    }
    
    // ترتيب العملاء من الأحدث إلى الأقدم
    const sortedClients = [...filteredClients].sort((a, b) => b.id - a.id);
    
    clientsContainer.innerHTML = sortedClients.map(client => `
        <div class="client-card">
            <h3><i class="fas fa-user"></i>${client.name}</h3>
            <p><i class="fas fa-phone"></i> ${client.phone}</p>
            <p><i class="fas fa-cogs"></i> ${client.serviceType}</p>
            <p><i class="fas fa-calendar"></i> تاريخ التسجيل: ${client.registrationDate}</p>
            <p><i class="fas fa-clock"></i> الوقت: ${client.registrationTime}</p>
            <p><i class="fas fa-clipboard-check"></i> حالة الخدمة: 
                <span class="${client.serviceStatus === 'مكتملة' ? 'status-completed' : client.serviceStatus === 'قيد التنفيذ' ? 'status-pending' : 'status-cancelled'}">
                    ${client.serviceStatus}
                </span>
            </p>
            ${client.notes ? `<p><i class="fas fa-sticky-note"></i> ${client.notes}</p>` : ''}
            
            <div class="amount-container">
                <div class="amount-item">
                    <div class="amount-label">سعر الخدمة</div>
                    <div class="amount-value total-amount">${formatCurrency(client.servicePrice)}</div>
                </div>
                <div class="amount-item">
                    <div class="amount-label">المبلغ المدفوع</div>
                    <div class="amount-value paid-amount">${formatCurrency(client.paidAmount)}</div>
                </div>
                <div class="amount-item">
                    <div class="amount-label">المبلغ المتبقي</div>
                    <div class="amount-value remaining-amount">${formatCurrency(client.remainingAmount)}</div>
                </div>
            </div>
            
            <div class="client-actions">
                <button class="action-btn btn-payment" onclick="openPaymentModal(${client.id})">
                    <i class="fas fa-money-bill-wave"></i> تسديد
                </button>
                <button class="action-btn btn-add" onclick="openAddModal(${client.id})">
                    <i class="fas fa-plus-circle"></i> إضافة
                </button>
                <button class="action-btn btn-edit" onclick="openEditModal(${client.id})">
                    <i class="fas fa-edit"></i> تعديل السعر
                </button>
                <button class="action-btn btn-status" onclick="openStatusModal(${client.id})">
                    <i class="fas fa-exchange-alt"></i> تغيير الحالة
                </button>
                <button class="action-btn btn-history" onclick="showHistory(${client.id})">
                    <i class="fas fa-history"></i> السجل
                </button>
                <button class="action-btn btn-delete" onclick="deleteClient(${client.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// تصفية العملاء حسب البحث
function filterClients() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        filteredClients = [...currentClients];
    } else {
        filteredClients = currentClients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.serviceType.toLowerCase().includes(searchTerm) ||
            client.phone.includes(searchTerm) ||
            client.notes.toLowerCase().includes(searchTerm)
        );
    }
    
    renderClients();
    updateSummaryTable();
}

// مسح البحث
function clearSearch() {
    searchInput.value = '';
    filteredClients = [...currentClients];
    renderClients();
    updateSummaryTable();
}

// تحديث جدول الملخص
function updateSummaryTable() {
    if (filteredClients.length === 0) {
        summaryTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    لا توجد بيانات لعرضها
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب العملاء من الأحدث إلى الأقدم
    const sortedClients = [...filteredClients].sort((a, b) => b.id - a.id);
    
    summaryTableBody.innerHTML = sortedClients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.serviceType}</td>
            <td class="amount-total">${formatCurrency(client.servicePrice)}</td>
            <td class="amount-paid">${formatCurrency(client.paidAmount)}</td>
            <td class="amount-remaining">${formatCurrency(client.remainingAmount)}</td>
            <td>${client.registrationDate}<br><small>${client.registrationTime}</small></td>
            <td>
                <span class="${client.serviceStatus === 'مكتملة' ? 'status-completed' : client.serviceStatus === 'قيد التنفيذ' ? 'status-pending' : 'status-cancelled'}">
                    ${client.serviceStatus}
                </span>
            </td>
            <td>${client.notes || '-'}</td>
        </tr>
    `).join('');
}

// نقل البيانات إلى الملخص
function transferToSummary() {
    if (currentClients.length === 0) {
        showNotification('لا توجد بيانات لنقلها إلى الملخص', 'error');
        return;
    }
    
    const recordDate = prompt('أدخل تاريخ التسجيل الشهري (مثال: ديسمبر 2024):', 
        new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }));
    
    if (!recordDate) return;
    
    // نسخ العملاء الحاليين إلى الملخص مع إضافة تاريخ التسجيل
    const clientsToAdd = currentClients.map(client => ({
        ...client,
        summaryId: generateId(),
        summaryDate: recordDate,
        transferDate: new Date().toLocaleString('ar-EG'),
        transferTimestamp: new Date().getTime(),
        phone: client.phone || 'غير مسجل'
    }));
    
    // إضافة إلى ملخص العملاء
    summaryClients.push(...clientsToAdd);
    localStorage.setItem('ماريكتينج_ويف_ملخص', JSON.stringify(summaryClients));
    
    // مسح العملاء الحاليين
    currentClients = [];
    filteredClients = [];
    saveCurrentClients();
    updateStats();
    renderClients();
    updateSummaryTable();
    
    // عرض رسالة نجاح
    showNotification(`تم نقل ${clientsToAdd.length} عميل إلى ملخص العملاء بتاريخ ${recordDate}!`, 'success');
}

// عرض صفحة الملخص
function viewSummaryPage() {
    const summaryWindow = window.open('', '_blank');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ملخص العملاء - ماريكتينج ويف</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background-color: #f5f7fa;
                    color: #2c3e50;
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 30px 0;
                    background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
                    color: white;
                    border-radius: 15px;
                }
                
                header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                }
                
                .controls-container {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .search-container {
                    display: flex;
                    flex: 1;
                    min-width: 300px;
                    gap: 10px;
                }
                
                .search-input {
                    flex: 1;
                    padding: 12px 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                }
                
                .search-select {
                    padding: 12px 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                    min-width: 180px;
                }
                
                .search-icon {
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #7f8c8d;
                }
                
                .summary-info {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                
                .info-card {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                
                .info-card h3 {
                    color: #3498db;
                    margin-bottom: 10px;
                }
                
                .info-card p {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .info-card.total-revenue {
                    background: #e8f6f3;
                }
                
                .info-card.total-paid {
                    background: #e8f8f1;
                }
                
                .info-card.total-pending {
                    background: #fdebd0;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }
                
                th {
                    background-color: #3498db;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                }
                
                td {
                    padding: 12px;
                    border: 1px solid #eee;
                    text-align: center;
                }
                
                tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                
                .status-completed {
                    color: #27ae60;
                    background-color: rgba(39, 174, 96, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .status-pending {
                    color: #f39c12;
                    background-color: rgba(243, 156, 18, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .status-cancelled {
                    color: #e74c3c;
                    background-color: rgba(231, 76, 60, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .summary-group {
                    margin-bottom: 40px;
                    border: 2px solid #3498db;
                    border-radius: 10px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .group-header {
                    background: #2c3e50;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .group-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .group-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .btn-delete {
                    background-color: #e74c3c;
                    color: white;
                }
                
                .btn-delete:hover {
                    background-color: #c0392b;
                }
                
                .btn-print {
                    background-color: #3498db;
                    color: white;
                }
                
                .btn-print:hover {
                    background-color: #2980b9;
                }
                
                .btn-export {
                    background-color: #2ecc71;
                    color: white;
                }
                
                .btn-export:hover {
                    background-color: #27ae60;
                }
                
                .monthly-totals {
                    background: #ecf0f1;
                    padding: 15px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    border-bottom: 1px solid #ddd;
                }
                
                .monthly-total-item {
                    text-align: center;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                
                .monthly-total-label {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                    margin-bottom: 5px;
                }
                
                .monthly-total-value {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .monthly-total-value.revenue {
                    color: #3498db;
                }
                
                .monthly-total-value.paid {
                    color: #27ae60;
                }
                
                .monthly-total-value.pending {
                    color: #e74c3c;
                }
                
                .overall-totals {
                    background: #2c3e50;
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 30px 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                
                .overall-total-item {
                    text-align: center;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                }
                
                .overall-total-label {
                    font-size: 1rem;
                    margin-bottom: 10px;
                    opacity: 0.9;
                }
                
                .overall-total-value {
                    font-size: 1.8rem;
                    font-weight: bold;
                }
                
                @media print {
                    .no-print { display: none; }
                    button { display: none; }
                    .controls-container { display: none; }
                }
                
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .notification.success {
                    background-color: #27ae60;
                }
                
                .notification.error {
                    background-color: #e74c3c;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #7f8c8d;
                }
                
                .empty-state i {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    color: #ddd;
                }
                
                .hidden {
                    display: none !important;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1><i class="fas fa-chart-line"></i> ملخص العملاء - ماريكتينج ويف</h1>
                    <p>السجلات المحفوظة وتقارير المبيعات</p>
                </header>
                
                <div class="controls-container no-print">
                    <div class="search-container">
                        <input type="text" id="summary-search" class="search-input" placeholder="ابحث عن عميل أو خدمة...">
                        <select id="month-filter" class="search-select">
                            <option value="">جميع الأشهر</option>
    `;
    
    // إنشاء قائمة بالأشهر الفريدة
    const allSummaryClients = JSON.parse(localStorage.getItem('ماريكتينج_ويف_ملخص')) || [];
    const uniqueMonths = [...new Set(allSummaryClients.map(client => client.summaryDate))];
    
    uniqueMonths.forEach(month => {
        htmlContent += `<option value="${month}">${month}</option>`;
    });
    
    htmlContent += `
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.print()" class="btn btn-print">
                            <i class="fas fa-print"></i> طباعة التقرير
                        </button>
                        <button onclick="window.close()" class="btn btn-delete">
                            <i class="fas fa-times"></i> إغلاق
                        </button>
                    </div>
                </div>
    `;
    
    if (allSummaryClients.length === 0) {
        htmlContent += `
            <div class="empty-state">
                <i class="fas fa-archive"></i>
                <h2>لا توجد سجلات محفوظة</h2>
                <p>قم بنقل البيانات من الصفحة الرئيسية لبدأ حفظ السجلات</p>
            </div>
        `;
    } else {
        // إحصائيات عامة
        const totalClients = allSummaryClients.length;
        const totalRevenue = allSummaryClients.reduce((sum, client) => sum + client.servicePrice, 0);
        const totalPaid = allSummaryClients.reduce((sum, client) => sum + client.paidAmount, 0);
        const totalPending = allSummaryClients.reduce((sum, client) => sum + client.remainingAmount, 0);
        
        htmlContent += `
            <div class="summary-info">
                <div class="info-card">
                    <h3><i class="fas fa-users"></i> إجمالي العملاء</h3>
                    <p>${totalClients}</p>
                </div>
                <div class="info-card total-revenue">
                    <h3><i class="fas fa-money-bill-wave"></i> إجمالي الإيرادات</h3>
                    <p>${formatCurrency(totalRevenue)}</p>
                </div>
                <div class="info-card total-paid">
                    <h3><i class="fas fa-check-circle"></i> إجمالي المدفوع</h3>
                    <p>${formatCurrency(totalPaid)}</p>
                </div>
                <div class="info-card total-pending">
                    <h3><i class="fas fa-clock"></i> إجمالي المستحقات</h3>
                    <p>${formatCurrency(totalPending)}</p>
                </div>
            </div>
            
            <div class="overall-totals">
                <div class="overall-total-item">
                    <div class="overall-total-label">صافي الربح المحقق</div>
                    <div class="overall-total-value">${formatCurrency(totalPaid)}</div>
                </div>
                <div class="overall-total-item">
                    <div class="overall-total-label">متوسط قيمة العميل</div>
                    <div class="overall-total-value">${formatCurrency(totalRevenue / totalClients)}</div>
                </div>
                <div class="overall-total-item">
                    <div class="overall-total-label">نسبة التحصيل</div>
                    <div class="overall-total-value">${((totalPaid / totalRevenue) * 100).toFixed(1)}%</div>
                </div>
            </div>
        `;
        
        // تجميع العملاء حسب تاريخ التسجيل وترتيبهم من الأحدث
        const groupedClients = {};
        allSummaryClients.forEach(client => {
            if (!groupedClients[client.summaryDate]) {
                groupedClients[client.summaryDate] = [];
            }
            groupedClients[client.summaryDate].push(client);
        });
        
        // الحصول على المفاتيح وترتيبها حسب الأحدث
        const sortedDates = Object.keys(groupedClients).sort((a, b) => {
            const dateA = new Date(groupedClients[a][0].transferTimestamp);
            const dateB = new Date(groupedClients[b][0].transferTimestamp);
            return dateB - dateA;
        });
        
        // عرض كل مجموعة مرتبة
        sortedDates.forEach(date => {
            const clients = groupedClients[date];
            let groupTotal = 0;
            let groupPaid = 0;
            let groupRemaining = 0;
            let groupClientsCount = clients.length;
            
            clients.forEach(client => {
                groupTotal += client.servicePrice;
                groupPaid += client.paidAmount;
                groupRemaining += client.remainingAmount;
            });
            
            htmlContent += `
                <div class="summary-group" data-month="${date}">
                    <div class="group-header">
                        <h2><i class="fas fa-calendar-alt"></i> سجل ${date}</h2>
                        <div class="group-actions no-print">
                            <button onclick="deleteMonth('${date}')" class="btn btn-delete">
                                <i class="fas fa-trash"></i> حذف الشهر
                            </button>
                            <button onclick="printMonth('${date}')" class="btn btn-print">
                                <i class="fas fa-print"></i> طباعة الشهر
                            </button>
                            <button onclick="exportMonth('${date}')" class="btn btn-export">
                                <i class="fas fa-file-export"></i> تصدير الشهر
                            </button>
                        </div>
                    </div>
                    
                    <div class="monthly-totals">
                        <div class="monthly-total-item">
                            <div class="monthly-total-label">عدد العملاء</div>
                            <div class="monthly-total-value">${groupClientsCount}</div>
                        </div>
                        <div class="monthly-total-item">
                            <div class="monthly-total-label">إجمالي الإيرادات</div>
                            <div class="monthly-total-value revenue">${formatCurrency(groupTotal)}</div>
                        </div>
                        <div class="monthly-total-item">
                            <div class="monthly-total-label">إجمالي المدفوع</div>
                            <div class="monthly-total-value paid">${formatCurrency(groupPaid)}</div>
                        </div>
                        <div class="monthly-total-item">
                            <div class="monthly-total-label">إجمالي المستحقات</div>
                            <div class="monthly-total-value pending">${formatCurrency(groupRemaining)}</div>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>اسم العميل</th>
                                    <th>رقم الهاتف</th>
                                    <th>نوع الخدمة</th>
                                    <th>سعر الخدمة</th>
                                    <th>المدفوع</th>
                                    <th>المتبقي</th>
                                    <th>تاريخ التسجيل</th>
                                    <th>حالة الخدمة</th>
                                    <th>ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            clients.forEach(client => {
                htmlContent += `
                    <tr>
                        <td>${client.name}</td>
                        <td>${client.phone}</td>
                        <td>${client.serviceType}</td>
                        <td>${formatCurrency(client.servicePrice)}</td>
                        <td>${formatCurrency(client.paidAmount)}</td>
                        <td>${formatCurrency(client.remainingAmount)}</td>
                        <td>${client.registrationDate}<br><small>${client.registrationTime}</small></td>
                        <td>
                            <span class="${client.serviceStatus === 'مكتملة' ? 'status-completed' : client.serviceStatus === 'قيد التنفيذ' ? 'status-pending' : 'status-cancelled'}">
                                ${client.serviceStatus}
                            </span>
                        </td>
                        <td>${client.notes || '-'}</td>
                    </tr>
                `;
            });
            
            htmlContent += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
    }
    
    htmlContent += `
            </div>
            
            <script>
                let allClientsData = ${JSON.stringify(allSummaryClients)};
                
                function formatCurrency(amount) {
                    return amount.toLocaleString('ar-EG') + ' ج.م';
                }
                
                // البحث المتقدم في الصفحة
                const searchInput = document.getElementById('summary-search');
                const monthFilter = document.getElementById('month-filter');
                
                function performSearch() {
                    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
                    const selectedMonth = monthFilter ? monthFilter.value : '';
                    const groups = document.querySelectorAll('.summary-group');
                    
                    let visibleGroups = 0;
                    
                    groups.forEach(group => {
                        const month = group.getAttribute('data-month');
                        const rows = group.querySelectorAll('tbody tr');
                        let hasMatch = false;
                        
                        // فلترة حسب الشهر
                        if (selectedMonth && month !== selectedMonth) {
                            group.classList.add('hidden');
                            return;
                        }
                        
                        rows.forEach(row => {
                            const text = row.textContent.toLowerCase();
                            if (searchTerm === '' || text.includes(searchTerm)) {
                                row.style.display = '';
                                hasMatch = true;
                            } else {
                                row.style.display = 'none';
                            }
                        });
                        
                        // إظهار أو إخفاء المجموعة بناءً على وجود نتائج
                        if ((searchTerm === '' || hasMatch) && (!selectedMonth || month === selectedMonth)) {
                            group.classList.remove('hidden');
                            visibleGroups++;
                        } else {
                            group.classList.add('hidden');
                        }
                    });
                    
                    // تحديث الإحصائيات بناءً على المجموعات المرئية
                    updateFilteredStats();
                }
                
                function updateFilteredStats() {
                    const visibleGroups = document.querySelectorAll('.summary-group:not(.hidden)');
                    let totalClients = 0;
                    let totalRevenue = 0;
                    let totalPaid = 0;
                    let totalPending = 0;
                    
                    visibleGroups.forEach(group => {
                        const monthTotals = group.querySelector('.monthly-totals');
                        if (monthTotals) {
                            const totals = monthTotals.querySelectorAll('.monthly-total-value');
                            if (totals.length >= 4) {
                                totalClients += parseInt(totals[0].textContent) || 0;
                                totalRevenue += parseFloat(totals[1].textContent.replace(/[^0-9.]/g, '')) || 0;
                                totalPaid += parseFloat(totals[2].textContent.replace(/[^0-9.]/g, '')) || 0;
                                totalPending += parseFloat(totals[3].textContent.replace(/[^0-9.]/g, '')) || 0;
                            }
                        }
                    });
                    
                    // تحديث الإحصائيات في الـ DOM إذا كانت موجودة
                    const statsContainer = document.querySelector('.summary-info');
                    if (statsContainer) {
                        const statsCards = statsContainer.querySelectorAll('.info-card p');
                        if (statsCards.length >= 4) {
                            statsCards[0].textContent = totalClients;
                            statsCards[1].textContent = formatCurrency(totalRevenue);
                            statsCards[2].textContent = formatCurrency(totalPaid);
                            statsCards[3].textContent = formatCurrency(totalPending);
                        }
                    }
                }
                
                // إضافة مستمعي الأحداث للبحث
                if (searchInput) {
                    searchInput.addEventListener('input', performSearch);
                }
                
                if (monthFilter) {
                    monthFilter.addEventListener('change', performSearch);
                }
                
                // حذف شهر بدون إعادة تحميل
                function deleteMonth(month) {
                    if (confirm('هل أنت متأكد من حذف جميع سجلات شهر ' + month + '؟')) {
                        // فلترة السجلات لإزالة الشهر المحدد
                        const updatedClients = allClientsData.filter(client => client.summaryDate !== month);
                        
                        // تحديث localStorage
                        localStorage.setItem('ماريكتينج_ويف_ملخص', JSON.stringify(updatedClients));
                        
                        // تحديث البيانات المحلية
                        allClientsData = updatedClients;
                        
                        // إزالة المجموعة من الصفحة
                        const group = document.querySelector('.summary-group[data-month="' + month + '"]');
                        if (group) {
                            group.remove();
                            showNotification('تم حذف شهر ' + month + ' بنجاح!', 'success');
                        }
                        
                        // تحديث قائمة الأشهر في الفلتر
                        updateMonthFilter();
                        
                        // إذا لم تعد هناك مجموعات، عرض رسالة فارغة
                        const remainingGroups = document.querySelectorAll('.summary-group');
                        if (remainingGroups.length === 0) {
                            document.querySelector('.container').innerHTML = \`
                                <header>
                                    <h1><i class="fas fa-chart-line"></i> ملخص العملاء - ماريكتينج ويف</h1>
                                    <p>السجلات المحفوظة وتقارير المبيعات</p>
                                </header>
                                <div class="empty-state">
                                    <i class="fas fa-archive"></i>
                                    <h2>لا توجد سجلات محفوظة</h2>
                                    <p>قم بنقل البيانات من الصفحة الرئيسية لبدأ حفظ السجلات</p>
                                </div>
                            \`;
                        }
                        
                        // تحديث الإحصائيات العامة
                        updateOverallStats();
                    }
                }
                
                function updateMonthFilter() {
                    const months = [...new Set(allClientsData.map(client => client.summaryDate))];
                    const monthFilter = document.getElementById('month-filter');
                    
                    if (monthFilter) {
                        // حفظ القيمة الحالية
                        const currentValue = monthFilter.value;
                        
                        // تحديث الخيارات
                        monthFilter.innerHTML = '<option value="">جميع الأشهر</option>';
                        months.forEach(month => {
                            const option = document.createElement('option');
                            option.value = month;
                            option.textContent = month;
                            monthFilter.appendChild(option);
                        });
                        
                        // استعادة القيمة إذا كانت لا تزال موجودة
                        if (months.includes(currentValue)) {
                            monthFilter.value = currentValue;
                        }
                    }
                }
                
                function updateOverallStats() {
                    const totalClients = allClientsData.length;
                    const totalRevenue = allClientsData.reduce((sum, client) => sum + client.servicePrice, 0);
                    const totalPaid = allClientsData.reduce((sum, client) => sum + client.paidAmount, 0);
                    const totalPending = allClientsData.reduce((sum, client) => sum + client.remainingAmount, 0);
                    
                    // تحديث الإحصائيات في الـ DOM
                    const statsContainer = document.querySelector('.summary-info');
                    if (statsContainer) {
                        const statsCards = statsContainer.querySelectorAll('.info-card p');
                        if (statsCards.length >= 4) {
                            statsCards[0].textContent = totalClients;
                            statsCards[1].textContent = formatCurrency(totalRevenue);
                            statsCards[2].textContent = formatCurrency(totalPaid);
                            statsCards[3].textContent = formatCurrency(totalPending);
                        }
                    }
                    
                    // تحديث الإحصائيات الكلية
                    const overallStats = document.querySelector('.overall-totals');
                    if (overallStats) {
                        const overallItems = overallStats.querySelectorAll('.overall-total-value');
                        if (overallItems.length >= 3) {
                            overallItems[0].textContent = formatCurrency(totalPaid);
                            overallItems[1].textContent = formatCurrency(totalRevenue / totalClients || 0);
                            overallItems[2].textContent = totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) + '%' : '0%';
                        }
                    }
                }
                
                // طباعة شهر معين
                function printMonth(month) {
                    const group = document.querySelector('.summary-group[data-month="' + month + '"]');
                    if (group) {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write('<html dir="rtl" lang="ar"><head><title>تقرير ' + month + '</title>');
                        printWindow.document.write('<style>body { font-family: Arial; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write('<h1>تقرير ' + month + ' - ماريكتينج ويف</h1>');
                        printWindow.document.write(group.innerHTML);
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.print();
                    }
                }
                
                // تصدير شهر معين إلى Word
                function exportMonth(month) {
                    const monthClients = allClientsData.filter(client => client.summaryDate === month);
                    
                    let htmlContent = \`
                        <!DOCTYPE html>
                        <html dir="rtl" lang="ar">
                        <head>
                            <meta charset="UTF-8">
                            <title>تقرير \${month} - ماريكتينج ويف</title>
                            <style>
                                body { font-family: Arial; margin: 40px; }
                                h1 { color: #2c3e50; text-align: center; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th { background-color: #3498db; color: white; padding: 12px; text-align: center; }
                                td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                            </style>
                        </head>
                        <body>
                            <h1>تقرير \${month} - ماريكتينج ويف</h1>
                            <table>
                                <thead>
                                    <tr>
                                        <th>اسم العميل</th>
                                        <th>رقم الهاتف</th>
                                        <th>نوع الخدمة</th>
                                        <th>سعر الخدمة</th>
                                        <th>المدفوع</th>
                                        <th>المتبقي</th>
                                        <th>حالة الخدمة</th>
                                    </tr>
                                </thead>
                                <tbody>
                    \`;
                    
                    monthClients.forEach(client => {
                        htmlContent += \`
                            <tr>
                                <td>\${client.name}</td>
                                <td>\${client.phone}</td>
                                <td>\${client.serviceType}</td>
                                <td>\${formatCurrency(client.servicePrice)}</td>
                                <td>\${formatCurrency(client.paidAmount)}</td>
                                <td>\${formatCurrency(client.remainingAmount)}</td>
                                <td>\${client.serviceStatus}</td>
                            </tr>
                        \`;
                    });
                    
                    htmlContent += \`
                                </tbody>
                            </table>
                        </body>
                        </html>
                    \`;
                    
                    const blob = new Blob([htmlContent], { type: 'application/msword' });
                    const filename = \`تقرير_\${month}_ماريكتينج_ويف.doc\`;
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                
                // إظهار إشعار
                function showNotification(message, type) {
                    const notification = document.createElement('div');
                    notification.className = \`notification \${type}\`;
                    notification.innerHTML = \`
                        <i class="fas \${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                        <span>\${message}</span>
                    \`;
                    
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.style.animation = 'slideIn 0.3s ease reverse';
                        setTimeout(() => {
                            document.body.removeChild(notification);
                        }, 300);
                    }, 3000);
                }
            </script>
        </body>
        </html>
    `;
    
    summaryWindow.document.write(htmlContent);
    summaryWindow.document.close();
}

// فتح نوافذ التعديل
function openPaymentModal(id) {
    currentClientId = id;
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-description').value = '';
    paymentModal.style.display = 'flex';
}

function openAddModal(id) {
    currentClientId = id;
    document.getElementById('add-amount').value = '';
    document.getElementById('add-description').value = '';
    addModal.style.display = 'flex';
}

function openEditModal(id) {
    currentClientId = id;
    const client = currentClients.find(c => c.id === id);
    document.getElementById('edit-amount').value = client.servicePrice;
    editModal.style.display = 'flex';
}

function openStatusModal(id) {
    currentClientId = id;
    const client = currentClients.find(c => c.id === id);
    document.getElementById('new-status').value = client.serviceStatus;
    statusModal.style.display = 'flex';
}

// معالجة التسديد
function processPayment() {
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const description = document.getElementById('payment-description').value.trim();
    
    if (!amount || amount <= 0) {
        showNotification('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    const clientIndex = currentClients.findIndex(c => c.id === currentClientId);
    if (currentClients[clientIndex].remainingAmount < amount) {
        showNotification('المبلغ المطلوب تسديده أكبر من قيمة المستحقات المتبقية', 'error');
        return;
    }
    
    currentClients[clientIndex].paidAmount += amount;
    currentClients[clientIndex].remainingAmount -= amount;
    
    currentClients[clientIndex].history.push({
        id: generateId(),
        type: 'payment',
        amount: amount,
        description: description || 'تسديد دفعة على الخدمة',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: new Date().getTime()
    });
    
    saveCurrentClients();
    updateStats();
    renderClients();
    updateSummaryTable();
    paymentModal.style.display = 'none';
    
    showNotification(`تم تسديد ${formatCurrency(amount)} بنجاح!`, 'success');
}

// إضافة إلى الخدمة
function addToService() {
    const amount = parseFloat(document.getElementById('add-amount').value);
    const description = document.getElementById('add-description').value.trim();
    
    if (!amount || amount <= 0) {
        showNotification('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    const clientIndex = currentClients.findIndex(c => c.id === currentClientId);
    
    currentClients[clientIndex].servicePrice += amount;
    currentClients[clientIndex].remainingAmount += amount;
    
    currentClients[clientIndex].history.push({
        id: generateId(),
        type: 'add',
        amount: amount,
        description: description || 'إضافة إلى سعر الخدمة',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: new Date().getTime()
    });
    
    saveCurrentClients();
    updateStats();
    renderClients();
    updateSummaryTable();
    addModal.style.display = 'none';
    
    showNotification(`تم إضافة ${formatCurrency(amount)} إلى الخدمة!`, 'success');
}

// تعديل سعر الخدمة
function editServicePrice() {
    const newPrice = parseFloat(document.getElementById('edit-amount').value);
    if (!newPrice || newPrice <= 0) {
        showNotification('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    const clientIndex = currentClients.findIndex(c => c.id === currentClientId);
    const oldPrice = currentClients[clientIndex].servicePrice;
    
    currentClients[clientIndex].servicePrice = newPrice;
    currentClients[clientIndex].remainingAmount = newPrice - currentClients[clientIndex].paidAmount;
    
    if (currentClients[clientIndex].remainingAmount < 0) {
        currentClients[clientIndex].remainingAmount = 0;
    }
    
    currentClients[clientIndex].history.push({
        id: generateId(),
        type: 'edit',
        oldAmount: oldPrice,
        newAmount: newPrice,
        description: 'تعديل سعر الخدمة',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: new Date().getTime()
    });
    
    saveCurrentClients();
    updateStats();
    renderClients();
    updateSummaryTable();
    editModal.style.display = 'none';
    
    showNotification(`تم تعديل سعر الخدمة إلى ${formatCurrency(newPrice)}!`, 'success');
}

// تغيير حالة الخدمة
function changeServiceStatus() {
    const newStatus = document.getElementById('new-status').value;
    const clientIndex = currentClients.findIndex(c => c.id === currentClientId);
    const oldStatus = currentClients[clientIndex].serviceStatus;
    
    currentClients[clientIndex].serviceStatus = newStatus;
    
    currentClients[clientIndex].history.push({
        id: generateId(),
        type: 'status_change',
        oldStatus: oldStatus,
        newStatus: newStatus,
        description: 'تغيير حالة الخدمة',
        date: new Date().toLocaleString('ar-EG'),
        timestamp: new Date().getTime()
    });
    
    saveCurrentClients();
    renderClients();
    updateSummaryTable();
    statusModal.style.display = 'none';
    
    showNotification(`تم تغيير حالة الخدمة إلى ${newStatus}!`, 'success');
}

// عرض السجل
function showHistory(id) {
    const client = currentClients.find(c => c.id === id);
    const historyList = document.getElementById('history-list');
    
    // ترتيب السجل من الأحدث إلى الأقدم
    const sortedHistory = [...client.history].sort((a, b) => b.timestamp - a.timestamp);
    
    historyList.innerHTML = sortedHistory.map(record => {
        let recordHtml = '';
        
        if (record.type === 'new') {
            recordHtml = `
                <div class="history-item">
                    <div class="history-details">
                        <div class="history-type"><i class="fas fa-user-plus"></i> تسجيل عميل جديد</div>
                        ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                        <div class="history-date">${record.date}</div>
                    </div>
                    <div class="history-actions">
                        <span class="history-amount">${record.amount} ج.م</span>
                    </div>
                </div>
            `;
        } else if (record.type === 'payment') {
            recordHtml = `
                <div class="history-item">
                    <div class="history-details">
                        <div class="history-type"><i class="fas fa-money-bill-wave"></i> تسديد دفعة</div>
                        ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                        <div class="history-date">${record.date}</div>
                    </div>
                    <div class="history-actions">
                        <span class="history-amount deducted">-${record.amount} ج.م</span>
                    </div>
                </div>
            `;
        } else if (record.type === 'add') {
            recordHtml = `
                <div class="history-item">
                    <div class="history-details">
                        <div class="history-type"><i class="fas fa-plus-circle"></i> إضافة إلى الخدمة</div>
                        ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                        <div class="history-date">${record.date}</div>
                    </div>
                    <div class="history-actions">
                        <span class="history-amount added">+${record.amount} ج.م</span>
                    </div>
                </div>
            `;
        } else if (record.type === 'edit') {
            recordHtml = `
                <div class="history-item">
                    <div class="history-details">
                        <div class="history-type"><i class="fas fa-edit"></i> تعديل السعر</div>
                        ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                        <div class="history-date">${record.date}</div>
                    </div>
                    <div class="history-actions">
                        <span class="history-amount edited">${record.oldAmount} → ${record.newAmount} ج.م</span>
                    </div>
                </div>
            `;
        } else if (record.type === 'status_change') {
            recordHtml = `
                <div class="history-item">
                    <div class="history-details">
                        <div class="history-type"><i class="fas fa-exchange-alt"></i> تغيير الحالة</div>
                        ${record.description ? `<div class="history-description">${record.description}</div>` : ''}
                        <div class="history-date">${record.date}</div>
                    </div>
                    <div class="history-actions">
                        <span class="history-amount">${record.oldStatus} → ${record.newStatus}</span>
                    </div>
                </div>
            `;
        }
        
        return recordHtml;
    }).join('');
    
    historyModal.style.display = 'flex';
}

// حذف العميل
function deleteClient(id) {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        currentClients = currentClients.filter(c => c.id !== id);
        filteredClients = [...currentClients];
        saveCurrentClients();
        updateStats();
        renderClients();
        updateSummaryTable();
        
        showNotification('تم حذف العميل بنجاح!', 'success');
    }
}

// تحديث الإحصائيات
function updateStats() {
    const totalRevenue = currentClients.reduce((sum, client) => sum + client.servicePrice, 0);
    const totalPaid = currentClients.reduce((sum, client) => sum + client.paidAmount, 0);
    const totalPending = currentClients.reduce((sum, client) => sum + client.remainingAmount, 0);
    const clientsCount = currentClients.length;
    
    totalAmountElement.textContent = `${formatCurrency(totalRevenue)}`;
    clientsCountElement.textContent = clientsCount;
    pendingAmountElement.textContent = `${formatCurrency(totalPending)}`;
    
    // إضافة فئة للأرقام الكبيرة
    updateStatsColors(totalRevenue, totalPaid, totalPending);
}

// تلوين الإحصائيات حسب القيمة
function updateStatsColors(revenue, paid, pending) {
    const pendingPercentage = revenue > 0 ? (pending / revenue) * 100 : 0;
    
    if (pendingPercentage > 50) {
        pendingAmountElement.style.color = '#e74c3c';
    } else if (pendingPercentage > 25) {
        pendingAmountElement.style.color = '#f39c12';
    } else {
        pendingAmountElement.style.color = '#27ae60';
    }
}

// حفظ البيانات الحالية في localStorage
function saveCurrentClients() {
    localStorage.setItem('ماريكتينج_ويف_حالي', JSON.stringify(currentClients));
}

// وظائف مساعدة
function formatCurrency(amount) {
    return amount.toLocaleString('ar-EG') + ' ج.م';
}

// إظهار إشعار
function showNotification(message, type) {
    // إزالة أي إشعارات موجودة مسبقاً
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
    `;
    
    // إضافة أنيميشن
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 300);
    }, 3000);
}

// تصدير إلى Word
function exportToWord() {
    if (currentClients.length === 0) {
        showNotification('لا توجد بيانات لتصديرها', 'error');
        return;
    }
    
    let htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>ملخص العملاء - ماريكتينج ويف</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #3498db; color: white; padding: 12px; text-align: center; }
                td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .total-row { font-weight: bold; background-color: #ecf0f1; }
                .footer { margin-top: 40px; text-align: left; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <h1>ملخص العملاء - ماريكتينج ويف</h1>
            <h2>تقرير بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>اسم العميل</th>
                        <th>رقم الهاتف</th>
                        <th>نوع الخدمة</th>
                        <th>سعر الخدمة</th>
                        <th>المدفوع</th>
                        <th>المتبقي</th>
                        <th>تاريخ التسجيل</th>
                        <th>حالة الخدمة</th>
                        <th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredClients.forEach(client => {
        htmlContent += `
            <tr>
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.serviceType}</td>
                <td>${formatCurrency(client.servicePrice)}</td>
                <td>${formatCurrency(client.paidAmount)}</td>
                <td>${formatCurrency(client.remainingAmount)}</td>
                <td>${client.registrationDate}<br><small>${client.registrationTime}</small></td>
                <td>${client.serviceStatus}</td>
                <td>${client.notes || '-'}</td>
            </tr>
        `;
    });
    
    const totalCourseFees = filteredClients.reduce((sum, client) => sum + client.servicePrice, 0);
    const totalPaidAmount = filteredClients.reduce((sum, client) => sum + client.paidAmount, 0);
    const totalRemainingAmount = filteredClients.reduce((sum, client) => sum + client.remainingAmount, 0);
    
    htmlContent += `
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3">الإجمالي</td>
                        <td>${formatCurrency(totalCourseFees)}</td>
                        <td>${formatCurrency(totalPaidAmount)}</td>
                        <td>${formatCurrency(totalRemainingAmount)}</td>
                        <td colspan="4"></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="footer">
                <p>عدد العملاء: ${filteredClients.length}</p>
                <p>تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}</p>
                <p>نظام إدارة الخدمات - ماريكتينج ويف</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const filename = `ملخص_العملاء_${new Date().toISOString().split('T')[0]}.doc`;
    
    // إنشاء رابط للتحميل
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('تم تصدير التقرير بنجاح!', 'success');
}

// طباعة الملخص
function printSummary() {
    if (currentClients.length === 0) {
        showNotification('لا توجد بيانات للطباعة', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>طباعة ملخص العملاء</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #3498db; color: white; padding: 12px; text-align: center; }
                td { padding: 10px; border: 1px solid #ddd; text-align: center; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .total-row { font-weight: bold; background-color: #ecf0f1; }
                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin: 30px 0;
                }
                .stat-item {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #2c3e50;
                }
                @media print {
                    .no-print { display: none; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>ملخص العملاء - ماريكتينج ويف</h1>
            <h2>تقرير بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</h2>
            
            <div class="summary-stats">
                <div class="stat-item">
                    <div>إجمالي الإيرادات</div>
                    <div class="stat-value">${formatCurrency(filteredClients.reduce((sum, client) => sum + client.servicePrice, 0))}</div>
                </div>
                <div class="stat-item">
                    <div>إجمالي المدفوع</div>
                    <div class="stat-value">${formatCurrency(filteredClients.reduce((sum, client) => sum + client.paidAmount, 0))}</div>
                </div>
                <div class="stat-item">
                    <div>إجمالي المستحقات</div>
                    <div class="stat-value">${formatCurrency(filteredClients.reduce((sum, client) => sum + client.remainingAmount, 0))}</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>اسم العميل</th>
                        <th>رقم الهاتف</th>
                        <th>نوع الخدمة</th>
                        <th>سعر الخدمة</th>
                        <th>المدفوع</th>
                        <th>المتبقي</th>
                        <th>تاريخ التسجيل</th>
                        <th>حالة الخدمة</th>
                    </tr>
                </thead>
                <tbody>
    `);
    
    filteredClients.forEach(client => {
        printWindow.document.write(`
            <tr>
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.serviceType}</td>
                <td>${formatCurrency(client.servicePrice)}</td>
                <td>${formatCurrency(client.paidAmount)}</td>
                <td>${formatCurrency(client.remainingAmount)}</td>
                <td>${client.registrationDate}</td>
                <td>${client.serviceStatus}</td>
            </tr>
        `);
    });
    
    printWindow.document.write(`
                </tbody>
            </table>
            <br>
            <div style="text-align: center;" class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; cursor: pointer; margin: 0 10px;">
                    <i class="fas fa-print"></i> طباعة التقرير
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; cursor: pointer; margin: 0 10px;">
                    <i class="fas fa-times"></i> إغلاق
                </button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}