
import { Product, Client, Proforma, Invoice, Payment, DocumentStatus, CompanyInfo } from '../types.ts';

/**
 * VERSIONING: Permet de faire évoluer la structure sans perdre les données
 */
const DB_VERSION = '2.0';
const STORAGE_KEYS = {
  VERSION: 'pn_db_version',
  PRODUCTS: 'pn_products_v2',
  CLIENTS: 'pn_clients_v2',
  PROFORMAS: 'pn_proformas_v2',
  INVOICES: 'pn_invoices_v2',
  SETTINGS: 'pn_settings_v2',
  COMPANY_INFO: 'pn_company_info_v2',
  HAS_USER_DATA: 'pn_has_user_data' // Clé critique : si présente, on n'écrase JAMAIS
};

class DataService {
  private isInitialized = false;

  constructor() {
    this.initDatabase();
  }

  /**
   * Initialisation sécurisée : 
   * Ne charge les données par défaut QUE si le stockage est totalement vide.
   */
  private initDatabase() {
    const hasData = localStorage.getItem(STORAGE_KEYS.HAS_USER_DATA);
    
    if (!hasData) {
      console.warn("[DataService] Initialisation des données d'usine (Premier lancement)...");
      this.setupDefaultData();
      localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, 'true');
    }
    this.isInitialized = true;
  }

  private setupDefaultData() {
    const defaultProducts: Product[] = [
      { id: '1', name: 'Paracétamol 500mg', category: 'Antalgiques', unit: 'Boîte', unitPrice: 1500, isActive: true },
      { id: '2', name: 'Amoxicilline 1g', category: 'Antibiotiques', unit: 'Boîte', unitPrice: 3500, isActive: true }
    ];

    const defaultCompany: CompanyInfo = {
      name: 'Pharmacie Nouvelle',
      address: 'Abidjan - Plateau, Avenue Jean Paul II',
      phone: '+225 21 00 00 00',
      slogan: 'Votre santé, notre priorité.',
    };

    this.saveProducts(defaultProducts);
    this.saveCompanyInfo(defaultCompany);
    this.saveClients([]);
    this.saveProformas([]);
    this.saveInvoices([]);
    this.saveSettings({ showUnitColumn: true });
  }

  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data === null) return fallback;
      return JSON.parse(data);
    } catch (e) {
      console.error(`Erreur de lecture : ${key}`, e);
      return fallback;
    }
  }

  private set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // On marque qu'il y a des données dès qu'un 'set' est effectué
      localStorage.setItem(STORAGE_KEYS.HAS_USER_DATA, 'true');
    } catch (e) {
      console.error("Erreur critique de persistence :", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("Attention : Mémoire du navigateur pleine. Veuillez supprimer d'anciennes factures.");
      }
    }
  }

  // --- PERSISTENCE DE L'ENTREPRISE ---
  getCompanyInfo() { return this.get<CompanyInfo>(STORAGE_KEYS.COMPANY_INFO, {} as CompanyInfo); }
  saveCompanyInfo(data: CompanyInfo) { this.set(STORAGE_KEYS.COMPANY_INFO, data); }

  // --- PERSISTENCE DES PRODUITS ---
  getProducts() { return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []); }
  saveProducts(data: Product[]) { this.set(STORAGE_KEYS.PRODUCTS, data); }

  // --- PERSISTENCE DES CLIENTS ---
  getClients() { return this.get<Client[]>(STORAGE_KEYS.CLIENTS, []); }
  saveClients(data: Client[]) { this.set(STORAGE_KEYS.CLIENTS, data); }

  // --- DOCUMENTS ---
  getProformas() { return this.get<Proforma[]>(STORAGE_KEYS.PROFORMAS, []); }
  saveProformas(data: Proforma[]) { this.set(STORAGE_KEYS.PROFORMAS, data); }

  getInvoices() { return this.get<Invoice[]>(STORAGE_KEYS.INVOICES, []); }
  saveInvoices(data: Invoice[]) { this.set(STORAGE_KEYS.INVOICES, data); }

  getSettings() { return this.get<any>(STORAGE_KEYS.SETTINGS, { showUnitColumn: true }); }
  saveSettings(data: any) { this.set(STORAGE_KEYS.SETTINGS, data); }

  // --- UTILITAIRES ---
  getSyncStatus(): boolean {
    return this.isInitialized && (localStorage.getItem(STORAGE_KEYS.HAS_USER_DATA) === 'true');
  }

  exportFullBackup() {
    const backup: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      backup[key] = localStorage.getItem(key);
    });
    return JSON.stringify({
      appName: 'Pharmacie Nouvelle',
      db_version: DB_VERSION,
      timestamp: new Date().toISOString(),
      data: backup
    }, null, 2);
  }

  importFullBackup(jsonString: string) {
    try {
      const wrapper = JSON.parse(jsonString);
      const backup = wrapper.data || wrapper;
      Object.entries(backup).forEach(([key, value]) => {
        if (value !== null) localStorage.setItem(key, value as string);
      });
      return true;
    } catch (e) {
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

    return {
      dailyTurnover: invoices.filter(i => i.date.startsWith(today) && i.status !== DocumentStatus.CANCELLED).reduce((sum, i) => sum + i.total, 0),
      monthlyTurnover: invoices.filter(i => i.date.startsWith(month) && i.status !== DocumentStatus.CANCELLED).reduce((sum, i) => sum + i.total, 0),
      totalCollected: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
      totalRemaining: invoices.reduce((sum, i) => sum + i.balance, 0),
      invoiceCount: invoices.length
    };
  }
}

export const dataService = new DataService();
