// ===================== STATE =====================
let state = {
  customers: [],
  products: [],
  invoices: [],
  settings: {
    name: 'InvoiceFlow Pro', gstin: '', address: '', phone: '',
    email: '', website: '', gst: 18, bank: '', accno: '', ifsc: '', accname: ''
  },
  activity: [],
  nextInvNum: 1
};

// Current invoice line items — separate from state to avoid stale data on new invoice
let lineItems = [];
let editingInvoiceId = null;

// ===================== INIT =====================
function init() {
  const saved = localStorage.getItem('billingData_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } catch(e) { console.error('Load failed', e); }
  }
  loadSettings();
  renderAll();
  updateDashboard();
}

// ===================== SAVE =====================
function save() {
  localStorage.setItem('billingData_v2', JSON.stringify(state));
}

// ===================== NAVIGATION =====================
function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent =
    page.charAt(0).toUpperCase() + page.slice(1);
}

// ===================== MODAL =====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ===================== TOAST =====================
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = toast ${type};
  el.innerHTML = <span>${type === 'success' ? '✅' : '❌'}</span> ${msg};
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===================== SETTINGS =====================
function loadSettings() {
  const s = state.settings;
  setValue('s-name', s.name || '');
  setValue('s-gstin', s.gstin || '');
  setValue('s-address', s.address || '');
  setValue('s-phone', s.phone || '');
  setValue('s-email', s.email || '');
  setValue('s-website', s.website || '');
  setValue('s-gst', s.gst || 18);
  setValue('s-bank', s.bank || '');
  setValue('s-accno', s.accno || '');
  setValue('s-ifsc', s.ifsc || '');
  setValue('s-accname', s.accname || '');
  const nameEl = document.getElementById('sb-name');
  if (nameEl) nameEl.textContent = s.name || 'InvoiceFlow';
  const avatarEl = document.getElementById('sb-avatar');
  if (avatarEl) avatarEl.textContent = (s.name || 'IF').substring(0, 2).toUpperCase();
}

function saveSettings() {
  state.settings = {
    name: getVal('s-name'),
    gstin: getVal('s-gstin'),
    address: getVal('s-address'),
    phone: getVal('s-phone'),
    email: getVal('s-email'),
    website: getVal('s-website'),
    gst: getVal('s-gst'),
    bank: getVal('s-bank'),
    accno: getVal('s-accno'),
    ifsc: getVal('s-ifsc'),
    accname: getVal('s-accname')
  };
  save();
  loadSettings();
  toast('Settings saved!');
}

// ===================== HELPERS =====================
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
function fmtCurrency(n) {
  return '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function addActivity(msg) {
  state.activity.unshift({ msg, time: new Date().toISOString() });
  if (state.activity.length > 20) state.activity.pop();
}

// ===================== RENDER ALL =====================
function renderAll() {
  renderCustomers();
  renderProducts();
  renderInvoices();
  updateDashboard();
}

// ===================== CUSTOMERS =====================
function renderCustomers(filter = '') {
  const tbody = document.getElementById('customers-table');
  const empty = document.getElementById('customers-empty');
  const list = filter
    ? state.customers.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(filter.toLowerCase()))
    : state.customers;

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong style="color:var(--text)">${c.name}</strong></td>
      <td>${c.email || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.gstin || '—'}</td>
      <td>${c.city || '—'}</td>
      <td>${state.invoices.filter(i => i.customerId === c.id).length}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="editCustomer('${c.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCustomers(v) { renderCustomers(v); }

function openCustomerModal(reset = true) {
  if (reset) {
    document.getElementById('customerModal-title').textContent = 'Add Customer';
    setValue('c-id', '');
    ['c-name','c-email','c-phone','c-gstin','c-address','c-city','c-state','c-pin']
      .forEach(id => setValue(id, ''));
  }
  openModal('customerModal');
}

function editCustomer(id) {
  const c = state.customers.find(x => x.id === id);
  if (!c) return;
  document.getElementById('customerModal-title').textContent = 'Edit Customer';
  setValue('c-id', c.id);
  setValue('c-name', c.name);
  setValue('c-email', c.email || '');
  setValue('c-phone', c.phone || '');
  setValue('c-gstin', c.gstin || '');
  setValue('c-address', c.address || '');
  setValue('c-city', c.city || '');
  setValue('c-state', c.state || '');
  setValue('c-pin', c.pin || '');
  openModal('customerModal');
}

