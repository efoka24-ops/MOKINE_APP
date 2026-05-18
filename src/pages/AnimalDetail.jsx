import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { animals as animalsAPI } from '../API';

// ─── QR Code ─────────────────────────────────────────────────────────────────
function AnimalQRCode({ animalId, animalName }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/animals/${animalId}`)}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={url} alt={`QR ${animalName}`} width={160} height={160} className="rounded-lg border" />
      <a href={url} download={`qr-${animalName}.png`} className="text-xs text-blue-600 hover:underline">Télécharger QR</a>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportCSV(animal, records) {
  const rows = [
    ['Champ', 'Valeur'],
    ['Nom', animal.name], ['Type', animal.type], ['Race', animal.breed || ''],
    ['Sexe', animal.sex || ''], ['Enclos', animal.enclos || ''],
    ['Statut', animal.status], ['Poids', animal.weight || ''],
    ['Naissance', animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('fr-FR') : ''],
    ['Collier ID', animal.collarId || ''], [],
    ['Date', 'Type', 'Titre', 'Description', 'Vétérinaire', 'Poids (kg)'],
    ...records.map(r => [
      new Date(r.date).toLocaleDateString('fr-FR'),
      r.type, r.title || r.description || '', r.description || '', r.vet || '', r.weight || ''
    ])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${animal.name}-carnet.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ANIMAL_ICONS = { cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷', chicken: '🐓', horse: '🐴', fish: '🐟' };
const STATUS_CONFIG = {
  healthy:     { color: 'bg-green-100 text-green-700',  label: 'Sain' },
  sick:        { color: 'bg-red-100 text-red-700',      label: 'Malade' },
  treatment:   { color: 'bg-orange-100 text-orange-700', label: 'En traitement' },
  observation: { color: 'bg-yellow-100 text-yellow-700', label: 'Sous observation' },
  pregnant:    { color: 'bg-blue-100 text-blue-700',    label: 'Gestante' },
  deceased:    { color: 'bg-gray-200 text-gray-600',    label: 'Décédé' },
};
const TABS = [
  { id: 'sante',        label: 'Santé',        icon: '🩺' },
  { id: 'vaccination',  label: 'Vaccination',  icon: '💉' },
  { id: 'traitements',  label: 'Traitements',  icon: '💊' },
  { id: 'reproduction', label: 'Reproduction', icon: '🐣' },
  { id: 'mortalite',    label: 'Mortalité',    icon: '📋' },
];
const TREATMENT_TYPES = [
  { value: 'medication',  label: 'Médicament' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'surgery',     label: 'Chirurgie' },
  { value: 'local_care',  label: 'Soin local' },
];
const ADMIN_MODES = ['Orale', 'Injection IM', 'Injection IV', 'Topique', 'Sous-cutané'];
const SYMPTOMS = [
  'Perte d\'appétit', 'Fièvre', 'Toux', 'Diarrhée', 'Boiterie',
  'Écoulements nasaux', 'Œil rouge', 'Amaigrissement', 'Gonflement', 'Autre',
];
const REPRO_EVENTS = [
  { value: 'cycle',         label: 'Cycle observé' },
  { value: 'mating',        label: 'Saillie / Insémination' },
  { value: 'gestation',     label: 'Gestation confirmée' },
  { value: 'birth',         label: 'Naissance' },
  { value: 'miscarriage',   label: 'Avortement' },
];

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal]             = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [treatments, setTreatments]     = useState([]);
  const [reproRecords, setReproRecords] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('sante');
  const [showQR, setShowQR]             = useState(false);

  // Modals
  const [showAddRecord, setShowAddRecord]   = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showHealthAlert, setShowHealthAlert] = useState(false);
  const [showDeathModal, setShowDeathModal]   = useState(false);
  const [showReproModal, setShowReproModal]   = useState(false);
  const [saving, setSaving]                   = useState(false);

  // Forms
  const [recordForm, setRecordForm] = useState({ type: 'checkup', title: '', description: '', vet: '', weight: '' });
  const [treatForm, setTreatForm]   = useState({
    treatmentType: 'medication', productName: '', dosage: '', administrationMode: '',
    startDate: '', duration: '', veterinarianName: '', notes: '', nextDueDate: '',
  });
  const [alertForm, setAlertForm]   = useState({ symptom: '', severity: 'medium', evolution: 'acute', temperature: '', notes: '' });
  const [deathForm, setDeathForm]   = useState({ deathDate: '', cause: '', notes: '' });
  const [reproForm, setReproForm]   = useState({
    event: 'mating', date: '', partnerName: '', gestationStatus: 'unknown',
    expectedBirthDate: '', notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [animalRes, recordsRes, treatRes, reproRes] = await Promise.all([
          animalsAPI.getById(id),
          animalsAPI.getHealthRecords(id).catch(() => ({ data: [] })),
          animalsAPI.getTreatments(id).catch(() => ({ data: [] })),
          animalsAPI.getReproductionRecords(id).catch(() => ({ data: [] })),
        ]);
        setAnimal(animalRes.data);
        setHealthRecords(recordsRes.data || []);
        setTreatments(treatRes.data || []);
        setReproRecords(reproRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleAddRecord = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await animalsAPI.addHealthRecord(id, recordForm);
      setHealthRecords(prev => [res.data.record, ...prev]);
      setShowAddRecord(false);
      setRecordForm({ type: 'checkup', title: '', description: '', vet: '', weight: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await animalsAPI.addTreatment(id, treatForm);
      setTreatments(prev => [res.data.treatment, ...prev]);
      setShowTreatmentModal(false);
      setTreatForm({ treatmentType: 'medication', productName: '', dosage: '', administrationMode: '', startDate: '', duration: '', veterinarianName: '', notes: '', nextDueDate: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleReportAlert = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await animalsAPI.reportHealthProblem(id, alertForm);
      const res = await animalsAPI.getHealthRecords(id).catch(() => ({ data: healthRecords }));
      setHealthRecords(res.data || healthRecords);
      setShowHealthAlert(false);
      const updated = await animalsAPI.getById(id);
      setAnimal(updated.data);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDeclareDeath = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await animalsAPI.declareDeath(id, deathForm);
      const updated = await animalsAPI.getById(id);
      setAnimal(updated.data);
      setShowDeathModal(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAddRepro = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await animalsAPI.addReproductionRecord(id, reproForm);
      setReproRecords(prev => [res.data.record, ...prev]);
      setShowReproModal(false);
      setReproForm({ event: 'mating', date: '', partnerName: '', gestationStatus: 'unknown', expectedBirthDate: '', notes: '' });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-400">Chargement...</div>;
  if (!animal) return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">🐾</div>
      <p className="text-gray-500">Animal non trouvé</p>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-[#178A3B] hover:underline text-sm">← Tableau de bord</button>
    </div>
  );

  const status = STATUS_CONFIG[animal.status] || STATUS_CONFIG.healthy;
  const vaccinationRecords = healthRecords.filter(r => r.type === 'vaccination');
  const soinRecords = healthRecords.filter(r => r.type !== 'vaccination' && r.type !== 'death');

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-[#178A3B]">Tableau de bord</Link>
        <span>›</span>
        <span className="font-medium text-gray-800">{animal.name}</span>
      </div>

      {/* Animal header */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center text-5xl overflow-hidden flex-shrink-0">
            {animal.photoUrl
              ? <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
              : ANIMAL_ICONS[animal.type] || '🐾'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">{animal.name}</h1>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${status.color}`}>{status.label}</span>
              {animal.isBatch && <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Lot ×{animal.quantity}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {animal.type} {animal.breed ? `— ${animal.breed}` : ''} {animal.sex ? `· ${animal.sex === 'male' ? '♂ Mâle' : '♀ Femelle'}` : ''}
            </p>
            {animal.enclos && <p className="text-xs text-gray-400 mt-0.5">📍 {animal.enclos}</p>}
            {animal.collarId && <p className="text-xs text-gray-400">🏷️ {animal.collarId}</p>}
          </div>
        </div>

        {/* Detail grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-4">
          {animal.birthDate && (
            <div><p className="text-xs text-gray-400">Naissance</p><p className="text-sm font-medium">{new Date(animal.birthDate).toLocaleDateString('fr-FR')}</p></div>
          )}
          {animal.weight && (
            <div><p className="text-xs text-gray-400">Poids</p><p className="text-sm font-medium">{animal.weight} kg</p></div>
          )}
          <div><p className="text-xs text-gray-400">Ajouté le</p><p className="text-sm font-medium">{new Date(animal.createdAt).toLocaleDateString('fr-FR')}</p></div>
          {animal.vaccinations?.length > 0 && (
            <div><p className="text-xs text-gray-400">Vaccins</p><p className="text-sm font-medium">{animal.vaccinations.length}</p></div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <button onClick={() => navigate('/ia/questionnaire')}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-lg transition-colors">
            🧠 Diagnostic IA
          </button>
          <button onClick={() => navigate('/consultation')}
            className="px-3 py-1.5 bg-[#178A3B] hover:bg-[#136B2F] text-white text-xs rounded-lg transition-colors">
            💬 Consulter
          </button>
          <button onClick={() => setShowHealthAlert(true)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-lg transition-colors">
            🚨 Signaler problème
          </button>
          <button onClick={() => setShowQR(v => !v)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors">
            📱 QR Code
          </button>
          <button onClick={() => exportCSV(animal, healthRecords)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-lg transition-colors">
            📥 Export CSV
          </button>
          {animal.status !== 'deceased' && (
            <button onClick={() => setShowDeathModal(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-colors">
              ✝️ Déclarer décès
            </button>
          )}
        </div>
      </div>

      {/* QR Code panel */}
      {showQR && (
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center gap-3">
          <h2 className="font-semibold text-gray-800 self-start">📱 QR Code — {animal.name}</h2>
          <AnimalQRCode animalId={id} animalName={animal.name} />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#178A3B] text-[#178A3B]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── SANTÉ ─────────────────────────────────────────────────────── */}
        {activeTab === 'sante' && (
          <div>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Carnet de santé</h3>
              <button onClick={() => setShowAddRecord(true)}
                className="px-3 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">+ Acte</button>
            </div>

            {showAddRecord && (
              <form onSubmit={handleAddRecord} className="p-4 bg-green-50 border-b space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={recordForm.type} onChange={e => setRecordForm(p => ({...p, type: e.target.value}))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="checkup">Visite de routine</option>
                    <option value="treatment">Traitement</option>
                    <option value="surgery">Intervention</option>
                    <option value="observation">Observation</option>
                  </select>
                  <input type="number" value={recordForm.weight}
                    onChange={e => setRecordForm(p => ({...p, weight: e.target.value}))}
                    placeholder="Poids (kg)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <input required value={recordForm.title}
                  onChange={e => setRecordForm(p => ({...p, title: e.target.value}))}
                  placeholder="Titre *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <textarea value={recordForm.description}
                  onChange={e => setRecordForm(p => ({...p, description: e.target.value}))}
                  placeholder="Description / observations" rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input value={recordForm.vet} onChange={e => setRecordForm(p => ({...p, vet: e.target.value}))}
                  placeholder="Vétérinaire" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddRecord(false)} className="text-sm text-gray-500 px-3 py-1.5">Annuler</button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg disabled:opacity-60">
                    {saving ? '...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y">
              {soinRecords.length === 0
                ? <div className="py-10 text-center text-gray-400 text-sm">Aucun acte de santé enregistré</div>
                : soinRecords.map(r => <RecordRow key={r.id} record={r} />)
              }
            </div>
          </div>
        )}

        {/* ── VACCINATION ───────────────────────────────────────────────── */}
        {activeTab === 'vaccination' && (
          <div>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Carnet de vaccination</h3>
              <button onClick={() => { setTreatForm(p => ({...p, treatmentType: 'vaccination'})); setShowTreatmentModal(true); }}
                className="px-3 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">+ Vaccin</button>
            </div>
            <div className="divide-y">
              {vaccinationRecords.length === 0
                ? <div className="py-10 text-center text-gray-400 text-sm">Aucune vaccination enregistrée</div>
                : vaccinationRecords.map(r => <RecordRow key={r.id} record={r} />)
              }
            </div>
          </div>
        )}

        {/* ── TRAITEMENTS ───────────────────────────────────────────────── */}
        {activeTab === 'traitements' && (
          <div>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Traitements</h3>
              <button onClick={() => setShowTreatmentModal(true)}
                className="px-3 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">+ Traitement</button>
            </div>
            <div className="divide-y">
              {treatments.length === 0
                ? <div className="py-10 text-center text-gray-400 text-sm">Aucun traitement enregistré</div>
                : treatments.map(t => (
                    <div key={t.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              {TREATMENT_TYPES.find(x => x.value === t.treatmentType)?.label || t.treatmentType}
                            </span>
                            <span className="font-medium text-sm text-gray-800">{t.productName || '—'}</span>
                          </div>
                          {t.dosage && <p className="text-xs text-gray-500">Posologie: {t.dosage}</p>}
                          {t.administrationMode && <p className="text-xs text-gray-500">Mode: {t.administrationMode}</p>}
                          {t.duration && <p className="text-xs text-gray-500">Durée: {t.duration}</p>}
                          {t.veterinarianName && <p className="text-xs text-gray-400 mt-0.5">Dr. {t.veterinarianName}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-400 ml-3">
                          {new Date(t.startDate).toLocaleDateString('fr-FR')}
                          {t.nextDueDate && (
                            <div className="text-blue-600 mt-0.5">Rappel: {new Date(t.nextDueDate).toLocaleDateString('fr-FR')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── REPRODUCTION ──────────────────────────────────────────────── */}
        {activeTab === 'reproduction' && (
          <div>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Suivi reproductif</h3>
              <button onClick={() => setShowReproModal(true)}
                className="px-3 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">+ Événement</button>
            </div>
            <div className="divide-y">
              {reproRecords.length === 0
                ? <div className="py-10 text-center text-gray-400 text-sm">Aucun enregistrement reproductif</div>
                : reproRecords.map(r => (
                    <div key={r.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {REPRO_EVENTS.find(e => e.value === r.event)?.label || r.event}
                            </span>
                          </div>
                          {r.partnerName && <p className="text-xs text-gray-500">Partenaire: {r.partnerName}</p>}
                          {r.gestationStatus !== 'unknown' && (
                            <p className="text-xs text-gray-500">Gestation: {r.gestationStatus === 'pregnant' ? '✅ Oui' : '❌ Non'}</p>
                          )}
                          {r.expectedBirthDate && <p className="text-xs text-blue-600">Naissance prévue: {new Date(r.expectedBirthDate).toLocaleDateString('fr-FR')}</p>}
                          {r.notes && <p className="text-xs text-gray-500 mt-0.5">{r.notes}</p>}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── MORTALITÉ ─────────────────────────────────────────────────── */}
        {activeTab === 'mortalite' && (
          <div className="p-4">
            {animal.status === 'deceased' ? (
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">✝️ Animal déclaré décédé</p>
                  {animal.deathDate && <p className="text-sm text-gray-600">Date: {new Date(animal.deathDate).toLocaleDateString('fr-FR')}</p>}
                  {animal.deathCause && <p className="text-sm text-gray-600">Cause: {animal.deathCause}</p>}
                  {animal.deathNotes && <p className="text-sm text-gray-500 mt-1">{animal.deathNotes}</p>}
                </div>
                {/* Last treatment at time of death */}
                {treatments.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-yellow-700 mb-2">Dernier traitement avant décès</p>
                    <p className="text-sm font-medium text-gray-800">{treatments[0].productName}</p>
                    <p className="text-xs text-gray-500">{new Date(treatments[0].startDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">Cet animal est actif. Vous pouvez déclarer son décès si nécessaire.</p>
                <button onClick={() => setShowDeathModal(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors">
                  ✝️ Déclarer le décès
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Treatment modal */}
      {showTreatmentModal && (
        <Modal title="Ajouter un traitement" onClose={() => setShowTreatmentModal(false)}>
          <form onSubmit={handleAddTreatment} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de traitement</label>
              <select value={treatForm.treatmentType} onChange={e => setTreatForm(p => ({...p, treatmentType: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {TREATMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Produit / Intervention *</label>
              <input required value={treatForm.productName} onChange={e => setTreatForm(p => ({...p, productName: e.target.value}))}
                placeholder="Ex: Oxytetracycline 20%" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posologie</label>
                <input value={treatForm.dosage} onChange={e => setTreatForm(p => ({...p, dosage: e.target.value}))}
                  placeholder="Ex: 5ml / 2x par jour" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mode d'administration</label>
                <select value={treatForm.administrationMode} onChange={e => setTreatForm(p => ({...p, administrationMode: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Sélectionner —</option>
                  {ADMIN_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
                <input type="date" value={treatForm.startDate} onChange={e => setTreatForm(p => ({...p, startDate: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Durée</label>
                <input value={treatForm.duration} onChange={e => setTreatForm(p => ({...p, duration: e.target.value}))}
                  placeholder="Ex: 5 jours" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de rappel (si applicable)</label>
              <input type="date" value={treatForm.nextDueDate} onChange={e => setTreatForm(p => ({...p, nextDueDate: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <input value={treatForm.veterinarianName} onChange={e => setTreatForm(p => ({...p, veterinarianName: e.target.value}))}
              placeholder="Vétérinaire (optionnel)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <textarea value={treatForm.notes} onChange={e => setTreatForm(p => ({...p, notes: e.target.value}))}
              placeholder="Observations / commentaires" rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowTreatmentModal(false)} className="text-sm text-gray-500 px-3 py-1.5">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg disabled:opacity-60">
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Health alert modal */}
      {showHealthAlert && (
        <Modal title="🚨 Signaler un problème de santé" onClose={() => setShowHealthAlert(false)}>
          <form onSubmit={handleReportAlert} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Symptôme observé *</label>
              <select required value={alertForm.symptom} onChange={e => setAlertForm(p => ({...p, symptom: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">— Sélectionner —</option>
                {SYMPTOMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Niveau de gravité</label>
              <div className="flex gap-2">
                {[['low','Faible','green'],['medium','Modéré','orange'],['high','Élevé','red'],['critical','Critique','red']].map(([v,l,c]) => (
                  <button key={v} type="button" onClick={() => setAlertForm(p => ({...p, severity: v}))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      alertForm.severity === v ? `border-${c}-500 bg-${c}-50 text-${c}-700` : 'border-gray-200 text-gray-600'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Évolution</label>
                <select value={alertForm.evolution} onChange={e => setAlertForm(p => ({...p, evolution: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="acute">Aiguë (soudain)</option>
                  <option value="chronic">Chronique (progressif)</option>
                  <option value="sudden">Subite (immédiate)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Température (°C)</label>
                <input type="number" step="0.1" value={alertForm.temperature}
                  onChange={e => setAlertForm(p => ({...p, temperature: e.target.value}))}
                  placeholder="Ex: 40.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <textarea value={alertForm.notes} onChange={e => setAlertForm(p => ({...p, notes: e.target.value}))}
              placeholder="Observations complémentaires..." rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowHealthAlert(false)} className="text-sm text-gray-500 px-3 py-1.5">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-60">
                {saving ? '...' : 'Signaler'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Death declaration modal */}
      {showDeathModal && (
        <Modal title="✝️ Déclarer le décès" onClose={() => setShowDeathModal(false)}>
          <form onSubmit={handleDeclareDeath} className="space-y-3">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              Cette action est irréversible. L'animal sera retiré du cheptel actif et archivé.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date du décès</label>
              <input type="date" value={deathForm.deathDate} onChange={e => setDeathForm(p => ({...p, deathDate: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cause probable</label>
              <input value={deathForm.cause} onChange={e => setDeathForm(p => ({...p, cause: e.target.value}))}
                placeholder="Ex: Fièvre aphteuse, accident, cause inconnue..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <textarea value={deathForm.notes} onChange={e => setDeathForm(p => ({...p, notes: e.target.value}))}
              placeholder="Observations, actions menées (isolement, élimination...)" rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowDeathModal(false)} className="text-sm text-gray-500 px-3 py-1.5">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg disabled:opacity-60">
                {saving ? '...' : 'Confirmer le décès'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reproduction modal */}
      {showReproModal && (
        <Modal title="🐣 Événement reproductif" onClose={() => setShowReproModal(false)}>
          <form onSubmit={handleAddRepro} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type d'événement</label>
              <select value={reproForm.event} onChange={e => setReproForm(p => ({...p, event: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {REPRO_EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" required value={reproForm.date} onChange={e => setReproForm(p => ({...p, date: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            {(reproForm.event === 'mating' || reproForm.event === 'gestation') && (
              <>
                <input value={reproForm.partnerName} onChange={e => setReproForm(p => ({...p, partnerName: e.target.value}))}
                  placeholder="Nom / ID du partenaire" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Statut gestation</label>
                  <select value={reproForm.gestationStatus} onChange={e => setReproForm(p => ({...p, gestationStatus: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="unknown">Non confirmé</option>
                    <option value="pregnant">Gestante</option>
                    <option value="not_pregnant">Non gestante</option>
                  </select>
                </div>
                {reproForm.gestationStatus === 'pregnant' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Naissance prévue</label>
                    <input type="date" value={reproForm.expectedBirthDate} onChange={e => setReproForm(p => ({...p, expectedBirthDate: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
              </>
            )}
            <textarea value={reproForm.notes} onChange={e => setReproForm(p => ({...p, notes: e.target.value}))}
              placeholder="Observations..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowReproModal(false)} className="text-sm text-gray-500 px-3 py-1.5">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg disabled:opacity-60">
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function RecordRow({ record }) {
  const TYPE_COLORS = {
    checkup: 'bg-blue-100 text-blue-700',
    vaccination: 'bg-green-100 text-green-700',
    treatment: 'bg-yellow-100 text-yellow-700',
    surgery: 'bg-purple-100 text-purple-700',
    observation: 'bg-orange-100 text-orange-700',
    alert: 'bg-red-100 text-red-700',
    death: 'bg-gray-200 text-gray-700',
  };
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[record.type] || 'bg-gray-100 text-gray-600'}`}>
              {record.type}
            </span>
            <span className="font-medium text-sm text-gray-800">{record.title || record.description || '—'}</span>
          </div>
          {record.description && record.description !== record.title && (
            <p className="text-sm text-gray-600 mt-0.5">{record.description}</p>
          )}
          {record.vet && <p className="text-xs text-gray-400 mt-0.5">Dr. {record.vet}</p>}
        </div>
        <div className="text-right text-xs text-gray-400 whitespace-nowrap ml-4">
          {new Date(record.date).toLocaleDateString('fr-FR')}
          {record.weight && <div className="font-medium text-gray-600">{record.weight} kg</div>}
        </div>
      </div>
    </div>
  );
}
