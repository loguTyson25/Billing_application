// src/app/shared/layout/layout.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-layout',
  template: `
<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
    <div class="brand">
      <span class="brand-icon">⚙</span>
      <span class="brand-name" *ngIf="!sidebarCollapsed">{{ storeName }}</span>
    </div>
    <nav class="nav-links">
      <a *ngFor="let item of navItems"
         [routerLink]="item.path"
         routerLinkActive="active"
         class="nav-item"
         [title]="item.label">
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
      </a>
    </nav>
    <div class="sidebar-footer">
      <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
        {{ sidebarCollapsed ? '▶' : '◀' }}
      </button>
    </div>
  </aside>

  <!-- Main content -->
  <main class="main-content">
    <header class="topbar">
      <h1 class="page-title">{{ currentRoute() }}</h1>
      <div class="topbar-actions">
        <span class="gst-badge">GST: {{ gstNo }}</span>
        <button class="btn-new-bill" routerLink="/billing">+ New Bill</button>
      </div>
    </header>
    <div class="content-area">
      <router-outlet></router-outlet>
    </div>
  </main>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .app-shell {
      display: flex;
      height: 100vh;
      background: #f0f2f5;
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
    }

    /* ── Sidebar ────────────────────────────── */
    .sidebar {
      width: 220px;
      background: #0f1117;
      color: #fff;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 60px; }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px;
      border-bottom: 1px solid #1e2130;
      background: #070a10;
    }
    .brand-icon {
      font-size: 22px;
      flex-shrink: 0;
      color: #f59e0b;
    }
    .brand-name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #e2e8f0;
      white-space: nowrap;
    }

    .nav-links {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .nav-item:hover { background: #1e2130; color: #e2e8f0; }
    .nav-item.active { background: #f59e0b; color: #0f1117; font-weight: 700; }
    .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }

    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid #1e2130;
    }
    .collapse-btn {
      background: #1e2130;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    .collapse-btn:hover { background: #2d3748; color: #fff; }

    /* ── Main ───────────────────────────────── */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .topbar {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f1117;
      margin: 0;
      letter-spacing: 0.3px;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .gst-badge {
      font-size: 11px;
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 600;
    }

    .btn-new-bill {
      background: #f59e0b;
      color: #0f1117;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-new-bill:hover { background: #d97706; }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `]
})
export class LayoutComponent {
  storeName = environment.storeName;
  gstNo = environment.gstNo;
  sidebarCollapsed = false;

  navItems = [
    { path: '/dashboard', label: 'Dashboard',   icon: '📊' },
    { path: '/billing',   label: 'New Bill',     icon: '🧾' },
    { path: '/invoices',  label: 'Invoices',     icon: '📄' },
    { path: '/products',  label: 'Products',     icon: '📦' },
    { path: '/customers', label: 'Customers',    icon: '👥' },
    { path: '/payments',  label: 'Payments',     icon: '💳' },
    { path: '/returns',   label: 'Returns',      icon: '↩️' },
    { path: '/suppliers', label: 'Suppliers',    icon: '🏭' },
    { path: '/reports',   label: 'Reports',      icon: '📈' },
  ];

  constructor(private router: Router) {}

  currentRoute() {
    const seg = this.router.url.split('/')[1];
    const item = this.navItems.find(n => n.path.includes(seg));
    return item ? item.label : 'HardwareStore Pro';
  }
}
