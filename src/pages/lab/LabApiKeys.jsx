import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';

export default function LabApiKeys() {
  const { token } = useLabAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(null);
  const [revealed, setRevealed] = useState({});

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/lab/models/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/lab/models/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (res.ok) {
        setNewKeyName('');
        setShowForm(false);
        fetchKeys();
      }
    } catch {}
    setCreating(false);
  };

  const revokeKey = async (id) => {
    if (!window.confirm('Révoquer cette clé ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`/api/lab/models/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchKeys();
    } catch {}
  };

  const copyKey = async (key, id) => {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/mokinelab/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-800">Clés API</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
          style={{ background: PRIMARY }}>
          + Générer une clé
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
          <strong>Utilisation des clés API :</strong> Ajoutez le header <code className="bg-blue-100 px-1 rounded">Authorization: Bearer &lt;votre_clé&gt;</code> à vos requêtes vers <code className="bg-blue-100 px-1 rounded">/api/lab/models/:id/infer</code>.
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Nouvelle clé API</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Nom de la clé (ex: Mon app, Intégration X...)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                onKeyDown={e => e.key === 'Enter' && createKey()}
              />
              <button onClick={createKey} disabled={creating}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
                style={{ background: PRIMARY }}>
                {creating ? '...' : 'Créer'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des clés */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-gray-500 font-medium">Aucune clé API</p>
            <p className="text-gray-400 text-sm mt-1">Générez une clé pour accéder à vos modèles déployés.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{k.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-gray-700 truncate max-w-xs">
                        {revealed[k.id] ? k.key : k.maskedKey || `mlk_••••••••${k.key?.slice(-8)}`}
                      </code>
                      <button
                        onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        {revealed[k.id] ? '🙈' : '👁️'}
                      </button>
                      <button
                        onClick={() => copyKey(k.key, k.id)}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        {copied === k.id ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{k.requestCount || 0} requêtes</p>
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(k.createdAt).toLocaleDateString('fr-FR')}</p>
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="mt-2 text-xs text-red-400 hover:text-red-600 font-medium">
                      Révoquer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
