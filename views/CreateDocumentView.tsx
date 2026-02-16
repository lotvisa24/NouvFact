
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, ArrowLeft, Save, FileText, Receipt, Check } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Product, Client, LineItem, DocumentStatus, Proforma, Invoice } from '../types';
import { formatCurrency, generateNumber } from '../utils/formatters';

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
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const settings = dataService.getSettings();
    setShowUnit(settings.showUnitColumn ?? true);

    if (isEditing && id) {
      const doc = type === 'proforma' 
        ? dataService.getProformas().find(p => p.id === id)
        : dataService.getInvoices().find(i => i.id === id);
      
      if (doc) {
        setSelectedClient(clients.find(c => c.id === doc.clientId) || null);
        setItems(doc.items);
        setDiscount(doc.discount);
        setDate(doc.date);
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

  const updateItem = (id: string, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const newItem = { ...i, [field]: value };
        newItem.total = newItem.quantity * newItem.unitPrice;
        return newItem;
      }
      return i;
    }));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSave = () => {
    if (!selectedClient) return alert('Veuillez sélectionner un client.');
    if (items.length === 0) return alert('Veuillez ajouter au moins un produit.');

    const docBase = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date,
      items,
      discount,
      subtotal,
      total,
      status: type === 'proforma' ? DocumentStatus.PENDING : DocumentStatus.PARTIAL
    };

    if (type === 'proforma') {
      const proformas = dataService.getProformas();
      const newProforma: Proforma = {
        ...docBase,
        id: isEditing ? id! : Date.now().toString(),
        number: isEditing ? proformas.find(p => p.id === id)!.number : generateNumber('PRO', proformas.length)
      };
      const updated = isEditing ? proformas.map(p => p.id === id ? newProforma : p) : [...proformas, newProforma];
      dataService.saveProformas(updated);
      navigate('/proformas');
    } else {
      const invoices = dataService.getInvoices();
      const newInvoice: Invoice = {
        ...docBase,
        id: isEditing ? id! : Date.now().toString(),
        number: isEditing ? invoices.find(i => i.id === id)!.number : generateNumber('INV', invoices.length),
        paidAmount: 0,
        balance: total,
        payments: []
      };
      const updated = isEditing ? invoices.map(i => i.id === id ? newInvoice : i) : [...invoices, newInvoice];
      dataService.saveInvoices(updated);
      navigate('/invoices');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Modifier' : 'Créer'} {type === 'proforma' ? 'une Proforma' : 'une Facture'}
            </h2>
            <p className="text-gray-500 font-medium">Remplissez les informations ci-dessous.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100"
        >
          <Save size={20} />
          Enregistrer le document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Client</label>
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
                <label className="text-sm font-bold text-gray-700">Date du document</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Articles facturés</h3>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                {items.length} Article(s)
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produit</th>
                    {showUnit && <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Unité</th>}
                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center" style={{width: '120px'}}>Qté</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right" style={{width: '180px'}}>P.U (Frcs)</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 font-bold text-gray-900 text-sm">
                        {item.productName}
                      </td>
                      {showUnit && (
                        <td className="px-8 py-6 text-center text-sm font-medium text-gray-500">
                          {item.productUnit || '-'}
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <input 
                          type="number"
                          min="1"
                          className="w-full text-center py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="number"
                          className="w-full text-right py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-emerald-600 text-sm">{formatCurrency(item.total)}</td>
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={showUnit ? 6 : 5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Search size={40} strokeWidth={1} />
                          <p className="font-medium italic">Sélectionnez des produits à droite pour les ajouter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Récapitulatif</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Remise (Frcs)</span>
                <input 
                  type="number"
                  className="w-32 text-right py-2 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  value={discount}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-gray-900">Total Net</span>
                <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Catalogue rapide</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Filtrer les produits..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {products.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-left p-4 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">{p.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{p.category} {showUnit && p.unit ? `(${p.unit})` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">{formatCurrency(p.unitPrice)}</p>
                    <div className="mt-1 opacity-0 group-hover:opacity-100 bg-emerald-600 text-white rounded-full p-1 inline-block transition-opacity">
                      <Plus size={12} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentView;
