import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { dataService } from '../services/dataService.ts';

const SettingsView = () => {
  const [settings, setSettings] = useState<any>({ showUnitColumn: true });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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
    showFeedback("Préférence d'affichage mise à jour localement.");
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
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Paramètres</h2>
          <p className="text-gray-500 font-medium">Configuration et sécurité du système PN.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Stockage Local Actif
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

      {/* Alerte sur la persistance */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
        <div className="shrink-0 p-3 bg-amber-100 text-amber-700 rounded-2xl h-fit">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">Note sur la sécurité des données</h4>
          <p className="text-sm text-amber-800 leading-relaxed font-medium">
            Vos données sont stockées uniquement dans la mémoire de votre navigateur. 
            <span className="font-black"> Si vous videz votre cache ou si l'application est réinstallée, vos données seront perdues.</span>
            Pensez à utiliser le bouton <strong>Exporter</strong> régulièrement pour garder une copie de sécurité sur votre ordinateur.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section Affichage */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-gray-900 border-b border-gray-50 pb-4">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-600">
              <Eye size={20} />
            </div>
            <h3 className="font-bold uppercase text-xs tracking-widest">Affichage</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <p className="font-bold text-gray-800 text-sm">Afficher les Unités</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Colonnes "Boîte", "Flacon", etc.</p>
            </div>
            <button 
              onClick={handleToggleUnit}
              className={`w-14 h-8 rounded-full transition-all relative ${settings.showUnitColumn ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.showUnitColumn ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Section Backup */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-gray-900 border-b border-gray-50 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database size={20} />
            </div>
            <h3 className="font-bold uppercase text-xs tracking-widest text-emerald-600">Base de données</h3>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all group shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-3">
                <FileJson size={18} />
                <span className="text-sm font-bold">Exporter mes données</span>
              </div>
              <Download size={18} />
            </button>

            <label className="w-full flex items-center justify-between p-4 bg-white border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 rounded-2xl transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <Upload size={18} />
                <span className="text-sm font-bold">Importer une sauvegarde</span>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Section Danger Zone */}
        <div className="bg-white rounded-3xl p-8 border border-red-50 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 text-red-600 border-b border-red-50 pb-4">
            <div className="p-2 bg-red-50 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold uppercase text-xs tracking-widest">Maintenance critique</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-4">
               <div className="p-3 bg-red-50 text-red-500 rounded-2xl h-fit">
                  <Trash2 size={24} />
               </div>
               <div>
                  <p className="font-bold text-gray-800 text-sm">Réinitialisation complète</p>
                  <p className="text-xs text-gray-500 max-w-sm">Efface tous les produits, clients et factures. Utile uniquement pour repartir de zéro ou après une erreur grave.</p>
               </div>
            </div>
            <button 
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all text-xs border border-red-100 uppercase tracking-widest"
            >
              Vider la base
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-300 font-bold text-[9px] uppercase tracking-[0.2em] pt-10">
        <Info size={10} />
        Données cryptées localement • Version de base 1.2.0
      </div>
    </div>
  );
};

export default SettingsView;