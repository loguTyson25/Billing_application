// ============================================================
// HARDWARE STORE BILLING - Google Apps Script Backend API
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open Google Sheets → Extensions → Apps Script
// 2. Paste this entire file
// 3. Run initializeSheets() once to create all sheet tabs
// 4. Deploy → New deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone (or your org)
// 5. Copy the Web App URL into Angular environment.ts
// ============================================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ─── Sheet Names ───────────────────────────────────────────
const SHEETS = {
  PRODUCTS:   'Products',
  CUSTOMERS:  'Customers',
  INVOICES:   'Invoices',
  INVOICE_ITEMS: 'InvoiceItems',
  PAYMENTS:   'Payments',
  RETURNS:    'Returns',
  RETURN_ITEMS: 'ReturnItems',
  SUPPLIERS:  'Suppliers',
  PURCHASE_ORDERS: 'PurchaseOrders',
  USERS:      'Users',
};

// ─── CORS Helper ───────────────────────────────────────────
function buildResponse(data, status = 200) {
  return ContentService
    .createTextOutput(JSON.stringify({ status, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildError(message, status = 400) {
  return ContentService
    .createTextOutput(JSON.stringify({ status, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Router ────────────────────────────────────────────────
function doGet(e) {
  const path = e.parameter.path || '';
  const id   = e.parameter.id   || null;
  try {
    switch (path) {
      case 'products':       return getAll(SHEETS.PRODUCTS, id);
      case 'customers':      return getAll(SHEETS.CUSTOMERS, id);
      case 'invoices':       return getInvoices(id);
      case 'payments':       return getAll(SHEETS.PAYMENTS, id);
      case 'returns':        return getAll(SHEETS.RETURNS, id);
      case 'suppliers':      return getAll(SHEETS.SUPPLIERS, id);
      case 'purchase-orders':return getAll(SHEETS.PURCHASE_ORDERS, id);
      case 'users':          return getAll(SHEETS.USERS, id);
      case 'dashboard':      return getDashboard();
      case 'reports/daily-sales':    return getDailySales(e.parameter.date);
      case 'reports/outstanding':    return getOutstanding();
      case 'reports/top-products':   return getTopProducts();
      case 'reports/stock-status':   return getStockStatus();
      case 'reports/gst':            return getGstReport(e.parameter.from, e.parameter.to);
      default: return buildError('Unknown path: ' + path, 404);
    }
  } catch (err) {
    return buildError(err.message, 500);
  }
}

function doPost(e) {
  const path    = e.parameter.path || '';
  const action  = e.parameter.action || 'create';
  const payload = JSON.parse(e.postData.contents || '{}');
  try {
    switch (path) {
      case 'products':       return upsertProduct(payload, action);
      case 'customers':      return upsertCustomer(payload, action);
      case 'invoices':       return createInvoice(payload);
      case 'payments':       return recordPayment(payload);
      case 'returns':        return recordReturn(payload);
      case 'suppliers':      return upsertRow(SHEETS.SUPPLIERS, payload, action);
      case 'purchase-orders':return upsertRow(SHEETS.PURCHASE_ORDERS, payload, action);
      case 'users':          return upsertRow(SHEETS.USERS, payload, action);
      default: return buildError('Unknown path: ' + path, 404);
    }
  } catch (err) {
    return buildError(err.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEETS.PRODUCTS]: ['id','sku','name','category','unit','price','taxRate','hsnCode','stock','minStock','barcode','createdAt','updatedAt'],
    [SHEETS.CUSTOMERS]: ['id','name','phone','email','address','creditLimit','outstanding','loyaltyPoints','createdAt'],
    [SHEETS.INVOICES]: ['id','invoiceNo','date','customerId','customerName','subtotal','discountAmount','taxAmount','total','paidAmount','balanceDue','paymentMode','paymentStatus','notes','createdBy','createdAt'],
    [SHEETS.INVOICE_ITEMS]: ['id','invoiceId','productId','sku','productName','qty','unit','price','discount','taxRate','taxAmount','lineTotal'],
    [SHEETS.PAYMENTS]: ['id','invoiceId','invoiceNo','customerId','customerName','amount','mode','date','reference','notes'],
    [SHEETS.RETURNS]: ['id','returnNo','invoiceId','invoiceNo','date','customerId','customerName','reason','total','status'],
    [SHEETS.RETURN_ITEMS]: ['id','returnId','productId','productName','qty','price','lineTotal'],
    [SHEETS.SUPPLIERS]: ['id','name','contact','phone','email','address','gstNo','createdAt'],
    [SHEETS.PURCHASE_ORDERS]: ['id','poNo','supplierId','supplierName','date','items','total','status','notes'],
    [SHEETS.USERS]: ['id','name','email','role','password','active','createdAt'],
  };

  Object.entries(schemas).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
           .setBackground('#1a1a2e').setFontColor('#ffffff').setFontWeight('bold');
    }
  });

  // Seed sample data
  seedSampleData();
  Logger.log('✅ All sheets initialized!');
}

function seedSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const products = ss.getSheetByName(SHEETS.PRODUCTS);
  if (products.getLastRow() > 1) return; // already seeded

  const now = new Date().toISOString();
  const pData = [
    ['P001','SKU001','Cement OPC 53 Grade','Building Materials','Bag',380,18,'3816000',50,10,'','',now,now],
    ['P002','SKU002','MS Rod 10mm','Steel','Kg',65,18,'7214200',200,20,'','',now,now],
    ['P003','SKU003','Sand Fine','Aggregates','Cubic Ft',45,0,'2505100',500,50,'','',now,now],
    ['P004','SKU004','PVC Pipe 1 inch','Plumbing','Meter',85,18,'3917230',80,10,'','',now,now],
    ['P005','SKU005','Electrical Wire 2.5mm','Electrical','Meter',55,18,'8544492',150,20,'','',now,now],
    ['P006','SKU006','Paint Primer 1L','Paints','Piece',220,18,'3210000',30,5,'','',now,now],
    ['P007','SKU007','Tiles 2x2 ft','Flooring','Box',850,18,'6907219',40,5,'','',now,now],
    ['P008','SKU008','Bolt M12 x 50mm','Hardware','Piece',12,18,'7318159',500,50,'','',now,now],
  ];
  products.getRange(2,1,pData.length,pData[0].length).setValues(pData);

  const customers = ss.getSheetByName(SHEETS.CUSTOMERS);
  const cData = [
    ['C001','Ravi Construction','9876543210','ravi@example.com','Chennai','50000',0,0,now],
    ['C002','Priya Builders','9988776655','priya@builders.com','Coimbatore','100000',0,0,now],
    ['C003','Walk-in Customer','','','','0',0,0,now],
  ];
  customers.getRange(2,1,cData.length,cData[0].length).setValues(cData);

  const users = ss.getSheetByName(SHEETS.USERS);
  const uData = [
    ['U001','Admin User','admin@store.com','admin','admin123',true,now],
    ['U002','Sales Staff','sales@store.com','sales','sales123',true,now],
  ];
  users.getRange(2,1,uData.length,uData[0].length).setValues(uData);
}

// ═══════════════════════════════════════════════════════════
// GENERIC HELPERS
// ═══════════════════════════════════════════════════════════
function sheetToJson(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  );
}

function getAll(sheetName, id) {
  const rows = sheetToJson(sheetName);
  if (id) {
    const row = rows.find(r => r.id === id);
    return row ? buildResponse(row) : buildError('Not found', 404);
  }
  return buildResponse(rows);
}

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase();
}

function appendRow(sheetName, values) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.appendRow(values);
}

function updateRow(sheetName, id, updates) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(sheetName);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');
  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === id) {
      headers.forEach((h, c) => {
        if (updates[h] !== undefined) sheet.getRange(r+1, c+1).setValue(updates[h]);
      });
      return true;
    }
  }
  return false;
}

