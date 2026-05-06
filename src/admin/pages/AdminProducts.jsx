import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/DataTable';
import { admin } from '../../API.js';
import { Search, Plus } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await admin.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Supprimer "${product.name}"?`)) {
      try {
        await admin.deleteProduct(product.id);
        setProducts(products.filter((p) => p.id !== product.id));
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Nom du Produit' },
    { key: 'category', label: 'Catégorie' },
    {
      key: 'price',
      label: 'Prix',
      render: (val) => `${val.toLocaleString('fr-FR')} F CFA`,
    },
    { key: 'stock', label: 'Stock' },
    {
      key: 'status',
      label: 'Statut',
      render: (val) => (
        <span className={val === 'active' ? 'text-green-600' : 'text-red-600'}>
          {val === 'active' ? '✓ Actif' : '✕ Inactif'}
        </span>
      ),
    },
    {
      key: 'sales',
      label: 'Ventes',
      render: (val) => `${val} unités`,
    },
  ];

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
            <p className="text-gray-600 mt-1">Marketplace et inventaire</p>
          </div>
          <button className="flex items-center gap-2 bg-[#178A3B] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <Plus size={20} />
            Ajouter Produit
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Produits</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{totalProducts}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Valeur Stock</p>
            <p className="text-2xl font-bold text-green-700 mt-2">{(totalValue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500">F CFA</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Ventes Totales</p>
            <p className="text-3xl font-bold text-orange-700 mt-2">{totalSales}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">{products.filter((p) => p.status === 'active').length}</p>
          </div>
        </div>

        {/* Tableau */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          actions={{
            delete: handleDeleteProduct,
          }}
        />
      </div>
    </AdminLayout>
  );
}
