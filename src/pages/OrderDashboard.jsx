import React, { useState, useCallback, useEffect } from 'react';
import { ShoppingBag, Truck, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import { marketOrders } from '../API';

/**
 * OrderDashboard - Suivi des commandes
 * Historique, statuts, livraison, annulation
 */
export default function OrderDashboard() {
  const toText = (value, fallback = '') => {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return fallback;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        marketOrders.getMyOrders({ status: filter }),
        marketOrders.getStats(),
      ]);
      setOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      const statsData = statsRes?.data;
      setStats(statsData && typeof statsData === 'object' && Object.keys(statsData).length > 0 
        ? statsData 
        : { total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0, totalRevenue: 0 });
    } catch (err) {
      console.error('Erreur:', err);
      setOrders([]);
      setStats({ total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0, totalRevenue: 0 });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const STATUS_CONFIG = {
    pending: { label: '⏳ En attente', color: 'bg-yellow-50 border-yellow-200' },
    paid: { label: '✅ Payée', color: 'bg-green-50 border-green-200' },
    processing: { label: '📦 En préparation', color: 'bg-blue-50 border-blue-200' },
    shipped: { label: '🚚 Expédiée', color: 'bg-blue-50 border-blue-200' },
    delivered: { label: '🎉 Livrée', color: 'bg-green-50 border-green-200' },
    cancelled: { label: '❌ Annulée', color: 'bg-red-50 border-red-200' },
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={28} className="text-blue-600" />
          Mes Commandes
        </h2>
        <p className="text-sm text-gray-600 mt-1">Suivi et gestion de vos achats</p>
      </div>

      {/* Stats */}
      {stats && typeof stats === 'object' && 'total' in stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600 mt-1">En attente</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.paid}</p>
            <p className="text-xs text-blue-600 mt-1">Payées</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            <p className="text-xs text-green-600 mt-1">Livrées</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-700">{stats.totalRevenue?.toLocaleString('fr-FR')} F</p>
            <p className="text-xs text-red-600 mt-1">Total payé</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'paid', 'shipped', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status ? STATUS_CONFIG[status]?.label : 'Tous'}
          </button>
        ))}
      </div>

      {/* Liste commandes */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucune commande</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className={`border rounded-lg p-4 ${STATUS_CONFIG[order.status]?.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">Commande {order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{Number(order.totalPrice || 0).toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-gray-600">{STATUS_CONFIG[order.status]?.label}</p>
                </div>
              </div>

              {/* Produits */}
              <div className="bg-white/50 rounded p-3 mb-3 space-y-1">
                {order.items?.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-sm text-gray-700">
                    • {toText(item.productName, 'Produit')} <span className="text-gray-600">x{item.quantity}</span>
                  </p>
                ))}
                {order.items?.length > 3 && (
                  <p className="text-sm text-gray-600">+{order.items.length - 3} produit(s)</p>
                )}
              </div>

              {/* Statut livraison */}
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <Truck size={16} />
                  <span>Suivi: {order.trackingNumber}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center justify-center gap-1">
                  <Download size={14} /> Détails
                </button>
                {order.status === 'pending' && (
                  <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm">
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
