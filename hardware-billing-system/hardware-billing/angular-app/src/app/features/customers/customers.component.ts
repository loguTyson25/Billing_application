// src/app/features/customers/customers.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customers',
  template: `
<div class="page">
  <div class="toolbar">
    <input [(ngModel)]="search" placeholder="Search customers..." class="search-input" />
    <button class="btn-primary" (click)="openForm(null)">+ Add Customer</button>
  </div>
  <div class="table-card">
    <table class="main-table">
      <thead>
        <tr><th>Name</th><th>Phone</th><th>Email</th><th>Credit Limit</th><th>Outstanding</th><th>Points</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of filteredCustomers">
          <td><strong>{{ c.name }}</strong></td>
          <td>{{ c.phone }}</td>
          <td>{{ c.email }}</td>
          <td>{{ cur }}{{ c.creditLimit | number:'1.0-0' }}</td>
          <td>
            <span [style.color]="c.outstanding > 0 ? '#dc2626' : '#16a34a'" [style.fontWeight]="'700'">
              {{ cur }}{{ c.outstanding | number:'1.0-0' }}
            </span>
          </td>
          <td>{{ c.loyaltyPoints }}</td>
          <td>
            <button class="btn-edit" (click)="openForm(c)">✎ Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">{{ editing ? 'Edit Customer' : 'Add Customer' }}
      <button class="modal-close" (click)="closeForm()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field full"><label>Name *</label><input [(ngModel)]="form.name" class="fc" /></div>
        <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" class="fc" /></div>
        <div class="field"><label>Email</label><input [(ngModel)]="form.email" class="fc" type="email" /></div>
        <div class="field full"><label>Address</label><textarea [(ngModel)]="form.address" class="fc" rows="2"></textarea></div>
        <div class="field"><label>Credit Limit ({{ cur }})</label><input type="number" [(ngModel)]="form.creditLimit" class="fc" /></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="closeForm()">Cancel</button>
      <button class="btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; }
    .toolbar { display: flex; gap: 12px; justify-content: space-between; }
    .search-input { flex:1; max-width:300px; padding:8px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; }
    .btn-primary { background:#f59e0b; color:#0f1117; border:none; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-secondary { background:#f8fafc; border:1px solid #d1d5db; padding:8px 18px; border-radius:8px; font-size:13px; cursor:pointer; }
    .table-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:auto; }
    .main-table { width:100%; border-collapse:collapse; font-size:13px; }
    .main-table th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e2e8f0; }
    .main-table td { padding:10px 14px; border-bottom:1px solid #f1f5f9; }
    .btn-edit { background:none; border:1px solid #e2e8f0; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; }
    .btn-edit:hover { background:#eff6ff; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#fff; border-radius:16px; width:560px; max-width:95vw; }
    .modal-header { padding:16px 20px; font-size:16px; font-weight:700; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; }
    .modal-close { background:none; border:none; cursor:pointer; font-size:18px; }
    .modal-body { padding:20px; }
    .modal-footer { padding:16px 20px; border-top:1px solid #e2e8f0; display:flex; gap:10px; justify-content:flex-end; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .field { display:flex; flex-direction:column; gap:4px; }
    .field.full { grid-column:1/-1; }
    .field label { font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; }
    .fc { padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; width:100%; box-sizing:border-box; }
  `]
})
export class CustomersComponent implements OnInit {
  cur = environment.currency;
  customers: any[] = [];
  search = '';
  showForm = false;
  editing: any = null;
  saving = false;
  form: any = {};

  get filteredCustomers() {
    const q = this.search.toLowerCase();
    return this.customers.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }

  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getCustomers().subscribe(c => this.customers = c); }

  openForm(c: any) { this.editing = c; this.form = c ? {...c} : {name:'',phone:'',email:'',address:'',creditLimit:0}; this.showForm = true; }
  closeForm() { this.showForm = false; }

  save() {
    this.saving = true;
    const obs = this.editing ? this.api.updateCustomer(this.form) : this.api.createCustomer(this.form);
    obs.subscribe({ next: () => { this.api.getCustomers().subscribe(c => { this.customers = c; this.closeForm(); this.saving = false; }); }, error: () => this.saving = false });
  }
}
