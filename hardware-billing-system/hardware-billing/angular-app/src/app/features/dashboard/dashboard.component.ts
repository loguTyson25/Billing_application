// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  template: `
<div class="dashboard">
  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card amber" *ngFor="let k of kpis">
      <div class="kpi-icon">{{ k.icon }}</div>
      <div class="kpi-body">
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">{{ k.value }}</div>
      </div>
    </div>
  </div>

  <div class="dash-cols">
    <!-- Recent Invoices -->
    <div class="dash-card">
      <div class="card-header">
        <h3>Recent Invoices</h3>
        <a routerLink="/invoices" class="link-all">View all →</a>
      </div>
      <div *ngIf="loading" class="loading-state">Loading...</div>
      <table class="data-table" *ngIf="!loading && data">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of data?.recentInvoices">
            <td><a routerLink="/invoices" class="inv-link">{{ inv.invoiceNo }}</a></td>
            <td>{{ inv.customerName }}</td>
            <td>{{ cur }}{{ inv.total | number:'1.0-0' }}</td>
            <td>
              <span class="badge" [ngClass]="'badge-' + inv.paymentStatus">
                {{ inv.paymentStatus }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Low Stock Alert -->
    <div class="dash-card alert-card">
      <div class="card-header">
        <h3>⚠ Low Stock Alerts</h3>
        <a routerLink="/products" class="link-all">Manage →</a>
      </div>
      <div *ngIf="!data?.lowStockItems?.length" class="empty-state">
        ✅ All products have sufficient stock
      </div>
      <div class="stock-list" *ngIf="data?.lowStockItems?.length">
        <div class="stock-row" *ngFor="let p of data?.lowStockItems">
          <span class="prod-name">{{ p.name }}</span>
          <span class="stock-badge" [class.out]="p.stock == 0">
            {{ p.stock == 0 ? 'OUT' : p.stock + ' ' + p.unit }}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #f59e0b;
    }
    .kpi-icon { font-size: 28px; }
    .kpi-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 22px; font-weight: 800; color: #0f1117; margin-top: 4px; }

    .dash-cols { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }

    .dash-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 20px;
    }
    .alert-card { border-left: 4px solid #ef4444; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-header h3 { font-size: 15px; font-weight: 700; color: #0f1117; margin: 0; }
    .link-all { font-size: 12px; color: #f59e0b; font-weight: 600; text-decoration: none; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { text-align: left; padding: 8px 12px; background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    .data-table tr:last-child td { border-bottom: none; }

    .inv-link { color: #0284c7; text-decoration: none; font-weight: 600; }

    .badge {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 20px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-paid    { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef9c3; color: #854d0e; }
    .badge-unpaid  { background: #fee2e2; color: #991b1b; }

    .stock-list { display: flex; flex-direction: column; gap: 8px; }
    .stock-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #fff7ed;
      border-radius: 8px;
    }
    .prod-name { font-size: 13px; color: #374151; font-weight: 600; }
    .stock-badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 20px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
    }
    .stock-badge.out { background: #fee2e2; color: #991b1b; }

    .loading-state { text-align: center; padding: 40px; color: #94a3b8; }
    .empty-state { text-align: center; padding: 30px; color: #10b981; font-weight: 600; }

    @media (max-width: 900px) {
      .dash-cols { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  cur = environment.currency;
  data: any = null;
  loading = true;
  kpis: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: d => {
        this.data = d;
        this.loading = false;
        this.kpis = [
          { icon: '💰', label: "Today's Sales", value: `${this.cur}${Number(d.todaySales).toLocaleString('en-IN')}` },
          { icon: '📅', label: 'Month Sales',   value: `${this.cur}${Number(d.monthSales).toLocaleString('en-IN')}` },
          { icon: '⏳', label: 'Outstanding',   value: `${this.cur}${Number(d.outstanding).toLocaleString('en-IN')}` },
          { icon: '👥', label: 'Customers',     value: d.totalCustomers },
          { icon: '📦', label: 'Products',      value: d.totalProducts },
          { icon: '⚠️', label: 'Low Stock',     value: d.lowStockCount },
        ];
      },
      error: () => { this.loading = false; }
    });
  }
}
