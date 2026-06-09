// src/app/features/suppliers/suppliers.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({ selector: 'app-suppliers', template: `
<div class="page">
  <div class="toolbar">
    <input [(ngModel)]="search" placeholder="Search suppliers..." class="search-input" />
    <button class="btn-primary" (click)="openForm(null)">+ Add Supplier</button>
  </div>
  <div class="table-card">
    <table class="main-table">
      <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>GST No</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let s of filtered">
          <td><strong>{{ s.name }}</strong></td><td>{{ s.contact }}</td><td>{{ s.phone }}</td>
          <td>{{ s.email }}</td><td class="mono">{{ s.gstNo }}</td>
          <td><button class="btn-edit" (click)="openForm(s)">✎ Edit</button></td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!filtered.length" class="empty-state">No suppliers found</div>
  </div>
</div>
<div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">{{ editing ? 'Edit Supplier' : 'Add Supplier' }}
      <button class="modal-close" (click)="closeForm()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field full"><label>Company Name *</label><input [(ngModel)]="form.name" class="fc" /></div>
        <div class="field"><label>Contact Person</label><input [(ngModel)]="form.contact" class="fc" /></div>
        <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" class="fc" /></div>
        <div class="field"><label>Email</label><input [(ngModel)]="form.email" class="fc" type="email" /></div>
        <div class="field"><label>GST No</label><input [(ngModel)]="form.gstNo" class="fc" /></div>
        <div class="field full"><label>Address</label><textarea [(ngModel)]="form.address" class="fc" rows="2"></textarea></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="closeForm()">Cancel</button>
      <button class="btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
    </div>
  </div>
</div>
`, styles: [`
  .page{display:flex;flex-direction:column;gap:16px;} .toolbar{display:flex;gap:12px;justify-content:space-between;}
  .search-input{flex:1;max-width:300px;padding:8px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;}
  .btn-primary{background:#f59e0b;color:#0f1117;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
  .btn-secondary{background:#f8fafc;border:1px solid #d1d5db;padding:8px 18px;border-radius:8px;cursor:pointer;}
  .table-card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:auto;}
  .main-table{width:100%;border-collapse:collapse;font-size:13px;}
  .main-table th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;}
  .main-table td{padding:10px 14px;border-bottom:1px solid #f1f5f9;}
  .mono{font-family:monospace;font-size:12px;color:#6366f1;}
  .btn-edit{background:none;border:1px solid #e2e8f0;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;}
  .empty-state{text-align:center;padding:40px;color:#9ca3af;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;}
  .modal{background:#fff;border-radius:16px;width:520px;max-width:95vw;}
  .modal-header{padding:16px 20px;font-size:16px;font-weight:700;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;}
  .modal-close{background:none;border:none;cursor:pointer;font-size:18px;}
  .modal-body{padding:20px;} .modal-footer{padding:16px 20px;border-top:1px solid #e2e8f0;display:flex;gap:10px;justify-content:flex-end;}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .field{display:flex;flex-direction:column;gap:4px;} .field.full{grid-column:1/-1;}
  .field label{font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;}
  .fc{padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;width:100%;box-sizing:border-box;}
`]})
export class SuppliersComponent implements OnInit {
  suppliers: any[] = [];
  search = '';
  showForm = false;
  editing: any = null;
  saving = false;
  form: any = {};

  get filtered() {
    const q = this.search.toLowerCase();
    return this.suppliers.filter(s => !q || s.name.toLowerCase().includes(q));
  }

  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getSuppliers().subscribe(s => this.suppliers = s); }
  openForm(s: any) { this.editing = s; this.form = s ? {...s} : {name:'',contact:'',phone:'',email:'',gstNo:'',address:''}; this.showForm = true; }
  closeForm() { this.showForm = false; }
  save() {
    this.saving = true;
    const obs = this.editing ? this.api.updateSupplier(this.form) : this.api.createSupplier(this.form);
    obs.subscribe({ next: () => { this.api.getSuppliers().subscribe(s => { this.suppliers = s; this.closeForm(); this.saving = false; }); }, error: () => this.saving = false });
  }
}
