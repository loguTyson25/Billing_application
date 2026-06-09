// src/app/features/billing/billing.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-billing',
  template: `
<div class="billing-screen">
  <div class="billing-left">
    <!-- Customer Section -->
    <div class="panel">
      <div class="panel-header">🧑 Customer</div>
      <div class="panel-body">
        <div class="form-row">
          <select [(ngModel)]="selectedCustomerId" (change)="onCustomerChange()" class="form-control">
            <option value="">-- Walk-in Customer --</option>
            <option *ngFor="let c of customers" [value]="c.id">{{ c.name }} ({{ c.phone }})</option>
          </select>
          <button class="btn-icon" title="Add new customer" (click)="showNewCustomer = !showNewCustomer">+</button>
        </div>
        <div *ngIf="selectedCustomer" class="customer-info">
          <span>📞 {{ selectedCustomer.phone }}</span>
          <span class="outstanding-badge" *ngIf="selectedCustomer.outstanding > 0">
            Outstanding: {{ cur }}{{ selectedCustomer.outstanding | number:'1.0-0' }}
          </span>
        </div>
        <!-- Quick add customer -->
        <div *ngIf="showNewCustomer" class="quick-form">
          <input [(ngModel)]="newCust.name"  placeholder="Name *" class="form-control" />
          <input [(ngModel)]="newCust.phone" placeholder="Phone *" class="form-control" />
          <input [(ngModel)]="newCust.address" placeholder="Address" class="form-control" />
          <button class="btn-save" (click)="addCustomer()">Save Customer</button>
        </div>
      </div>
    </div>

    <!-- Product Search -->
    <div class="panel">
      <div class="panel-header">📦 Add Products</div>
      <div class="panel-body">
        <div class="search-row">
          <input
            [(ngModel)]="productSearch"
            (input)="filterProducts()"
            placeholder="Search by name, SKU or scan barcode..."
            class="form-control search-box"
          />
        </div>
        <div class="product-results" *ngIf="filteredProducts.length && productSearch">
          <div
            class="product-result-row"
            *ngFor="let p of filteredProducts.slice(0,8)"
            (click)="addToCart(p)"
          >
            <div>
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta">{{ p.sku }} | {{ p.unit }} | Stock: {{ p.stock }}</div>
            </div>
            <div class="p-price">{{ cur }}{{ p.price }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart / Line Items -->
    <div class="panel">
      <div class="panel-header">🛒 Bill Items</div>
      <div *ngIf="!cartItems.length" class="empty-cart">No items added yet</div>
      <table class="cart-table" *ngIf="cartItems.length">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Disc%</th>
            <th>Tax%</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of cartItems; let i = index">
            <td>
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-sku">{{ item.sku }}</div>
            </td>
            <td>
              <input type="number" [(ngModel)]="item.qty" min="1" class="qty-input"
                     (ngModelChange)="recalcItem(item)" />
            </td>
            <td>
              <input type="number" [(ngModel)]="item.price" class="price-input"
                     (ngModelChange)="recalcItem(item)" />
            </td>
            <td>
              <input type="number" [(ngModel)]="item.discount" min="0" max="100" class="disc-input"
                     (ngModelChange)="recalcItem(item)" />
            </td>
            <td>{{ item.taxRate }}%</td>
            <td class="line-total">{{ cur }}{{ item.lineTotal | number:'1.2-2' }}</td>
            <td>
              <button class="btn-remove" (click)="removeItem(i)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Right: Summary & Payment -->
  <div class="billing-right">
    <div class="summary-panel">
      <div class="summary-header">💳 Payment Summary</div>

      <div class="summary-rows">
        <div class="sum-row">
          <span>Subtotal</span>
          <span>{{ cur }}{{ subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="sum-row">
          <span>Bill Discount ({{ billDiscount }}%)</span>
          <span class="text-red">-{{ cur }}{{ discountAmount | number:'1.2-2' }}</span>
        </div>
        <div class="sum-row">
          <span>GST / Tax</span>
          <span>{{ cur }}{{ taxTotal | number:'1.2-2' }}</span>
        </div>
        <div class="sum-row total-row">
          <span>Total</span>
          <span>{{ cur }}{{ grandTotal | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Discount -->
      <div class="field-group">
        <label>Bill Discount (%)</label>
        <input type="number" [(ngModel)]="billDiscount" min="0" max="100" class="form-control"
               (ngModelChange)="recalcTotals()" />
      </div>

      <!-- Payment Mode -->
      <div class="field-group">
        <label>Payment Mode</label>
        <div class="mode-tabs">
          <button *ngFor="let m of paymentModes"
                  [class.active]="paymentMode === m.value"
                  (click)="paymentMode = m.value"
                  class="mode-btn">
            {{ m.icon }} {{ m.label }}
          </button>
        </div>
      </div>

      <!-- Amount Paid -->
      <div class="field-group">
        <label>Amount Paid ({{ cur }})</label>
        <input type="number" [(ngModel)]="amountPaid" [max]="grandTotal" class="form-control"
               placeholder="Leave 0 for full credit" />
      </div>

      <!-- Balance -->
      <div class="balance-row" [class.credit]="grandTotal - amountPaid > 0">
        <span>Balance Due</span>
        <span class="bal-amount">{{ cur }}{{ (grandTotal - amountPaid) | number:'1.2-2' }}</span>
      </div>

      <!-- Date -->
      <div class="field-group">
        <label>Invoice Date</label>
        <input type="date" [(ngModel)]="invoiceDate" class="form-control" />
      </div>

      <!-- Notes -->
      <div class="field-group">
        <label>Notes</label>
        <textarea [(ngModel)]="notes" class="form-control" rows="2" placeholder="Optional notes..."></textarea>
      </div>

      <!-- Actions -->
      <div class="action-btns">
        <button class="btn-save-bill" (click)="saveBill()" [disabled]="!cartItems.length || saving">
          {{ saving ? 'Saving...' : '💾 Save Invoice' }}
        </button>
        <button class="btn-print" (click)="printBill()" [disabled]="!lastInvoice" title="Print last saved invoice">
          🖨 Print
        </button>
        <button class="btn-clear" (click)="clearBill()">🗑 Clear</button>
      </div>

      <!-- Success Banner -->
      <div class="success-banner" *ngIf="lastInvoice">
        ✅ Invoice <strong>{{ lastInvoice.invoiceNo }}</strong> saved!
        Total: {{ cur }}{{ lastInvoice.total | number:'1.0-0' }}
        | Balance: {{ cur }}{{ lastInvoice.balance | number:'1.0-0' }}
      </div>
    </div>
  </div>
</div>

<!-- Print area (hidden) -->
<div id="print-area" style="display:none;">
  <div *ngIf="lastInvoice" class="print-invoice">
    <h2>{{ storeName }}</h2>
    <p>{{ storeAddress }} | GST: {{ gstNo }}</p>
    <hr/>
    <p><strong>Invoice No:</strong> {{ lastInvoice.invoiceNo }} &nbsp;&nbsp; <strong>Date:</strong> {{ invoiceDate }}</p>
    <p><strong>Customer:</strong> {{ customerName }}</p>
    <hr/>
    <table style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead>
        <tr style="background:#eee;">
          <th style="text-align:left;padding:4px;">Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Tax</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of cartItems">
          <td style="padding:4px;">{{ item.productName }} ({{ item.sku }})</td>
          <td style="text-align:center;">{{ item.qty }} {{ item.unit }}</td>
          <td style="text-align:right;">{{ cur }}{{ item.price }}</td>
          <td style="text-align:right;">{{ cur }}{{ item.taxAmount | number:'1.2-2' }}</td>
          <td style="text-align:right;">{{ cur }}{{ item.lineTotal | number:'1.2-2' }}</td>
        </tr>
      </tbody>
    </table>
    <hr/>
    <div style="text-align:right;">
      <p>Subtotal: {{ cur }}{{ subtotal | number:'1.2-2' }}</p>
      <p>Discount: -{{ cur }}{{ discountAmount | number:'1.2-2' }}</p>
      <p>GST: {{ cur }}{{ taxTotal | number:'1.2-2' }}</p>
      <p><strong>TOTAL: {{ cur }}{{ grandTotal | number:'1.2-2' }}</strong></p>
      <p>Paid: {{ cur }}{{ amountPaid | number:'1.2-2' }}</p>
      <p>Balance: {{ cur }}{{ (grandTotal - amountPaid) | number:'1.2-2' }}</p>
    </div>
    <hr/>
    <p style="text-align:center; font-size:11px;">Thank you for your business!</p>
  </div>
</div>
  `,
  styles: [`
    .billing-screen {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      min-height: calc(100vh - 108px);
    }
    .billing-left { display: flex; flex-direction: column; gap: 16px; }

    .panel {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .panel-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }
    .panel-body { padding: 16px; }

    .form-row { display: flex; gap: 8px; align-items: center; }
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    }
    .form-control:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #f8fafc;
      cursor: pointer;
      font-size: 18px;
      flex-shrink: 0;
    }
    .btn-icon:hover { background: #f59e0b; color: #fff; border-color: #f59e0b; }

    .customer-info {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 12px;
      color: #64748b;
    }
    .outstanding-badge {
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 600;
    }

    .quick-form {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .btn-save {
      background: #0f1117;
      color: #f59e0b;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
    }

    .search-row { margin-bottom: 8px; }
    .search-box { font-size: 14px; }

    .product-results {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .product-result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.1s;
      border-bottom: 1px solid #f1f5f9;
    }
    .product-result-row:hover { background: #fffbeb; }
    .p-name { font-size: 13px; font-weight: 600; color: #374151; }
    .p-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .p-price { font-size: 14px; font-weight: 700; color: #f59e0b; }

    .empty-cart { text-align: center; padding: 30px; color: #9ca3af; font-size: 13px; }

    .cart-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .cart-table th {
      background: #f8fafc;
      padding: 8px 10px;
      text-align: left;
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .cart-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .item-name { font-weight: 600; color: #374151; }
    .item-sku  { font-size: 10px; color: #9ca3af; }
    .line-total { font-weight: 700; color: #0f1117; }

    .qty-input, .price-input, .disc-input {
      width: 60px;
      padding: 4px 6px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
    }
    .price-input { width: 80px; }

    .btn-remove {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .btn-remove:hover { background: #fee2e2; }

    /* ── Right Panel ── */
    .billing-right { }
    .summary-panel {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 0;
      position: sticky;
      top: 0;
    }
    .summary-header {
      background: #0f1117;
      color: #f59e0b;
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 12px 12px 0 0;
    }

    .summary-rows { padding: 16px 16px 0; }
    .sum-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #374151;
      border-bottom: 1px dashed #f1f5f9;
    }
    .total-row {
      font-size: 16px;
      font-weight: 800;
      color: #0f1117;
      border-top: 2px solid #0f1117;
      border-bottom: none;
      margin-top: 4px;
      padding-top: 8px;
    }
    .text-red { color: #ef4444; }

    .field-group { padding: 10px 16px 0; }
    .field-group label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }

    .mode-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .mode-btn {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #f8fafc;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.15s;
    }
    .mode-btn.active { background: #f59e0b; border-color: #f59e0b; color: #fff; }

    .balance-row {
      margin: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0fdf4;
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      color: #166534;
    }
    .balance-row.credit { background: #fff7ed; color: #9a3412; }
    .bal-amount { font-size: 18px; }

    .action-btns {
      display: flex;
      gap: 8px;
      padding: 16px;
      flex-wrap: wrap;
    }
    .btn-save-bill {
      flex: 1;
      background: #f59e0b;
      color: #0f1117;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-save-bill:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-print {
      background: #0f1117;
      color: #fff;
      border: none;
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-clear {
      background: #f8fafc;
      border: 1px solid #d1d5db;
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }

    .success-banner {
      margin: 0 16px 16px;
      background: #dcfce7;
      color: #166534;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
    }

    @media (max-width: 900px) {
      .billing-screen { grid-template-columns: 1fr; }
    }
  `]
})
export class BillingComponent implements OnInit {
  cur = environment.currency;
  storeName = environment.storeName;
  storeAddress = environment.storeAddress;
  gstNo = environment.gstNo;

