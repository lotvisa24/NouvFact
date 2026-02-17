import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Edit2, Trash2, Printer, 
  CheckCircle, Download, Eye, X, ExternalLink, Banknote 
} from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { Proforma, Invoice, DocumentStatus } from '../types.ts';
import { formatCurrency, formatDate, generateNumber } from '../utils/formatters.ts';
import html2pdf from 'html2pdf.js';

const ProformaTemplate = ({ p, showUnit }: { p: Proforma, showUnit: boolean }) => (
  <div className="bg-white p-10 text-gray-800" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
    <div className="flex justify-between items-start mb-10 border-b-2 border-emerald-600 pb-8">
      <div>
        <h1 className="text-3xl font-black text-emerald-600 mb-2">PHARMACIE NOUVELLE</h1>
        <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Abidjan - Plateau, Avenue Jean Paul II</p>
        <p className="text-gray-500 text-[11px] mt-1 italic">Tel: +225 21 00 00 00 | RC: 123456</p>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">FACTURE PROFORMA</h2>
        <p className="text-emerald-600 font-black text-xl">{p.number}</p>
        <p className="text-gray-500 mt-2 font-medium">Date: {formatDate(p.date)}</p>
      </div>
    </div>

    <div className="mb-10 p-8 bg-gray-50 rounded-3xl border border-gray-100">
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">DESTINATAIRE</p>
      <h3 className="text-2xl font-black text-gray-900">{p.clientName}</h3>
      <div className="mt-4 space-y-1 text-sm text-gray-600 font-medium">
        <p>Abidjan, Côte d'Ivoire</p>
        <p>Document commercial</p>
      </div>
    </div>

    <table className="w-full mb-10">
      <thead>
        <tr className="bg-emerald-600 text-white text-left text-[11px] uppercase tracking-wider">
          <th className="py-4 px-4 font-bold rounded-l-xl">Désignation</th>
          {showUnit && <th className="py-4 px-4 font-bold text-center">Unité</th>}
          <th className="py-4 px-4 font-bold text-center">Qté</th>
          <th className="py-4 px-4 font-bold text-right">Prix Unit.</th>
          <th className="py-4 px-4 font-bold text-right rounded-r-xl">Total HT</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {p.items.map(item => (
          <tr key={item.id}>
            <td className="py-4 px-4 font-bold text-gray-900 text-sm">{item.productName}</td>
            {showUnit && <td className="py-4 px-4 text-center text-xs font-medium text-gray-500">{item.productUnit || '-'}</td>}
            <td className="py-4 px-4 text-center font-medium text-gray-600 text-sm">{item.quantity}</td>
            <td className="py-4 px-4 text-right font-medium text-gray-600 text-sm">{formatCurrency(item.unitPrice)}</td>
            <td className="py-4 px-4 text-right font-black text-gray-900 text-sm">{formatCurrency(item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-end pt-6 border-t border-gray-100">
      <div className="w-80 space-y-4">
        <div className="flex justify-between text-gray-500 font-bold">
          <span className="uppercase text-xs tracking-wider">Sous-total</span>
          <span>{formatCurrency(p.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-bold">
          <span className="uppercase text-xs tracking-wider">Remise</span>
          <span>- {formatCurrency(p.discount)}</span>
        </div>
        <div className="h-0.5 bg-emerald-600" />
        <div className="flex justify-between text-2xl font-black text-emerald-600">
          <span>TOTAL NET</span>
          <span>{formatCurrency(p.total)}</span>
        </div>
      </div>
    </div>

    <div className="mt-24 pt-10 border-t-2 border-gray-100 text-center text-gray-400 text-[11px] leading-relaxed">
      <p className="font-black text-gray-500 uppercase tracking-widest mb-2">Conditions de vente</p>
      <p>Cette proforma est valable 30 jours à compter de la date d'émission.</p>
      <p>Livraison sous 24h après validation du bon de commande.</p>
      <p className="mt-6 italic font-bold text-emerald-600">Pharmacie Nouvelle - Votre santé, notre priorité.</p>
    </div>
  </div>
);

const ProformaView = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUnit, setShowUnit] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'validated'>('pending');

  useEffect(() => {
    setProformas(dataService.getProformas());
    const settings = dataService.getSettings();
    setShowUnit(settings.showUnitColumn ?? true);
  }, []);

  const filtered = proformas.filter(p => {
    const matchesSearch = p.number.toLowerCase().includes(search.toLowerCase()) || 
                         p.clientName.toLowerCase().includes(search.toLowerCase());
    
    const isProcessed = !!p.convertedToInvoiceId || p.status === DocumentStatus.PAID;
    const matchesTab = activeTab === 'pending' ? !isProcessed : isProcessed;
    
    return matchesSearch && matchesTab;
  });

  const markAsPaidDirectly = (proforma: Proforma) => {
    if (confirm(`Voulez-vous marquer la proforma ${proforma.number} comme PAYÉE directement ?`)) {
      try {
        const updatedProformas = proformas.map(p => 
          p.id === proforma.id 
            ? { ...p, status: DocumentStatus.PAID } 
            : p
        );
        
        dataService.saveProformas(updatedProformas);
        setProformas(updatedProformas);
        alert(`Succès : La proforma ${proforma.number} est désormais marquée comme payée.`);
        setActiveTab('validated');
      } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la mise à jour.");
      }
    }
  };

  const convertToInvoice = (proforma: Proforma) => {
    if (confirm(`Voulez-vous transformer la proforma ${proforma.number} en facture définitive ?`)) {
      try {
        const currentInvoices = dataService.getInvoices();
        const { convertedToInvoiceId, status, ...baseData } = proforma;
        
        const newInvoice: Invoice = {
          ...baseData,
          id: `INV-${Date.now()}`,
          number: generateNumber('INV', currentInvoices.length),
          status: DocumentStatus.PARTIAL,
          paidAmount: 0,
          balance: proforma.total,
          payments: [],
          proformaId: proforma.id
        };
        
        const updatedProformas = proformas.map(p => 
          p.id === proforma.id 
            ? { ...p, convertedToInvoiceId: newInvoice.id, status: DocumentStatus.PAID } 
            : p
        );
        
        dataService.saveInvoices([...currentInvoices, newInvoice]);
        dataService.saveProformas(updatedProformas);
        
        setProformas(updatedProformas);
        alert(`Succès : La facture ${newInvoice.number} a été générée.`);
        setActiveTab('validated');
      } catch (error) {
        console.error("Erreur conversion:", error);
        alert("Une erreur est survenue.");
      }
    }
  };

  const deleteProforma = (id: string) => {
    if (confirm('Supprimer cette proforma ?')) {
      const updated = proformas.filter(p => p.id !== id);
      setProformas(updated);
      dataService.saveProformas(updated);
    }
  };

  const handlePrint = (p: Proforma) => {
    setSelectedProforma(p);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPDF = async (p: Proforma) => {
    setSelectedProforma(p);
    setTimeout(async () => {
      if (printRef.current) {
        const opt = {
          margin: 10,
          filename: `PROFORMA_${p.number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        let exporter = html2pdf;
        if (exporter && (exporter as any).default) {
            exporter = (exporter as any).default;
        }
        
        if (typeof exporter === 'function') {
          await (exporter as any)().from(printRef.current).set(opt).save();
        } else {
          alert("Erreur PDF.");
        }
      }
    }, 150);
  };

  const handlePreview = (p: Proforma) => {
    setSelectedProforma(p);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Factures Proforma</h2>
          <p className="text-sm text-gray-500 font-medium">Gestion des devis et des règlements proforma.</p>
        </div>
        <button 
          onClick={() => navigate('/proformas/create')}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100"
        >
          <FileText size={20} />
          Nouvelle Proforma
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'pending' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={18} />
          En attente ({proformas.filter(p => !p.convertedToInvoiceId && p.status !== DocumentStatus.PAID).length})
        </button>
        <button 
          onClick={() => setActiveTab('validated')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'validated' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle size={18} />
          Archive / Validées ({proformas.filter(p => !!p.convertedToInvoiceId || p.status === DocumentStatus.PAID).length})
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Montant Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((proforma) => (
                <tr key={proforma.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">{proforma.number}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{proforma.clientName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{formatDate(proforma.date)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(proforma.total)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      proforma.status === DocumentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {proforma.status === DocumentStatus.PAID ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handlePreview(proforma)} className="p-2 text-gray-400 hover:text-emerald-600" title="Visualiser">
                        <Eye size={18} />
                      </button>
                      
                      {activeTab === 'pending' ? (
                        <>
                          <button 
                            onClick={() => convertToInvoice(proforma)} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" 
                            title="Convertir en Facture"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => markAsPaidDirectly(proforma)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl" 
                            title="Payer directement"
                          >
                            <Banknote size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/proformas/edit/${proforma.id}`)} 
                            className="p-2 text-gray-400 hover:text-emerald-600" 
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                        </>
                      ) : (
                        proforma.convertedToInvoiceId && (
                          <button 
                            onClick={() => navigate('/invoices')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <ExternalLink size={14} />
                            Facture liée
                          </button>
                        )
                      )}
                      
                      <button onClick={() => handlePrint(proforma)} className="p-2 text-gray-400 hover:text-gray-900" title="Imprimer">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleExportPDF(proforma)} className="p-2 text-emerald-600 hover:text-emerald-800" title="Exporter PDF">
                        <Download size={18} />
                      </button>
                      <button onClick={() => deleteProforma(proforma.id)} className="p-2 text-gray-400 hover:text-red-600" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    {activeTab === 'pending' ? "Aucune proforma en attente." : "Aucun historique trouvé."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewOpen && selectedProforma && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Aperçu du document</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedProforma.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'pending' && (
                  <>
                    <button 
                      onClick={() => { setIsPreviewOpen(false); convertToInvoice(selectedProforma); }}
                      className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-200"
                    >
                      <CheckCircle size={16} />
                      Facturer
                    </button>
                    <button 
                      onClick={() => { setIsPreviewOpen(false); markAsPaidDirectly(selectedProforma); }}
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-200"
                    >
                      <Banknote size={16} />
                      Payer
                    </button>
                  </>
                )}
                <button onClick={() => handleExportPDF(selectedProforma)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700">
                  <Download size={16} />
                  PDF
                </button>
                <button onClick={() => handlePrint(selectedProforma)} className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">
                  <Printer size={16} />
                  Imprimer
                </button>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 ml-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-100/50 p-8 flex justify-center">
              <div className="shadow-lg transform scale-90 origin-top">
                <ProformaTemplate p={selectedProforma} showUnit={showUnit} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden print-only" ref={printRef}>
        {selectedProforma && <ProformaTemplate p={selectedProforma} showUnit={showUnit} />}
      </div>
    </div>
  );
};

export default ProformaView;