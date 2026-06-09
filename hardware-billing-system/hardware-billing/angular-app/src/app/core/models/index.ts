// src/app/core/models/index.ts

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  taxRate: number;
  hsnCode: string;
  stock: number;
  minStock: number;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  outstanding: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  sku: string;
  productName: string;
  qty: number;
  unit: string;
  price: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id?: string;
  invoiceNo?: string;
  date: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: 'cash' | 'upi' | 'card' | 'credit';
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  createdBy?: string;
}

export interface Payment {
  id?: string;
  invoiceId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  amount: number;
  mode: string;
  date: string;
  reference?: string;
  notes?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface Return {
  id?: string;
  returnNo?: string;
  invoiceId: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  reason: string;
  total: number;
  items: ReturnItem[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  gstNo: string;
}

export interface DashboardData {
  todaySales: number;
  monthSales: number;
  outstanding: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockItems: Product[];
  recentInvoices: Invoice[];
}
