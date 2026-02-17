import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search, Trash2, Printer, CreditCard, Download, X, Eye } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { Invoice, Payment, PaymentMode, DocumentStatus } from '../types.ts';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatters.ts';
import html2pdf from 'html2pdf.js';

const InvoiceTemplate = ({ inv, showUnit }: { inv: Invoice, showUnit: boolean }) => (
  <div className="bg-white p-8 text-gray-800 flex flex-col" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
    <div className="flex justify-between items-start mb-6 border-b-4 border-gray-900 pb-4">
      <div>
        <h1 className="text-2xl font-black text-emerald-600 mb-1 italic">PHARMACIE NOUVELLE</h1>
        <p className="text-gray-800 font-black uppercase tracking-widest text-[9px]">SANTÉ & BIEN-ÊTRE AU QUOTIDIEN</p>
        <div className="mt-2 text-[9px] text-gray-600 font-medium space-y-0">
          <p>Abidjan - Plateau, Avenue Jean Paul II</p>
          <p>Tel: +225 21 00 00 00 | RCCM: CI-ABJ-2023-B-12345</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-black text-gray-900 mb-0 uppercase italic tracking-tighter">FACTURE</h2>
        <p className="text-gray-900 font-black text-lg bg-gray-100 px-3 py-1 rounded-lg inline-block">{inv.number}</p>
        <div className="mt-2 text-[10px] font-bold text-gray-700">
          <p>Date: {formatDate(inv.date)}</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-6">
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">FACTURÉ À</p>
        <h3 className="text-xl font-black text-gray-900">{inv.clientName}</h3>
        <p className="mt-1 text-[10px] text-gray-600 font-medium italic">Abidjan, Côte d'Ivoire</p>
      </div>
      <div className="p-6 bg-gray-900 rounded-2xl text-white">
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">STATUT</p>
        <h3 className={`text-xl font-black uppercase tracking-widest ${inv.status === DocumentStatus.PAID ? 'text-emerald-400' : 'text-orange-400'}`}>
          {inv.status}
        </h3>
        <div className="mt-2 flex justify-between items-center text-[10px] font-bold">
          <span>Reste :</span>
          <span className="text-base">{formatCurrency(inv.balance)}</span>
        </div>
      </div>
    </div>

    <div className="flex-grow">
      <table className="w-full mb-6">
        <thead>
          <tr className="border-y-2 border-gray-900 text-left text-[9px] uppercase tracking-wider">
            <th className="py-3 px-2 font-black text-gray-900">Désignation</th>
            {showUnit && <th className="py-3 px-2 font-black text-gray-900 text-center">Unité</th>}
            <th className="py-3 px-2 font-black text-gray-900 text-center">Qté</th>
            <th className="py-3 px-2 font-black text-gray-900 text-right">Unit.</th>
            <th className="py-3 px-2 font-black text-gray-900 text-right">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inv.items.map(item => (
            <tr key={item.id}>
              <td className="py-3 px-2 font-bold text-gray-900 text-xs">{item.productName}</td>
              {showUnit && <td className="py-3 px-2 text-center text-[10px] font-medium text-gray-500">{item.productUnit || '-'}</td>}
              <td className="py-3 px-2 text-center font-bold text-gray-600 text-xs">{item.quantity}</td>
              <td className="py-3 px-2 text-right font-bold text-gray-600 text-xs">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 px-2 text-right font-black text-gray-900 text-xs">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="flex justify-between items-start pt-4 mb-6">
      <div className="w-1/2">
        <h4 className="font-black text-gray-900 uppercase text-[9px] tracking-widest mb-2">Historique règlements</h4>
        <div className="space-y-1">
          {inv.payments.length > 0 ? inv.payments.slice(0, 3).map(pay => (
            <div key={pay.id} className="flex justify-between text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
              <span>{formatDate(pay.date)}</span>
              <span className="text-emerald-600">+{formatCurrency(pay.amount)}</span>
            </div>
          )) : (
            <p className="text-[10px] text-gray-400 italic">Aucun règlement.</p>
          )}
        </div>
      </div>
      <div className="w-64 space-y-2">
        <div className="flex justify-between text-gray-500 font-bold text-[10px]">
          <span className="uppercase tracking-wider">Sous-total</span>
          <span>{formatCurrency(inv.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-bold text-[10px]">
          <span className="uppercase tracking-wider">Remise</span>
          <span>- {formatCurrency(inv.discount)}</span>
        </div>
        <div className="h-0.5 bg-gray-900" />
        <div className="flex justify-between text-gray-900 font-black">
          <span className="text-[10px] uppercase tracking-widest">Net à payer</span>
          <span className="text-xl underline underline-offset-4 decoration-emerald-500">{formatCurrency(inv.total)}</span>
        </div>
      </div>
    </div>

    <div className="mb-6 p-4 bg-gray-900 rounded-2xl text-white">
      <p className="text-xs font-medium leading-relaxed italic text-gray-300">
        Arrêté la présente facture à la somme nette de : <br/>
        <span className="font-black text-white not-italic uppercase tracking-tight text-sm">
          {numberToWords(inv.total)} Francs CFA
        </span>
      </p>
    </div>

    <div className="mt-auto pt-4 border-t-2 border-gray-900 flex justify-between items-end">
      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
        <p>Document original certifié - PN System</p>
      </div>
      <div className="text-right border-t border-gray-200 pt-2 w-40">
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-8 text-center">Cachet & Signature</p>
      </div>
    </div>
  </div>
);

const InvoiceView = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUnit, setShowUnit] = useState(true);

  useEffect(() => {
    setInvoices(dataService.getInvoices());
    const settings = dataService.getSettings();
    setShowUnit(settings.showUnitColumn ?? true);
  }, []);

  const filtered = invoices.filter(i => 
    i.number.toLowerCase().includes(search.toLowerCase()) || 
    i.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get('amount') as string);
    const mode = formData.get('mode') as PaymentMode;

    const newPayment: Payment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount,
      mode,
      invoiceId: selectedInvoice.id
    };

    const newPaidAmount = selectedInvoice.paidAmount + amount;
    const newBalance = selectedInvoice.total - newPaidAmount;
    
    let newStatus = DocumentStatus.PARTIAL;
    if (newBalance <= 0) newStatus = DocumentStatus.PAID;

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      paidAmount: newPaidAmount,
      balance: Math.max(0, newBalance),
      status: newStatus,
      payments: [...selectedInvoice.payments, newPayment]
    };

    const updatedInvoices = invoices.map(i => i.id === selectedInvoice.id ? updatedInvoice : i);
    setInvoices(updatedInvoices);
    dataService.saveInvoices(updatedInvoices);
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const deleteInvoice = (id: string) => {
    if (confirm('Supprimer cette facture ?')) {
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      dataService.saveInvoices(updated);
    }
  };

  const handlePrint = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExportPDF = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setTimeout(async () => {
      if (printRef.current) {
        const opt = {
          margin: 0,
          filename: `FACTURE_${inv.number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        let exporter = html2pdf;
        if (exporter && (exporter as any).default) {
            exporter = (exporter as any).default;
        }

        try {
          if (typeof exporter === 'function') {
            await (exporter as any)().from(printRef.current).set(opt).save();
          } else {
             const h2p = (window as any).html2pdf || exporter;
             await h2p().from(printRef.current).set(opt).save();
          }
        } catch (e) {
          console.error("Erreur PDF:", e);
          alert("Erreur lors de la génération du PDF.");
        }
      }
    }, 300);
  };

  const handlePreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Factures Définitives</h2>
          <p className="text-sm text-gray-500 font-medium">Gestion des factures et règlements.</p>
        </div>
        <button 
          onClick={() => navigate('/invoices/create')}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition-all font-bold shadow-lg"
        >
          <Receipt size={20} />
          Nouvelle Facture
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une facture..."
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Payé</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Reste</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">{invoice.number}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{invoice.clientName}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">{formatCurrency(invoice.total)}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm">{formatCurrency(invoice.paidAmount)}</td>
                  <td className="px-6 py-4 text-right font-bold text-orange-600 text-sm">{formatCurrency(invoice.balance)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      invoice.status === DocumentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                      invoice.status === DocumentStatus.PARTIAL ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handlePreview(invoice)} className="p-2 text-gray-400 hover:text-emerald-600" title="Visualiser">
                        <Eye size={18} />
                      </button>
                      {invoice.status !== DocumentStatus.PAID && (
                        <button 
                          onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          title="Enregistrer paiement"
                        >
                          <CreditCard size={18} />
                        </button>
                      )}
                      <button onClick={() => handlePrint(invoice)} className="p-2 text-gray-400 hover:text-gray-900" title="Imprimer">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleExportPDF(invoice)} className="p-2 text-emerald-600 hover:text-emerald-800" title="Exporter PDF">
                        <Download size={18} />
                      </button>
                      {/* Fix: use invoice.id instead of undefined variable id */}
                      <button onClick={() => deleteInvoice(invoice.id)} className="p-2 text-gray-400 hover:text-red-600" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Aperçu de la Facture</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedInvoice.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleExportPDF(selectedInvoice)}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <Download size={16} />
                  Télécharger PDF
                </button>
                <button 
                  onClick={() => handlePrint(selectedInvoice)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  <Printer size={16} />
                  Imprimer
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors ml-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-100/50 p-8 flex justify-center">
              <div className="shadow-lg transform scale-90 origin-top">
                <InvoiceTemplate inv={selectedInvoice} showUnit={showUnit} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -1 }}>
        <div ref={printRef}>
          {selectedInvoice && <InvoiceTemplate inv={selectedInvoice} showUnit={showUnit} />}
        </div>
      </div>

      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Enregistrer un paiement</h3>
                <p className="text-emerald-100 text-xs mt-1">Facture: {selectedInvoice.number}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-emerald-100 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Reste à payer :</span>
                <span className="text-lg font-black text-emerald-600">{formatCurrency(selectedInvoice.balance)}</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Montant versé (Frcs CFA)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    max={selectedInvoice.balance}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-lg font-black" 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Mode de paiement</label>
                  <select name="mode" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm appearance-none">
                    {Object.values(PaymentMode).map(mode => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mt-4">
                Valider le règlement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;