import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { farms as farmsAPI } from '../API';

const ROLE_CONFIG = {
  owner:    { label: 'Propriétaire',       color: 'bg-green-100 text-green-700',  icon: '👑' },
  manager:  { label: 'Responsable',        color: 'bg-blue-100 text-blue-700',    icon: '🏡' },
  assistant:{ label: 'Assistant / Berger', color: 'bg-gray-100 text-gray-700',    icon: '👨‍🌾' },
};

const ACTIVITY_MOCK = [
  { id: 1, user: 'Jean Éleveur',  action: 'A ajouté un animal',           date: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, user: 'Amadou Diallo', action: 'A enregistré un traitement',   date: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, user: 'Jean Éleveur',  action: 'A signalé un problème de santé', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, user: 'Marie Ndoye',   action: 'A ajouté une observation',     date: new Date(Date.now() - 172800000).toISOString() },
];

export default function FarmManagement() {
  const { user } = useAuth();
  const [farms, setFarms]         = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('membres');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateFarm, setShowCreateFarm]   = useState(false);
  const [inviteForm, setInviteForm] = useState({ phone: '', name: '', role: 'assistant' });
  const [farmForm, setFarmForm]     = useState({ name: '', address: '', city: '', gps: '' });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await farmsAPI.getAll().catch(() => ({ data: { farms: [] } }));
        const list = Array.isArray(res.data?.farms) ? res.data.farms
                   : Array.isArray(res.data)         ? res.data
                   : [];
        setFarms(list);
        // Load members for the first farm
        if (list.length > 0) {
          const farmRes = await farmsAPI.getById(list[0].id).catch(() => ({ data: {} }));
          setMembers(Array.isArray(farmRes.data?.members) ? farmRes.data.members : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await farmsAPI.create(farmForm);
      const newFarm = res.data.farm || res.data;
      setFarms(prev => { const arr = Array.isArray(prev) ? prev : []; return [newFarm, ...arr]; });
      setMembers([]);
      setShowCreateFarm(false);
      setFarmForm({ name: '', address: '', city: '', gps: '' });
      setSuccess('Ferme créée avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const farmId = farms[0]?.id;
      if (!farmId) { setError("Créez d'abord une ferme."); setSaving(false); return; }
      await farmsAPI.invite(farmId, inviteForm);
      setShowInviteModal(false);
      setInviteForm({ phone: '', name: '', role: 'assistant' });
      setSuccess('Invitation envoyée avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'invitation");
    } finally { setSaving(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Retirer ce membre de la ferme ?')) return;
    try {
      const farmId = farms[0]?.id;
      await farmsAPI.removeMember(farmId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const currentFarm = farms[0];

  // Synthetic member list (owner + invited)
  const allMembers = currentFarm ? [
    { id: 'owner', name: user?.name || 'Vous', phone: user?.phone || '', role: 'owner', joinedAt: currentFarm.createdAt },
    ...members,
  ] : [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏡 Ma Ferme</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gérez votre exploitation et les accès des membres</p>
        </div>
        {!currentFarm && (
          <button onClick={() => setShowCreateFarm(true)}
            className="px-4 py-2 bg-[#178A3B] hover:bg-[#136B2F] text-white text-sm font-medium rounded-lg transition-colors">
            + Créer ma ferme
          </button>
        )}
      </div>

      {/* Feedback */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">{success}</div>}

      {/* Farm card */}
      {currentFarm ? (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">🏡</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800">{currentFarm.name}</h3>
              {currentFarm.city && <p className="text-sm text-gray-500">{currentFarm.city}</p>}
              {currentFarm.address && <p className="text-xs text-gray-400">{currentFarm.address}</p>}
              {currentFarm.gps && <p className="text-xs text-gray-400">📍 GPS: {currentFarm.gps}</p>}
              <p className="text-xs text-gray-400 mt-1">Créée le {new Date(currentFarm.createdAt || Date.now()).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-3">🏡</div>
            <h3 className="font-semibold text-gray-800 mb-1">Aucune ferme enregistrée</h3>
            <p className="text-sm text-gray-500 mb-4">Créez votre ferme pour gérer les membres et l'accès multi-utilisateurs.</p>
            <button onClick={() => setShowCreateFarm(true)}
              className="px-5 py-2 bg-[#178A3B] text-white text-sm font-medium rounded-lg hover:bg-[#136B2F]">
              + Créer ma ferme
            </button>
          </div>
        )
      )}

      {/* Tabs */}
      {currentFarm && (
        <>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { id: 'membres', label: 'Membres' },
              { id: 'activite', label: 'Journal d\'activité' },
              { id: 'acces', label: 'Niveaux d\'accès' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>{t.label}</button>
            ))}
          </div>

          {/* Members tab */}
          {tab === 'membres' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-800">{allMembers.length} membre{allMembers.length > 1 ? 's' : ''}</h3>
                <button onClick={() => setShowInviteModal(true)}
                  className="px-3 py-1.5 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">
                  + Inviter
                </button>
              </div>
              <div className="divide-y">
                {allMembers.map(m => {
                  const cfg = ROLE_CONFIG[m.role] || ROLE_CONFIG.assistant;
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                        {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                        <p className="text-xs text-gray-400">
                          Rejoint le {new Date(m.joinedAt || Date.now()).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {m.role !== 'owner' && (
                        <button onClick={() => handleRemoveMember(m.id)}
                          className="text-xs text-red-500 hover:text-red-700 ml-2">Retirer</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity log tab */}
          {tab === 'activite' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Journal d'activité</h3>
                <p className="text-xs text-gray-500 mt-0.5">Toutes les actions effectuées sur cette ferme</p>
              </div>
              <div className="divide-y">
                {ACTIVITY_MOCK.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800"><span className="font-medium">{a.user}</span> — {a.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.date).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Succès</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access levels tab */}
          {tab === 'acces' && (
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 mb-1">Niveaux d'accès</h3>
              {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                <div key={role} className="border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{cfg.icon}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {role === 'owner' && <>
                      <li>✅ Accès complet — gestion totale du cheptel</li>
                      <li>✅ Inviter / retirer des membres</li>
                      <li>✅ Consulter les vétérinaires et passer des commandes</li>
                      <li>✅ Modifier et supprimer des fiches animaux</li>
                    </>}
                    {role === 'manager' && <>
                      <li>✅ Gérer tout le cheptel (ajouter, modifier)</li>
                      <li>✅ Consulter les alertes et contacter les vétérinaires</li>
                      <li>✅ Enregistrer traitements et actes de santé</li>
                      <li>❌ Inviter de nouveaux membres</li>
                      <li>❌ Supprimer un animal (validation propriétaire)</li>
                    </>}
                    {role === 'assistant' && <>
                      <li>✅ Ajouter des observations et photos</li>
                      <li>✅ Consulter les informations de base</li>
                      <li>✅ Suivre les instructions de soins</li>
                      <li>❌ Modifier ou supprimer des fiches</li>
                      <li>❌ Accès aux consultations vétérinaires</li>
                    </>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Create farm modal */}
      {showCreateFarm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-gray-800">🏡 Créer ma ferme</h3>
              <button onClick={() => setShowCreateFarm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateFarm} className="p-4 space-y-3">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom de la ferme *</label>
                <input required value={farmForm.name} onChange={e => setFarmForm(p => ({...p, name: e.target.value}))}
                  placeholder="Ex: Ferme du Nord" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ville / Localité</label>
                <input value={farmForm.city} onChange={e => setFarmForm(p => ({...p, city: e.target.value}))}
                  placeholder="Ex: Yaoundé" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse / Quartier</label>
                <input value={farmForm.address} onChange={e => setFarmForm(p => ({...p, address: e.target.value}))}
                  placeholder="Ex: Quartier Mvog-Mbi" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Coordonnées GPS (optionnel)</label>
                <input value={farmForm.gps} onChange={e => setFarmForm(p => ({...p, gps: e.target.value}))}
                  placeholder="Ex: 3.8480°N, 11.5021°E" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateFarm(false)} className="text-sm text-gray-500 px-3 py-2">Annuler</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F] disabled:opacity-60">
                  {saving ? 'Création...' : 'Créer la ferme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite member modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-gray-800">Inviter un membre</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleInvite} className="p-4 space-y-3">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom de la personne</label>
                <input required value={inviteForm.name} onChange={e => setInviteForm(p => ({...p, name: e.target.value}))}
                  placeholder="Prénom et nom" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Numéro de téléphone *</label>
                <input required type="tel" value={inviteForm.phone} onChange={e => setInviteForm(p => ({...p, phone: e.target.value}))}
                  placeholder="Ex: +237655..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rôle attribué</label>
                <div className="space-y-2">
                  {Object.entries(ROLE_CONFIG).filter(([r]) => r !== 'owner').map(([role, cfg]) => (
                    <button key={role} type="button" onClick={() => setInviteForm(p => ({...p, role}))}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        inviteForm.role === role ? 'border-[#178A3B] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{cfg.label}</p>
                        <p className="text-xs text-gray-500">
                          {role === 'manager' ? 'Peut gérer le cheptel et contacter les vétérinaires' : 'Peut ajouter des observations et consulter'}
                        </p>
                      </div>
                      {inviteForm.role === role && <span className="ml-auto text-[#178A3B]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 bg-blue-50 p-3 rounded-lg">
                📱 Un SMS sera envoyé à ce numéro avec un lien d'invitation.
                La personne aura 72h pour accepter.
              </p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowInviteModal(false)} className="text-sm text-gray-500 px-3 py-2">Annuler</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F] disabled:opacity-60">
                  {saving ? 'Envoi...' : 'Envoyer l\'invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
