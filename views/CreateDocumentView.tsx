import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, ArrowLeft, Save } from 'lucide-react';
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

  const handleSave = () => {
    if (!selectedClient) return alert('Veuillez sélectionner un client.');
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
      const newInvoice: Invoice = {
        ...docBase,
        id: isEditing ? id! : Date.now().toString(),
        number: isEditing ? invoices.find(i => i.id === id)!.number : generateNumber('INV', invoices.length),
        paidAmount: 0, balance: total, payments: []
      };
      dataService.saveInvoices(isEditing ? invoices.map(i => i.id === id ? newInvoice : i) : [...invoices, newInvoice]);
      navigate('/invoices');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl">
          <ArrowLeft size={20} />
        </button>
        <button onClick={handleSave} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg">
          <Save size={20} className="inline mr-2" /> Enregistrer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100">
             <select 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl"
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
            >
              <option value="">Sélectionner un client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="p-4">
                    <td className="p-4 font-bold">{item.productName}</td>
                    <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 h-fit">
          <h3 className="font-bold mb-4">Catalogue rapide</h3>
          <div className="space-y-2">
            {products.map(p => (
              <button key={p.id} onClick={() => addItem(p)} className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-100 flex justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <Plus size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentView;