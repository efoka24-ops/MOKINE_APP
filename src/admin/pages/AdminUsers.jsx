import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import { admin } from '../../API.js';
import { Search, Plus } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await admin.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleBlock = async (user) => {
    try {
      await admin.toggleUserBlock(user.id);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, blocked: !u.blocked } : u)));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle', render: (val) => <span className="capitalize">{val}</span> },
    {
      key: 'status',
      label: 'Statut',
      render: (_, row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            row.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {row.blocked ? 'Bloqué' : 'Actif'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date d\'inscription',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez les éleveurs et vétérinaires</p>
          </div>
          <button className="flex items-center gap-2 bg-[#178A3B] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Plus size={20} />
            Nouvel Utilisateur
          </button>
        </div>

        {/* Recherche et Filtres */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]">
              <option>Tous les rôles</option>
              <option>Éleveur</option>
              <option>Vétérinaire</option>
              <option>Admin</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]">
              <option>Tous les statuts</option>
              <option>Actif</option>
              <option>Bloqué</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          actions={{
            toggle: handleToggleBlock,
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Utilisateurs Totaux</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{users.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{users.filter((u) => !u.blocked).length}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Comptes Bloqués</p>
            <p className="text-3xl font-bold text-red-700 mt-2">{users.filter((u) => u.blocked).length}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
