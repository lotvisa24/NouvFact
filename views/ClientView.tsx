import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, X } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { Client } from '../types.ts';

const ClientView = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    setClients(dataService.getClients());
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData: Client = {
      id: editingClient?.id || Date.now().toString(),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    let newClients;
    if (editingClient) {
      newClients = clients.map(c => c.id === editingClient.id ? clientData : c);
    } else {
      newClients = [...clients, clientData];
    }

    setClients(newClients);
    dataService.saveClients(newClients);
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const deleteClient = (id: string) => {
    if (confirm('Supprimer ce client ?')) {
      const newClients = clients.filter(c => c.id !== id);
      setClients(newClients);
      dataService.saveClients(newClients);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Base Clients</h2>
          <p className="text-sm text-gray-500 font-medium">Suivez vos clients et leurs historiques de facturation.</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          Nouveau Client
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher un client..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-emerald-300 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl uppercase">
                  {client.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-emerald-600"><Edit2 size={16} /></button>
                  <button onClick={() => deleteClient(client.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">{client.name}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <Phone size={14} className="text-emerald-500" />
                  {client.phone}
                </div>
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Mail size={14} className="text-emerald-500" />
                    {client.email}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <MapPin size={14} className="text-emerald-500" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 italic">Aucun client répertorié.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{editingClient ? 'Modifier le client' : 'Nouveau client'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nom ou Raison Sociale</label>
                  <input name="name" required defaultValue={editingClient?.name} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ex: Clinique Centrale" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Téléphone</label>
                    <input name="phone" required defaultValue={editingClient?.phone} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="+225 ..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Email</label>
                    <input name="email" type="email" defaultValue={editingClient?.email} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="contact@..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Adresse Physique</label>
                  <textarea name="address" rows={2} defaultValue={editingClient?.address} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm resize-none" placeholder="Rue, Ville, Pays..." />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-4 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientView;