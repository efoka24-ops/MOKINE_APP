import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import { admin } from '../../API.js';
import { Search, Plus } from 'lucide-react';

export default function AdminVeterinarians() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const { data } = await admin.getVeterinarians();
        setVets(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVets();
  }, []);

  const filteredVets = vets.filter((vet) =>
    vet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'specialization', label: 'Spécialité' },
    { key: 'phone', label: 'Téléphone' },
    {
      key: 'availability',
      label: 'Disponibilité',
      render: (val) => (
        <span className={val ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {val ? 'Disponible' : 'Indisponible'}
        </span>
      ),
    },
    {
      key: 'earnings',
      label: 'Revenus',
      render: (val) => `${val.toLocaleString('fr-FR')} F CFA`,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Vétérinaires</h1>
            <p className="text-gray-600 mt-1">Gérez la liste des professionnels</p>
          </div>
          <button className="flex items-center gap-2 bg-[#178A3B] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Plus size={20} />
            Ajouter Vétérinaire
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
            />
          </div>
        </div>

        {/* Tableau */}
        <DataTable columns={columns} data={filteredVets} loading={loading} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Vétérinaires</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{vets.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Disponibles</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{vets.filter((v) => v.availability).length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Spécialités</p>
            <p className="text-3xl font-bold text-orange-700 mt-2">{new Set(vets.map((v) => v.specialization)).size}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Revenus Totaux</p>
            <p className="text-2xl font-bold text-purple-700 mt-2">
              {vets.reduce((sum, v) => sum + (v.earnings || 0), 0).toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
