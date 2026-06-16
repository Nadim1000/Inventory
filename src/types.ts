export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  purchasePrice: number;
  salesPrice: number;
  category: string;
  unit: string;
  minStockAlert: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  dueAmount: number; // For "Baqi" / unpaid receivables
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;
  customerId?: string; // Optional if customer is walk-in
  customerName: string;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
}

export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  currency: string;
  taxRate: number;
  language: 'bn' | 'en';
}

export interface UserProfile {
  id: string;
  email: string;
  settings: BusinessSettings;
}
