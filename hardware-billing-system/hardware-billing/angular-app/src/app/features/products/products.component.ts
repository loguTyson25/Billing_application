// src/app/features/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  template: `
<div class="products-page">
  <!-- Toolbar -->
  <div class="toolbar">
    <input [(ngModel)]="search" placeholder="Search products..." class="search-input" />
    <div class="toolbar-right">
      <select [(ngModel)]="filterCategory" class="filter-select">
        <option value="">All Categories</option>
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
      <button class="btn-primary" (click)="openForm(null)">+ Add Product</button>
    </div>
  </div>

  <!-- Table -->
  <div class="table-card">
    <table class="main-table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Name</th>
          <th>Category</th>
          <th>Unit</th>
          <th>Price</th>
          <th>Tax%</th>
          <th>HSN</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of filteredProducts">
          <td class="mono">{{ p.sku }}</td>
          <td><strong>{{ p.name }}</strong></td>
          <td>{{ p.category }}</td>
          <td>{{ p.unit }}</td>
          <td>{{ cur }}{{ p.price | number:'1.0-2' }}</td>
          <td>{{ p.taxRate }}%</td>
          <td class="mono">{{ p.hsnCode }}</td>
          <td>
            <span class="stock-pill" [class.low]="p.stock <= p.minStock" [class.out]="p.stock == 0">
              {{ p.stock }}
            </span>
          </td>
          <td>
            <span class="badge" [ngClass]="p.stock == 0 ? 'badge-red' : p.stock <= p.minStock ? 'badge-amber' : 'badge-green'">
              {{ p.stock == 0 ? 'Out' : p.stock <= p.minStock ? 'Low' : 'OK' }}
            </span>
          </td>
          <td>
            <button class="btn-edit" (click)="openForm(p)">✎</button>
            <button class="btn-del" (click)="deleteProduct(p)">✕</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!filteredProducts.length" class="empty-table">No products found</div>
  </div>
</div>

<!-- Modal -->
<div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">
      {{ editingProduct ? 'Edit Product' : 'Add New Product' }}
      <button class="modal-close" (click)="closeForm()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field">
          <label>SKU *</label>
          <input [(ngModel)]="form.sku" class="fc" placeholder="e.g. SKU001" />
        </div>
        <div class="field">
          <label>Barcode</label>
          <input [(ngModel)]="form.barcode" class="fc" placeholder="EAN / barcode" />
        </div>
        <div class="field full">
          <label>Product Name *</label>
          <input [(ngModel)]="form.name" class="fc" placeholder="Product name" />
        </div>
        <div class="field">
          <label>Category</label>
          <input [(ngModel)]="form.category" class="fc" placeholder="e.g. Steel" list="cat-list" />
          <datalist id="cat-list">
            <option *ngFor="let c of categories" [value]="c"></option>
          </datalist>
        </div>
        <div class="field">
          <label>Unit</label>
          <select [(ngModel)]="form.unit" class="fc">
            <option *ngFor="let u of units" [value]="u">{{ u }}</option>
          </select>
        </div>
        <div class="field">
          <label>Price ({{ cur }}) *</label>
          <input type="number" [(ngModel)]="form.price" class="fc" />
        </div>
        <div class="field">
          <label>Tax Rate (%)</label>
          <select [(ngModel)]="form.taxRate" class="fc">
            <option [ngValue]="0">0%</option>
            <option [ngValue]="5">5% (GST)</option>
            <option [ngValue]="12">12% (GST)</option>
            <option [ngValue]="18">18% (GST)</option>
            <option [ngValue]="28">28% (GST)</option>
          </select>
        </div>
        <div class="field">
          <label>HSN Code</label>
          <input [(ngModel)]="form.hsnCode" class="fc" placeholder="8 digit HSN" />
        </div>
        <div class="field">
          <label>Stock Qty</label>
          <input type="number" [(ngModel)]="form.stock" class="fc" />
        </div>
        <div class="field">
          <label>Min Stock Alert</label>
          <input type="number" [(ngModel)]="form.minStock" class="fc" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="closeForm()">Cancel</button>
      <button class="btn-primary" (click)="saveProduct()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Save Product' }}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .products-page { display: flex; flex-direction: column; gap: 16px; }

    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    }
    .toolbar-right { display: flex; gap: 8px; }
    .search-input {
      flex: 1;
      max-width: 300px;
      padding: 8px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
    }
    .filter-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
    }
    .btn-primary {
      background: #f59e0b;
      color: #0f1117;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-secondary {
      background: #f8fafc;
      border: 1px solid #d1d5db;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }

    .table-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: auto;
    }
    .main-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .main-table th {
      background: #f8fafc;
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .main-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #374151;
    }
    .main-table tr:last-child td { border-bottom: none; }
    .mono { font-family: monospace; font-size: 12px; color: #6366f1; }
    .empty-table { text-align: center; padding: 40px; color: #9ca3af; }

    .stock-pill {
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      background: #f0fdf4;
      color: #166534;
    }
    .stock-pill.low { background: #fef9c3; color: #854d0e; }
    .stock-pill.out { background: #fee2e2; color: #991b1b; }

    .badge { font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef9c3; color: #854d0e; }
    .badge-red   { background: #fee2e2; color: #991b1b; }

    .btn-edit, .btn-del {
      background: none;
      border: 1px solid #e2e8f0;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      margin-right: 4px;
      font-size: 13px;
    }
    .btn-edit:hover { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
    .btn-del:hover  { background: #fee2e2; border-color: #ef4444; color: #ef4444; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      border-radius: 16px;
      width: 620px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    .modal-close { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .fc {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      width: 100%;
      box-sizing: border-box;
    }
    .fc:focus { outline: none; border-color: #f59e0b; }
  `]
})
export class ProductsComponent implements OnInit {
  cur = environment.currency;
  products: any[] = [];
  search = '';
  filterCategory = '';
  showForm = false;
  editingProduct: any = null;
  saving = false;

  units = ['Piece', 'Kg', 'Gram', 'Meter', 'Liter', 'Box', 'Bag', 'Bundle', 'Cubic Ft', 'Sq Ft', 'Roll'];
  categories = ['Building Materials', 'Steel', 'Aggregates', 'Plumbing', 'Electrical', 'Paints', 'Flooring', 'Hardware', 'Tools'];

  form: any = this.emptyForm();

  get filteredProducts() {
    return this.products.filter(p => {
      const q = this.search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = !this.filterCategory || p.category === this.filterCategory;
      return matchSearch && matchCat;
    });
  }

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getProducts().subscribe(p => this.products = p); }

  emptyForm() {
    return { sku: '', name: '', category: '', unit: 'Piece', price: 0, taxRate: 18, hsnCode: '', stock: 0, minStock: 5, barcode: '' };
  }

  openForm(product: any) {
    this.editingProduct = product;
    this.form = product ? { ...product } : this.emptyForm();
    this.showForm = true;
  }
  closeForm() { this.showForm = false; this.editingProduct = null; }

  saveProduct() {
    if (!this.form.name || !this.form.sku) return alert('Name and SKU are required');
    this.saving = true;
    const action = this.editingProduct ? 'update' : 'create';
    this.api.updateProduct(this.form).subscribe({
      next: () => { this.load(); this.closeForm(); this.saving = false; },
      error: () => this.saving = false
    });
  }

  deleteProduct(p: any) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    this.api.deleteProduct(p.id).subscribe(() => this.load());
  }
}
