import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { vet as vetAPI, consultations as consultAPI } from '../API.js';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  normal: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const MODE_OPTIONS = [
  { value: 'text', label: '💬 Chat texte', desc: 'Messagerie instantanée' },
  { value: 'audio', label: '🎙️ Audio', desc: 'Appel vocal' },
  { value: 'video', label: '📹 Vidéo', desc: 'Visioconférence' },
  { value: 'onsite', label: '🚗 Sur terrain', desc: 'Visite physique géolocalisée' },
];

const REMINDER_TYPES = ['vaccination', 'checkup', 'treatment', 'followup'];
const THEMES = ['vaccination', 'nutrition', 'hygiene', 'disease', 'general'];
const LANG_OPTIONS = ['Français', 'Fulfuldé', 'Haoussa', 'Wolof', 'Anglais'];

const withDoctorPrefix = (name = '') => {
  const cleanName = String(name || '').trim();
  if (!cleanName) return 'Dr.';
  return /^dr\.?\s+/i.test(cleanName) ? cleanName : `Dr. ${cleanName}`;
};

function StatCard({ label, value, icon, color = 'green' }) {
  const colors = { green: 'from-green-600 to-green-700', blue: 'from-blue-600 to-blue-700', orange: 'from-orange-500 to-orange-600', red: 'from-red-500 to-red-600' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="font-semibold text-sm opacity-90">{label}</div>
    </div>
  );
}