function upsertRow(sheetName, payload, action) {
  if (action === 'update') {
    updateRow(sheetName, payload.id, payload);
    return buildResponse({ success: true, id: payload.id });
  }
  if (action === 'delete') {
    deleteRow(sheetName, payload.id);
    return buildResponse({ success: true });
  }
  payload.id = payload.id || generateId(sheetName.charAt(0));
  payload.createdAt = payload.createdAt || new Date().toISOString();
  const headers = sheetToJson(sheetName).length === 0
    ? getSheetHeaders(sheetName) : Object.keys(sheetToJson(sheetName)[0] || {});
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const hdrs  = sheet.getDataRange().getValues()[0];
  appendRow(sheetName, hdrs.map(h => payload[h] !== undefined ? payload[h] : ''));
  return buildResponse({ success: true, id: payload.id });
}

function deleteRow(sheetName, id) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data  = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  for (let r = data.length - 1; r >= 1; r--) {
    if (data[r][idCol] === id) { sheet.deleteRow(r + 1); return; }
  }
}

// ═══════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════
function upsertProduct(payload, action) {
  if (action === 'update') {
    payload.updatedAt = new Date().toISOString();
    updateRow(SHEETS.PRODUCTS, payload.id, payload);
    return buildResponse({ success: true });
  }
  if (action === 'delete') {
    deleteRow(SHEETS.PRODUCTS, payload.id);
    return buildResponse({ success: true });
  }
  const now = new Date().toISOString();
  const row = [
    generateId('P'), payload.sku, payload.name, payload.category,
    payload.unit, payload.price, payload.taxRate || 18,
    payload.hsnCode || '', payload.stock || 0, payload.minStock || 5,
    payload.barcode || '', '', now, now
  ];
  appendRow(SHEETS.PRODUCTS, row);
  return buildResponse({ success: true, id: row[0] });
}

