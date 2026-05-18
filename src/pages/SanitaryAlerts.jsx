import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../API';

const SEVERITY_CONFIG = {
  low: { label: 'Faible', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500', icon: '🔵' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500', icon: '🟡' },
  high: { label: 'Élevé', color: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500', icon: '🟠' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500', icon: '🔴' },
};

const ALERT_TYPES = [
  { id: 'symptom', label: 'Symptôme suspect', icon: '🤒' },
  { id: 'mortality', label: 'Mortalité animale', icon: '💀' },
  { id: 'epidemic', label: 'Épidémie suspectée', icon: '⚠️' },
  { id: 'quarantine', label: 'Quarantaine', icon: '🔒' },
];

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SanitaryAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [locating, setLocating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'symptom',
    description: '',
    severity: 'medium',
    animalType: 'cattle',
    affectedCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
    detectLocation();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts/sanitary').catch(() => ({ data: [] }));
      setAlerts(res.data.alerts || res.data || getMockAlerts());
    } catch {
      setAlerts(getMockAlerts());
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Géolocalisation non supportée par votre navigateur');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        // Fallback: Yaoundé, Cameroun
        setUserLocation({ lat: 3.848, lon: 11.502 });
        setLocationError('Position approximative (Yaoundé). Activez la géolocalisation pour plus de précision.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const getMockAlerts = () => [
    { id: '1', type: 'epidemic', severity: 'critical', description: 'Foyer de fièvre aphteuse détecté — 12 bovins affectés. Mouvement du bétail suspendu dans un rayon de 10 km.', animalType: 'cattle', affectedCount: 12, location: { lat: 3.87, lon: 11.52 }, city: 'Obala', reportedBy: 'Dr. Amara Diallo', createdAt: new Date(Date.now() - 2 * 3600000), verified: true },
    { id: '2', type: 'symptom', severity: 'high', description: 'Plusieurs ovins présentent des symptômes de pasteurellose — toux, fièvre > 41°C, difficultés respiratoires.', animalType: 'sheep', affectedCount: 6, location: { lat: 3.82, lon: 11.48 }, city: 'Soa', reportedBy: 'Jean-Pierre Mbarga', createdAt: new Date(Date.now() - 5 * 3600000), verified: false },
    { id: '3', type: 'mortality', severity: 'medium', description: 'Mortalité inexpliquée de 3 caprins en 48h. Analyses en cours. Isolez les animaux suspects.', animalType: 'goat', affectedCount: 3, location: { lat: 3.95, lon: 11.55 }, city: 'Nkolafamba', reportedBy: 'Aminata Traoré', createdAt: new Date(Date.now() - 12 * 3600000), verified: false },
    { id: '4', type: 'quarantine', severity: 'high', description: 'Zone de quarantaine déclarée suite à suspicion de charbon bactéridien. Accès interdit aux non-professionnels.', animalType: 'cattle', affectedCount: 25, location: { lat: 3.78, lon: 11.44 }, city: 'Mbankomo', reportedBy: 'MINEPIA', createdAt: new Date(Date.now() - 24 * 3600000), verified: true },
  ];

  const alertsWithDistance = alerts.map(a => ({
    ...a,
    distanceKm: userLocation && a.location
      ? Math.round(distanceKm(userLocation.lat, userLocation.lon, a.location.lat, a.location.lon))
      : null,
  }));

  const filtered = alertsWithDistance
    .filter(a => filterSeverity === 'all' || a.severity === filterSeverity)
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => !userLocation || a.distanceKm === null || a.distanceKm <= radiusKm)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] || 2) - (order[b.severity] || 2);
    });

  const handleSubmitAlert = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...newAlert,
        location: userLocation || { lat: 3.848, lon: 11.502 },
      };
      await apiClient.post('/alerts/sanitary', payload).catch(() => null);
      setAlerts(prev => [{
        id: Date.now().toString(),
        ...payload,
        reportedBy: user?.name || 'Utilisateur',
        createdAt: new Date(),
        verified: false,
        distanceKm: 0,
        city: 'Votre localisation',
      }, ...prev]);
      setShowNewAlert(false);
      setNewAlert({ type: 'symptom', description: '', severity: 'medium', animalType: 'cattle', affectedCount: 1 });
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗺️ Alertes Sanitaires</h1>
          <p className="text-sm text-gray-500 mt-0.5">Signalements géolocalisés de maladies animales</p>
        </div>
        {user && (
          <button onClick={() => setShowNewAlert(true)} className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
            ⚠️ Signaler
          </button>
        )}
      </div>

      {/* Location bar */}
      <div className={`rounded-xl border p-3 flex items-center gap-3 text-sm ${userLocation ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <span className="text-lg">{locating ? '⏳' : userLocation ? '📍' : '❓'}</span>
        <div className="flex-1">
          {locating ? 'Détection de votre position...' :
            userLocation ? `Position détectée (${userLocation.lat.toFixed(3)}°N, ${userLocation.lon.toFixed(3)}°E)` :
              'Position non disponible'}
          {locationError && <div className="text-xs text-yellow-700 mt-0.5">{locationError}</div>}
        </div>
        {!userLocation && !locating && (
          <button onClick={detectLocation} className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700">
            Activer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Rayon:</label>
            <select value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))} className="border rounded-lg px-2 py-1 text-sm">
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={9999}>Tout le pays</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Gravité:</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
              <option value="all">Toutes</option>
              {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Type:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
              <option value="all">Tous</option>
              {ALERT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {filtered.length} alerte(s) trouvée(s) dans un rayon de {radiusKm} km
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Chargement des alertes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-medium">Aucune alerte dans votre zone</p>
          <p className="text-sm mt-1">Élargissez le rayon pour voir plus d'alertes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
            const type = ALERT_TYPES.find(t => t.id === alert.type);
            return (
              <div key={alert.id} className={`bg-white rounded-xl border-l-4 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{type?.icon || '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sev.color}`}>{sev.icon} {sev.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{type?.label || alert.type}</span>
                      {alert.verified && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Vérifié</span>}
                      {alert.distanceKm !== null && (
                        <span className="text-xs text-gray-500">📍 {alert.distanceKm} km</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      {alert.city && <span>📌 {alert.city}</span>}
                      <span>🐾 {alert.animalType} ({alert.affectedCount} animal(aux))</span>
                      <span>✍️ {alert.reportedBy}</span>
                      <span>🕐 {new Date(alert.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                {(alert.severity === 'critical' || alert.severity === 'high') && (
                  <div className="mt-3 flex gap-2">
                    <a href="/consultation" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                      Consulter un vétérinaire
                    </a>
                    <a href="/tebe" className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      Diagnostic Tebe IA
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New alert modal */}
      {showNewAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-4">
            <h3 className="font-semibold text-gray-900 mb-4">Signaler une alerte sanitaire</h3>
            <form onSubmit={handleSubmitAlert} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type d'alerte</label>
                <select value={newAlert.type} onChange={e => setNewAlert(p => ({ ...p, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  {ALERT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <textarea
                  value={newAlert.description}
                  onChange={e => setNewAlert(p => ({ ...p, description: e.target.value }))}
                  placeholder="Décrivez les symptômes observés, le nombre d'animaux touchés, la date de début..."
                  required
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Gravité estimée</label>
                  <select value={newAlert.severity} onChange={e => setNewAlert(p => ({ ...p, severity: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Espèce animale</label>
                  <select value={newAlert.animalType} onChange={e => setNewAlert(p => ({ ...p, animalType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="cattle">🐄 Bovin</option>
                    <option value="sheep">🐑 Ovin</option>
                    <option value="goat">🐐 Caprin</option>
                    <option value="pig">🐷 Porcin</option>
                    <option value="poultry">🐓 Volaille</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nombre d'animaux affectés</label>
                <input
                  type="number" min={1} value={newAlert.affectedCount}
                  onChange={e => setNewAlert(p => ({ ...p, affectedCount: parseInt(e.target.value) || 1 }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                📍 Votre position actuelle sera enregistrée avec le signalement pour alerter les éleveurs à proximité.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNewAlert(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={submitting || !newAlert.description} className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {submitting ? 'Envoi...' : '⚠️ Signaler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