export default function VetDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data
  const [data, setData] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [patients, setPatients] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [sensiPosts, setSensiPosts] = useState([]);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [faq, setFaq] = useState(null);

  // UI state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptModal, setAcceptModal] = useState(null); // consultation to accept
  const [refuseModal, setRefuseModal] = useState(null); // consultation to refuse
  const [refuseReason, setRefuseReason] = useState('');
  const [infoModal, setInfoModal] = useState(null);
  const [infoQuestion, setInfoQuestion] = useState('');
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({ animalName: '', farmerId: '', farmerName: '', type: 'vaccination', dueDate: '', notes: '' });
  const [sensiModal, setSensiModal] = useState(false);
  const [sensiForm, setSensiForm] = useState({ title: '', content: '', theme: 'general', urgency: 'info', zone: '', languages: ['Français'], type: 'post', campaignDate: '' });
  const [referModal, setReferModal] = useState(null);
  const [availableVets, setAvailableVets] = useState([]);
  const [referForm, setReferForm] = useState({ targetVetId: '', message: '', specialty: '' });
  const [postModal, setPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'maladie', tags: '' });
  const [forumFilter, setForumFilter] = useState({ category: '', search: '' });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, consultationId: '' });
  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ farmerName: '', animalName: '', type: 'consultation', scheduledAt: '', duration: 30, notes: '' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoCoords, setGeoCoords] = useState(null);

  useEffect(() => {
    if (user?.role !== 'veterinarian') { navigate('/dashboard'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, agRes, patRes, invRes, forumRes, remRes, sensiRes] = await Promise.allSettled([
        vetAPI.getDashboard(),
        vetAPI.getAgenda(),
        vetAPI.getPatients(),
        vetAPI.getInvoices(),
        vetAPI.getForumPosts(forumFilter),
        vetAPI.getReminders(),
        vetAPI.getSensitisationPosts(),
      ]);
      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data);
        setPendingConsultations(dashRes.value.data.pendingConsultations || []);
      }
      if (agRes.status === 'fulfilled') setAgenda(Array.isArray(agRes.value.data) ? agRes.value.data : []);
      if (patRes.status === 'fulfilled') setPatients(patRes.value.data);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.invoices || []);
      if (forumRes.status === 'fulfilled') setForumPosts(forumRes.value.data.posts || []);
      if (remRes.status === 'fulfilled') setReminders(remRes.value.data.reminders || []);
      if (sensiRes.status === 'fulfilled') setSensiPosts(sensiRes.value.data.posts || []);
    } catch {}
    setLoading(false);
  }, []);

  const loadFAQ = async () => {
    if (faq) return;
    try { const r = await vetAPI.getSupportFAQ(); setFaq(r.data); } catch {}
  };

  // Actions
  const handleAccept = async (mode) => {
    if (mode === 'onsite') {
      setGeoLoading(true);
      setGeoError('');
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoCoords(coords);
        setGeoLoading(false);
        await vetAPI.acceptConsultation(acceptModal.id, mode, coords);
      } catch {
        setGeoLoading(false);
        setGeoError('Géolocalisation impossible — intervention acceptée sans coordonnées GPS.');
        await vetAPI.acceptConsultation(acceptModal.id, mode);
      }
    } else {
      await vetAPI.acceptConsultation(acceptModal.id, mode);
    }
    setAcceptModal(null);
    setGeoCoords(null);
    setGeoError('');
    fetchAll();
  };

  const handleRefuse = async () => {
    try {
      await vetAPI.refuseConsultation(refuseModal.id, refuseReason);
      setRefuseModal(null); setRefuseReason('');
      fetchAll();
    } catch {}
  };

  const handleRequestInfo = async () => {
    if (!infoQuestion.trim()) return;
    try {
      await vetAPI.requestMoreInfo(infoModal.id, infoQuestion);
      setInfoModal(null); setInfoQuestion('');
      fetchAll();
    } catch {}
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await vetAPI.createReminder(reminderForm);
      setReminderModal(false);
      setReminderForm({ animalName: '', farmerId: '', farmerName: '', type: 'vaccination', dueDate: '', notes: '' });
      fetchAll();
    } catch {}
  };

  const handleCreateSensi = async (e) => {
    e.preventDefault();
    try {
      await vetAPI.createSensitisationPost(sensiForm);
      setSensiModal(false);
      setSensiForm({ title: '', content: '', theme: 'general', urgency: 'info', zone: '', languages: ['Français'], type: 'post', campaignDate: '' });
      fetchAll();
    } catch {}
  };

  const handleRefer = async () => {
    if (!referForm.targetVetId) return;
    try {
      await vetAPI.referColleague({ ...referForm, consultationId: referModal?.id });
      setReferModal(null); setReferForm({ targetVetId: '', message: '', specialty: '' });
    } catch {}
  };

  const openReferModal = async (consultation) => {
    setReferModal(consultation || true);
    try { const r = await vetAPI.getVetsForReferral(); setAvailableVets(r.data.vets || []); } catch {}
  };

  const handleCreatePost = async () => {
    try {
      await vetAPI.createForumPost({ ...newPost, tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean) });
      setPostModal(false); setNewPost({ title: '', content: '', category: 'maladie', tags: '' });
      fetchAll();
    } catch {}
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await vetAPI.createSlot(slotForm);
      setSlotModal(false);
      setSlotForm({ farmerName: '', animalName: '', type: 'consultation', scheduledAt: '', duration: 30, notes: '' });
      fetchAll();
    } catch {}
  };

  const handleMarkReminderDone = async (id) => {
    try { await vetAPI.markReminderDone(id); fetchAll(); } catch {}
  };

  const handleMarkResolved = async (postId) => {
    try { await vetAPI.resolveForumPost(postId); fetchAll(); } catch {}
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceModal.consultationId) return;
    try {
      await vetAPI.generateInvoice({ consultationId: invoiceModal.consultationId });
      setInvoiceModal({ open: false, consultationId: '' });
      fetchAll();
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = data?.stats || {};

  const TABS = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'demandes', label: `Demandes${pendingConsultations.length > 0 ? ` (${pendingConsultations.length})` : ''}`, icon: '📥' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'patients', label: 'Patients', icon: '🐄' },
    { id: 'billing', label: 'Facturation', icon: '💰' },
    { id: 'analytics', label: 'Statistiques', icon: '📈' },
    { id: 'forum', label: 'Forum', icon: '💬' },
    { id: 'communication', label: 'Communication', icon: '📢' },
    { id: 'support', label: 'Support', icon: '🆘' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Espace Vétérinaire</h1>
            <p className="text-green-200 text-sm mt-0.5">
              {withDoctorPrefix(user?.name)}
              {user?.specialization && ` — ${user.specialization}`}
              {user?.city && ` · ${user.city}`}
            </p>
            {user?.licenseNumber && (
              <p className="text-green-300 text-xs mt-0.5 font-mono">🏅 OVN : {user.licenseNumber}</p>
            )}
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {pendingConsultations.length > 0 && (
              <button onClick={() => setTab('demandes')}
                className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse hover:bg-red-600">
                {pendingConsultations.length} demande{pendingConsultations.length > 1 ? 's' : ''} en attente
              </button>
            )}
            <button onClick={() => navigate('/consultation')} className="bg-white text-green-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-green-50">
              Voir les consultations
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'support') loadFAQ(); }}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── OVERVIEW ─────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Consultations totales" value={stats.totalConsultations || 0} icon="💬" color="green" />
              <StatCard label="En cours" value={stats.activeConsultations || 0} icon="🔴" color="orange" />
              <StatCard label="Demandes en attente" value={stats.pendingRequests || 0} icon="⏳" color="red" />
              <StatCard label="Patients uniques" value={stats.uniquePatients || 0} icon="🐄" color="blue" />
            </div>

            {/* Rappels à venir */}
            {reminders.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm">
                <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" /><h2 className="font-bold text-gray-800">Rappels à venir</h2></div>
                  <button onClick={() => setReminderModal(true)} className="text-sm text-amber-700 font-medium hover:underline">+ Nouveau</button>
                </div>
                {reminders.slice(0, 3).map(r => (
                  <div key={r.id} className="px-5 py-3 border-b border-gray-100 last:border-0 flex items-center justify-between">
                    <div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mr-2">{r.type}</span>
                      <span className="font-medium text-sm text-gray-800">{r.animalName}</span>
                      <span className="text-xs text-gray-400 ml-2">· {r.farmerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{new Date(r.dueDate).toLocaleDateString('fr-FR')}</span>
                      <button onClick={() => handleMarkReminderDone(r.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">✓ Fait</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Demandes en attente snapshot */}
            {pendingConsultations.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm">
                <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><h2 className="font-bold text-gray-800">Demandes en attente</h2></div>
                  <button onClick={() => setTab('demandes')} className="text-sm text-red-600 font-medium hover:underline">Voir toutes →</button>
                </div>
                {pendingConsultations.slice(0, 3).map(c => (
                  <div key={c.id} className="px-5 py-4 border-b border-gray-100 last:border-0 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.normal}`}>{c.priority?.toUpperCase() || 'NORMAL'}</span>
                        <span className="font-semibold text-gray-800">{c.animalName}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{c.subject}</p>
                      <p className="text-xs text-gray-400">{c.farmerName} · {new Date(c.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <button onClick={() => setAcceptModal(c)} className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex-shrink-0">
                      Accepter
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Activité récente */}
            {data?.recentActivity?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">Activité récente</h2></div>
                {data.recentActivity.map(c => (
                  <div key={c.id} className="px-5 py-3.5 border-b border-gray-100 last:border-0 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{c.animalName}</span>
                      <span className="text-gray-400 text-sm mx-2">·</span>
                      <span className="text-sm text-gray-600">{c.subject}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DEMANDES ─────────────────────────────────── */}
        {tab === 'demandes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Demandes de consultation</h2>
            {pendingConsultations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">Aucune demande en attente</p>
              </div>
            ) : (
              pendingConsultations.map(c => (
                <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${selectedRequest?.id === c.id ? 'border-green-400' : 'border-gray-200'}`}>
                  <div className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setSelectedRequest(selectedRequest?.id === c.id ? null : c)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.normal}`}>{(c.priority || 'normal').toUpperCase()}</span>
                        <span className="font-bold text-gray-800">{c.animalName}</span>
                        <span className="text-gray-400 text-sm">— {c.farmerName}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{c.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className="text-gray-400 text-sm">{selectedRequest?.id === c.id ? '▲' : '▼'}</span>
                  </div>

                  {selectedRequest?.id === c.id && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                      {c.messages?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Messages de l'éleveur</p>
                          {c.messages.slice(0, 3).map(m => (
                            <div key={m.id} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 mb-1">{m.content}</div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setAcceptModal(c)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700">
                          ✅ Accepter
                        </button>
                        <button onClick={() => setRefuseModal(c)}
                          className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-200 hover:bg-red-100">
                          ❌ Refuser
                        </button>
                        <button onClick={() => setInfoModal(c)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-xl font-medium border border-blue-200 hover:bg-blue-100">
                          ❓ Demander infos
                        </button>
                        <button onClick={() => openReferModal(c)}
                          className="px-4 py-2 bg-purple-50 text-purple-700 text-sm rounded-xl font-medium border border-purple-200 hover:bg-purple-100">
                          🔄 Référer confrère
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── AGENDA ─────────────────────────────────── */}
        {tab === 'agenda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Mon Agenda</h2>
              <button onClick={() => setSlotModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">+ Nouveau créneau</button>
            </div>
            {agenda.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="text-5xl mb-3">📅</div>
                <p className="text-gray-500">Aucun rendez-vous planifié</p>
              </div>
            ) : agenda.map(slot => (
              <div key={slot.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="bg-green-100 text-green-700 rounded-xl p-3 text-center min-w-[60px]">
                  <div className="text-lg font-bold">{new Date(slot.scheduledAt).getDate()}</div>
                  <div className="text-xs">{new Date(slot.scheduledAt).toLocaleString('fr-FR', { month: 'short' })}</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{slot.farmerName} — {slot.animalName || 'Animal à définir'}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{new Date(slot.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {slot.duration} min · {slot.type}</div>
                  {slot.notes && <div className="text-xs text-gray-400 mt-1 italic">{slot.notes}</div>}
                  {slot.type === 'onsite' && slot.location && (
                    <div className="text-xs text-blue-600 mt-1">📍 {slot.location}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${slot.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{slot.status}</span>
                  {slot.type === 'video' && (
                    <button onClick={() => navigate('/visioconference')}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium">
                      📹 Rejoindre
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PATIENTS ─────────────────────────────────── */}
        {tab === 'patients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Patients ({patients?.totalPatients || 0})</h2>
              <button onClick={() => setReminderModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600">+ Rappel</button>
            </div>

            {/* Rappels */}
            {reminders.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-3">⏰ Rappels programmés</h3>
                <div className="space-y-2">
                  {reminders.map(r => (
                    <div key={r.id} className="bg-white border border-amber-100 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mr-2">{r.type}</span>
                        <span className="text-sm font-medium text-gray-800">{r.animalName}</span>
                        {r.notes && <span className="text-xs text-gray-400 ml-2 italic">{r.notes}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{new Date(r.dueDate).toLocaleDateString('fr-FR')}</span>
                        <button onClick={() => handleMarkReminderDone(r.id)} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200">✓ Fait</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(patients?.patients || []).map(p => (
              <div key={p.animal.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                      {p.animal.type === 'cattle' ? '🐄' : p.animal.type === 'sheep' ? '🐑' : p.animal.type === 'goat' ? '🐐' : '🐾'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{p.animal.name}</div>
                      <div className="text-xs text-gray-500">{p.animal.type} · {p.animal.breed}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-gray-700">{p.consultationCount} consultation{p.consultationCount > 1 ? 's' : ''}</div>
                    <div className="text-xs text-gray-400">{p.lastConsultation ? new Date(p.lastConsultation).toLocaleDateString('fr-FR') : 'Aucune'}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setInvoiceModal({ open: true, consultationId: p.consultations[0]?.id || '' })}
                    className="text-sm text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50">Facture</button>
                  <button onClick={() => {
                    setReminderForm(f => ({ ...f, animalName: p.animal.name, animalId: p.animal.id }));
                    setReminderModal(true);
                  }} className="text-sm text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50">+ Rappel</button>
                </div>
              </div>
            ))}
            {(patients?.patients || []).length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">Aucun patient suivi</div>
            )}
          </div>
        )}

        {/* ── BILLING ─────────────────────────────────── */}
        {tab === 'billing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0) / 1000).toFixed(0)}K</div>
                <div className="text-sm text-green-600 font-medium">XAF perçus</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{(invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0) / 1000).toFixed(0)}K</div>
                <div className="text-sm text-yellow-600 font-medium">XAF en attente</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{invoices.length}</div>
                <div className="text-sm text-blue-600 font-medium">Factures émises</div>
              </div>
            </div>
            {invoices.map(inv => (
              <div key={inv.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-gray-800">{inv.id}</div>
                  <div className="text-sm text-gray-600">{inv.farmerName} · {inv.animalName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-800">{inv.amount?.toLocaleString()} <span className="text-sm font-normal">{inv.currency}</span></div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status === 'paid' ? 'Payée' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">Aucune facture générée</div>}
          </div>
        )}

        {/* ── FORUM ─────────────────────────────────── */}
        {tab === 'forum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-800">Forum Vétérinaires</h2>
              <div className="flex gap-2">
                <button onClick={() => openReferModal(null)} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-100">🔄 Référer un cas</button>
                <button onClick={() => setPostModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">+ Nouvelle publication</button>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-3 flex-wrap">
              <input value={forumFilter.search} onChange={e => setForumFilter(f => ({ ...f, search: e.target.value }))}
                placeholder="Rechercher..." className="border border-gray-300 rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px] focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <select value={forumFilter.category} onChange={e => setForumFilter(f => ({ ...f, category: e.target.value }))}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="">Toutes catégories</option>
                {['maladie', 'traitement', 'chirurgie', 'nutrition', 'legislation', 'formation', 'divers'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {forumPosts.map(post => (
              <div key={post.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${post.resolved ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                      {post.resolved && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">✓ Résolu</span>}
                      {post.tags?.map(tag => <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{tag}</span>)}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{withDoctorPrefix(post.authorName)}</span>
                      <span>· {new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>· 💬 {post.replies?.length || 0}</span>
                      <span>· 👍 {post.likes}</span>
                    </div>
                  </div>
                  {post.authorId === user?.id && !post.resolved && (
                    <button onClick={() => handleMarkResolved(post.id)}
                      className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 flex-shrink-0">
                      ✓ Résoudre
                    </button>
                  )}
                </div>
              </div>
            ))}
            {forumPosts.length === 0 && <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">Aucune publication</div>}
          </div>
        )}

        {/* ── COMMUNICATION ─────────────────────────────────── */}
        {tab === 'communication' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Communication & Sensibilisation</h2>
                <p className="text-sm text-gray-500 mt-0.5">Partagez des conseils, alertes et campagnes avec les éleveurs</p>
              </div>
              <button onClick={() => setSensiModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">+ Nouveau contenu</button>
            </div>

            {sensiPosts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.urgency === 'critical' ? 'bg-red-100 text-red-700' : post.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {post.urgency === 'critical' ? '🚨 Critique' : post.urgency === 'urgent' ? '⚠️ Urgent' : 'ℹ️ Info'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.theme}</span>
                      {post.type === 'campaign' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">📅 Campagne</span>}
                      {post.zone && <span className="text-xs text-gray-500">📍 {post.zone}</span>}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    {post.campaignDate && (
                      <p className="text-xs text-purple-700 mt-1 font-medium">📅 Campagne : {new Date(post.campaignDate).toLocaleDateString('fr-FR')}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{post.authorName}</span>
                      <span>· {new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>· 👁 {post.views} vues</span>
                      <span>· 🔔 {post.notified} notifiés</span>
                      <span>· {post.languages?.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sensiPosts.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">📢</div>
                <p className="text-gray-500">Aucun contenu publié</p>
                <p className="text-sm text-gray-400 mt-1">Partagez vos premiers conseils avec les éleveurs de votre zone</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ─────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Statistiques analytiques</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-md">
                <div className="text-3xl font-bold">{stats.totalConsultations || 0}</div>
                <div className="text-sm font-medium opacity-90 mt-1">Consultations totales</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-md">
                <div className="text-3xl font-bold">{stats.uniquePatients || 0}</div>
                <div className="text-sm font-medium opacity-90 mt-1">Patients uniques</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-md">
                <div className="text-3xl font-bold">{invoices.filter(i => i.status === 'paid').length}</div>
                <div className="text-sm font-medium opacity-90 mt-1">Factures payées</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 text-white shadow-md">
                <div className="text-3xl font-bold">
                  {Math.round(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0) / 1000)}K
                </div>
                <div className="text-sm font-medium opacity-90 mt-1">XAF perçus</div>
              </div>
            </div>

            {/* Consultations par statut */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Consultations par statut</h3>
              {[
                { label: 'Active', count: stats.activeConsultations || 0, color: '#16a34a' },
                { label: 'En attente', count: stats.pendingRequests || 0, color: '#d97706' },
                { label: 'Fermée', count: (stats.totalConsultations || 0) - (stats.activeConsultations || 0) - (stats.pendingRequests || 0), color: '#6b7280' },
              ].map(({ label, count, color }) => {
                const pct = stats.totalConsultations > 0 ? Math.round((count / stats.totalConsultations) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div className="h-4 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-mono text-gray-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Répartition par mode */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Modes de consultation utilisés</h3>
              {[
                { label: '💬 Chat texte', mode: 'text' },
                { label: '🎙️ Audio', mode: 'audio' },
                { label: '📹 Vidéo', mode: 'video' },
                { label: '🚗 Terrain', mode: 'onsite' },
              ].map(({ label, mode }) => {
                const count = (data?.recentActivity || []).filter(c => c.mode === mode).length;
                const total = (data?.recentActivity || []).length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={mode} className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div className="h-3 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Rappels par type */}
            {reminders.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">Rappels programmés par type</h3>
                {REMINDER_TYPES.map(type => {
                  const count = reminders.filter(r => r.type === type).length;
                  const pct = reminders.length > 0 ? Math.round((count / reminders.length) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-gray-600 w-24 capitalize flex-shrink-0">{type}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="h-3 rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agenda à venir */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-2">Agenda — {agenda.length} rendez-vous planifié{agenda.length > 1 ? 's' : ''}</h3>
              <p className="text-sm text-gray-500">
                Visites terrain : <strong>{agenda.filter(s => s.type === 'onsite').length}</strong> ·
                Vidéo : <strong>{agenda.filter(s => s.type === 'video').length}</strong> ·
                Audio : <strong>{agenda.filter(s => s.type === 'audio').length}</strong> ·
                Chat : <strong>{agenda.filter(s => s.type === 'consultation').length}</strong>
              </p>
            </div>
          </div>
        )}

        {/* ── SUPPORT ─────────────────────────────────── */}
        {tab === 'support' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-xl font-bold text-gray-800">Support & Ressources</h2>

            {/* Contact */}
            {faq && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <h3 className="font-bold text-green-800 mb-3">📞 Contacter le support</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a href={`https://wa.me/${faq.contacts?.whatsapp?.replace(/\s/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3 hover:bg-green-100 text-sm font-medium text-green-800">
                    📱 WhatsApp
                    <span className="text-xs text-gray-500 block">{faq.contacts?.whatsapp}</span>
                  </a>
                  <a href={`mailto:${faq.contacts?.email}`}
                    className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3 hover:bg-green-100 text-sm font-medium text-green-800">
                    ✉️ Email
                    <span className="text-xs text-gray-500 block">{faq.contacts?.email}</span>
                  </a>
                  <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3 text-sm font-medium text-green-800">
                    🕐 Horaires
                    <span className="text-xs text-gray-500 block">{faq.contacts?.hours}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guides */}
            {faq?.guides && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">📚 Centre de ressources</h3>
                <div className="space-y-2">
                  {faq.guides.map((g, i) => (
                    <a key={i} href={g.url} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{g.title}</span>
                      <span className="ml-auto text-gray-400 text-sm">→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faq?.faqs && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">❓ Questions fréquentes</h3>
                <div className="space-y-3">
                  {faq.faqs.map((item, i) => (
                    <details key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-800 hover:bg-gray-50">{item.q}</summary>
                      <div className="px-4 pb-3 pt-1 text-sm text-gray-600 border-t border-gray-100 bg-gray-50">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {!faq && <div className="text-center py-10 text-gray-400">Chargement des ressources...</div>}
          </div>
        )}
      </div>

      {/* ── MODAL: Accepter consultation (choix mode) ── */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Choisir le mode de consultation</h3>
            <p className="text-sm text-gray-600">
              <strong>{acceptModal.animalName}</strong> — {acceptModal.farmerName}<br />
              <span className="text-gray-400">{acceptModal.subject}</span>
            </p>
            {geoLoading && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Localisation GPS en cours…
              </div>
            )}
            {geoError && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-xs text-orange-700">{geoError}</div>
            )}
            {geoCoords && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700">
                📍 Position : {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
              </div>
            )}
            <div className="space-y-2">
              {MODE_OPTIONS.map(m => (
                <button
                  key={m.value}
                  disabled={geoLoading}
                  onClick={() => handleAccept(m.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="text-xl">{m.label.split(' ')[0]}</span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{m.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xs text-gray-400">{m.desc}{m.value === 'onsite' ? ' — GPS automatique' : ''}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => { setAcceptModal(null); setGeoCoords(null); setGeoError(''); }} className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
          </div>
        </div>
      )}

      {/* ── MODAL: Refuser consultation ── */}
      {refuseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Refuser la consultation</h3>
            <p className="text-sm text-gray-500">Un message sera envoyé à l'éleveur (optionnel).</p>
            <textarea value={refuseReason} onChange={e => setRefuseReason(e.target.value)}
              rows={3} placeholder="Motif du refus (optionnel)..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-300 focus:outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setRefuseModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={handleRefuse} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">Confirmer le refus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Demander infos complémentaires ── */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Demander des informations</h3>
            <textarea value={infoQuestion} onChange={e => setInfoQuestion(e.target.value)}
              rows={3} placeholder="Quelle information manque-t-il ? (symptômes, photos, durée...)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-300 focus:outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setInfoModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={handleRequestInfo} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">Envoyer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Référer un confrère ── */}
      {referModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Référer un confrère</h3>
            <select value={referForm.targetVetId} onChange={e => setReferForm(f => ({ ...f, targetVetId: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none">
              <option value="">Choisir un vétérinaire…</option>
              {availableVets.map(v => (
                <option key={v.id} value={v.id}>{withDoctorPrefix(v.name)}{v.specialization ? ` — ${v.specialization}` : ''}</option>
              ))}
            </select>
            <input value={referForm.specialty} onChange={e => setReferForm(f => ({ ...f, specialty: e.target.value }))}
              placeholder="Domaine de compétence recherché (ex: volailles)" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none" />
            <textarea value={referForm.message} onChange={e => setReferForm(f => ({ ...f, message: e.target.value }))}
              rows={3} placeholder="Message au confrère (optionnel)..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-300 focus:outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setReferModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
              <button onClick={handleRefer} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700">Envoyer la référence</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Rappel de soin ── */}
      {reminderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Programmer un rappel</h3>
            <form onSubmit={handleCreateReminder} className="space-y-3">
              <input value={reminderForm.animalName} onChange={e => setReminderForm(f => ({ ...f, animalName: e.target.value }))}
                placeholder="Nom de l'animal *" required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:outline-none" />
              <input value={reminderForm.farmerName} onChange={e => setReminderForm(f => ({ ...f, farmerName: e.target.value }))}
                placeholder="Nom de l'éleveur" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:outline-none" />
              <select value={reminderForm.type} onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:outline-none">
                {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="datetime-local" value={reminderForm.dueDate} onChange={e => setReminderForm(f => ({ ...f, dueDate: e.target.value }))}
                required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:outline-none" />
              <input value={reminderForm.notes} onChange={e => setReminderForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (ex: vaccin PPCB, 2ème dose...)" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:outline-none" />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setReminderModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600">Créer le rappel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Sensibilisation ── */}
      {sensiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Publier un contenu de sensibilisation</h3>
              <button onClick={() => setSensiModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreateSensi} className="p-6 space-y-4">
              <input value={sensiForm.title} onChange={e => setSensiForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Titre *" required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <textarea value={sensiForm.content} onChange={e => setSensiForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Contenu / message *" required rows={4}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Thème</label>
                  <select value={sensiForm.theme} onChange={e => setSensiForm(f => ({ ...f, theme: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Niveau d'urgence</label>
                  <select value={sensiForm.urgency} onChange={e => setSensiForm(f => ({ ...f, urgency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option value="info">ℹ️ Information</option>
                    <option value="urgent">⚠️ Urgent</option>
                    <option value="critical">🚨 Critique</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Type</label>
                  <select value={sensiForm.type} onChange={e => setSensiForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option value="post">Publication</option>
                    <option value="campaign">Campagne</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Zone géographique</label>
                  <input value={sensiForm.zone} onChange={e => setSensiForm(f => ({ ...f, zone: e.target.value }))}
                    placeholder="Ex: Région Centre" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              </div>
              {sensiForm.type === 'campaign' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date de la campagne</label>
                  <input type="datetime-local" value={sensiForm.campaignDate} onChange={e => setSensiForm(f => ({ ...f, campaignDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Langues de diffusion</label>
                <div className="flex flex-wrap gap-2">
                  {LANG_OPTIONS.map(lang => (
                    <button key={lang} type="button"
                      onClick={() => setSensiForm(f => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang] }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${sensiForm.languages.includes(lang) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSensiModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Nouveau créneau agenda ── */}
      {slotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nouveau créneau</h3>
            <form onSubmit={handleCreateSlot} className="space-y-3">
              <input value={slotForm.farmerName} onChange={e => setSlotForm(f => ({ ...f, farmerName: e.target.value }))} placeholder="Nom de l'éleveur" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <input value={slotForm.animalName} onChange={e => setSlotForm(f => ({ ...f, animalName: e.target.value }))} placeholder="Animal concerné" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <select value={slotForm.type} onChange={e => setSlotForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="consultation">Téléconsultation</option>
                <option value="onsite">Visite sur terrain</option>
                <option value="vaccination">Vaccination</option>
                <option value="followup">Suivi</option>
              </select>
              <input type="datetime-local" value={slotForm.scheduledAt} onChange={e => setSlotForm(f => ({ ...f, scheduledAt: e.target.value }))} required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <input type="number" value={slotForm.duration} onChange={e => setSlotForm(f => ({ ...f, duration: e.target.value }))} placeholder="Durée (min)" min={15} max={240} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <textarea value={slotForm.notes} onChange={e => setSlotForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Notes (adresse pour visites terrain...)" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:outline-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setSlotModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm">Annuler</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Facture ── */}
      {invoiceModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Générer une facture</h3>
            <input value={invoiceModal.consultationId} onChange={e => setInvoiceModal(p => ({ ...p, consultationId: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4" placeholder="ID de la consultation" />
            <div className="flex gap-3">
              <button onClick={() => setInvoiceModal({ open: false, consultationId: '' })} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm font-medium">Annuler</button>
              <button onClick={handleGenerateInvoice} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700">Générer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nouveau post forum ── */}
      {postModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Nouvelle publication</h3>
            <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Titre" />
            <select value={newPost.category} onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm">
              {['maladie', 'traitement', 'chirurgie', 'nutrition', 'legislation', 'formation', 'divers'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} rows={5} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none" placeholder="Contenu..." />
            <input value={newPost.tags} onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Tags (virgule): fièvre, bovin..." />
            <div className="flex gap-3">
              <button onClick={() => setPostModal(false)} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm font-medium">Annuler</button>
              <button onClick={handleCreatePost} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700">Publier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
