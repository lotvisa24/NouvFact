
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  Menu, 
  X,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
  DollarSign,
  History,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import DashboardView from './views/DashboardView';
import ProductView from './views/ProductView';
import ClientView from './views/ClientView';
import ProformaView from './views/ProformaView';
import InvoiceView from './views/InvoiceView';
import CreateDocumentView from './views/CreateDocumentView';

// Fix: Made children optional to resolve property missing error in some TS environments
const SidebarLink = ({ to, icon: Icon, children, active }: { to: string, icon: any, children?: React.ReactNode, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{children}</span>
  </Link>
);

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Pharmacie Nouvelle</h1>
            </div>
            <p className="mt-1 text-xs text-gray-500 font-medium uppercase tracking-wider">Système de Facturation</p>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <SidebarLink to="/" icon={LayoutDashboard} active={location.pathname === '/'}>Tableau de bord</SidebarLink>
            <SidebarLink to="/proformas" icon={FileText} active={location.pathname.startsWith('/proformas')}>Factures Proforma</SidebarLink>
            <SidebarLink to="/invoices" icon={Receipt} active={location.pathname.startsWith('/invoices')}>Factures Définitives</SidebarLink>
            <div className="h-px bg-gray-100 my-4 mx-4" />
            <SidebarLink to="/products" icon={Package} active={location.pathname.startsWith('/products')}>Catalogue Produits</SidebarLink>
            <SidebarLink to="/clients" icon={Users} active={location.pathname.startsWith('/clients')}>Gestion Clients</SidebarLink>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-emerald-700 font-bold">
                  AD
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Admin Pharmacie</p>
                  <p className="text-xs text-emerald-700">Responsable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 flex items-center justify-end gap-4">
             <Link to="/proformas/create" className="hidden sm:flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium text-sm">
                <Plus size={18} />
                Nouvelle Proforma
             </Link>
             <Link to="/invoices/create" className="sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm">
                <Plus size={18} />
                Nouvelle Facture
             </Link>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/products" element={<ProductView />} />
            <Route path="/clients" element={<ClientView />} />
            <Route path="/proformas" element={<ProformaView />} />
            <Route path="/invoices" element={<InvoiceView />} />
            <Route path="/proformas/create" element={<CreateDocumentView type="proforma" />} />
            <Route path="/invoices/create" element={<CreateDocumentView type="invoice" />} />
            <Route path="/proformas/edit/:id" element={<CreateDocumentView type="proforma" isEditing={true} />} />
            <Route path="/invoices/edit/:id" element={<CreateDocumentView type="invoice" isEditing={true} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
