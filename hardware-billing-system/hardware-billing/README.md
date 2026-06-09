# HardwareStore Pro — Billing System
## Angular 16 + Google Sheets Backend

---

## 📁 Project Structure

```
hardware-billing/
├── apps-script/
│   └── Code.gs              ← Google Apps Script (Backend API)
└── angular-app/
    ├── package.json
    └── src/
        ├── index.html
        ├── main.ts
        ├── styles.css
        ├── environments/
        │   └── environment.ts    ← 🔴 Set your API URL here
        └── app/
            ├── app.module.ts
            ├── app.component.ts
            ├── core/
            │   ├── models/index.ts
            │   └── services/api.service.ts
            ├── shared/
            │   └── layout/layout.component.ts
            └── features/
                ├── dashboard/
                ├── billing/         ← Main POS / Invoice creation
                ├── products/
                ├── customers/
                ├── invoices/
                ├── payments/
                ├── returns/
                ├── reports/
                └── suppliers/
```

---

## 🚀 STEP 1 — Setup Google Apps Script Backend

### Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → Create new spreadsheet
2. Name it: **HardwareStore Pro**
3. Open **Extensions → Apps Script**
4. Delete the default code
5. Paste the entire content of `apps-script/Code.gs`
6. Save (Ctrl+S)

### Initialize Sheets

7. In Apps Script, select function `initializeSheets` from dropdown
8. Click ▶ **Run** → Allow permissions when prompted
9. You should see 10 sheet tabs created with sample data

### Deploy as Web App

10. Click **Deploy → New Deployment**
11. Type: **Web App**
12. Description: `HardwareStore Billing API v1`
13. Execute as: **Me**
14. Who has access: **Anyone** (or your Google Workspace org)
15. Click **Deploy**
16. **Copy the Web App URL** — you'll need this!

> ⚠️ Every time you edit Code.gs, deploy a **new version** (not re-deploy same version).

---

## 🚀 STEP 2 — Setup Angular App

### Install Angular CLI

```bash
npm install -g @angular/cli@16
```

### Create Angular project

```bash
ng new hardware-billing --routing=true --style=css
cd hardware-billing
```

### Replace files

Copy all files from `angular-app/src/` into your Angular project's `src/` folder.

### Configure API URL

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',  // ← Paste here
  storeName: 'Sri Murugan Hardware',
  storeAddress: 'No.12, Anna Nagar, Chennai - 600040',
  storePhone: '+91 98765 43210',
  currency: '₹',
  gstNo: '33XXXXX0000X1ZX',  // ← Your GST number
};
```

### Run the app

```bash
npm install
ng serve
```

Open: [http://localhost:4200](http://localhost:4200)

---

## 📱 Features

| Module | Features |
|--------|----------|
| **Dashboard** | Today's sales, month sales, outstanding, low stock alerts, recent invoices |
| **Billing** | Product search/barcode, add to cart, item-level discount, bill discount, GST auto-calc, multi-payment modes, print invoice |
| **Products** | Full CRUD, categories, units (Piece/Kg/Meter/Box...), HSN codes, stock tracking, low stock alerts |
| **Customers** | CRUD, credit limit, outstanding balance tracking, purchase history |
| **Invoices** | List all invoices, filter by status (paid/partial/unpaid) |
| **Payments** | Record collections, view outstanding dues, update invoice balance |
| **Returns** | Record returns, auto-restores stock in Google Sheet |
| **Suppliers** | Manage suppliers with GST numbers |
| **Reports** | Daily sales, Outstanding dues, Top products, Stock status, GST report (CGST/SGST breakdown) |

---

## 🔧 Google Sheets API — Endpoints

All requests go to your Web App URL with query parameters.

### GET Requests
```
?path=products              → All products
?path=products&id=P001      → Single product
?path=customers             → All customers
?path=invoices              → All invoices with items
?path=invoices&id=INV001    → Single invoice
?path=payments              → All payments
?path=returns               → All returns
?path=suppliers             → All suppliers
?path=dashboard             → Dashboard summary
?path=reports/daily-sales&date=2025-01-15
?path=reports/outstanding
?path=reports/top-products
?path=reports/stock-status
?path=reports/gst&from=2025-01-01&to=2025-01-31
```

### POST Requests
```
?path=products&action=create    → Body: {sku, name, category, unit, price, taxRate, hsnCode, stock}
?path=products&action=update    → Body: {id, ...fields}
?path=products&action=delete    → Body: {id}
?path=customers&action=create   → Body: {name, phone, email, address, creditLimit}
?path=invoices                  → Body: full invoice object with items[]
?path=payments                  → Body: {invoiceId, invoiceNo, amount, mode, ...}
?path=returns                   → Body: {invoiceId, items[], reason, total}
```

---

## 📊 Google Sheets Structure

| Sheet | Purpose |
|-------|---------|
| Products | Product catalog with stock |
| Customers | Customer profiles & balances |
| Invoices | Invoice headers |
| InvoiceItems | Line items per invoice |
| Payments | Payment records |
| Returns | Return headers |
| ReturnItems | Returned items |
| Suppliers | Supplier master |
| PurchaseOrders | PO management |
| Users | User accounts |

---

## 🖨 Print Invoice

After saving a bill, click **🖨 Print** to open a printable invoice in a new tab.
For PDF: Use browser's Print → Save as PDF.

---

## 🔐 Security Note

The Apps Script runs with your Google account. For production:
- Restrict access to your Google Workspace domain
- Add basic auth checking using the `Users` sheet
- Consider using a service account for read-only reports

---

## 📱 WhatsApp Invoice Sharing

To share invoices via WhatsApp, add this to billing component after save:

```typescript
shareWhatsApp(invoice: any) {
  const msg = encodeURIComponent(
    `*${this.storeName}*\nInvoice: ${invoice.invoiceNo}\nAmount: ₹${invoice.total}\nBalance: ₹${invoice.balance}\nThank you!`
  );
  window.open(`https://wa.me/${this.selectedCustomer?.phone}?text=${msg}`, '_blank');
}
```
