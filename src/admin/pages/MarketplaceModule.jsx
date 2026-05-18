import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, Store } from 'lucide-react';
import { marketVendors, marketKYC, marketOrders } from '../../API';

/**
 * MarketModule - Module d'administration du marketplace
 * Gestion des fournisseurs, KYC, commandes
 */
export default function MarketplaceAdminModule() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vendorRes, kycRes, ordersRes, kycStatsRes] = await Promise.all([
        marketVendors.getPending(),
        marketKYC.getPending(),
        marketOrders.getStats(),
        marketKYC.getStats(),
      ]);
      setVendors(vendorRes.data.vendors || []);
      setKycQueue(kycRes.data.kyc || []);
      setStats(kycStatsRes.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveVendor = async (vendorId) => {
    try {
      await marketVendors.approve(vendorId);
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleRejectVendor = async (vendorId, reason) => {
    try {
      await marketVendors.reject(vendorId, { reason });
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleApproveKYC = async (kycId) => {
    try {
      await marketKYC.approve(kycId, {
        verifications: {
          businessLicense: true,
          taxId: true,
          bankAccount: true,
          ownership: true,
          address: true,
        },
      });
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleRejectKYC = async (kycId, reason) => {
    try {
      await marketKYC.reject(kycId, { reason });
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🛍️ Gestion MokineMarket
        </h2>
        <p className="text-sm text-gray-600 mt-1">Approbation des fournisseurs, vérification KYC, gestion des commandes</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{vendors.length}</p>
            <p className="text-sm text-gray-600 mt-2">Fournisseurs en attente</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{stats.underReview}</p>
            <p className="text-sm text-yellow-600 mt-2">KYC en examen</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-sm text-green-600 mt-2">KYC approuvés</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
            <p className="text-sm text-red-600 mt-2">KYC rejetés</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'vendors', label: '🏪 Fournisseurs', icon: Store },
          { id: 'kyc', label: '📄 KYC', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {vendors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucun fournisseur en attente</p>
            </div>
          ) : (
            vendors.map(vendor => (
              <div key={vendor.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{vendor.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Candidat: {vendor.userName} | Email: {vendor.userEmail}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    ⏳ En attente
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-gray-600">Type d'affaires</p>
                    <p className="font-semibold text-gray-900">{vendor.businessType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Téléphone</p>
                    <p className="font-semibold text-gray-900">{vendor.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Adresse</p>
                    <p className="font-semibold text-gray-900">{vendor.address.substring(0, 20)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Catégories</p>
                    <p className="font-semibold text-gray-900">{vendor.categories?.length || 0}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 bg-blue-50 p-3 rounded">
                  {vendor.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveVendor(vendor.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                  >
                    <CheckCircle size={18} /> Approuver
                  </button>
                  <button
                    onClick={() => handleRejectVendor(vendor.id, 'Documents incomplets')}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                  >
                    <XCircle size={18} /> Rejeter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          {kycQueue.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Aucun KYC en attente</p>
            </div>
          ) : (
            kycQueue.map(kyc => (
              <div key={kyc.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{kyc.vendor?.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Vendeur: {kyc.vendor?.userName}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    ⏳ Sous examen
                  </span>
                </div>

                {/* Documents Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Licence Commerciale', field: 'businessLicense' },
                    { label: 'NIF', field: 'taxId' },
                    { label: 'Compte Bancaire', field: 'bankAccount' },
                    { label: 'ID Recto', field: 'ownerIdFront' },
                    { label: 'ID Verso', field: 'ownerIdBack' },
                    { label: 'Preuve d\'adresse', field: 'proofOfAddress' },
                  ].map(doc => (
                    <div key={doc.field} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-600">{doc.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {kyc.documents?.[doc.field] ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Soumis</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-yellow-600" />
                            <span className="text-xs text-yellow-600 font-medium">Manquant</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                {kyc.comments && (
                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Notes:</strong> {kyc.comments}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveKYC(kyc.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                  >
                    <CheckCircle size={18} /> Approuver KYC
                  </button>
                  <button
                    onClick={() => handleRejectKYC(kyc.id, 'Documents manquants ou invalides')}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                  >
                    <XCircle size={18} /> Rejeter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
