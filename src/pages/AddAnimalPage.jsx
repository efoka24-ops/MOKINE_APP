import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { animals as animalsAPI } from '../API';

const ANIMAL_TYPES = [
  { id: 'cattle',  label: 'Bovin',       icon: '🐄' },
  { id: 'goat',    label: 'Caprin',      icon: '🐐' },
  { id: 'sheep',   label: 'Ovin',        icon: '🐑' },
  { id: 'pig',     label: 'Porcin',      icon: '🐷' },
  { id: 'chicken', label: 'Volaille',    icon: '🐔' },
  { id: 'horse',   label: 'Équin',       icon: '🐎' },
  { id: 'fish',    label: 'Poisson',     icon: '🐟' },
];

const STATUS_OPTIONS = [
  { value: 'healthy',     label: 'Sain',              color: 'text-green-700' },
  { value: 'observation', label: 'Sous observation',  color: 'text-orange-600' },
  { value: 'sick',        label: 'Malade',            color: 'text-red-700' },
  { value: 'treatment',   label: 'En traitement',     color: 'text-yellow-700' },
];

const ICON_DEFAULT = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷',
  chicken: '🐔', horse: '🐎', fish: '🐟',
};

export default function AddAnimalPage() {
  const navigate = useNavigate();
  const photoRef = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [isBatch, setIsBatch]   = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    name: '', type: 'cattle', breed: '', sex: '',
    birthDate: '', weight: '', collarId: '',
    enclos: '', notes: '', status: 'healthy',
    vaccinations: '',
    // batch
    quantity: 10,
    batchName: '',
    photoUrl: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Photo trop lourde (max 3 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      set('photoUrl', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBatch && !form.collarId.trim()) { setError('Le numéro de collier / tag est obligatoire pour identifier l\'animal.'); return; }
    if (isBatch && !form.batchName.trim()) { setError('Le nom du lot est obligatoire.'); return; }
    if (isBatch && !form.quantity) { setError('La quantité est obligatoire.'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        vaccinations: form.vaccinations ? form.vaccinations.split(',').map(s => s.trim()).filter(Boolean) : [],
        isBatch,
        quantity: isBatch ? parseInt(form.quantity) : 1,
        name: isBatch
          ? `${form.batchName} — ${ICON_DEFAULT[form.type] || ''} ${ANIMAL_TYPES.find(t => t.id === form.type)?.label || form.type} (${form.quantity} têtes)`
          : form.name.trim(),
      };
      await animalsAPI.add(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Ajouter un animal</h1>
      </div>

      {/* Batch toggle */}
      <div className="flex gap-2">
        <button onClick={() => setIsBatch(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${!isBatch ? 'border-[#178A3B] bg-green-50 text-[#178A3B]' : 'border-gray-200 text-gray-500'}`}>
          Animal individuel
        </button>
        <button onClick={() => setIsBatch(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${isBatch ? 'border-[#178A3B] bg-green-50 text-[#178A3B]' : 'border-gray-200 text-gray-500'}`}>
          Lot / Groupe
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'animal *</label>
            <div className="grid grid-cols-4 gap-2">
              {ANIMAL_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('type', t.id)}
                  className={`flex flex-col items-center p-2.5 rounded-lg border-2 transition-all ${
                    form.type === t.id ? 'border-[#178A3B] bg-green-50 text-[#178A3B]' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-xs font-medium mt-1">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optionnel)</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#178A3B] transition-colors"
                onClick={() => photoRef.current?.click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  : <div className="text-center">
                      <span className="text-2xl">{ICON_DEFAULT[form.type] || '📷'}</span>
                      <p className="text-xs text-gray-400 mt-1">Photo</p>
                    </div>
                }
              </div>
              <div>
                <button type="button" onClick={() => photoRef.current?.click()}
                  className="text-sm text-[#178A3B] border border-[#178A3B] px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                  📷 {photoPreview ? 'Changer' : 'Prendre une photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">Max 3 Mo · JPG, PNG</p>
              </div>
            </div>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Collier — identifiant principal (individuel uniquement) */}
          {!isBatch && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Numéro de collier / Tag <span className="text-red-500">*</span>
              </label>
              <input
                value={form.collarId}
                onChange={e => set('collarId', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-[#178A3B] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#178A3B] bg-green-50"
                placeholder="Ex: 001, A-23, TAG-0047…"
              />
              <p className="text-xs text-gray-500 mt-1">
                Saisissez le numéro inscrit sur le collier ou la boucle auriculaire physiquement posé sur l'animal.
              </p>
              {form.collarId.trim() && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
                  <span className="mt-0.5">ℹ️</span>
                  <span>Ce collier sera enregistré en <strong>attente d'activation</strong>. L'administrateur Mokine recevra une notification pour valider et activer ce numéro depuis le back office.</span>
                </div>
              )}
            </div>
          )}

          {/* Lot : nom du lot + quantité */}
          {isBatch && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lot *</label>
                <input required value={form.batchName} onChange={e => set('batchName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
                  placeholder="Ex: Lot bovin saison sèche 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input type="number" min="1" required value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
                  placeholder="Ex: 150" />
              </div>
            </>
          )}

          {/* Nom (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom ou surnom <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
              placeholder="Ex: Sultan, Fanta…" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
            <input value={form.breed} onChange={e => set('breed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
              placeholder="Ex: Holstein, Brahman..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
              <select value={form.sex} onChange={e => set('sex', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]">
                <option value="">Non précisé</option>
                <option value="male">Mâle</option>
                <option value="female">Femelle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">État général</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]">
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
                placeholder="Ex: 350" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enclos / Bâtiment</label>
            <input value={form.enclos} onChange={e => set('enclos', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
              placeholder="Ex: Étable A, Parcelle 3" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccinations (séparées par virgule)</label>
            <input value={form.vaccinations} onChange={e => set('vaccinations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
              placeholder="Ex: Bouche-pied 2024, PPCB 2023" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observations / Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B] resize-none"
              placeholder="Remarques particulières..." />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Enregistrement...' : isBatch ? `Ajouter le lot (${form.quantity || '?'} ${ANIMAL_TYPES.find(t => t.id === form.type)?.label || ''})` : "Ajouter l'animal"}
          </button>
        </form>
      </div>
    </div>
  );
}
