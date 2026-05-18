// src/pages/Consultation.jsx — Téléconsultation avec chat temps réel
import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { consultations as consultationsAPI, animals as animalsAPI, auth as authAPI, pdf as pdfAPI } from "../API";
import { createMeeting, authToken } from "../API";
import { PlusIcon } from "@heroicons/react/24/outline";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600'
};
const STATUS_LABELS = { pending: 'En attente', active: 'Active', closed: 'Fermée' };
const PRIORITY_COLORS = { low: 'text-gray-500', normal: 'text-blue-600', high: 'text-orange-600', urgent: 'text-red-600' };

const formatDoctorName = (name = '') => {
  const clean = String(name || '').trim();
  if (!clean) return 'Dr.';
  return /^dr\.?\s+/i.test(clean) ? clean : `Dr. ${clean}`;
};

const getTeleconsultationLink = (consultation) => {
  const explicitLink = consultation?.meetingLink || consultation?.teleconsultation?.meetingLink;
  if (explicitLink) return explicitLink;
  const meetingId = consultation?.meetingId || consultation?.teleconsultation?.meetingId;
  if (!meetingId) return null;
  return `/visio?roomId=${encodeURIComponent(meetingId)}`;
};

const canJoinTeleconsultation = (consultation) => {
  const scheduledAt = consultation?.scheduledAt || consultation?.teleconsultation?.scheduledAt;
  if (!scheduledAt) return true;
  const now = Date.now();
  const startAt = new Date(scheduledAt).getTime() - 5 * 60 * 1000; // tolérance 5 minutes avant
  return now >= startAt;
};

