// src/app/features/payments/payments.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payments',
  template: `
<div class="page">
  <div class="toolbar">
    <h2 style="margin:0;font-size:18px;">Payment Collections</h2>
    <button class="btn-primary" (click)="showForm=true">+ Record Payment</button>
  </div>

  <!-- Outstanding customers -->
  <div class="outstanding-card">
    <div class="oc-header">⏳ Outstanding Dues</div>
    <div class="oc-body">
      <div *ngIf="loadingOut" class="loading">Loading...</div>
      <div class="due-list" *ngIf="!loadingOut">
        <div class="due-row" *ngFor="let c of outstanding">
          <div>
            <div class="due-name">{{ c.name }}</div>
            <div class="due-phone">{{ c.phone }}</div>
          </div>
          <div class="due-amount">{{ cur }}{{ c.outstanding | number:'1.0-0' }}</div>
          <button class="btn-collect" (click)="presetPayment(c)">Collect</button>
        </div>
        <div *ngIf="!outstanding.length" class="all-clear">✅ No outstanding dues</div>
      </div>
    </div>
  </div>
</div>

<!-- Payment Modal -->
<div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">Record Payment <button class="modal-close" (click)="showForm=false">✕</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field full"><label>Invoice No *</label><input [(ngModel)]="form.invoiceNo" class="fc" placeholder="INV-2025-0001" /></div>
        <div class="field full"><label>Customer Name</label><input [(ngModel)]="form.customerName" class="fc" /></div>
        <div class="field"><label>Amount ({{ cur }}) *</label><input type="number" [(ngModel)]="form.amount" class="fc" /></div>
        <div class="field"><label>Date</label><input type="date" [(ngModel)]="form.date" class="fc" /></div>
        <div class="field">
          <label>Mode</label>
          <select [(ngModel)]="form.mode" class="fc">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div class="field"><label>Reference No</label><input [(ngModel)]="form.reference" class="fc" placeholder="UPI txn ID etc." /></div>
        <div class="field full"><label>Notes</label><textarea [(ngModel)]="form.notes" class="fc" rows="2"></textarea></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="showForm=false">Cancel</button>
      <button class="btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Payment' }}</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; }
    .toolbar { display:flex; justify-content:space-between; align-items:center; }
    .btn-primary { background:#f59e0b; color:#0f1117; border:none; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-secondary { background:#f8fafc; border:1px solid #d1d5db; padding:8px 18px; border-radius:8px; cursor:pointer; }
    .outstanding-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; }
    .oc-header { background:#fef3c7; padding:12px 16px; font-size:14px; font-weight:700; color:#92400e; border-bottom:1px solid #fde68a; }
    .oc-body { padding:16px; }
    .due-list { display:flex; flex-direction:column; gap:10px; }
    .due-row { display:flex; align-items:center; gap:16px; background:#f8fafc; padding:12px 16px; border-radius:10px; }
    .due-name { font-size:14px; font-weight:700; color:#0f1117; }
    .due-phone { font-size:12px; color:#64748b; }
    .due-amount { margin-left:auto; font-size:18px; font-weight:800; color:#dc2626; }
    .btn-collect { background:#0f1117; color:#f59e0b; border:none; padding:6px 14px; border-radius:8px; font-weight:700; cursor:pointer; font-size:12px; }
    .all-clear { text-align:center; padding:30px; color:#10b981; font-weight:600; }
    .loading { text-align:center; padding:30px; color:#9ca3af; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#fff; border-radius:16px; width:520px; max-width:95vw; }
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
export class PaymentsComponent implements OnInit {
  cur = environment.currency;
  outstanding: any[] = [];
  loadingOut = true;
  showForm = false;
  saving = false;
  form: any = this.emptyForm();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getOutstanding().subscribe({ next: r => { this.outstanding = r.customers; this.loadingOut = false; }, error: () => this.loadingOut = false });
  }

  emptyForm() {
    return { invoiceId:'', invoiceNo:'', customerId:'', customerName:'', amount:0, mode:'cash', date: new Date().toISOString().substring(0,10), reference:'', notes:'' };
  }

  presetPayment(c: any) {
    this.form = { ...this.emptyForm(), customerName: c.name, customerId: c.id, amount: c.outstanding };
    this.showForm = true;
  }

  save() {
    this.saving = true;
    this.api.recordPayment(this.form).subscribe({ next: () => { this.showForm = false; this.saving = false; this.form = this.emptyForm(); this.ngOnInit(); }, error: () => this.saving = false });
  }
}
