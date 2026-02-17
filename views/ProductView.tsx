import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Power, X, Eye, EyeOff, FileSpreadsheet, Upload, CheckCircle2, Info } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { Product } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';
import * as XLSX from 'xlsx';

const ProductView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showUnitColumn, setShowUnitColumn] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(dataService.getProducts());
    const settings = dataService.getSettings();
    setShowUnitColumn(settings.showUnitColumn ?? true);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      unitPrice: parseInt(formData.get('unitPrice') as string),
      description: formData.get('description') as string,
      isActive: editingProduct ? editingProduct.isActive : true
    };

    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? productData : p);
    } else {
      newProducts = [...products, productData];
    }

    setProducts(newProducts);
    dataService.saveProducts(newProducts);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const toggleStatus = (id: string) => {
    const newProducts = products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setProducts(newProducts);
    dataService.saveProducts(newProducts);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      dataService.saveProducts(newProducts);
    }
  };

  const toggleUnitColumnVisibility = () => {
    const newValue = !showUnitColumn;
    setShowUnitColumn(newValue);
    dataService.saveSettings({ ...dataService.getSettings(), showUnitColumn: newValue });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length === 0) {
          alert("Le fichier est vide.");
          setIsImporting(false);
          return;
        }

        // Détection de l'en-tête (Nom ou Désignation dans la première colonne)
        const firstCell = String(data[0][0] || '').toLowerCase();
        const startIdx = (firstCell.includes('nom') || firstCell.includes('désignation') || firstCell.includes('designation')) ? 1 : 0;
        
        const newProductsFromExcel: Product[] = [];
        for (let i = startIdx; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue; // Saute si pas de nom

          newProductsFromExcel.push({
            id: `xls-${Date.now()}-${i}`,
            name: String(row[0]),
            category: row[1] ? String(row[1]) : 'Général',
            unit: row[2] ? String(row[2]) : undefined,
            unitPrice: parseInt(String(row[3]).replace(/[^0-9]/g, '')) || 0,
            description: row[4] ? String(row[4]) : undefined,
            isActive: true
          });
        }

        if (newProductsFromExcel.length > 0) {
          const finalProducts = [...products, ...newProductsFromExcel];
          setProducts(finalProducts);
          dataService.saveProducts(finalProducts);
          setImportFeedback(`${newProductsFromExcel.length} produits importés !`);
          setTimeout(() => setImportFeedback(null), 5000);
        } else {
          alert("Aucun produit valide trouvé. Colonnes attendues : Nom, Catégorie, Unité, Prix, Description.");
        }
      } catch (err) {
        console.error("Excel import error:", err);
        alert("Erreur lors de la lecture du fichier Excel. Vérifiez que c'est un fichier .xlsx valide.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catalogue Produits</h2>
          <p className="text-sm text-gray-500 font-medium">Gérez vos articles et tarifs de vente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {importFeedback && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold animate-pulse">
              <CheckCircle2 size={14} />
              {importFeedback}
            </div>
          )}
          
          <button 
            onClick={toggleUnitColumnVisibility}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border ${
              showUnitColumn ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-transparent'
            }`}
            title={showUnitColumn ? "Masquer la colonne Unité" : "Afficher la colonne Unité"}
          >
            {showUnitColumn ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="text-sm">Colonnes</span>
          </button>

          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleExcelImport}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-100 px-6 py-3 rounded-2xl hover:bg-emerald-50 transition-all font-bold shadow-sm"
            >
              <FileSpreadsheet size={20} />
              {isImporting ? 'Importation...' : 'Importer Excel'}
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-gray-900 text-white rounded-2xl text-[10px] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-gray-700">
               <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase tracking-widest">
                  <Info size={12} /> Format attendu
               </div>
               <p className="mb-2 text-gray-400 font-medium">L'ordre des colonnes doit être :</p>
               <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li><span className="font-bold text-white">Nom</span> (ex: Paracétamol)</li>
                  <li><span className="font-bold text-white">Catégorie</span> (ex: Antalgique)</li>
                  <li><span className="font-bold text-white">Unité</span> (ex: Boîte)</li>
                  <li><span className="font-bold text-white">Prix</span> (ex: 1500)</li>
                  <li><span className="font-bold text-white">Description</span> (ex: Détails)</li>
               </ol>
            </div>
          </div>

          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Nouveau produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher un produit ou une catégorie..."
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Catégorie</th>
                {showUnitColumn && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Unité</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Prix Unitaire</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                    {product.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{product.category}</span>
                  </td>
                  {showUnitColumn && (
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600">{product.unit || '-'}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(product.unitPrice)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(product.id)}
                        className={`p-2 transition-colors ${product.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-emerald-500'}`}
                        title={product.isActive ? 'Désactiver' : 'Activer'}
                      >
                        <Power size={18} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={showUnitColumn ? 6 : 5} className="px-6 py-12 text-center text-gray-400 italic">Aucun produit trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nom du produit</label>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingProduct?.name}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" 
                    placeholder="Ex: Paracétamol 500mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Catégorie</label>
                    <input 
                      name="category" 
                      required 
                      defaultValue={editingProduct?.category}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" 
                      placeholder="Ex: Antalgiques"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Unité</label>
                    <input 
                      name="unit" 
                      defaultValue={editingProduct?.unit}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" 
                      placeholder="Ex: Boîte, Flacon..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Prix (Frcs CFA)</label>
                    <input 
                      name="unitPrice" 
                      type="number" 
                      required 
                      defaultValue={editingProduct?.unitPrice}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" 
                      placeholder="Ex: 1500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Description (Optionnel)</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingProduct?.description}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm resize-none" 
                    placeholder="Détails du produit..."
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;