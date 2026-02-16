
import { Product, Client, Proforma, Invoice, Payment, DocumentStatus, PaymentMode } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'pn_products',
  CLIENTS: 'pn_clients',
  PROFORMAS: 'pn_proformas',
  INVOICES: 'pn_invoices',
  PAYMENTS: 'pn_payments',
  AUDIT: 'pn_audit_log',
  SETTINGS: 'pn_settings'
};

// Initial Data
const initialProducts: Product[] = [
  { id: '1', name: 'Paracétamol 500mg', category: 'Antalgiques', unit: 'Boîte', unitPrice: 1500, isActive: true },
  { id: '2', name: 'Amoxicilline 1g', category: 'Antibiotiques', unit: 'Boîte', unitPrice: 3500, isActive: true },
  { id: '3', name: 'Sirop Toux Enfant', category: 'Pédiatrie', unit: 'Flacon', unitPrice: 2800, isActive: true },
  { id: '4', name: 'Masques Chirurgicaux (50pcs)', category: 'Matériel', unit: 'Paquet', unitPrice: 5000, isActive: true },
  { id: '5', name: 'Solution Hydroalcoolique 500ml', category: 'Hygiène', unit: 'Flacon', unitPrice: 1200, isActive: true },
];

const initialClients: Client[] = [
  { id: 'c1', name: 'Clinique de la Paix', phone: '+225 01 02 03 04', address: 'Abidjan, Cocody' },
  { id: 'c2', name: 'Jean Dupont', phone: '+221 77 123 45 67', address: 'Dakar, Plateau' },
];

class DataService {
  private get<T>(key: string, initial: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  }

  private set<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Settings
  getSettings() { return this.get<any>(STORAGE_KEYS.SETTINGS, { showUnitColumn: true }); }
  saveSettings(data: any) { this.set(STORAGE_KEYS.SETTINGS, data); }

  // Products
  getProducts() { return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts); }
  saveProducts(data: Product[]) { this.set(STORAGE_KEYS.PRODUCTS, data); }

  // Clients
  getClients() { return this.get<Client[]>(STORAGE_KEYS.CLIENTS, initialClients); }
  saveClients(data: Client[]) { this.set(STORAGE_KEYS.CLIENTS, data); }

  // Proformas
  getProformas() { return this.get<Proforma[]>(STORAGE_KEYS.PROFORMAS, []); }
  saveProformas(data: Proforma[]) { this.set(STORAGE_KEYS.PROFORMAS, data); }

  // Invoices
  getInvoices() { return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []); }
  saveInvoices(data: Invoice[]) { this.set(STORAGE_KEYS.INVOICES, data); }

  // Dashboard Stats
  getStats() {
    const invoices = this.getInvoices();
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);

    const dailyTurnover = invoices
      .filter(i => i.date.startsWith(today) && i.status !== DocumentStatus.CANCELLED)
      .reduce((sum, i) => sum + i.total, 0);

    const monthlyTurnover = invoices
      .filter(i => i.date.startsWith(month) && i.status !== DocumentStatus.CANCELLED)
      .reduce((sum, i) => sum + i.total, 0);

    const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalRemaining = invoices.reduce((sum, i) => sum + i.balance, 0);
    
    return {
      dailyTurnover,
      monthlyTurnover,
      totalCollected,
      totalRemaining,
      invoiceCount: invoices.length
    };
  }
}

export const dataService = new DataService();
