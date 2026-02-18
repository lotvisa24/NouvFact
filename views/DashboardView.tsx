
import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Receipt, CreditCard, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { formatCurrency } from '../utils/formatters.ts';

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
  const [companyName, setCompanyName] = useState(dataService.getCompanyInfo().name || "Pharmacie");

  useEffect(() => {
    const checkName = setInterval(() => {
      const current = dataService.getCompanyInfo().name;
      if (current !== companyName) setCompanyName(current);
    }, 2000);
    return () => clearInterval(checkName);
  }, [companyName]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Bienvenue, {companyName}</h2>
        <p className="text-gray-500 mt-1 font-medium">Voici l'état de votre activité aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="CA Journalier" value={formatCurrency(stats.dailyTurnover)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="CA Mensuel" value={formatCurrency(stats.monthlyTurnover)} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Total Encaissé" value={formatCurrency(stats.totalCollected)} icon={CreditCard} color="bg-purple-500" />
        <StatCard title="Total Restant Dû" value={formatCurrency(stats.totalRemaining)} icon={AlertCircle} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Dernières Factures</h3>
          <div className="space-y-6">
            {dataService.getInvoices().length > 0 ? (
              dataService.getInvoices().slice(0, 5).reverse().map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">INV</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{invoice.clientName}</p>
                      <p className="text-xs text-gray-500">{invoice.number}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 italic">Aucune facture enregistrée pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