  customers: any[] = [];
  products: any[] = [];
  filteredProducts: any[] = [];
  cartItems: any[] = [];

  selectedCustomerId = '';
  selectedCustomer: any = null;
  customerName = 'Walk-in Customer';
  productSearch = '';
  billDiscount = 0;
  paymentMode = 'cash';
  amountPaid = 0;
  invoiceDate = new Date().toISOString().substring(0, 10);
  notes = '';
  saving = false;
  showNewCustomer = false;
  lastInvoice: any = null;
  newCust = { name: '', phone: '', address: '' };

  paymentModes = [
    { value: 'cash',   label: 'Cash',   icon: '💵' },
    { value: 'upi',    label: 'UPI',    icon: '📱' },
    { value: 'card',   label: 'Card',   icon: '💳' },
    { value: 'credit', label: 'Credit', icon: '📋' },
  ];

  get subtotal() {
    return this.cartItems.reduce((s, i) => s + (i.qty * i.price * (1 - i.discount / 100)), 0);
  }
  get discountAmount() { return this.subtotal * this.billDiscount / 100; }
  get taxTotal() { return this.cartItems.reduce((s, i) => s + i.taxAmount, 0); }
  get grandTotal() { return this.subtotal - this.discountAmount + this.taxTotal; }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getCustomers().subscribe(c => this.customers = c);
    this.api.getProducts().subscribe(p => this.products = p);
  }

  onCustomerChange() {
    this.selectedCustomer = this.customers.find(c => c.id === this.selectedCustomerId) || null;
    this.customerName = this.selectedCustomer?.name || 'Walk-in Customer';
  }

  filterProducts() {
    const q = this.productSearch.toLowerCase();
    this.filteredProducts = q
      ? this.products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
        )
      : [];
  }

  addToCart(product: any) {
    const existing = this.cartItems.find(i => i.productId === product.id);
    if (existing) {
      existing.qty++;
      this.recalcItem(existing);
    } else {
      const item = {
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        qty: 1,
        unit: product.unit,
        price: Number(product.price),
        discount: 0,
        taxRate: Number(product.taxRate),
        taxAmount: 0,
        lineTotal: 0,
      };
      this.recalcItem(item);
      this.cartItems.push(item);
    }
    this.productSearch = '';
    this.filteredProducts = [];
  }

  recalcItem(item: any) {
    const base = item.qty * item.price * (1 - item.discount / 100);
    item.taxAmount = base * item.taxRate / 100;
    item.lineTotal = base + item.taxAmount;
  }

  recalcTotals() { /* reactive via getters */ }

  removeItem(i: number) { this.cartItems.splice(i, 1); }

  addCustomer() {
    if (!this.newCust.name) return;
    this.api.createCustomer(this.newCust).subscribe(r => {
      this.api.getCustomers().subscribe(c => {
        this.customers = c;
        this.selectedCustomerId = r.id;
        this.onCustomerChange();
        this.showNewCustomer = false;
        this.newCust = { name: '', phone: '', address: '' };
      });
    });
  }

  saveBill() {
    if (!this.cartItems.length) return;
    this.saving = true;
    const payload = {
      date: this.invoiceDate,
      customerId: this.selectedCustomerId || 'C003',
      customerName: this.customerName,
      items: this.cartItems,
      subtotal: this.subtotal,
      discountAmount: this.discountAmount,
      taxAmount: this.taxTotal,
      total: this.grandTotal,
      paidAmount: this.amountPaid || (this.paymentMode !== 'credit' ? this.grandTotal : 0),
      paymentMode: this.paymentMode,
      notes: this.notes,
      createdBy: 'admin',
    };
    this.api.createInvoice(payload).subscribe({
      next: r => {
        this.lastInvoice = r;
        this.saving = false;
      },
      error: () => { this.saving = false; alert('Error saving invoice. Check API URL.'); }
    });
  }

  printBill() {
    if (!this.lastInvoice) return;
    const w = window.open('', '_blank');
    const el = document.getElementById('print-area');
    if (w && el) {
      w.document.write('<html><body>' + el.innerHTML + '</body></html>');
      w.document.close();
      w.print();
    }
  }

  clearBill() {
    this.cartItems = [];
    this.billDiscount = 0;
    this.amountPaid = 0;
    this.paymentMode = 'cash';
    this.notes = '';
    this.lastInvoice = null;
    this.selectedCustomerId = '';
    this.selectedCustomer = null;
    this.customerName = 'Walk-in Customer';
  }
}
