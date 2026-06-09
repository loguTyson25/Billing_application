// src/app/features/returns/returns.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({ selector: 'app-returns', template: `
<div class="page">
  <div class="toolbar">
    <h2 style="margin:0">Returns & Exchanges</h2>
    <button class="btn-primary" (click)="showForm=true">+ New Return</button>
  </div>
  <div class="table-card">
    <table class="main-table">
      <thead><tr><th>Return No</th><th>Invoice</th><th>Date</th><th>Customer</th><th>Reason</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of returns">
          <td class="mono">{{ r.returnNo }}</td><td>{{ r.invoiceNo }}</td>
          <td>{{ r.date }}</td><td>{{ r.customerName }}</td>
          <td>{{ r.reason }}</td>
          <td>{{ cur }}{{ r.total | number:'1.0-2' }}</td>
          <td><span class="badge badge-green">{{ r.status }}</span></td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!returns.length" class="empty-state">No returns recorded</div>
  </div>
</div>

<div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">Record Return <button class="modal-close" (click)="showForm=false">✕</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="field"><label>Invoice No *</label><input [(ngModel)]="form.invoiceNo" class="fc" /></div>
        <div class="field"><label>Date</label><input type="date" [(ngModel)]="form.date" class="fc" /></div>
        <div class="field full"><label>Customer Name</label><input [(ngModel)]="form.customerName" class="fc" /></div>
        <div class="field full"><label>Reason</label><textarea [(ngModel)]="form.reason" class="fc" rows="2"></textarea></div>
        <div class="field"><label>Return Total ({{ cur }})</label><input type="number" [(ngModel)]="form.total" class="fc" /></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" (click)="showForm=false">Cancel</button>
      <button class="btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Return' }}</button>
    </div>
  </div>
</div>
`, styles: [`
  .page{display:flex;flex-direction:column;gap:16px;} .toolbar{display:flex;justify-content:space-between;align-items:center;}
  .btn-primary{background:#f59e0b;color:#0f1117;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
  .btn-secondary{background:#f8fafc;border:1px solid #d1d5db;padding:8px 18px;border-radius:8px;cursor:pointer;}
  .table-card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:auto;}
  .main-table{width:100%;border-collapse:collapse;font-size:13px;}
  .main-table th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;}
  .main-table td{padding:10px 14px;border-bottom:1px solid #f1f5f9;}
  .mono{font-family:monospace;color:#6366f1;font-weight:700;}
  .badge{font-size:10px;padding:3px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;}
  .badge-green{background:#dcfce7;color:#166534;}
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
export class ReturnsComponent implements OnInit {
  cur = environment.currency;
  returns: any[] = [];
  showForm = false;
  saving = false;
  form: any = { invoiceNo:'', invoiceId:'', date: new Date().toISOString().substring(0,10), customerName:'', reason:'', total:0, items:[] };
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getReturns().subscribe(r => this.returns = r); }
  save() { this.saving=true; this.api.createReturn(this.form).subscribe({ next: () => { this.showForm=false; this.saving=false; this.ngOnInit(); }, error: () => this.saving=false }); }
}
