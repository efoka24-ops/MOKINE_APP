// src/pages/Ordonnances.jsx — Gestion ordonnances (vétérinaire) + consultation (éleveur)
import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, DocumentTextIcon, ArrowDownTrayIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { consultations as consultAPI, animals as animalsAPI, pdf as pdfAPI } from '../API';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_CONFIG = {
  active:  { label: 'Active',  color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirée', color: 'bg-red-100   text-red-700'   },
  used:    { label: 'Utilisée', color: 'bg-gray-100  text-gray-600'  },
};

const EMPTY_MED = { name: '', dosage: '', frequency: '', duration: '' };

export default function Ordonnances() {
  const { user } = useAuth();
  const isVet = user?.role === 'veterinarian';

  const [prescriptions, setPrescriptions] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    consultationId: '',
    animalId: '',
    animalName: '',
    medicines: [{ ...EMPTY_MED }],
    instructions: '',
    validDays: 30,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyResults, setVerifyResults] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, cRes] = await Promise.all([
        consultAPI.getPrescriptions(),
        animalsAPI.getAll().catch(() => ({ data: [] })),
        isVet ? consultAPI.getAll().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setPrescriptions(pRes.data || []);
      setAnimals(aRes.data || []);
      setConsultations(cRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isVet]);

  useEffect(() => { load(); }, [load]);

  const setMed = (idx, field, value) => {
    setForm(f => {
      const meds = [...f.medicines];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...f, medicines: meds };
    });
  };

  const addMed = () => setForm(f => ({ ...f, medicines: [...f.medicines, { ...EMPTY_MED }] }));
  const removeMed = (idx) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));

  const handleAnimalChange = (id) => {
    const a = animals.find(x => x.id === id);
    setForm(f => ({ ...f, animalId: id, animalName: a?.name || '' }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.medicines.some(m => !m.name.trim())) {
      setError('Veuillez remplir le nom de chaque médicament.');
      return;
    }
    if (!form.animalId) {
      setError('Veuillez sélectionner un animal.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await consultAPI.createPrescription(form);
      setShowCreate(false);
      setForm({ consultationId: '', animalId: '', animalName: '', medicines: [{ ...EMPTY_MED }], instructions: '', validDays: 30 });
      setSuccessMsg('Ordonnance créée avec succès !');
      setTimeout(() => setSuccessMsg(''), 3000);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyPrescription = async (id) => {
    setVerifyResults(v => ({ ...v, [id]: 'checking' }));
    try {
      const res = await pdfAPI.verifyPrescription(id);
      setVerifyResults(v => ({ ...v, [id]: res.data?.valid ? 'valid' : 'invalid' }));
    } catch {
      setVerifyResults(v => ({ ...v, [id]: 'invalid' }));
    }
  };

  const downloadPDF = (id) => {
    const token = localStorage.getItem('mokine_token');
    window.open(`${API_BASE}/pdf/prescription/${id}?token=${token}`, '_blank');
  };

  const getStatus = (p) => {
    if (new Date() > new Date(p.validUntil)) return 'expired';
    return p.status || 'active';
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">📋 Ordonnances</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isVet ? 'Gérez et émettez vos ordonnances numériques' : 'Vos ordonnances vétérinaires'}
          </p>
        </div>
        {isVet && (
          <button onClick={() => setShowCreate(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-full shadow flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            <span className="hidden md:inline">Nouvelle ordonnance</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckBadgeIcon className="h-5 w-5" /> {successMsg}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">Chargement…</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucune ordonnance</p>
          {isVet && <p className="text-sm text-gray-400 mt-1">Créez votre première ordonnance ci-dessus.</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map(p => {
            const st = getStatus(p);
            const config = STATUS_CONFIG[st] || STATUS_CONFIG.active;
            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">
                        🐾 {p.animalName || 'Animal'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">Prescrit par <span className="font-medium">Dr. {p.veterinarianName}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Émise le {new Date(p.createdAt).toLocaleDateString('fr-FR')} —
                      Valide jusqu'au {new Date(p.validUntil).toLocaleDateString('fr-FR')}
                    </p>

                    {/* Médicaments */}
                    <div className="mt-3 space-y-1">
                      {p.medicines?.map((m, i) => (
                        <div key={i} className="bg-green-50 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium text-green-800">{m.name}</span>
                          <span className="text-gray-500 ml-2">— {m.dosage}{m.frequency ? `, ${m.frequency}` : ''}{m.duration ? `, ${m.duration}` : ''}</span>
                        </div>
                      ))}
                    </div>
                    {p.instructions && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                        📌 {p.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <button onClick={() => downloadPDF(p.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      <ArrowDownTrayIcon className="h-4 w-4" /> PDF
                    </button>
                    {verifyResults[p.id] === 'valid' ? (
                      <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                        <CheckBadgeIcon className="h-4 w-4" /> Authentique
                      </span>
                    ) : verifyResults[p.id] === 'invalid' ? (
                      <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                        ⚠️ Invalide
                      </span>
                    ) : (
                      <button onClick={() => verifyPrescription(p.id)}
                        disabled={verifyResults[p.id] === 'checking'}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60">
                        <CheckBadgeIcon className="h-4 w-4" />
                        {verifyResults[p.id] === 'checking' ? '...' : 'Vérifier'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle ordonnance</h3>
              <button onClick={() => { setShowCreate(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

              {/* Animal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal *</label>
                <select value={form.animalId} onChange={e => handleAnimalChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none">
                  <option value="">Sélectionner un animal</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                </select>
              </div>

              {/* Consultation liée (optionnel) */}
              {consultations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation liée (optionnel)</label>
                  <select value={form.consultationId} onChange={e => setForm(f => ({ ...f, consultationId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option value="">— Sans consultation liée —</option>
                    {consultations.filter(c => c.status === 'active' || c.status === 'closed').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.subject || `Consultation #${c.id.slice(-6)}`} — {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Médicaments */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Médicaments *</label>
                  <button type="button" onClick={addMed}
                    className="text-sm text-green-600 hover:underline flex items-center gap-1">
                    <PlusIcon className="h-4 w-4" /> Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {form.medicines.map((m, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex gap-2 items-start">
                        <input value={m.name} onChange={e => setMed(idx, 'name', e.target.value)}
                          placeholder="Nom du médicament *" required
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        {form.medicines.length > 1 && (
                          <button type="button" onClick={() => removeMed(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">✕</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input value={m.dosage} onChange={e => setMed(idx, 'dosage', e.target.value)}
                          placeholder="Posologie" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        <input value={m.frequency} onChange={e => setMed(idx, 'frequency', e.target.value)}
                          placeholder="Fréquence" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        <input value={m.duration} onChange={e => setMed(idx, 'duration', e.target.value)}
                          placeholder="Durée" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions spéciales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions spéciales</label>
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  rows={3} placeholder="Instructions particulières pour l'éleveur…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" />
              </div>

              {/* Validité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validité (jours)</label>
                <select value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: Number(e.target.value) }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                  <option value={7}>7 jours</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium disabled:opacity-60">
                  {submitting ? 'Création…' : 'Créer l\'ordonnance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
