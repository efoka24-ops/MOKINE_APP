import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import { admin } from '../../API.js';
import { Search } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await admin.getPayments();
        setPayments(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) =>
    payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'transactionId', label: 'ID Transaction' },
    { key: 'userEmail', label: 'Utilisateur' },
    {
      key: 'amount',
      label: 'Montant',
      render: (val) => `${val.toLocaleString('fr-FR')} F CFA`,
    },
    { key: 'paymentMethod', label: 'Méthode' },
    {
      key: 'status',
      label: 'Statut',
      render: (val) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            val === 'completed'
              ? 'bg-green-100 text-green-800'
              : val === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {val === 'completed' ? 'Complété' : val === 'pending' ? 'En attente' : 'Échoué'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ];

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
          <p className="text-gray-600 mt-1">Suivi des transactions et revenus</p>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par email ou ID transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <p className="text-sm text-gray-600">Revenus Totaux</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{totalRevenue.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-500 mt-2">F CFA</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">{pendingAmount.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-500 mt-2">F CFA</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{payments.length}</p>
            <p className="text-xs text-gray-500 mt-2">au total</p>
          </div>
        </div>

        {/* Tableau des paiements */}
        <DataTable columns={columns} data={filteredPayments} loading={loading} />

        {/* Rapport Mensuel */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Rapport Mensuel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Transactions Complétées</p>
              <p className="text-2xl font-bold mt-1">{payments.filter((p) => p.status === 'completed').length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions Échouées</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{payments.filter((p) => p.status === 'failed').length}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
