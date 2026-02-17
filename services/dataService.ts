import { Product, Client, Proforma, Invoice, Payment, DocumentStatus, PaymentMode } from '../types.ts';

const STORAGE_KEYS = {
  INITIALIZED: 'pn_initialized_v1',
  PRODUCTS: 'pn_products',
  CLIENTS: 'pn_clients',
  PROFORMAS: 'pn_proformas',
  INVOICES: 'pn_invoices',
  SETTINGS: 'pn_settings'
};

// Données de base (uniquement pour le tout premier lancement)
const initialProducts: Product[] = [
  { id: '1', name: 'Paracétamol 500mg', category: 'Antalgiques', unit: 'Boîte', unitPrice: 1500, isActive: true },
  { id: '2', name: 'Amoxicilline 1g', category: 'Antibiotiques', unit: 'Boîte', unitPrice: 3500, isActive: true },
  { id: '3', name: 'Sirop Toux Enfant', category: 'Pédiatrie', unit: 'Flacon', unitPrice: 2800, isActive: true },
];

const initialClients: Client[] = [
  { id: 'c1', name: 'Clinique de la Paix', phone: '+225 01 02 03 04', address: 'Abidjan, Cocody' },
];

class DataService {
  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      console.log("[DataService] Premier lancement : Initialisation des données par défaut...");
      this.set(STORAGE_KEYS.PRODUCTS, initialProducts);
      this.set(STORAGE_KEYS.CLIENTS, initialClients);
      this.set(STORAGE_KEYS.PROFORMAS, []);
      this.set(STORAGE_KEYS.INVOICES, []);
      this.set(STORAGE_KEYS.SETTINGS, { showUnitColumn: true });
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data === null) return fallback;
      return JSON.parse(data);
    } catch (e) {
      console.error(`Erreur de lecture pour ${key}:`, e);
      return fallback;
    }
  }

  private set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Erreur d'écriture pour ${key}:`, e);
      alert("Erreur : Espace de stockage saturé ou inaccessible.");
    }
  }

  // Settings
  getSettings() { return this.get<any>(STORAGE_KEYS.SETTINGS, { showUnitColumn: true }); }
  saveSettings(data: any) { this.set(STORAGE_KEYS.SETTINGS, data); }

  // Products
  getProducts() { return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []); }
  saveProducts(data: Product[]) { this.set(STORAGE_KEYS.PRODUCTS, data); }

  // Clients
  getClients() { return this.get<Client[]>(STORAGE_KEYS.CLIENTS, []); }
  saveClients(data: Client[]) { this.set(STORAGE_KEYS.CLIENTS, data); }

  // Proformas
  getProformas() { return this.get<Proforma[]>(STORAGE_KEYS.PROFORMAS, []); }
  saveProformas(data: Proforma[]) { this.set(STORAGE_KEYS.PROFORMAS, data); }

  // Invoices
  getInvoices() { return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []); }
  saveInvoices(data: Invoice[]) { this.set(STORAGE_KEYS.INVOICES, data); }

  // Data Management
  exportFullBackup() {
    const backup: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      backup[key] = localStorage.getItem(key);
    });
    return JSON.stringify({
      appName: 'Pharmacie Nouvelle',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      data: backup
    }, null, 2);
  }

  importFullBackup(jsonString: string) {
    try {
      const wrapper = JSON.parse(jsonString);
      const backup = wrapper.data || wrapper; // Gère les anciens et nouveaux formats
      
      Object.entries(backup).forEach(([key, value]) => {
        if (value !== null && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });
      return true;
    } catch (e) {
      console.error("Erreur import:", e);
      return false;
    }
  }

  resetAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }

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

    return {
      dailyTurnover,
      monthlyTurnover,
      totalCollected: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
      totalRemaining: invoices.reduce((sum, i) => sum + i.balance, 0),
      invoiceCount: invoices.length
    };
  }
}

export const dataService = new DataService();