function saveCustomer() {
  const name = getVal('c-name');
  const email = getVal('c-email');
  if (!name) { toast('Customer name is required', 'error'); return; }

  const existingId = getVal('c-id');
  if (existingId) {
    // Edit
    const idx = state.customers.findIndex(c => c.id === existingId);
    if (idx > -1) {
      state.customers[idx] = {
        ...state.customers[idx],
        name, email,
        phone: getVal('c-phone'),
        gstin: getVal('c-gstin'),
        address: getVal('c-address'),
        city: getVal('c-city'),
        state: getVal('c-state'),
        pin: getVal('c-pin')
      };
      addActivity(Customer "${name}" updated);
      toast('Customer updated!');
    }
  } else {
    // New
    const customer = {
      id: uid(), name, email,
      phone: getVal('c-phone'),
      gstin: getVal('c-gstin'),
      address: getVal('c-address'),
      city: getVal('c-city'),
      state: getVal('c-state'),
      pin: getVal('c-pin')
    };
    state.customers.push(customer);
    addActivity(Customer "${name}" added);
    toast('Customer added!');
  }
  save();
  renderAll();
  closeModal('customerModal');
}

function deleteCustomer(id) {
  const c = state.customers.find(x => x.id === id);
  if (!c) return;
  if (!confirm(Delete customer "${c.name}"? This won't delete their invoices.)) return;
  state.customers = state.customers.filter(x => x.id !== id);
  addActivity(Customer "${c.name}" deleted);
  save();
  renderAll();
  toast('Customer deleted');
}

// ===================== PRODUCTS =====================
function renderProducts(filter = '') {
  const tbody = document.getElementById('products-table');
  const empty = document.getElementById('products-empty');
  const list = filter
    ? state.products.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(filter.toLowerCase()))
    : state.products;

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => `
    <tr>
      <td><strong style="color:var(--text)">${p.name}</strong></td>
      <td>${p.sku || '—'}</td>
      <td>${p.category || '—'}</td>
      <td>${fmtCurrency(p.price)}</td>
      <td>${p.gst || 0}%</td>
      <td>${p.unit || '—'}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProducts(v) { renderProducts(v); }

function editProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productModal-title').textContent = 'Edit Product';
  setValue('p-id', p.id);
  setValue('p-name', p.name);
  setValue('p-sku', p.sku || '');
  setValue('p-category', p.category || 'Service');
  setValue('p-price', p.price);
  setValue('p-gst', p.gst || 18);
  setValue('p-unit', p.unit || 'Nos');
  setValue('p-desc', p.desc || '');
  openModal('productModal');
}

function saveProduct() {
  const name = getVal('p-name');
  const price = parseFloat(getVal('p-price'));
  if (!name) { toast('Product name is required', 'error'); return; }
  if (isNaN(price) || price < 0) { toast('Enter a valid price', 'error'); return; }

  const existingId = getVal('p-id');
  if (existingId) {
    const idx = state.products.findIndex(p => p.id === existingId);
    if (idx > -1) {
      state.products[idx] = {
        ...state.products[idx],
        name, price,
        sku: getVal('p-sku'),
        category: getVal('p-category'),
        gst: parseInt(getVal('p-gst')),
        unit: getVal('p-unit'),
        desc: getVal('p-desc')
      };
      addActivity(Product "${name}" updated);
      toast('Product updated!');
    }
  } else {
    const product = {
      id: uid(), name, price,
      sku: getVal('p-sku'),
      category: getVal('p-category'),
      gst: parseInt(getVal('p-gst')),
      unit: getVal('p-unit'),
      desc: getVal('p-desc')
    };
    state.products.push(product);
    addActivity(Product "${name}" added);
    toast('Product added!');
  }
  save();
  renderAll();
  closeModal('productModal');
  // Reset product modal for next open
  document.getElementById('productModal-title').textContent = 'Add Product';
  setValue('p-id', '');
}

function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(Delete product "${p.name}"?)) return;
  state.products = state.products.filter(x => x.id !== id);
  addActivity(Product "${p.name}" deleted);
  save();
  renderAll();
  toast('Product deleted');
}

// ===================== INVOICE LINE ITEMS =====================

// BUG FIX: Always reset lineItems completely before opening new invoice
function openNewInvoiceModal() {
  editingInvoiceId = null;
  lineItems = []; // <-- Critical: clear previous invoice line items

  document.getElementById('invoiceModal-title').textContent = 'Create New Invoice';
  setValue('inv-id', '');

  // Auto-generate invoice number
  const num = 'INV-' + String(state.nextInvNum || 1).padStart(3, '0');
  setValue('inv-number', num);

  // Set today's date and due date (+30 days)
  const today = new Date();
  const due = new Date();
  due.setDate(due.getDate() + 30);
  setValue('inv-date', today.toISOString().split('T')[0]);
  setValue('inv-due', due.toISOString().split('T')[0]);

  setValue('inv-status', 'Pending');
  setValue('inv-notes', '');
  setValue('inv-customer', ''); // Reset customer selection
  setValue('tot-discount', '0');

  // Populate customer dropdown fresh
  populateCustomerDropdown();
  // Populate product picker fresh
  populateProductPicker();

  renderLineItems();
  updateTotals();
  openModal('invoiceModal');
}

// BUG FIX: Edit invoice — populate dropdowns FIRST, then set values
function editInvoice(id) {
  const inv = state.invoices.find(x => x.id === id);
  if (!inv) return;

  editingInvoiceId = id;

  document.getElementById('invoiceModal-title').textContent = 'Edit Invoice';

  setValue('inv-id', inv.id);
  setValue('inv-number', inv.number);
  setValue('inv-status', inv.status || 'Pending');
  setValue('inv-date', inv.date || '');
  setValue('inv-due', inv.due || '');
  setValue('inv-notes', inv.notes || '');
  setValue('tot-discount', inv.discount || 0);

  // CRITICAL FIX: Populate customer dropdown BEFORE setting selected value
  populateCustomerDropdown();
  // Now set the customer value — dropdown already has options
  setValue('inv-customer', inv.customerId || '');

  // Populate product picker
  populateProductPicker();

  // Deep copy line items so editing doesn't mutate saved state
  lineItems = JSON.parse(JSON.stringify(inv.lineItems || []));

  renderLineItems();
  updateTotals();
  openModal('invoiceModal');
}

// Populate customer <select> with current customers
function populateCustomerDropdown() {
  const sel = document.getElementById('inv-customer');
  sel.innerHTML = '<option value="">— Select Customer —</option>';
  state.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

// Populate product picker <select>
function populateProductPicker() {
  const sel = document.getElementById('product-picker');
  sel.innerHTML = '<option value="">＋ Select product to add...</option>';
  state.products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = ${p.name} — ${fmtCurrency(p.price)};
    sel.appendChild(opt);
  });
}

// Add product from picker
function addProductLine() {
  const pid = getVal('product-picker');
  if (!pid) { toast('Select a product first', 'error'); return; }
  const product = state.products.find(p => p.id === pid);
  if (!product) return;

  lineItems.push({
    id: uid(),
    description: product.name,
    productId: product.id,
    qty: 1,
    rate: product.price,
    gst: product.gst || 0
  });

  setValue('product-picker', ''); // Reset picker after adding
  renderLineItems();
  updateTotals();
}

// Add custom/blank line
function addCustomLine() {
  lineItems.push({ id: uid(), description: '', productId: null, qty: 1, rate: 0, gst: parseInt(state.settings.gst) || 18 });
  renderLineItems();
  updateTotals();
}

function removeLineItem(idx) {
  lineItems.splice(idx, 1);
  renderLineItems();
  updateTotals();
}

function renderLineItems() {
  const tbody = document.getElementById('line-items-body');
  if (lineItems.length === 0) {
    tbody.innerHTML = <tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px;font-size:0.82rem;">No items added yet. Use the product picker or add a custom line.</td></tr>;
    return;
  }
  tbody.innerHTML = lineItems.map((item, i) => {
    const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const gstAmt = amount * ((parseFloat(item.gst) || 0) / 100);
    const total = amount + gstAmt;
    return `
      <tr>
        <td><input type="text" value="${escHtml(item.description)}" placeholder="Description" oninput="updateLineItem(${i},'description',this.value)"></td>
        <td><input type="number" value="${item.qty}" min="1" step="1" oninput="updateLineItem(${i},'qty',this.value)" style="width:60px;"></td>
        <td><input type="number" value="${item.rate}" min="0" step="0.01" oninput="updateLineItem(${i},'rate',this.value)"></td>
        <td>
          <select onchange="updateLineItem(${i},'gst',this.value)">
            ${[0,5,12,18,28].map(g => <option value="${g}" ${parseInt(item.gst) === g ? 'selected' : ''}>${g}%</option>).join('')}
          </select>
        </td>
        <td style="color:var(--text);font-weight:600;">${fmtCurrency(total)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeLineItem(${i})">✕</button></td>
      </tr>
    `;
  }).join('');
}

function updateLineItem(idx, field, value) {
  if (!lineItems[idx]) return;
  lineItems[idx][field] = field === 'description' ? value : parseFloat(value) || 0;
  updateTotals();
  // Re-render only the amount cell to avoid cursor jumping
  updateAmountCells();
}

function updateAmountCells() {
  const rows = document.querySelectorAll('#line-items-body tr');
  lineItems.forEach((item, i) => {
    if (!rows[i]) return;
    const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const gstAmt = amount * ((parseFloat(item.gst) || 0) / 100);
    const total = amount + gstAmt;
    const tds = rows[i].querySelectorAll('td');
    if (tds[4]) tds[4].textContent = fmtCurrency(total);
  });
}

function updateTotals() {
  let subtotal = 0, gstTotal = 0;
  lineItems.forEach(item => {
    const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    subtotal += amount;
    gstTotal += amount * ((parseFloat(item.gst) || 0) / 100);
  });
  const discount = parseFloat(getVal('tot-discount')) || 0;
  const grand = subtotal + gstTotal - discount;

  setText('tot-subtotal', fmtCurrency(subtotal));
  setText('tot-gst', fmtCurrency(gstTotal));
  setText('tot-grand', fmtCurrency(Math.max(0, grand)));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===================== SAVE INVOICE =====================
function saveInvoice() {
  const customerId = getVal('inv-customer');
  const date = getVal('inv-date');
  const due = getVal('inv-due');

  if (!customerId) { toast('Please select a customer', 'error'); return; }
  if (!date) { toast('Invoice date is required', 'error'); return; }
  if (lineItems.length === 0) { toast('Add at least one line item', 'error'); return; }

  // Calculate totals
  let subtotal = 0, gstTotal = 0;
  lineItems.forEach(item => {
    const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    subtotal += amount;
    gstTotal += amount * ((parseFloat(item.gst) || 0) / 100);
  });
  const discount = parseFloat(getVal('tot-discount')) || 0;
  const grand = Math.max(0, subtotal + gstTotal - discount);

  const customer = state.customers.find(c => c.id === customerId);

  if (editingInvoiceId) {
    // Update existing
    const idx = state.invoices.findIndex(i => i.id === editingInvoiceId);
    if (idx > -1) {
      state.invoices[idx] = {
        ...state.invoices[idx],
        number: getVal('inv-number'),
        customerId,
        customerName: customer ? customer.name : '',
        date,
        due: getVal('inv-due'),
        status: getVal('inv-status'),
        notes: getVal('inv-notes'),
        lineItems: JSON.parse(JSON.stringify(lineItems)),
        subtotal, gstTotal, discount, grand,
        updatedAt: new Date().toISOString()
      };
      addActivity(Invoice #${getVal('inv-number')} updated);
      toast('Invoice updated!');
    }
  } else {
    // Create new
    const invNumber = getVal('inv-number');
    const invoice = {
      id: uid(),
      number: invNumber,
      customerId,
      customerName: customer ? customer.name : '',
      date,
      due: getVal('inv-due'),
      status: getVal('inv-status'),
      notes: getVal('inv-notes'),
      lineItems: JSON.parse(JSON.stringify(lineItems)),
      subtotal, gstTotal, discount, grand,
      createdAt: new Date().toISOString()
    };
    state.invoices.push(invoice);
    state.nextInvNum = (state.nextInvNum || 1) + 1;
    addActivity(Invoice #${invNumber} created for ${customer ? customer.name : 'customer'});
    toast('Invoice created!');
  }

  save();
  renderAll();
  closeModal('invoiceModal');
  editingInvoiceId = null;
  lineItems = [];
}

// ===================== RENDER INVOICES =====================
function renderInvoices(filter = '') {
  const tbody = document.getElementById('invoices-table');
  const empty = document.getElementById('invoices-empty');
  const badge = document.getElementById('inv-badge');

  const list = filter
    ? state.invoices.filter(i =>
        i.number.toLowerCase().includes(filter.toLowerCase()) ||
        (i.customerName || '').toLowerCase().includes(filter.toLowerCase()) ||
        (i.status || '').toLowerCase().includes(filter.toLowerCase()))
    : state.invoices;

  badge.textContent = state.invoices.length;

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = [...list].reverse().map(inv => `
    <tr>
      <td><strong style="color:var(--text)">${inv.number}</strong></td>
      <td>${inv.customerName || getCustomerName(inv.customerId)}</td>
      <td>${fmtDate(inv.date)}</td>
      <td>${fmtDate(inv.due)}</td>
      <td style="font-weight:700;color:var(--accent)">${fmtCurrency(inv.grand)}</td>
      <td><span class="status status-${(inv.status || 'pending').toLowerCase()}">${inv.status || 'Pending'}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="previewInvoice('${inv.id}')">👁️</button>
          <button class="btn btn-ghost btn-sm" onclick="editInvoice('${inv.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${inv.id}')">🗑️</button>
          ${inv.status !== 'Paid' ? <button class="btn btn-success btn-sm" onclick="markPaid('${inv.id}')">✅ Paid</button> : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterInvoices(v) { renderInvoices(v); }

function getCustomerName(id) {
  const c = state.customers.find(x => x.id === id);
  return c ? c.name : '—';
}

function deleteInvoice(id) {
  const inv = state.invoices.find(x => x.id === id);
  if (!inv) return;
  if (!confirm(Delete invoice ${inv.number}?)) return;
  state.invoices = state.invoices.filter(x => x.id !== id);
  addActivity(Invoice #${inv.number} deleted);
  save();
  renderAll();
  toast('Invoice deleted');
}

function markPaid(id) {
  const idx = state.invoices.findIndex(x => x.id === id);
  if (idx === -1) return;
  state.invoices[idx].status = 'Paid';
  addActivity(Invoice #${state.invoices[idx].number} marked as Paid);
  save();
  renderAll();
  toast('Marked as Paid ✅');
}

// ===================== DASHBOARD =====================
function updateDashboard() {
  const total = state.invoices.length;
  const paid = state.invoices.filter(i => i.status === 'Paid');
  const pending = state.invoices.filter(i => i.status !== 'Paid');
  const paidAmt = paid.reduce((s, i) => s + (i.grand || 0), 0);
  const pendingAmt = pending.reduce((s, i) => s + (i.grand || 0), 0);

  setText('stat-total-inv', total);
  setText('stat-paid', fmtCurrency(paidAmt));
  setText('stat-paid-count', ${paid.length} invoice${paid.length !== 1 ? 's' : ''} paid);
  setText('stat-pending', fmtCurrency(pendingAmt));
  setText('stat-pending-count', ${pending.length} invoice${pending.length !== 1 ? 's' : ''} pending);
  setText('stat-customers', state.customers.length);
  setText('stat-products-count', ${state.products.length} product${state.products.length !== 1 ? 's' : ''});

  // Recent invoices
  const recentEl = document.getElementById('dash-recent-invoices');
  const recent = [...state.invoices].reverse().slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="empty-state"><div class="es-icon">🧾</div><p>No invoices yet</p></div>';
  } else {
    recentEl.innerHTML = recent.map(inv => `
      <div class="recent-inv-row">
        <div>
          <div class="recent-inv-num">${inv.number}</div>
          <div class="recent-inv-cust">${inv.customerName || getCustomerName(inv.customerId)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="status status-${(inv.status || 'pending').toLowerCase()}">${inv.status}</span>
          <span class="recent-inv-amt">${fmtCurrency(inv.grand)}</span>
        </div>
      </div>
    `).join('');
  }

  // Activity
  const actEl = document.getElementById('dash-activity');
  if (state.activity.length === 0) {
    actEl.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><p>No recent activity</p></div>';
  } else {
    actEl.innerHTML = state.activity.slice(0, 8).map(a => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <div class="activity-text">${a.msg}</div>
          <div class="activity-time">${timeAgo(a.time)}</div>
        </div>
      </div>
    `).join('');
  }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return ${mins}m ago;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ${hrs}h ago;
  return ${Math.floor(hrs / 24)}d ago;
}

// ===================== INVOICE PREVIEW =====================
function previewInvoice(id) {
  const inv = state.invoices.find(x => x.id === id);
  if (!inv) return;
  const customer = state.customers.find(c => c.id === inv.customerId) || {};
  const s = state.settings;

  const statusClass = (inv.status || 'pending').toLowerCase();

  let itemsHtml = (inv.lineItems || []).map(item => {
    const amount = (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
    const gstAmt = amount * ((parseFloat(item.gst)||0)/100);
    return `
      <tr>
        <td>${escHtml(item.description)}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">₹${parseFloat(item.rate).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td style="text-align:center;">${item.gst || 0}%</td>
        <td style="text-align:right;font-weight:600;">₹${(amount+gstAmt).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
      </tr>
    `;
  }).join('');

  const bankHtml = s.bank ? `
    <div class="preview-bank">
      <div class="preview-bank-title">Bank Details</div>
      <div class="preview-bank-details">
        <div><strong>Bank:</strong> ${s.bank}</div>
        <div><strong>Account:</strong> ${s.accno}</div>
        <div><strong>IFSC:</strong> ${s.ifsc}</div>
        <div><strong>Name:</strong> ${s.accname}</div>
      </div>
    </div>
  ` : '';

  document.getElementById('invoice-preview-content').innerHTML = `
    <div class="preview-header">
      <div>
        <div class="preview-logo">${escHtml(s.name || 'InvoiceFlow')}</div>
        <div class="preview-invoice-num">Invoice #${inv.number}</div>
      </div>
      <div>
        <div class="preview-badge ${statusClass}">${inv.status || 'Pending'}</div>
      </div>
    </div>

    <div class="preview-parties">
      <div>
        <div class="preview-party-label">From</div>
        <div class="preview-party-name">${escHtml(s.name || 'Your Company')}</div>
        <div class="preview-party-info">
          ${s.gstin ? GSTIN: ${s.gstin}<br> : ''}
          ${escHtml(s.address || '')}${s.address ? '<br>' : ''}
          ${s.phone ? 📞 ${s.phone} : ''} ${s.email ? | ✉️ ${s.email} : ''}
        </div>
      </div>
      <div>
        <div class="preview-party-label">Bill To</div>
        <div class="preview-party-name">${escHtml(customer.name || inv.customerName || '—')}</div>
        <div class="preview-party-info">
          ${customer.gstin ? GSTIN: ${customer.gstin}<br> : ''}
          ${customer.address ? escHtml(customer.address) + '<br>' : ''}
          ${customer.city ? customer.city : ''} ${customer.state ? customer.state : ''}<br>
          ${customer.phone ? 📞 ${customer.phone} : ''} ${customer.email ? ✉️ ${customer.email} : ''}
        </div>
      </div>
    </div>

    <div class="preview-dates">
      <div>
        <div class="preview-date-label">Invoice Date</div>
        <div class="preview-date-val">${fmtDate(inv.date)}</div>
      </div>
      <div>
        <div class="preview-date-label">Due Date</div>
        <div class="preview-date-val">${fmtDate(inv.due)}</div>
      </div>
    </div>

    <table class="preview-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:center;">GST</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="preview-totals">
      <div class="preview-totals-box">
        <div class="preview-totals-row"><span>Subtotal</span><span>₹${(inv.subtotal||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
        <div class="preview-totals-row"><span>GST</span><span>₹${(inv.gstTotal||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
        ${inv.discount ? <div class="preview-totals-row"><span>Discount</span><span>- ₹${parseFloat(inv.discount).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div> : ''}
        <div class="preview-totals-grand"><span>Total</span><span>₹${(inv.grand||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      </div>
    </div>

    ${bankHtml}

    ${inv.notes ? <div class="preview-notes"><strong>Notes:</strong> ${escHtml(inv.notes)}</div> : ''}

    <div class="preview-footer">Thank you for your business! • Generated by InvoiceFlow Pro</div>
  `;

  openModal('previewModal');
}

function printInvoice() {
  window.print();
}

// ===================== UTILITY =====================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===================== OPEN MODAL WRAPPERS =====================
// Ensure customer modal resets on fresh open from button
document.addEventListener('DOMContentLoaded', () => {
  // Hook Add Customer button
  const addCustBtns = document.querySelectorAll('[onclick="openModal(\'customerModal\')"]');
  addCustBtns.forEach(btn => {
    btn.setAttribute('onclick', 'openFreshCustomerModal()');
  });
});

function openFreshCustomerModal() {
  document.getElementById('customerModal-title').textContent = 'Add Customer';
  setValue('c-id', '');
  ['c-name','c-email','c-phone','c-gstin','c-address','c-city','c-state','c-pin']
    .forEach(id => setValue(id, ''));
  openModal('customerModal');
}

function openFreshProductModal() {
  document.getElementById('productModal-title').textContent = 'Add Product';
  setValue('p-id', '');
  ['p-name','p-sku','p-desc'].forEach(id => setValue(id, ''));
  setValue('p-category', 'Service');
  setValue('p-price', '');
  setValue('p-gst', '18');
  setValue('p-unit', 'Nos');
  openModal('productModal');
}

// ===================== START =====================
document.addEventListener('DOMContentLoaded', init);