// ═══════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════
function upsertCustomer(payload, action) {
  if (action === 'update') {
    updateRow(SHEETS.CUSTOMERS, payload.id, payload);
    return buildResponse({ success: true });
  }
  if (action === 'delete') {
    deleteRow(SHEETS.CUSTOMERS, payload.id);
    return buildResponse({ success: true });
  }
  const row = [
    generateId('C'), payload.name, payload.phone, payload.email,
    payload.address, payload.creditLimit || 0, 0, 0, new Date().toISOString()
  ];
  appendRow(SHEETS.CUSTOMERS, row);
  return buildResponse({ success: true, id: row[0] });
}

// ═══════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════
function getInvoices(id) {
  const invoices = sheetToJson(SHEETS.INVOICES);
  const items    = sheetToJson(SHEETS.INVOICE_ITEMS);
  if (id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return buildError('Invoice not found', 404);
    inv.items = items.filter(it => it.invoiceId === id);
    return buildResponse(inv);
  }
  return buildResponse(invoices.map(inv => ({
    ...inv,
    items: items.filter(it => it.invoiceId === inv.id)
  })));
}

function createInvoice(payload) {
  const invId   = generateId('INV');
  const invNo   = 'INV-' + new Date().getFullYear() + '-' + String(getNextInvoiceSeq()).padStart(4,'0');
  const now     = new Date().toISOString();
  const date    = payload.date || now.substring(0,10);

  let subtotal = 0, taxTotal = 0;
  (payload.items || []).forEach(it => {
    subtotal += it.lineTotal;
    taxTotal += it.taxAmount;
  });
  const discAmt  = payload.discountAmount || 0;
  const total    = subtotal - discAmt + taxTotal;
  const paid     = payload.paidAmount || 0;
  const balance  = total - paid;
  const pStatus  = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

  const invRow = [
    invId, invNo, date,
    payload.customerId, payload.customerName,
    subtotal, discAmt, taxTotal, total,
    paid, balance, payload.paymentMode || 'cash',
    pStatus, payload.notes || '', payload.createdBy || 'admin', now
  ];
  appendRow(SHEETS.INVOICES, invRow);

  (payload.items || []).forEach(it => {
    appendRow(SHEETS.INVOICE_ITEMS, [
      generateId('II'), invId, it.productId, it.sku,
      it.productName, it.qty, it.unit, it.price,
      it.discount || 0, it.taxRate, it.taxAmount, it.lineTotal
    ]);
    updateStockOnSale(it.productId, it.qty);
  });

  if (paid > 0 && payload.customerId !== 'C003') {
    recordCustomerPayment(payload.customerId, balance);
  }

  return buildResponse({ success: true, id: invId, invoiceNo: invNo, total, balance });
}

