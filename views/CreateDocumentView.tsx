
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, ArrowLeft, Save, Hash } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { Product, Client, LineItem, DocumentStatus, Proforma, Invoice } from '../types.ts';
import { formatCurrency, generateNumber } from '../utils/formatters.ts';

interface CreateDocumentProps {
  type: 'proforma' | 'invoice';
  isEditing?: boolean;
}

const CreateDocumentView: React.FC<CreateDocumentProps> = ({ type, isEditing }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [clients] = useState(dataService.getClients());
  const [products] = useState(dataService.getProducts().filter(p => p.isActive));
  const [showUnit, setShowUnit] = useState(true);
  const [manualNumbering, setManualNumbering] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNumber, setManualNumber] = useState('');

  useEffect(() => {
    const settings = dataService.getSettings();
    setShowUnit(settings.showUnitColumn ?? true);
    setManualNumbering(settings.manualInvoiceNumbering ?? false);

    if (isEditing && id) {
      const doc = type === 'proforma' 
        ? dataService.getProformas().find(p => p.id === id)
        : dataService.getInvoices().find(i => i.id === id);
      
      if (doc) {
        setSelectedClient(clients.find(c => c.id === doc.clientId) || null);
        setItems(doc.items);
        setDiscount(doc.discount);
        setDate(doc.date);
        setManualNumber(doc.number);
      }
    }
  }, [id, isEditing, type, clients]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const total = subtotal - discount;

  const addItem = (product: Product) => {
    const existingItem = items.find(i => i.productId === product.id);
    if (existingItem) {
      setItems(items.map(i => i.productId === product.id ? { 
        ...i, 
        quantity: i.quantity + 1,
        total: (i.quantity + 1) * i.unitPrice
      } : i));
    } else {
      setItems([...items, {
        id: Date.now().toString() + Math.random(),
        productId: product.id,
        productName: product.name,
        productUnit: product.unit,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice
      }]);
    }
  };

  const removeItem = (lineId: string) => {
    setItems(items.filter(i => i.id !== lineId));
  };

  const updateQuantity = (lineId: string, q: number) => {
    setItems(items.map(i => i.id === lineId ? { 
      ...i, 
      quantity: Math.max(1, q), 
      total: Math.max(1, q) * i.unitPrice 
    } : i));
  };

  const handleSave = () => {
    if (!selectedClient) return alert('Veuillez sélectionner un client.');
    if (items.length === 0) return alert('Veuillez ajouter au moins un produit.');
    
    if (type === 'invoice' && manualNumbering && !manualNumber.trim()) {
      return alert('Le numéro de facture est obligatoire en mode manuel.');
    }

    const docBase = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date, items, discount, subtotal, total,
      status: type === 'proforma' ? DocumentStatus.PENDING : DocumentStatus.PARTIAL
    };

    if (type === 'proforma') {
      const proformas = dataService.getProformas();
      const newProforma: Proforma = {
        ...docBase,
        id: isEditing ? id! : Date.now().toString(),
        number: isEditing ? proformas.find(p => p.id === id)!.number : generateNumber('PRO', proformas.length)
      };
      dataService.saveProformas(isEditing ? proformas.map(p => p.id === id ? newProforma : p) : [...proformas, newProforma]);
      navigate('/proformas');
    } else {
      const invoices = dataService.getInvoices();
      
      // Vérification d'unicité pour le numéro manuel
      if (manualNumbering && !isEditing) {
        const exists = invoices.some(i => i.number.toLowerCase() === manualNumber.trim().toLowerCase());
        if (exists) return alert('Ce numéro de facture existe déjà. Veuillez en choisir un autre.');
      }

      const newInvoice: Invoice = {
        ...docBase,
        id: isEditing ? id! : Date.now().toString(),
        number: isEditing 
          ? (invoices.find(i => i.id === id)!.number) 
          : (manualNumbering ? manualNumber.trim().toUpperCase() : generateNumber('INV', invoices.length)),
        paidAmount: 0, balance: total, payments: []
      };
      dataService.saveInvoices(isEditing ? invoices.map(i => i.id === id ? newInvoice : i) : [...invoices, newInvoice]);
      navigate('/invoices');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Modifier' : 'Nouvelle'} {type === 'proforma' ? 'Proforma' : 'Facture'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Remplissez les informations ci-dessous.</p>
          </div>
        </div>
        <button onClick={handleSave} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2">
          <Save size={20} /> Enregistrer le document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client</label>
               <select 
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                value={selectedClient?.id || ''}
                onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
              >
                <option value="">Sélectionner un client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date d'émission</label>
               <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm"
               />
             </div>

             {type === 'invoice' && manualNumbering && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} /> Numéro de facture (Manuel)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: FACT-001/2024"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold placeholder:font-normal"
                    disabled={isEditing}
                  />
                  {!isEditing && <p className="text-[10px] text-gray-400 italic">Saisissez le numéro officiel souhaité pour cette facture.</p>}
                </div>
             )}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Articles sélectionnés</h3>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {items.length} produit(s)
              </span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Désignation</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Qté</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">P.U</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{item.productName}</p>
                      {item.productUnit && <p className="text-[10px] text-gray-400">{item.productUnit}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-50 border-none rounded-lg text-center text-sm font-bold"
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">{formatCurrency(item.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-gray-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-300 italic text-sm">
                      Aucun produit dans la liste. Utilisez le catalogue à droite.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Search size={18} />
              </div>
              <h3 className="font-bold text-gray-900">Catalogue Rapide</h3>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {products.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => addItem(p)} 
                  className="w-full text-left p-4 hover:bg-emerald-50 rounded-2xl border border-transparent hover:border-emerald-100 flex flex-col gap-1 transition-all group"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-700">{p.name}</span>
                    <Plus size={16} className="text-gray-300 group-hover:text-emerald-600" />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{p.category}</span>
                    <span className="text-emerald-600">{formatCurrency(p.unitPrice)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-4 shadow-xl">
             <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                <span>Sous-total HT</span>
                <span>{formatCurrency(subtotal)}</span>
             </div>
             <div className="flex justify-between items-center gap-4">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-widest">Remise</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-gray-800 border-none rounded-xl px-4 py-2 text-right text-sm font-bold w-32 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
             </div>
             <div className="h-px bg-gray-800 my-4" />
             <div className="flex justify-between items-end">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total Net</p>
                <p className="text-3xl font-black">{formatCurrency(total)}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentView;
