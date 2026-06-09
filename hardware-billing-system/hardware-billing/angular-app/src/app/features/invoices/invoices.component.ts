// src/app/features/invoices/invoices.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invoices',
  template: `
<div class="page">
  <div class="toolbar">
    <input [(ngModel)]="search" placeholder="Search invoice no, customer..." class="search-input" />
    <select [(ngModel)]="filterStatus" class="filter-select">
      <option value="">All Status</option>
      <option value="paid">Paid</option>
      <option value="partial">Partial</option>
      <option value="unpaid">Unpaid</option>
    </select>
  </div>
  <div class="table-card">
    <table class="main-table">
      <thead>
        <tr>
          <th>Invoice No</th><th>Date</th><th>Customer</th>
          <th>Total</th><th>Paid</th><th>Balance</th><th>Mode</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let inv of filtered">
          <td class="mono">{{ inv.invoiceNo }}</td>
          <td>{{ inv.date }}</td>
          <td>{{ inv.customerName }}</td>
          <td>{{ cur }}{{ inv.total | number:'1.0-2' }}</td>
          <td class="text-green">{{ cur }}{{ inv.paidAmount | number:'1.0-2' }}</td>
          <td class="text-red">{{ cur }}{{ inv.balanceDue | number:'1.0-2' }}</td>
          <td><span class="mode-tag">{{ inv.paymentMode }}</span></td>
          <td>
            <span class="badge" [ngClass]="'b-'+inv.paymentStatus">{{ inv.paymentStatus }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="!filtered.length" class="empty-state">No invoices found</div>
  </div>
</div>
  `,
  styles: [`
    .page { display:flex; flex-direction:column; gap:16px; }
    .toolbar { display:flex; gap:12px; }
    .search-input { flex:1; max-width:300px; padding:8px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; }
    .filter-select { padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; }
    .table-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:auto; }
    .main-table { width:100%; border-collapse:collapse; font-size:13px; }
    .main-table th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e2e8f0; }
    .main-table td { padding:10px 14px; border-bottom:1px solid #f1f5f9; }
    .mono { font-family:monospace; color:#6366f1; font-weight:700; }
    .text-green { color:#16a34a; font-weight:700; }
    .text-red { color:#dc2626; font-weight:700; }
    .mode-tag { background:#f1f5f9; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600; }
    .badge { font-size:10px; padding:3px 8px; border-radius:20px; font-weight:700; text-transform:uppercase; }
    .b-paid    { background:#dcfce7; color:#166534; }
    .b-partial { background:#fef9c3; color:#854d0e; }
    .b-unpaid  { background:#fee2e2; color:#991b1b; }
    .empty-state { text-align:center; padding:40px; color:#9ca3af; }
  `]
})
export class InvoicesComponent implements OnInit {
  cur = environment.currency;
  invoices: any[] = [];
  search = '';
  filterStatus = '';

  get filtered() {
    const q = this.search.toLowerCase();
    return this.invoices.filter(i => {
      const ms = !q || i.invoiceNo?.toLowerCase().includes(q) || i.customerName?.toLowerCase().includes(q);
      const mst = !this.filterStatus || i.paymentStatus === this.filterStatus;
      return ms && mst;
    });
  }

  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getInvoices().subscribe(i => this.invoices = i); }
}
