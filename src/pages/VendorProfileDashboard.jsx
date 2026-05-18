import React, { useState, useCallback, useEffect } from 'react';
import { Store, Plus, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { marketVendors, marketProducts } from '../API';
import { useAuth } from '../context/AuthContext';

/**
 * VendorDashboard - Tableau de bord fournisseur
 * Gestion des produits, commandes, profil
 */
export default function MarketplaceVendorDashboard() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'medicaments',
    sku: '',
    price: '',
    stock: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const vendorRes = await marketVendors.getMyProfile();
      setVendor(vendorRes.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await marketProducts.create({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      });
      setFormData({ name: '', description: '', category: 'medicaments', sku: '', price: '', stock: '' });
      setShowAddProduct(false);
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const STATUS_CONFIG = {
    pending: { label: '⏳ En attente', color: 'bg-yellow-50 border-yellow-200' },
    approved: { label: '✅ Approuvé', color: 'bg-green-50 border-green-200' },
    rejected: { label: '❌ Rejeté', color: 'bg-red-50 border-red-200' },
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vous n'êtes pas enregistré comme fournisseur</p>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Devenir Fournisseur
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store size={28} className="text-purple-600" />
            Tableau de Bord Fournisseur
          </h2>
          <p className="text-sm text-gray-600 mt-1">{vendor.name}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${STATUS_CONFIG[vendor.status]?.color}`}>
          {STATUS_CONFIG[vendor.status]?.label}
        </div>
      </div>

      {/* KYC Status */}
      {vendor.kycStatus !== 'approved' && (
        <div className={`p-4 border rounded-lg flex items-start gap-3 ${
          vendor.kycStatus === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <AlertCircle className={`flex-shrink-0 mt-0.5 ${
            vendor.kycStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
          }`} size={20} />
          <div>
            <p className={`font-semibold ${
              vendor.kycStatus === 'rejected' ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {vendor.kycStatus === 'rejected' ? 'KYC Rejeté' : 'KYC en attente'}
            </p>
            <p className={`text-sm mt-1 ${
              vendor.kycStatus === 'rejected' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {vendor.kycStatus === 'rejected'
                ? 'Veuillez soumettre des documents valides'
                : 'Soumettez vos documents KYC pour être approuvé'}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{vendor.stats?.productsCount || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Produits</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{vendor.stats?.ordersCount || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Commandes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {(vendor.stats?.totalRevenue || 0).toLocaleString('fr-FR')} F
          </p>
          <p className="text-sm text-gray-600 mt-2">Chiffre d'affaires</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">
            {vendor.stats?.rating?.toFixed(1) || 'N/A'}⭐
          </p>
          <p className="text-sm text-gray-600 mt-2">Note ({vendor.stats?.reviewCount || 0})</p>
        </div>
      </div>

      {/* Ajouter Produit */}
      <button
        onClick={() => setShowAddProduct(!showAddProduct)}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium"
      >
        <Plus size={20} /> Ajouter un Produit
      </button>

      {/* Formulaire Produit */}
      {showAddProduct && (
        <form onSubmit={handleAddProduct} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom du produit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="vaccins">Vaccins</option>
              <option value="medicaments">Médicaments</option>
              <option value="equipements">Équipements</option>
              <option value="fournitures">Fournitures</option>
              <option value="aliments">Aliments Spécialisés</option>
            </select>
            <input
              type="number"
              placeholder="Prix (FCFA)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowAddProduct(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Profil */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">Profil Fournisseur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Nom d'affaires</p>
            <p className="font-semibold text-gray-900">{vendor.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Téléphone</p>
            <p className="font-semibold text-gray-900">{vendor.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Adresse</p>
            <p className="font-semibold text-gray-900">{vendor.address}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Description</p>
            <p className="font-semibold text-gray-900">{vendor.description || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
