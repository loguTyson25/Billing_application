// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BillingComponent } from './features/billing/billing.component';
import { ProductsComponent } from './features/products/products.component';
import { CustomersComponent } from './features/customers/customers.component';
import { InvoicesComponent } from './features/invoices/invoices.component';
import { PaymentsComponent } from './features/payments/payments.component';
import { ReturnsComponent } from './features/returns/returns.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',  component: DashboardComponent },
  { path: 'billing',    component: BillingComponent },
  { path: 'invoices',   component: InvoicesComponent },
  { path: 'products',   component: ProductsComponent },
  { path: 'customers',  component: CustomersComponent },
  { path: 'payments',   component: PaymentsComponent },
  { path: 'returns',    component: ReturnsComponent },
  { path: 'reports',    component: ReportsComponent },
  { path: 'suppliers',  component: SuppliersComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    DashboardComponent,
    BillingComponent,
    ProductsComponent,
    CustomersComponent,
    InvoicesComponent,
    PaymentsComponent,
    ReturnsComponent,
    ReportsComponent,
    SuppliersComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forRoot(routes),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
