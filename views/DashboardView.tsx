
import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Receipt, CreditCard, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatCurrency } from '../utils/formatters';

const StatCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string, icon: any, color: string, subValue?: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
    </div>
    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    {subValue && <p className="text-xs text-gray-400 mt-2 font-medium">{subValue}</p>}
  </div>
);

const DashboardView = () => {
  const stats = useMemo(() => dataService.getStats(), []);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Bienvenue, Pharmacie Nouvelle</h2>
        <p className="text-gray-500 mt-1 font-medium">Voici l'aperçu de votre activité aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CA Journalier" 
          value={formatCurrency(stats.dailyTurnover)} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="CA Mensuel" 
          value={formatCurrency(stats.monthlyTurnover)} 
          icon={DollarSign} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Encaissé" 
          value={formatCurrency(stats.totalCollected)} 
          icon={CreditCard} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Restant Dû" 
          value={formatCurrency(stats.totalRemaining)} 
          icon={AlertCircle} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Dernières Factures</h3>
            <Receipt className="text-gray-400" />
          </div>
          <div className="space-y-6">
            {dataService.getInvoices().slice(0, 5).reverse().map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between group cursor-pointer p-2 -m-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    INV
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{invoice.clientName}</p>
                    <p className="text-xs text-gray-500">{invoice.number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                  <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                    invoice.status === 'Payée' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
            {dataService.getInvoices().length === 0 && (
              <p className="text-center text-gray-400 py-10 italic">Aucune facture émise pour le moment.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Produits les plus vendus</h3>
            <TrendingUp className="text-gray-400" />
          </div>
          <div className="space-y-6">
            {/* Simulation logic for top products */}
            {dataService.getProducts().slice(0, 4).map((product, idx) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${85 - idx * 15}%` }} />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500">{85 - idx * 15} Ventes</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