function getNextInvoiceSeq() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.INVOICES);
  return Math.max(1, sheet.getLastRow());
}

function updateStockOnSale(productId, qty) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.PRODUCTS);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');
  const stCol   = headers.indexOf('stock');
  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === productId) {
      const newStock = Number(data[r][stCol]) - Number(qty);
      sheet.getRange(r+1, stCol+1).setValue(Math.max(0, newStock));
      return;
    }
  }
}

function recordCustomerPayment(customerId, addBalance) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.CUSTOMERS);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');
  const outCol  = headers.indexOf('outstanding');
  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === customerId) {
      const cur = Number(data[r][outCol]) + Number(addBalance);
      sheet.getRange(r+1, outCol+1).setValue(cur);
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════
function recordPayment(payload) {
  const pid = generateId('PAY');
  const row = [
    pid, payload.invoiceId, payload.invoiceNo,
    payload.customerId, payload.customerName,
    payload.amount, payload.mode, payload.date || new Date().toISOString().substring(0,10),
    payload.reference || '', payload.notes || ''
  ];
  appendRow(SHEETS.PAYMENTS, row);

  // Update invoice paid/balance
  const invoices = sheetToJson(SHEETS.INVOICES);
  const inv = invoices.find(i => i.id === payload.invoiceId);
  if (inv) {
    const newPaid    = Number(inv.paidAmount) + Number(payload.amount);
    const newBalance = Number(inv.total) - newPaid;
    updateRow(SHEETS.INVOICES, inv.id, {
      paidAmount: newPaid,
      balanceDue: newBalance,
      paymentStatus: newBalance <= 0 ? 'paid' : 'partial'
    });
    if (payload.customerId !== 'C003') {
      adjustCustomerOutstanding(payload.customerId, -Number(payload.amount));
    }
  }

  return buildResponse({ success: true, id: pid });
}

function adjustCustomerOutstanding(customerId, delta) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.CUSTOMERS);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');
  const outCol  = headers.indexOf('outstanding');
  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === customerId) {
      sheet.getRange(r+1, outCol+1).setValue(Number(data[r][outCol]) + delta);
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// RETURNS
// ═══════════════════════════════════════════════════════════
function recordReturn(payload) {
  const retId  = generateId('RET');
  const retNo  = 'RET-' + Date.now();
  const row = [
    retId, retNo, payload.invoiceId, payload.invoiceNo,
    payload.date || new Date().toISOString().substring(0,10),
    payload.customerId, payload.customerName,
    payload.reason || '', payload.total || 0, 'completed'
  ];
  appendRow(SHEETS.RETURNS, row);

  (payload.items || []).forEach(it => {
    appendRow(SHEETS.RETURN_ITEMS, [
      generateId('RI'), retId, it.productId, it.productName,
      it.qty, it.price, it.lineTotal
    ]);
    // Restore stock
    restoreStock(it.productId, it.qty);
  });

  return buildResponse({ success: true, id: retId, returnNo: retNo });
}

function restoreStock(productId, qty) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.PRODUCTS);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');
  const stCol   = headers.indexOf('stock');
  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === productId) {
      sheet.getRange(r+1, stCol+1).setValue(Number(data[r][stCol]) + Number(qty));
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD & REPORTS
// ═══════════════════════════════════════════════════════════
function getDashboard() {
  const invoices  = sheetToJson(SHEETS.INVOICES);
  const customers = sheetToJson(SHEETS.CUSTOMERS);
  const products  = sheetToJson(SHEETS.PRODUCTS);
  const today     = new Date().toISOString().substring(0,10);

  const todaySales = invoices
    .filter(i => i.date === today)
    .reduce((s, i) => s + Number(i.total), 0);

  const outstanding = customers.reduce((s, c) => s + Number(c.outstanding), 0);

  const lowStock = products.filter(p => Number(p.stock) <= Number(p.minStock));

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthSales = invoices
    .filter(i => new Date(i.date) >= monthStart)
    .reduce((s, i) => s + Number(i.total), 0);

  return buildResponse({
    todaySales,
    monthSales,
    outstanding,
    totalCustomers: customers.length,
    totalProducts:  products.length,
    lowStockCount:  lowStock.length,
    lowStockItems:  lowStock.slice(0, 5),
    recentInvoices: invoices.slice(-5).reverse(),
  });
}

function getDailySales(date) {
  const d = date || new Date().toISOString().substring(0,10);
  const invoices = sheetToJson(SHEETS.INVOICES).filter(i => i.date === d);
  const total    = invoices.reduce((s,i) => s + Number(i.total), 0);
  return buildResponse({ date: d, invoices, total, count: invoices.length });
}

function getOutstanding() {
  const customers = sheetToJson(SHEETS.CUSTOMERS).filter(c => Number(c.outstanding) > 0);
  const total = customers.reduce((s,c) => s + Number(c.outstanding), 0);
  return buildResponse({ customers, total });
}

function getTopProducts() {
  const items = sheetToJson(SHEETS.INVOICE_ITEMS);
  const map   = {};
  items.forEach(it => {
    if (!map[it.productId]) map[it.productId] = { productId: it.productId, name: it.productName, qty: 0, revenue: 0 };
    map[it.productId].qty     += Number(it.qty);
    map[it.productId].revenue += Number(it.lineTotal);
  });
  const sorted = Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0,10);
  return buildResponse(sorted);
}

