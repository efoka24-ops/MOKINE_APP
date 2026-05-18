import React, { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from "@heroicons/react/24/solid";
import { appointments as appointmentsAPI, auth as authAPI, animals as animalsAPI, vet as vetAPI } from "../API";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
};

export default function RendezVous() {
  const { user } = useAuth();
  const [rdvList, setRdvList] = useState([]);
  const [vets, setVets] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [vetPatients, setVetPatients] = useState([]); // [{animal, farmer}] for vet dropdown
  const [vetFarmers, setVetFarmers] = useState([]);   // unique farmers for vet dropdown
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const isVet = user?.role === 'veterinarian';
  const [form, setForm] = useState({ animalId: '', animalName: '', farmerName: '', farmerId: '', veterinarianId: '', dateTime: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        appointmentsAPI.getAll(),
        authAPI.getVets(),
        animalsAPI.getAll(),
      ];
      if (isVet) promises.push(vetAPI.getPatients());
      const [rdvRes, vetRes, animRes, patRes] = await Promise.all(promises);
      setRdvList(rdvRes.data || []);
      setVets(vetRes.data || []);
      setAnimals(animRes.data || []);
      if (patRes) {
        setVetPatients(patRes.data?.patients || []);
        setVetFarmers(patRes.data?.farmers || []);
      }
    } catch (e) {
      console.error('Erreur chargement rendez-vous:', e);
    } finally {
      setLoading(false);
    }
  }, [isVet]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isVet) {
      if (!form.animalName || !form.dateTime) {
        setError('Veuillez renseigner le nom de l\'animal et la date.');
        return;
      }
    } else {
      if (!form.animalId || !form.veterinarianId || !form.dateTime) {
        setError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
    }
    setError('');
    setSubmitting(true);
    try {
      await appointmentsAPI.create(form);
      setIsModalOpen(false);
      setForm({ animalId: '', animalName: '', farmerName: '', farmerId: '', veterinarianId: '', dateTime: '', reason: '' });
      setConfirmationMessage('Rendez-vous planifié avec succès !');
      setTimeout(() => setConfirmationMessage(null), 3000);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de la création du rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    try {
      await appointmentsAPI.cancel(id);
      setConfirmationMessage('Rendez-vous annulé.');
      setTimeout(() => setConfirmationMessage(null), 3000);
      load();
    } catch (e) {
      setConfirmationMessage('Erreur lors de l\'annulation.');
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  const getAnimalName = (rdv) => animals.find(a => a.id === rdv.animalId)?.name || rdv.animalName || '—';
  const getVetName = (rdv) => vets.find(v => v.id === rdv.veterinarianId)?.name || rdv.veterinarianName || rdv.veterinarianId || '—';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">📅 Rendez-vous</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden md:inline">Planifier un RDV</span>
        </button>
      </div>

      {confirmationMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {confirmationMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Chargement…</div>
      ) : rdvList.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun rendez-vous planifié</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur "Planifier un RDV" pour commencer.</p>
        </div>
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="hidden md:block bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs font-medium">
                  <th className="py-3 px-4">Animal</th>
                  <th className="py-3 px-4">Vétérinaire</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Heure</th>
                  <th className="py-3 px-4">Motif</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rdvList.map((rdv) => {
                  const s = STATUS_LABELS[rdv.status] || STATUS_LABELS.scheduled;
                  return (
                    <tr key={rdv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{getAnimalName(rdv)}</td>
                      <td className="py-3 px-4">{getVetName(rdv)}</td>
                      <td className="py-3 px-4">{formatDate(rdv.dateTime)}</td>
                      <td className="py-3 px-4">{formatTime(rdv.dateTime)}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{rdv.reason || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        {rdv.status === 'scheduled' && (
                          <button onClick={() => handleCancel(rdv.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                            <TrashIcon className="h-3 w-3" /> Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="md:hidden space-y-4">
            {rdvList.map((rdv) => {
              const s = STATUS_LABELS[rdv.status] || STATUS_LABELS.scheduled;
              return (
                <div key={rdv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{getAnimalName(rdv)}</p>
                      <p className="text-sm text-gray-500">{getVetName(rdv)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{formatDate(rdv.dateTime)}</div>
                    <div className="flex items-center gap-1"><ClockIcon className="h-4 w-4" />{formatTime(rdv.dateTime)}</div>
                  </div>
                  {rdv.reason && <p className="mt-2 text-xs text-gray-400 truncate">{rdv.reason}</p>}
                  {rdv.status === 'scheduled' && (
                    <button onClick={() => handleCancel(rdv.id)} className="mt-3 text-red-500 text-sm hover:underline">
                      Annuler
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Planifier RDV */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Planifier un rendez-vous</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

              {isVet ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'animal *</label>
                    {vetPatients.length > 0 ? (
                      <select
                        value={form.animalId}
                        onChange={e => {
                          const selected = vetPatients.find(p => p.animal?.id === e.target.value);
                          setForm(f => ({
                            ...f,
                            animalId: e.target.value,
                            animalName: selected?.animal?.name || '',
                            farmerId: selected?.farmer?.id || '',
                            farmerName: selected?.farmer?.name || '',
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                      >
                        <option value="">— Sélectionner un animal patient —</option>
                        {vetPatients.map(p => (
                          <option key={p.animal?.id} value={p.animal?.id}>
                            {p.animal?.name}{p.animal?.species ? ` (${p.animal.species})` : ''}
                            {p.farmer ? ` — ${p.farmer.name}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" value={form.animalName}
                        onChange={e => setForm(f => ({...f, animalName: e.target.value}))}
                        placeholder="Ex: Bella, Taureau 12…"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du propriétaire de l'animal *</label>
                    {vetFarmers.length > 0 ? (
                      <select
                        value={form.farmerId}
                        onChange={e => {
                          const f = vetFarmers.find(f => f.id === e.target.value);
                          setForm(prev => ({
                            ...prev,
                            farmerId: e.target.value,
                            farmerName: f?.name || '',
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                      >
                        <option value="">— Sélectionner l'éleveur —</option>
                        {vetFarmers.map(f => (
                          <option key={f.id} value={f.id}>{f.name}{f.phone ? ` — ${f.phone}` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" value={form.farmerName}
                        onChange={e => setForm(f => ({...f, farmerName: e.target.value}))}
                        placeholder="Nom du propriétaire de l'animal"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Animal *</label>
                    <select value={form.animalId} onChange={e => setForm(f => ({...f, animalId: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none">
                      <option value="">Sélectionner un animal</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vétérinaire *</label>
                    <select value={form.veterinarianId} onChange={e => setForm(f => ({...f, veterinarianId: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none">
                      <option value="">Sélectionner un vétérinaire</option>
                      {vets.map(v => <option key={v.id} value={v.id}>{v.name}{v.specialization ? ` — ${v.specialization}` : ''}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({...f, dateTime: e.target.value}))}
                  min={new Date().toISOString().slice(0,16)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))}
                  rows={3} placeholder="Décrivez le motif du rendez-vous…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setError(''); setForm({ animalId: '', animalName: '', farmerName: '', farmerId: '', veterinarianId: '', dateTime: '', reason: '' }); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-60">
                  {submitting ? 'Enregistrement…' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}