const formatScheduledAt = (consultation) => {
  const scheduledAt = consultation?.scheduledAt || consultation?.teleconsultation?.scheduledAt;
  if (!scheduledAt) return null;
  return new Date(scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function Consultation() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [myAnimals, setMyAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [typing, setTyping] = useState('');
  const [newForm, setNewForm] = useState({ animalId: '', subject: '', priority: 'normal', veterinarianId: '' });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planningConsultation, setPlanningConsultation] = useState(null);
  const [plannedAtLocal, setPlannedAtLocal] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Init socket
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    if (user?.role === 'veterinarian') socket.emit('join_vets');

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('consultation_accepted', (c) => {
      setConsultations(prev => prev.map(item => item.id === c.id ? c : item));
      if (activeConsultation?.id === c.id) setActiveConsultation(c);
    });
    socket.on('new_consultation_request', (c) => {
      setConsultations(prev => [c, ...prev]);
    });
    socket.on('user_typing', ({ userName }) => { setTyping(`${userName} écrit...`); });
    socket.on('user_stop_typing', () => setTyping(''));

    return () => socket.disconnect();
  }, [user]);

  // Load consultations
  useEffect(() => {
    const load = async () => {
      try {
        const [consRes, animRes] = await Promise.all([
          consultationsAPI.getAll(),
          animalsAPI.getAll().catch(() => ({ data: [] }))
        ]);
        setConsultations(consRes.data || []);
        setMyAnimals(animRes.data || []);
        if (user?.role === 'farmer') {
          const vetRes = await authAPI.getVets().catch(() => ({ data: [] }));
          setVets(vetRes.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Join/leave consultation room
  const openChat = useCallback((consultation) => {
    if (activeConsultation) socketRef.current?.emit('leave_consultation', activeConsultation.id);
    setActiveConsultation(consultation);
    setMessages(consultation.messages || []);
    socketRef.current?.emit('join_consultation', consultation.id);
  }, [activeConsultation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConsultation) return;
    setSending(true);
    try {
      await consultationsAPI.sendMessage(activeConsultation.id, { content: newMessage });
      setNewMessage('');
      socketRef.current?.emit('stop_typing', { consultationId: activeConsultation.id });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (consultationId) => {
    try {
      const res = await consultationsAPI.accept(consultationId);
      const updated = res.data.consultation;
      setConsultations(prev => prev.map(c => c.id === consultationId ? updated : c));
      setActiveConsultation(updated);
    } catch (e) { console.error(e); }
  };

  const openPlanModal = (consultation) => {
    const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
    const defaultLocal = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setPlanningConsultation(consultation);
    setPlannedAtLocal(defaultLocal);
    setShowPlanModal(true);
  };

  const handlePlanTeleconsultation = async () => {
    if (!planningConsultation) return;
    if (!authToken) {
      alert("Le token de réunion n'est pas configuré. Impossible de générer un lien visio.");
      return;
    }

    const plannedDate = new Date(plannedAtLocal);
    if (Number.isNaN(plannedDate.getTime())) {
      alert("Date/heure invalide.");
      return;
    }

    setIsPlanning(true);
    try {
      const meetingId = await createMeeting({ token: authToken });
      const meetingLink = `${window.location.origin}/visio?roomId=${encodeURIComponent(meetingId)}`;
      const res = await consultationsAPI.accept(planningConsultation.id, {
        mode: 'video',
        scheduledAt: plannedDate.toISOString(),
        meetingId,
        meetingLink,
      });
      const updated = res.data.consultation;
      setConsultations(prev => prev.map(c => c.id === planningConsultation.id ? updated : c));
      setActiveConsultation(updated);
      setShowPlanModal(false);
      setPlanningConsultation(null);
      alert("Téléconsultation planifiée. Le lien est enregistré et envoyé à l'éleveur.");
    } catch (error) {
      console.error(error);
      alert("Impossible de planifier la téléconsultation.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const animal = myAnimals.find(a => a.id === newForm.animalId);
      const vet = vets.find(v => v.id === newForm.veterinarianId);
      const res = await consultationsAPI.create({
        ...newForm,
        animalName: animal?.name || '',
        veterinarianName: vet?.name || ''
      });
      setConsultations(prev => [res.data.consultation, ...prev]);
      setShowNewForm(false);
      setNewForm({ animalId: '', subject: '', priority: 'normal', veterinarianId: '' });
    } catch (e) { console.error(e); }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeConsultation) {
      socketRef.current?.emit('typing', { consultationId: activeConsultation.id, userName: user?.name });
      clearTimeout(window._typingTimer);
      window._typingTimer = setTimeout(() => {
        socketRef.current?.emit('stop_typing', { consultationId: activeConsultation.id });
      }, 2000);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">💬 Téléconsultations</h2>
        {user?.role === 'farmer' && (
          <button onClick={() => setShowNewForm(true)}
            className="bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
            <PlusIcon className="h-4 w-4" /> Nouvelle consultation
          </button>
        )}
      </div>

      {/* New consultation form */}
      {showNewForm && (
        <div className="bg-white rounded-xl shadow p-5 border border-green-200">
          <h3 className="font-semibold text-gray-800 mb-4">Demander une consultation</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <select value={newForm.animalId} onChange={e => setNewForm(p => ({ ...p, animalId: e.target.value }))} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#178A3B] focus:border-[#178A3B]">
              <option value="">Sélectionner un animal *</option>
              {myAnimals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
            <input value={newForm.subject} onChange={e => setNewForm(p => ({ ...p, subject: e.target.value }))} required
              placeholder="Sujet / Symptômes observés *"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#178A3B] focus:border-[#178A3B]" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newForm.priority} onChange={e => setNewForm(p => ({ ...p, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="low">Faible</option>
                <option value="normal">Normal</option>
                <option value="high">Urgent</option>
              </select>
              <select value={newForm.veterinarianId} onChange={e => setNewForm(p => ({ ...p, veterinarianId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Vétérinaire (optionnel)</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.name} — {v.specialization || 'Général'}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">Envoyer</button>
            </div>
          </form>
        </div>
      )}

      {showPlanModal && planningConsultation && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Planifier la téléconsultation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Consultation: <span className="font-medium">{planningConsultation.animalName || 'Animal'}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure</label>
            <input
              type="datetime-local"
              value={plannedAtLocal}
              onChange={(e) => setPlannedAtLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#178A3B] focus:border-[#178A3B]"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => { setShowPlanModal(false); setPlanningConsultation(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePlanTeleconsultation}
                disabled={isPlanning || !plannedAtLocal}
                className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F] disabled:opacity-50"
              >
                {isPlanning ? 'Planification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Consultation list */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 bg-white rounded-xl shadow overflow-y-auto max-h-56 lg:max-h-none">
          {loading ? (
            <div className="flex justify-center items-center h-24 text-gray-400 text-sm">Chargement...</div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm p-4 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p>Aucune consultation</p>
            </div>
          ) : (
            consultations.map(c => (
              <div key={c.id} onClick={() => openChat(c)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeConsultation?.id === c.id ? 'bg-green-50 border-l-4 border-l-[#178A3B]' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-800 text-sm truncate flex-1">{c.animalName || 'Animal'}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{c.subject}</p>
                {user?.role === 'veterinarian' && c.farmerName && (
                  <p className="text-xs text-gray-400 mt-0.5">Éleveur: {c.farmerName}</p>
                )}
                {c.priority !== 'normal' && (
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[c.priority]}`}>● {c.priority === 'high' ? 'Urgent' : c.priority}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Chat window */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow flex flex-col overflow-hidden">
          {!activeConsultation ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-medium">Sélectionnez une consultation</p>
              <p className="text-sm">pour démarrer le chat</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{activeConsultation.animalName}</div>
                  <div className="text-sm text-gray-500">{activeConsultation.subject}</div>
                  {activeConsultation.veterinarianName && (
                    <div className="text-xs text-[#178A3B]">{formatDoctorName(activeConsultation.veterinarianName)}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {user?.role === 'veterinarian' && activeConsultation.status === 'pending' && (
                    <button onClick={() => openPlanModal(activeConsultation)}
                      className="px-3 py-1.5 bg-[#178A3B] text-white text-xs rounded-lg hover:bg-[#136B2F]">
                      Planifier la visio
                    </button>
                  )}
                  {user?.role === 'veterinarian' && activeConsultation.status === 'pending' && (
                    <a
                      onClick={() => handleAccept(activeConsultation.id)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 flex items-center gap-1 cursor-pointer"
                    >
                      Accepter sans visio
                    </a>
                  )}
                  {/* Visioconférence */}
                  {activeConsultation.status === 'active' && getTeleconsultationLink(activeConsultation) && (
                    <a
                      href={canJoinTeleconsultation(activeConsultation) ? getTeleconsultationLink(activeConsultation) : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!canJoinTeleconsultation(activeConsultation)) {
                          e.preventDefault();
                          alert(`La téléconsultation sera disponible à ${formatScheduledAt(activeConsultation)}.`);
                        }
                      }}
                      className={`px-3 py-1.5 text-white text-xs rounded-lg flex items-center gap-1 ${canJoinTeleconsultation(activeConsultation) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                    >
                      📹 Se connecter
                    </a>
                  )}
                  {activeConsultation.status === 'active' && formatScheduledAt(activeConsultation) && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      🗓 {formatScheduledAt(activeConsultation)}
                    </span>
                  )}
                  {/* PDF prescription download */}
                  {activeConsultation.prescriptionId && (
                    <a
                      href={pdfAPI.getPrescription(activeConsultation.prescriptionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 flex items-center gap-1"
                    >
                      📄 Ordonnance PDF
                    </a>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[activeConsultation.status]}`}>
                    {STATUS_LABELS[activeConsultation.status]}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">Démarrez la conversation...</div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${isMe ? 'bg-[#178A3B] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                        {!isMe && <div className="text-xs font-medium mb-1 text-[#178A3B]">{msg.senderName}</div>}
                        <p className="text-sm">{msg.content}</p>
                        <div className={`text-xs mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typing && <div className="text-xs text-gray-400 italic">{typing}</div>}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              {activeConsultation.status !== 'closed' ? (
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    value={newMessage} onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
                  />
                  <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-[#178A3B] text-white rounded-full text-sm hover:bg-[#136B2F] disabled:opacity-50 transition-colors">
                    {sending ? '...' : 'Envoyer'}
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 border-t">Cette consultation est fermée</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
