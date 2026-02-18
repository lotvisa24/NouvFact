
import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  Eye, 
  ShieldAlert,
  CheckCircle2,
  FileJson,
  AlertTriangle,
  Info,
  Building2,
  Image as ImageIcon,
  Camera,
  AlertCircle,
  Hash
} from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { CompanyInfo } from '../types.ts';

const SettingsView = () => {
  const [settings, setSettings] = useState<any>({ showUnitColumn: true, manualInvoiceNumbering: false });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(dataService.getCompanyInfo());
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(dataService.getSettings());
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleUnit = () => {
    const newSettings = { ...settings, showUnitColumn: !settings.showUnitColumn };
    setSettings(newSettings);
    dataService.saveSettings(newSettings);
    showFeedback("Préférence d'affichage mise à jour.");
  };

  const handleToggleManualNumbering = () => {
    const newSettings = { ...settings, manualInvoiceNumbering: !settings.manualInvoiceNumbering };
    setSettings(newSettings);
    dataService.saveSettings(newSettings);
    showFeedback(`Numérotation manuelle ${newSettings.manualInvoiceNumbering ? 'activée' : 'désactivée'}.`);
  };

  const handleCompanySave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const updatedInfo: CompanyInfo = {
      ...companyInfo,
      name: formData.get('name') as string,
      slogan: formData.get('slogan') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      rccm: formData.get('rccm') as string,
    };
    
    setCompanyInfo(updatedInfo);
    dataService.saveCompanyInfo(updatedInfo);
    showFeedback("Informations de l'entreprise enregistrées.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) {
      alert("L'image est trop lourde. Veuillez choisir un logo de moins de 500 Ko.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updatedInfo = { ...companyInfo, logo: base64 };
      setCompanyInfo(updatedInfo);
      dataService.saveCompanyInfo(updatedInfo);
      showFeedback("Logo mis à jour avec succès.");
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    try {
      const data = dataService.exportFullBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
      link.href = url;
      link.download = `SAUVEGARDE_PHARMACIE_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showFeedback("Fichier de sauvegarde généré avec succès !");
    } catch (e) {
      showFeedback("Erreur lors de l'exportation.", "error");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Attention : l'importation écrasera toutes vos données actuelles par celles du fichier. Continuer ?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (dataService.importFullBackup(content)) {
        showFeedback("Données restaurées ! Redémarrage en cours...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showFeedback("Fichier de sauvegarde invalide ou corrompu.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("🚨 ACTION CRITIQUE : Cette opération supprimera TOUTES vos données. Assurez-vous d'avoir fait un export avant. Voulez-vous continuer ?")) {
      if (confirm("Dernière vérification : confirmer la suppression totale ?")) {
        dataService.resetAllData();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Paramètres Système</h2>
          <p className="text-gray-500 font-medium">Configurez l'identité de votre établissement et gérez vos données.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest">Informations Établissement</h3>
            </div>
            
            <form onSubmit={handleCompanySave} noValidate className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nom de la Pharmacie</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={companyInfo.name} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold peer invalid:ring-2 invalid:ring-red-500" 
                  placeholder="Ex: Pharmacie Nouvelle"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slogan / Devise</label>
                <input 
                  name="slogan" 
                  defaultValue={companyInfo.slogan} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 italic text-sm" 
                  placeholder="Ex: Votre santé, notre priorité"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Téléphone</label>
                <input 
                  name="phone" 
                  required 
                  type="tel"
                  pattern="^\+?[0-9\s\-]{8,20}$"
                  defaultValue={companyInfo.phone} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm peer invalid:ring-2 invalid:ring-red-500" 
                  placeholder="Ex: +225 0102030405"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Pro</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={companyInfo.email} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm peer invalid:ring-2 invalid:ring-red-500" 
                  placeholder="Ex: contact@pharmacie.com"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adresse Physique</label>
                <input 
                  name="address" 
                  required 
                  defaultValue={companyInfo.address} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm peer invalid:ring-2 invalid:ring-red-500" 
                  placeholder="Ex: Avenue Jean Paul II, Plateau"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identifiants Légaux (RC / RCCM / IFU)</label>
                <input 
                  name="rccm" 
                  defaultValue={companyInfo.rccm} 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono" 
                  placeholder="Ex: CI-ABJ-2023-B-12345"
                />
              </div>
              <div className="col-span-1 md:col-span-2 pt-4">
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs">
                  Mettre à jour l'identité
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
             <div className="flex items-center gap-3 text-gray-900 border-b border-gray-50 pb-4 mb-6 w-full">
              <div className="p-2 bg-gray-100 rounded-xl text-gray-600">
                <ImageIcon size={20} />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest">Logo Officiel</h3>
            </div>
            
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                {companyInfo.logo ? (
                  <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon size={40} className="text-gray-200" />
                )}
              </div>
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-transform hover:scale-110"
              >
                <Camera size={18} />
              </button>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-4 leading-relaxed">Format carré recommandé (PNG/JPG). Max 500 Ko.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-gray-900 border-b border-gray-50 pb-4">
              <div className="p-2 bg-gray-100 rounded-xl text-gray-600">
                <Eye size={20} />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest">Documents & Factures</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-gray-800 text-sm">Colonnes Unités</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Afficher sur documents</p>
                </div>
                <button 
                  onClick={handleToggleUnit}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.showUnitColumn ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.showUnitColumn ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex gap-3">
                  <div className="text-emerald-600 pt-1">
                    <Hash size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Numérotation Manuelle</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Factures Définitives</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleManualNumbering}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.manualInvoiceNumbering ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.manualInvoiceNumbering ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-600 border-b border-gray-50 pb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Database size={20} />
            </div>
            <h3 className="font-bold uppercase text-xs tracking-widest">Sauvegarde & Restauration</h3>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all group shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
                <FileJson size={18} />
                <span>Exporter</span>
              </div>
              <Download size={18} />
            </button>
            <label className="w-full flex items-center justify-between p-4 bg-white border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 rounded-2xl transition-all group cursor-pointer">
              <div className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
                <Upload size={18} />
                <span>Importer</span>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-red-50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-red-600 border-b border-red-50 pb-4">
            <div className="p-2 bg-red-50 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold uppercase text-xs tracking-widest">Zone Critique</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
               <div className="p-3 bg-red-50 text-red-500 rounded-2xl h-fit">
                  <Trash2 size={24} />
               </div>
               <div>
                  <p className="font-bold text-gray-800 text-sm">Réinitialisation totale</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Supprime tout sauf l'identité pharmacie.</p>
               </div>
            </div>
            <button 
              onClick={handleReset}
              className="w-full px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all text-[10px] border border-red-100 uppercase tracking-widest"
            >
              Vider toute la base de données
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
