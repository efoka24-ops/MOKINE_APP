import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../API';

const TABS = ['overview', 'orders', 'products', 'payments', 'kyc', 'salespoints'];
const TAB_LABELS = {
  overview: 'Vue d\'ensemble',
  orders: 'Commandes',
  products: 'Produits',
  payments: 'Paiements',
  kyc: 'Validation KYC',
  salespoints: 'Points de vente',
};

const DELIVERY_LABELS = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Préparation', color: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
  out_for_delivery: { label: 'En livraison', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
};

const MM_PROVIDERS = [
  { id: 'orange_money', name: 'Orange Money', color: 'bg-orange-500', icon: '🟠' },
  { id: 'mtn_momo', name: 'MTN MoMo', color: 'bg-yellow-400', icon: '🟡' },
  { id: 'moov_money', name: 'Moov Money', color: 'bg-blue-500', icon: '🔵' },
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [salesPoints, setSalesPoints] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [trackingModal, setTrackingModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [kycModal, setKycModal] = useState(false);
  const [spModal, setSpModal] = useState(false);

  // Forms
  const [trackingStatus, setTrackingStatus] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentProvider, setPaymentProvider] = useState('orange_money');
  const [kycForm, setKycForm] = useState({ businessName: '', registrationNumber: '', taxId: '', address: '', phoneNumber: '', documentType: 'id_card' });
  const [spForm, setSpForm] = useState({ name: '', address: '', phone: '', manager: '' });

  const user = JSON.parse(localStorage.getItem('mokine_user') || '{}');

  useEffect(() => {
    if (user.role !== 'vendor') { navigate('/dashboard'); return; }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, spRes] = await Promise.all([
        apiClient.get('/vendor/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/marketplace/orders').catch(() => ({ data: [] })),
        apiClient.get('/vendor/sales-points').catch(() => ({ data: [] })),
      ]);
      setStats(dashRes.data.stats || dashRes.data);
      setKycStatus(dashRes.data.kycStatus);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setSalesPoints(spRes.data.salesPoints || spRes.data || []);
    } catch (e) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateDelivery = async () => {
    if (!trackingModal || !trackingStatus) return;
    try {
      await apiClient.patch(`/vendor/orders/${trackingModal.id}/tracking`, { status: trackingStatus, note: trackingNote });
      setTrackingModal(null);
      setTrackingStatus('');
      setTrackingNote('');
      loadDashboard();
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const initiatePayment = async () => {
    if (!paymentModal || !paymentPhone) return;
    try {
      const res = await apiClient.post('/vendor/payment/mobile-money', {
        orderId: paymentModal.id,
        provider: paymentProvider,
        phoneNumber: paymentPhone,
        amount: paymentModal.total,
      });
      alert(`Paiement initié! Ref: ${res.data.transactionRef || res.data.reference}\nExpire dans 15 minutes.`);
      setPaymentModal(null);
      setPaymentPhone('');
    } catch (e) {
      alert('Erreur lors du paiement');
    }
  };

  const submitKYC = async () => {
    try {
      await apiClient.post('/vendor/kyc/submit', kycForm);
      alert('Dossier KYC soumis avec succès. Validation sous 48h.');
      setKycModal(false);
      loadDashboard();
    } catch (e) {
      alert('Erreur lors de la soumission KYC');
    }
  };

  const addSalesPoint = async () => {
    try {
      await apiClient.post('/vendor/sales-points', spForm);
      setSpModal(false);
      setSpForm({ name: '', address: '', phone: '', manager: '' });
      loadDashboard();
    } catch (e) {
      alert('Erreur lors de l\'ajout');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">V</div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Espace Vendeur</h1>
                <p className="text-xs text-gray-500">{user.name || 'Vendeur'}</p>
              </div>
            </div>
            {kycStatus && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${kycStatus === 'approved' ? 'bg-green-100 text-green-700' : kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                KYC: {kycStatus === 'approved' ? '✓ Vérifié' : kycStatus === 'pending' ? '⏳ En attente' : '✗ Non vérifié'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Revenue cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Revenus aujourd'hui", value: `${(stats.todayRevenue || 0).toLocaleString()} XAF`, icon: '💰', color: 'bg-green-50 border-green-200' },
                { label: 'Revenus ce mois', value: `${(stats.monthRevenue || 0).toLocaleString()} XAF`, icon: '📈', color: 'bg-blue-50 border-blue-200' },
                { label: 'Commandes en attente', value: stats.pendingOrders || 0, icon: '📦', color: 'bg-yellow-50 border-yellow-200' },
                { label: 'Alertes stock bas', value: stats.lowStockAlerts || 0, icon: '⚠️', color: 'bg-red-50 border-red-200' },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border p-4 ${s.color}`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Orders summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Auj.", value: stats.todayOrders || 0 },
                { label: 'Ce mois', value: stats.monthOrders || 0 },
                { label: 'Total', value: stats.totalOrders || 0 },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pending orders */}
            {stats.pendingOrdersList && stats.pendingOrdersList.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Commandes en attente</h3>
                <div className="space-y-3">
                  {stats.pendingOrdersList.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">Commande #{o.id}</p>
                        <p className="text-xs text-gray-500">{o.itemCount} article(s) · {(o.total || 0).toLocaleString()} XAF</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setTrackingModal(o); setTrackingStatus('confirmed'); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                          Confirmer
                        </button>
                        <button onClick={() => { setPaymentModal(o); }} className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">
                          Paiement
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low stock */}
            {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-red-600">⚠️ Stock faible</h3>
                <div className="space-y-2">
                  {stats.lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      <span className="text-sm text-red-600 font-semibold">{p.stock} restant(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Gestion des commandes</h2>
              <span className="text-sm text-gray-500">{orders.length} commande(s)</span>
            </div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <div className="text-5xl mb-3">📦</div>
                <p>Aucune commande pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => {
                  const statusInfo = DELIVERY_LABELS[o.status] || DELIVERY_LABELS.pending;
                  return (
                    <div key={o.id} className="bg-white rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">#{o.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{new Date(o.createdAt || Date.now()).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <span className="font-bold text-gray-900">{(o.total || 0).toLocaleString()} XAF</span>
                      </div>
                      {o.items && o.items.length > 0 && (
                        <div className="text-xs text-gray-600 mb-3">
                          {o.items.slice(0, 2).map((item, i) => (
                            <span key={i} className="mr-2">• {item.productName || item.name} ×{item.quantity}</span>
                          ))}
                          {o.items.length > 2 && <span>+{o.items.length - 2} autres</span>}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setTrackingModal(o); setTrackingStatus(o.status || 'pending'); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                          Mettre à jour livraison
                        </button>
                        <button onClick={() => setPaymentModal(o)} className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">
                          Mobile Money
                        </button>
                      </div>
                      {/* Tracking history */}
                      {o.tracking && o.tracking.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-2">Historique livraison</p>
                          <div className="space-y-1">
                            {o.tracking.slice(-3).map((t, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                <span>{DELIVERY_LABELS[t.status]?.label || t.status}</span>
                                {t.note && <span className="text-gray-400">— {t.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Paiements Mobile Money</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MM_PROVIDERS.map(p => (
                <div key={p.id} className="bg-white rounded-xl border p-5 flex flex-col items-center gap-3">
                  <div className="text-4xl">{p.icon}</div>
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  <span className={`text-xs px-3 py-1 rounded-full text-white ${p.color}`}>
                    {p.id === 'orange_money' ? '1.5% frais' : p.id === 'mtn_momo' ? '1% frais' : '1.2% frais'}
                  </span>
                  <p className="text-xs text-gray-500 text-center">Sélectionnez une commande dans l'onglet Commandes pour initier un paiement</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">ℹ️ Comment ça marche</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Allez dans l'onglet Commandes</li>
                <li>Cliquez sur "Mobile Money" pour une commande</li>
                <li>Sélectionnez le fournisseur et entrez le numéro de téléphone</li>
                <li>Le client reçoit une demande de confirmation sur son téléphone</li>
                <li>Paiement confirmé automatiquement via webhook</li>
              </ol>
            </div>
          </div>
        )}

        {/* KYC TAB */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Validation KYC</h2>
              {(!kycStatus || kycStatus === 'rejected') && (
                <button onClick={() => setKycModal(true)} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">
                  Soumettre dossier KYC
                </button>
              )}
            </div>

            <div className={`rounded-xl border p-6 ${kycStatus === 'approved' ? 'bg-green-50 border-green-300' : kycStatus === 'pending' ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">
                  {kycStatus === 'approved' ? '✅' : kycStatus === 'pending' ? '⏳' : '❌'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {kycStatus === 'approved' ? 'Compte vérifié' : kycStatus === 'pending' ? 'Vérification en cours' : 'Vérification requise'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {kycStatus === 'approved' ? 'Votre identité et entreprise ont été validées.' :
                      kycStatus === 'pending' ? 'Votre dossier est en cours d\'examen (24-48h).' :
                        'Soumettez votre dossier KYC pour accéder à toutes les fonctionnalités.'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {['Vente sur la marketplace', 'Réception de paiements Mobile Money', 'Gestion des commandes', 'Support prioritaire'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={kycStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}>
                      {kycStatus === 'approved' ? '✓' : '○'}
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-medium text-gray-900 mb-3">Documents requis</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {[
                  { icon: '🪪', text: 'Pièce d\'identité ou passeport valide' },
                  { icon: '📋', text: 'Numéro de registre de commerce (RCCM)' },
                  { icon: '🏢', text: 'Justificatif d\'adresse professionnelle' },
                  { icon: '💳', text: 'Numéro contribuable / NIF' },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{d.icon}</span>
                    <span>{d.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SALES POINTS TAB */}
        {tab === 'salespoints' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Points de vente</h2>
              <button onClick={() => setSpModal(true)} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">
                + Ajouter point de vente
              </button>
            </div>
            {salesPoints.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <div className="text-5xl mb-3">🏪</div>
                <p>Aucun point de vente ajouté</p>
                <button onClick={() => setSpModal(true)} className="mt-4 text-sm text-green-600 hover:underline">
                  Ajouter votre premier point de vente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salesPoints.map(sp => (
                  <div key={sp.id} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sp.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">📍 {sp.address}</p>
                        {sp.phone && <p className="text-sm text-gray-500">📞 {sp.phone}</p>}
                        {sp.manager && <p className="text-sm text-gray-500">👤 {sp.manager}</p>}
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Gestion des produits</h2>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-600">Gérez vos produits depuis le <a href="/marketplace" className="text-green-600 hover:underline">Marketplace</a>.</p>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-red-600 mb-2">Produits en rupture imminente</h3>
                  <div className="space-y-2">
                    {stats.lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-900">{p.name}</span>
                        <span className="text-xs font-bold text-red-600">{p.stock} restant(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Mettre à jour la livraison — Commande #{trackingModal.id}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Statut</label>
                <select
                  value={trackingStatus}
                  onChange={e => setTrackingStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Note (optionnel)</label>
                <input
                  value={trackingNote}
                  onChange={e => setTrackingNote(e.target.value)}
                  placeholder="Ex: Colis remis au livreur de Yaoundé"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setTrackingModal(null)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={updateDelivery} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Money Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Paiement Mobile Money</h3>
            <p className="text-sm text-gray-500 mb-4">Commande #{paymentModal.id} — {(paymentModal.total || 0).toLocaleString()} XAF</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Fournisseur</label>
                <div className="grid grid-cols-3 gap-2">
                  {MM_PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPaymentProvider(p.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${paymentProvider === p.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="text-xs font-medium">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Numéro de téléphone</label>
                <input
                  value={paymentPhone}
                  onChange={e => setPaymentPhone(e.target.value)}
                  placeholder="Ex: 237691234567"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                Le client recevra une notification de paiement sur son téléphone et devra confirmer avec son code PIN.
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPaymentModal(null)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={initiatePayment} disabled={!paymentPhone} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                Initier le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Modal */}
      {kycModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-4">
            <h3 className="font-semibold text-gray-900 mb-4">Soumettre dossier KYC</h3>
            <div className="space-y-3">
              {[
                { key: 'businessName', label: 'Nom de l\'entreprise', placeholder: 'Ex: Agroveto SARL' },
                { key: 'registrationNumber', label: 'N° RCCM / Registre commerce', placeholder: 'Ex: RC/DLA/2024/B/1234' },
                { key: 'taxId', label: 'Numéro contribuable / NIF', placeholder: 'Ex: M123456789' },
                { key: 'address', label: 'Adresse professionnelle', placeholder: 'Ex: Akwa, Douala, Cameroun' },
                { key: 'phoneNumber', label: 'Téléphone professionnel', placeholder: 'Ex: +237 655 123 456' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input
                    value={kycForm[f.key]}
                    onChange={e => setKycForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type de document</label>
                <select
                  value={kycForm.documentType}
                  onChange={e => setKycForm(prev => ({ ...prev, documentType: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="id_card">Carte nationale d'identité</option>
                  <option value="passport">Passeport</option>
                  <option value="resident_card">Titre de séjour</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setKycModal(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={submitKYC} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700">Soumettre</button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Point Modal */}
      {spModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ajouter un point de vente</h3>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Nom du point de vente', placeholder: 'Ex: Boutique principale Yaoundé' },
                { key: 'address', label: 'Adresse', placeholder: 'Ex: Bastos, Yaoundé' },
                { key: 'phone', label: 'Téléphone', placeholder: 'Ex: +237 655 123 456' },
                { key: 'manager', label: 'Responsable', placeholder: 'Ex: Jean-Pierre Mbarga' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input
                    value={spForm[f.key]}
                    onChange={e => setSpForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSpModal(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={addSalesPoint} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
