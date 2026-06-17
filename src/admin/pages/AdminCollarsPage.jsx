import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import { RefreshCw, CheckCircle, XCircle, Search, Tag } from 'lucide-react';

const COLLAR_STATUS = {
  pending:  { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  active:   { label: 'Actif',       cls: 'bg-green-100 text-green-700 border-green-200'  },
  inactive: { label: 'Inactif',     cls: 'bg-gray-100 text-gray-500 border-gray-200'     },
};

const ANIMAL_ICONS = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷', chicken: '🐔', horse: '🐎', fish: '🐟',
};

const ANIMAL_LABELS = {
  cattle: 'Bovin', goat: 'Caprin', sheep: 'Ovin', pig: 'Porcin',
  chicken: 'Volaille', horse: 'Équin', fish: 'Poisson',
};

function CollarBadge({ status }) {
  const cfg = COLLAR_STATUS[status] || COLLAR_STATUS.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function AdminCollarsPage() {
  const [collars, setCollars]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [actionId, setActionId]     = useState(null);
  const [deactivateModal, setDeactivateModal] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await admin.getCollars(filter === 'all' ? undefined : filter);
      setCollars(data.collars || []);
    } catch {
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (animalId) => {
    setActionId(animalId);
    try {
      await admin.activateCollar(animalId);
      showToast('Collier activé — email envoyé à l\'éleveur ✅');
      load();
    } catch {
      showToast('Erreur lors de l\'activation', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateModal) return;
    setActionId(deactivateModal.animalId);
    try {
      await admin.deactivateCollar(deactivateModal.animalId, deactivateReason);
      showToast('Collier désactivé — email envoyé à l\'éleveur');
      setDeactivateModal(null);
      setDeactivateReason('');
      load();
    } catch {
      showToast('Erreur lors de la désactivation', 'error');
    } finally {
      setActionId(null);
    }
  };

  const filtered = collars.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.collarId?.toLowerCase().includes(q) ||
      c.animalName?.toLowerCase().includes(q) ||
      c.ownerName?.toLowerCase().includes(q) ||
      c.ownerEmail?.toLowerCase().includes(q)
    );
  });

  const pending = collars.filter(c => c.collarStatus === 'pending').length;
  const active  = collars.filter(c => c.collarStatus === 'active').length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-[#178A3B]'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Tag size={20} className="text-[#178A3B]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestion des colliers / Tags</h1>
              <p className="text-sm text-gray-500">Validez les identifiants de colliers enregistrés par les éleveurs</p>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'En attente', value: pending, cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Actifs',     value: active,  cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Total',      value: collars.length, cls: 'bg-gray-50 border-gray-200 text-gray-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-5 py-4 flex items-center justify-between ${s.cls}`}>
              <span className="text-sm font-medium">{s.label}</span>
              <span className="text-2xl font-bold">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Alerte colliers en attente */}
        {pending > 0 && (
          <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <p className="text-sm text-yellow-800 font-medium">
              {pending} collier{pending > 1 ? 's' : ''} en attente de validation.
              Activez-les pour que l'éleveur reçoive la confirmation par email.
            </p>
          </div>
        )}

        {/* Filtres + Recherche */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              {[
                { key: 'all',      label: 'Tous' },
                { key: 'pending',  label: '⏳ En attente' },
                { key: 'active',   label: '✅ Actifs' },
                { key: 'inactive', label: '❌ Inactifs' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filter === f.key
                      ? 'bg-[#178A3B] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par collier, animal, éleveur…"
                className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-200 border-t-[#178A3B] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun collier trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['N° Collier / Tag', 'Animal', 'Éleveur', 'Email', 'Statut', 'Enregistré le', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.animalId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#178A3B] bg-green-50 px-2 py-0.5 rounded-md text-xs">
                          {c.collarId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="mr-1">{ANIMAL_ICONS[c.animalType] || '🐾'}</span>
                        <span className="font-medium text-gray-800">{c.animalName}</span>
                        <span className="text-gray-400 text-xs ml-1">({ANIMAL_LABELS[c.animalType] || c.animalType})</span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{c.ownerName}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{c.ownerEmail}</td>
                      <td className="py-3 px-4">
                        <CollarBadge status={c.collarStatus} />
                        {c.collarActivatedAt && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(c.collarActivatedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {c.collarStatus !== 'active' && (
                            <button
                              onClick={() => handleActivate(c.animalId)}
                              disabled={actionId === c.animalId}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-all disabled:opacity-50">
                              <CheckCircle size={12} />
                              {actionId === c.animalId ? '…' : 'Activer'}
                            </button>
                          )}
                          {c.collarStatus === 'active' && (
                            <button
                              onClick={() => setDeactivateModal({ animalId: c.animalId, collarId: c.collarId, animalName: c.animalName })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                              <XCircle size={12} />
                              Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal désactivation */}
      {deactivateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-1">Désactiver le collier</h3>
            <p className="text-sm text-gray-500 mb-4">
              Collier <strong className="font-mono text-[#178A3B]">{deactivateModal.collarId}</strong> — animal <strong>{deactivateModal.animalName}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
            <textarea
              value={deactivateReason}
              onChange={e => setDeactivateReason(e.target.value)}
              rows={3} placeholder="Ex: collier perdu, numéro incorrect…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4" />
            <p className="text-xs text-gray-400 mb-4">Un email sera envoyé à l'éleveur pour l'informer.</p>
            <div className="flex gap-3">
              <button onClick={() => { setDeactivateModal(null); setDeactivateReason(''); }}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleDeactivate} disabled={actionId !== null}
                className="flex-1 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                {actionId ? 'Désactivation…' : 'Confirmer la désactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