function getStockStatus() {
  const products = sheetToJson(SHEETS.PRODUCTS);
  const out = products.map(p => ({
    ...p,
    status: Number(p.stock) === 0 ? 'out' : Number(p.stock) <= Number(p.minStock) ? 'low' : 'ok'
  }));
  return buildResponse(out);
}

function getGstReport(from, to) {
  const invoices = sheetToJson(SHEETS.INVOICES);
  const items    = sheetToJson(SHEETS.INVOICE_ITEMS);
  const filtered = invoices.filter(i => {
    if (from && i.date < from) return false;
    if (to   && i.date > to)   return false;
    return true;
  });
  const invIds   = new Set(filtered.map(i => i.id));
  const filteredItems = items.filter(it => invIds.has(it.invoiceId));

  const byRate = {};
  filteredItems.forEach(it => {
    const rate = it.taxRate;
    if (!byRate[rate]) byRate[rate] = { rate, taxableAmount: 0, cgst: 0, sgst: 0, total: 0 };
    const taxable = Number(it.lineTotal) - Number(it.taxAmount);
    byRate[rate].taxableAmount += taxable;
    byRate[rate].cgst          += Number(it.taxAmount) / 2;
    byRate[rate].sgst          += Number(it.taxAmount) / 2;
    byRate[rate].total         += Number(it.taxAmount);
  });

  return buildResponse({
    from, to,
    invoiceCount: filtered.length,
    totalSales:   filtered.reduce((s,i) => s + Number(i.total), 0),
    totalTax:     filtered.reduce((s,i) => s + Number(i.taxAmount), 0),
    breakdown:    Object.values(byRate)
  });
}
