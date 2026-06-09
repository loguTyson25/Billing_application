// src/app/core/services/api.service.ts
// CORS FIX: Google Apps Script blocks OPTIONS preflight on POST requests.
// Solution: Send ALL requests as GET with data encoded as a 'payload' query param.
// The Apps Script doGet() handler reads e.parameter.payload and routes accordingly.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // All reads — standard GET
  private get<T>(path: string, params: Record<string, string> = {}): Observable<T> {
    let p = new HttpParams().set('path', path);
    Object.entries(params).forEach(([k, v]) => p = p.set(k, v));
    return this.http.get<{ status: number; data: T }>(this.base, { params: p })
      .pipe(map(r => r.data));
  }

  // All writes — also GET, body encoded as JSON string in 'payload' param
  // This avoids CORS preflight (OPTIONS) which Apps Script cannot handle
  private post<T>(path: string, body: any, action = 'create'): Observable<T> {
    let p = new HttpParams()
      .set('path', path)
      .set('action', action)
      .set('payload', JSON.stringify(body));
    return this.http.get<{ status: number; data: T }>(this.base, { params: p })
      .pipe(map(r => r.data));
  }

  // ── Products ──────────────────────────────────────────────
  getProducts()             { return this.get<any[]>('products'); }
  createProduct(p: any)     { return this.post<any>('products', p); }
  updateProduct(p: any)     { return this.post<any>('products', p, 'update'); }
  deleteProduct(id: string) { return this.post<any>('products', { id }, 'delete'); }

  // ── Customers ─────────────────────────────────────────────
  getCustomers()            { return this.get<any[]>('customers'); }
  createCustomer(c: any)    { return this.post<any>('customers', c); }
  updateCustomer(c: any)    { return this.post<any>('customers', c, 'update'); }

  // ── Invoices ──────────────────────────────────────────────
  getInvoices()             { return this.get<any[]>('invoices'); }
  getInvoice(id: string)    { return this.get<any>('invoices', { id }); }
  createInvoice(inv: any)   { return this.post<any>('invoices', inv); }

  // ── Payments ──────────────────────────────────────────────
  recordPayment(pay: any)   { return this.post<any>('payments', pay); }

  // ── Returns ───────────────────────────────────────────────
  getReturns()              { return this.get<any[]>('returns'); }
  createReturn(ret: any)    { return this.post<any>('returns', ret); }

  // ── Suppliers ─────────────────────────────────────────────
  getSuppliers()            { return this.get<any[]>('suppliers'); }
  createSupplier(s: any)    { return this.post<any>('suppliers', s); }
  updateSupplier(s: any)    { return this.post<any>('suppliers', s, 'update'); }

  // ── Dashboard ─────────────────────────────────────────────
  getDashboard()            { return this.get<any>('dashboard'); }

  // ── Reports ───────────────────────────────────────────────
  getDailySales(date?: string) {
    return this.get<any>('reports/daily-sales', date ? { date } : {});
  }
  getOutstanding()   { return this.get<any>('reports/outstanding'); }
  getTopProducts()   { return this.get<any[]>('reports/top-products'); }
  getStockStatus()   { return this.get<any[]>('reports/stock-status'); }
  getGstReport(from: string, to: string) {
    return this.get<any>('reports/gst', { from, to });
  }
}
