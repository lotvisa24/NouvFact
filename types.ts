
export enum PaymentMode {
  CASH = 'Espèces',
  BANK_TRANSFER = 'Virement bancaire',
  MOBILE_MONEY = 'Mobile Money',
  CARD = 'Carte bancaire'
}

export enum DocumentStatus {
  DRAFT = 'Brouillon',
  PENDING = 'En attente',
  PARTIAL = 'Partiel',
  PAID = 'Payée',
  CANCELLED = 'Annulée'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit?: string;
  unitPrice: number;
  description?: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  productUnit?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceBase {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  items: LineItem[];
  discount: number;
  subtotal: number;
  total: number;
  status: DocumentStatus;
}

export interface Proforma extends InvoiceBase {
  convertedToInvoiceId?: string;
}

export interface Invoice extends InvoiceBase {
  paidAmount: number;
  balance: number;
  payments: Payment[];
  proformaId?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  invoiceId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}
