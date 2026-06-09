// src/app/features/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  template: `
<div class="reports-page">
  <!-- Tab nav -->
  <div class="tab-nav">
    <button *ngFor="let tab of tabs" [class.active]="activeTab === tab.id" (click)="setTab(tab.id)">
      {{ tab.icon }} {{ tab.label }}
    </button>
  </div>

  <!-- Daily Sales -->
  <div *ngIf="activeTab === 'daily'" class="report-card">
    <div class="report-controls">
      <label>Date: <input type="date" [(ngModel)]="dailyDate" class="fc" (change)="loadDaily()" /></label>
    </div>
    <div class="kpi-row" *ngIf="daily">
      <div class="kpi"><div class="kl">Total Sales</div><div class="kv">{{ cur }}{{ daily.total | number:'1.0-0' }}</div></div>
      <div class="kpi"><div class="kl">Invoice Count</div><div class="kv">{{ daily.count }}</div></div>
    </div>
    <table class="rep-table" *ngIf="daily?.invoices?.length">
      <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Mode</th></tr></thead>
      <tbody>
        <tr *ngFor="let i of daily.invoices">
          <td class="mono">{{ i.invoiceNo }}</td><td>{{ i.customerName }}</td>
          <td>{{ cur }}{{ i.total | number:'1.0-2' }}</td>
          <td class="g">{{ cur }}{{ i.paidAmount | number:'1.0-2' }}</td>
          <td class="r">{{ cur }}{{ i.balanceDue | number:'1.0-2' }}</td>
          <td>{{ i.paymentMode }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Outstanding -->
  <div *ngIf="activeTab === 'outstanding'" class="report-card">
    <div class="kpi-row" *ngIf="outstanding">
      <div class="kpi"><div class="kl">Total Outstanding</div><div class="kv text-red">{{ cur }}{{ outstanding.total | number:'1.0-0' }}</div></div>
      <div class="kpi"><div class="kl">Customers with Dues</div><div class="kv">{{ outstanding.customers?.length }}</div></div>
    </div>
    <table class="rep-table" *ngIf="outstanding?.customers?.length">
      <thead><tr><th>Customer</th><th>Phone</th><th>Outstanding</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of outstanding.customers">
          <td><strong>{{ c.name }}</strong></td>
          <td>{{ c.phone }}</td>
          <td class="text-red fw">{{ cur }}{{ c.outstanding | number:'1.0-0' }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Top Products -->
  <div *ngIf="activeTab === 'top'" class="report-card">
    <table class="rep-table" *ngIf="topProducts?.length">
      <thead><tr><th>Rank</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
      <tbody>
        <tr *ngFor="let p of topProducts; let i = index">
          <td><span class="rank">{{ i+1 }}</span></td>
          <td><strong>{{ p.name }}</strong></td>
          <td>{{ p.qty | number:'1.0-0' }}</td>
          <td class="g fw">{{ cur }}{{ p.revenue | number:'1.0-0' }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Stock Status -->
  <div *ngIf="activeTab === 'stock'" class="report-card">
    <div class="filter-row">
      <select [(ngModel)]="stockFilter" class="fc-s">
        <option value="">All</option>
        <option value="ok">OK</option>
        <option value="low">Low Stock</option>
        <option value="out">Out of Stock</option>
      </select>
    </div>
    <table class="rep-table">
      <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Status</th></tr></thead>
      <tbody>
        <tr *ngFor="let p of filteredStock">
          <td class="mono">{{ p.sku }}</td><td>{{ p.name }}</td><td>{{ p.category }}</td>
          <td>{{ p.stock }} {{ p.unit }}</td><td>{{ p.minStock }}</td>
          <td><span class="badge" [ngClass]="p.status === 'ok' ? 'b-green' : p.status === 'low' ? 'b-amber' : 'b-red'">{{ p.status }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- GST Report -->
  <div *ngIf="activeTab === 'gst'" class="report-card">
    <div class="report-controls">
      <label>From: <input type="date" [(ngModel)]="gstFrom" class="fc" /></label>
      <label>To: <input type="date" [(ngModel)]="gstTo" class="fc" /></label>
      <button class="btn-primary" (click)="loadGst()">Generate</button>
    </div>
    <div *ngIf="gstReport">
      <div class="kpi-row">
        <div class="kpi"><div class="kl">Total Sales</div><div class="kv">{{ cur }}{{ gstReport.totalSales | number:'1.0-0' }}</div></div>
        <div class="kpi"><div class="kl">Total Tax</div><div class="kv">{{ cur }}{{ gstReport.totalTax | number:'1.0-0' }}</div></div>
        <div class="kpi"><div class="kl">Invoices</div><div class="kv">{{ gstReport.invoiceCount }}</div></div>
      </div>
      <table class="rep-table">
        <thead><tr><th>GST Rate</th><th>Taxable Amount</th><th>CGST</th><th>SGST</th><th>Total Tax</th></tr></thead>
        <tbody>
          <tr *ngFor="let b of gstReport.breakdown">
            <td><strong>{{ b.rate }}%</strong></td>
            <td>{{ cur }}{{ b.taxableAmount | number:'1.0-2' }}</td>
            <td>{{ cur }}{{ b.cgst | number:'1.0-2' }}</td>
            <td>{{ cur }}{{ b.sgst | number:'1.0-2' }}</td>
            <td class="g fw">{{ cur }}{{ b.total | number:'1.0-2' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  styles: [`
    .reports-page { display:flex; flex-direction:column; gap:16px; }
    .tab-nav { display:flex; gap:8px; flex-wrap:wrap; }
    .tab-nav button {
      padding:8px 16px; border:1px solid #d1d5db; border-radius:8px;
      background:#f8fafc; cursor:pointer; font-size:13px; font-weight:600;
      transition:all 0.15s;
    }
    .tab-nav button.active { background:#f59e0b; border-color:#f59e0b; color:#0f1117; }
    .report-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:20px; }
    .report-controls { display:flex; gap:16px; align-items:center; margin-bottom:20px; flex-wrap:wrap; }
    .report-controls label { font-size:13px; color:#374151; display:flex; gap:8px; align-items:center; }
    .fc { padding:8px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; }
    .fc-s { padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; }
    .btn-primary { background:#f59e0b; color:#0f1117; border:none; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
    .kpi-row { display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
    .kpi { flex:1; min-width:120px; background:#f8fafc; border-radius:10px; padding:14px; }
    .kl { font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600; margin-bottom:6px; }
    .kv { font-size:22px; font-weight:800; color:#0f1117; }
    .kv.text-red { color:#dc2626; }
    .rep-table { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
    .rep-table th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e2e8f0; }
    .rep-table td { padding:10px 14px; border-bottom:1px solid #f1f5f9; }
    .mono { font-family:monospace; color:#6366f1; }
    .g { color:#16a34a; } .r { color:#dc2626; } .fw { font-weight:700; } .text-red { color:#dc2626; }
    .rank { background:#f59e0b; color:#0f1117; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; }
    .badge { font-size:10px; padding:3px 8px; border-radius:20px; font-weight:700; text-transform:uppercase; }
    .b-green { background:#dcfce7; color:#166534; } .b-amber { background:#fef9c3; color:#854d0e; } .b-red { background:#fee2e2; color:#991b1b; }
    .filter-row { margin-bottom:16px; }
  `]
})
export class ReportsComponent implements OnInit {
  cur = environment.currency;
  activeTab = 'daily';
  tabs = [
    { id: 'daily',       label: 'Daily Sales',    icon: '📅' },
    { id: 'outstanding', label: 'Outstanding',     icon: '⏳' },
    { id: 'top',         label: 'Top Products',    icon: '🏆' },
    { id: 'stock',       label: 'Stock Status',    icon: '📦' },
    { id: 'gst',         label: 'GST Report',      icon: '🧾' },
  ];

  daily: any = null;
  outstanding: any = null;
  topProducts: any[] = [];
  stockReport: any[] = [];
  stockFilter = '';
  gstReport: any = null;

  dailyDate = new Date().toISOString().substring(0, 10);
  gstFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  gstTo = new Date().toISOString().substring(0, 10);

  get filteredStock() {
    return this.stockReport.filter(p => !this.stockFilter || p.status === this.stockFilter);
  }

  constructor(private api: ApiService) {}

  ngOnInit() { this.setTab('daily'); }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'daily') this.loadDaily();
    if (tab === 'outstanding') this.api.getOutstanding().subscribe(r => this.outstanding = r);
    if (tab === 'top') this.api.getTopProducts().subscribe(r => this.topProducts = r);
    if (tab === 'stock') this.api.getStockStatus().subscribe(r => this.stockReport = r);
  }

  loadDaily() { this.api.getDailySales(this.dailyDate).subscribe(r => this.daily = r); }
  loadGst() { this.api.getGstReport(this.gstFrom, this.gstTo).subscribe(r => this.gstReport = r); }
}
