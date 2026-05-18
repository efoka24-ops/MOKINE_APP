import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import { Search, RefreshCw, Plus, Pencil, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';

const TABS = [
  { id: 'products', label: 'Produits' },
  { id: 'orders',   label: 'Commandes' },
  { id: 'vendors',  label: 'Fournisseurs' },
  { id: 'kyc',      label: 'KYC' },
];

function useAutoRefresh(load) {
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
}

function Badge({ value, map }) {
  const [cls, label] = map[value] || ['bg-gray-100 text-gray-600', value || '—'];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function Table({ cols, rows, empty = 'Aucune donnée' }) {
  if (rows.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">{empty}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {cols.map(c => <th key={c.key} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {cols.map(c => (
                <td key={c.key} className="py-3 px-4 text-gray-700">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAB: Produits ──────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', unit: 'unité', description: '', ...product });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const r = await admin.updateMarketProduct(form.id, form);
        onSave(r.data);
      } else {
        const r = await admin.createMarketProduct(form);
        onSave(r.data);
      }
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {[['name', 'Nom *', 'text'], ['category', 'Catégorie *', 'text'], ['price', 'Prix (F CFA) *', 'number'], ['stock', 'Stock', 'number'], ['unit', 'Unité', 'text']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={label.includes('*')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50">
              {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');

  const filtered = q ? data.filter(p => [p.name, p.category, p.vendorName].some(f => String(f || '').toLowerCase().includes(q.toLowerCase()))) : data;

  const load = useCallback(() => {
    setLoading(true);
    admin.getMarketProducts().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await admin.deleteMarketProduct(id);
    setData(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = (saved) => {
    setData(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      return idx >= 0 ? prev.map((p, i) => i === idx ? saved : p) : [saved, ...prev];
    });
  };

  const cols = [
    { key: 'name', label: 'Nom' },
    { key: 'category', label: 'Catégorie' },
    { key: 'price', label: 'Prix', render: r => `${(r.price || 0).toLocaleString()} F` },
    { key: 'stock', label: 'Stock', render: r => <span className={r.stock < 10 ? 'text-red-600 font-semibold' : ''}>{r.stock ?? 0}</span> },
    { key: 'unit', label: 'Unité', render: r => r.unit || '—' },
    { key: 'isActive', label: 'Statut', render: r => <Badge value={r.isActive !== false ? 'active' : 'inactive'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], inactive: ['bg-gray-100 text-gray-500', 'Inactif'] }} /> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <button onClick={() => setModal(r)} className="p-1.5 rounded text-amber-500 hover:bg-amber-50 transition"><Pencil size={14} /></button>
        <button onClick={() => remove(r.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Produits <span className="text-gray-400 font-normal text-sm">({filtered.length})</span></h2>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium">
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </div>
      <div className="mb-4 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
      </div>
      <Table cols={cols} rows={filtered} empty="Aucun produit" />
      {modal !== null && <ProductModal product={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ─── TAB: Commandes ─────────────────────────────────────────────────────────
function OrdersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getOrders().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const updateStatus = async (id, status) => {
    await admin.updateOrderStatus(id, status);
    setData(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const STATUS = {
    pending:   ['bg-yellow-100 text-yellow-700', 'En attente'],
    confirmed: ['bg-blue-100 text-blue-700', 'Confirmée'],
    shipped:   ['bg-purple-100 text-purple-700', 'Expédiée'],
    delivered: ['bg-green-100 text-green-700', 'Livrée'],
    cancelled: ['bg-red-100 text-red-600', 'Annulée'],
  };

  const cols = [
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-xs">{String(r.id).slice(0, 8)}</span> },
    { key: 'buyerName', label: 'Acheteur', render: r => r.buyerName || r.buyerId || '—' },
    { key: 'totalAmount', label: 'Montant', render: r => r.totalAmount ? `${r.totalAmount.toLocaleString()} F` : '—' },
    { key: 'status', label: 'Statut', render: r => <Badge value={r.status} map={STATUS} /> },
    { key: 'createdAt', label: 'Date', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
    { key: 'actions', label: 'Actions', render: r => r.status === 'pending' ? (
      <div className="flex gap-1.5">
        <button onClick={() => updateStatus(r.id, 'confirmed')} className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="Confirmer"><CheckCircle size={14} /></button>
        <button onClick={() => updateStatus(r.id, 'cancelled')} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition" title="Annuler"><XCircle size={14} /></button>
      </div>
    ) : null },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Commandes <span className="text-gray-400 font-normal text-sm">({data.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucune commande" />
    </div>
  );
}

// ─── TAB: Fournisseurs ──────────────────────────────────────────────────────
function VendorsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getVendors().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const cols = [
    { key: 'name', label: 'Nom / Raison sociale', render: r => r.businessName || r.name },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone', render: r => r.phone || '—' },
    { key: 'businessAddress', label: 'Adresse', render: r => r.businessAddress || '—' },
    { key: 'isVerified', label: 'Vérifié', render: r => <Badge value={r.isVerified ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', 'Oui'], no: ['bg-yellow-100 text-yellow-700', 'En attente'] }} /> },
    { key: 'kyc', label: 'KYC', render: r => r.kyc ? <Badge value={r.kyc.status} map={{ approved: ['bg-green-100 text-green-700', 'Approuvé'], pending: ['bg-yellow-100 text-yellow-700', 'En attente'], rejected: ['bg-red-100 text-red-600', 'Rejeté'] }} /> : <span className="text-gray-400 text-xs">Non soumis</span> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Fournisseurs <span className="text-gray-400 font-normal text-sm">({data.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucun fournisseur" />
    </div>
  );
}

// ─── TAB: KYC ───────────────────────────────────────────────────────────────
function KycTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getKycRequests().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const approve = async (id) => {
    await admin.approveKyc(id);
    setData(prev => prev.map(k => k.id === id ? { ...k, status: 'approved' } : k));
  };
  const reject = async (id) => {
    const reason = window.prompt('Raison du rejet :');
    if (reason === null) return;
    await admin.rejectKyc(id, reason);
    setData(prev => prev.map(k => k.id === id ? { ...k, status: 'rejected', rejectionReason: reason } : k));
  };

  const cols = [
    { key: 'userId', label: 'Utilisateur', render: r => r.userId || '—' },
    { key: 'businessName', label: 'Raison sociale', render: r => r.businessName || '—' },
    { key: 'documentType', label: 'Document', render: r => r.documentType || '—' },
    { key: 'status', label: 'Statut', render: r => <Badge value={r.status} map={{ pending: ['bg-yellow-100 text-yellow-700', 'En attente'], approved: ['bg-green-100 text-green-700', 'Approuvé'], rejected: ['bg-red-100 text-red-600', 'Rejeté'] }} /> },
    { key: 'submittedAt', label: 'Soumis le', render: r => r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('fr-FR') : '—' },
    { key: 'actions', label: '', render: r => r.status === 'pending' ? (
      <div className="flex gap-1.5">
        <button onClick={() => approve(r.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition font-medium">
          <CheckCircle size={12} /> Approuver
        </button>
        <button onClick={() => reject(r.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium">
          <XCircle size={12} /> Rejeter
        </button>
      </div>
    ) : <span className="text-xs text-gray-400">{r.rejectionReason || '—'}</span> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Demandes KYC <span className="text-gray-400 font-normal text-sm">({data.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucune demande KYC" />
    </div>
  );
}

export default function MarketModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'products';
  const setTab = (t) => setSearchParams(t === 'products' ? {} : { tab: t });

  const TAB_COMPONENTS = { products: <ProductsTab />, orders: <OrdersTab />, vendors: <VendorsTab />, kyc: <KycTab /> };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛒 MokineMarket</h1>
          <p className="text-sm text-gray-500 mt-1">Marketplace vétérinaire — produits, commandes, fournisseurs, KYC</p>
        </div>
        <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {TAB_COMPONENTS[tab] || <div className="text-gray-400">Onglet inconnu</div>}
        </div>
      </div>
    </AdminLayout>
  );
}
