import React, { useState } from 'react';
import { ShoppingCart, Store, FileText } from 'lucide-react';
import ProductCatalog from './ProductCatalog';
import OrderDashboard from './OrderDashboard';
import VendorProfileDashboard from './VendorProfileDashboard';
import KYCForm from './KYCForm';

/**
 * MokineMarketPage - Page principale du marketplace
 * Onglets: Catalogue, Commandes, Profil Fournisseur, KYC
 */
export default function MokineMarketPage() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: '🛒 Catalogue', icon: ShoppingCart },
    { id: 'orders', label: '📦 Mes Commandes', icon: Store },
    { id: 'vendor', label: '🏪 Profil Fournisseur', icon: Store },
    { id: 'kyc', label: '📄 Vérification KYC', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🛍️ MokineMarket
              </h1>
              <p className="text-gray-600 mt-2">Marché vétérinaire en ligne - Produits, Équipements, Services</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'products' && <ProductCatalog />}
        {activeTab === 'orders' && <OrderDashboard />}
        {activeTab === 'vendor' && <VendorProfileDashboard />}
        {activeTab === 'kyc' && <KYCForm />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>🚀 MokineMarket v1.0 - Plateforme de commerce vétérinaire | © 2024</p>
        </div>
      </div>
    </div>
  );
}
