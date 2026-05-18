import React, { useState, useEffect } from 'react';
import apiClient from '../API';

const READING_ICONS = { temperature: '🌡️', activity: '🏃', heartRate: '❤️' };
const READING_UNITS = { temperature: '°C', activity: 'pas/h', heartRate: 'bpm' };

function AlertBadge({ severity }) {
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300',
  };
  const labels = { critical: '🔴 Critique', warning: '🟡 Attention', info: '🔵 Info' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[severity] || styles.info}`}>
      {labels[severity] || severity}
    </span>
  );
}

function GaugeBar({ value, min, max, label }) {
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 50;
  const inRange = pct > 10 && pct < 90;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span className={`font-semibold ${inRange ? 'text-green-600' : 'text-red-600'}`}>{value}</span>
        <span>{max}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full relative">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 opacity-30" />
        </div>
        <div
          className={`h-full rounded-full transition-all ${inRange ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function IoTDashboard() {
  const [dashData, setDashData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [registerModal, setRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({ deviceId: '', animalId: '', type: 'collar', animalType: 'cattle' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [dashRes, devRes, alertRes] = await Promise.all([
        apiClient.get('/iot/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/iot/devices').catch(() => ({ data: [] })),
        apiClient.get('/iot/alerts').catch(() => ({ data: [] })),
      ]);
      setDashData(dashRes.data);
      setDevices(devRes.data.devices || devRes.data || []);
      setAlerts(alertRes.data.alerts || alertRes.data || []);
    } catch {}
    setLoading(false);
  };

  const loadReadings = async (deviceId) => {
    try {
      const res = await apiClient.get(`/iot/readings/${deviceId}`);
      setReadings(res.data.readings || res.data || []);
    } catch {
      setReadings([]);
    }
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    loadReadings(device.deviceId);
    setTab('readings');
  };

  const registerDevice = async () => {
    try {
      await apiClient.post('/iot/devices', regForm);
      setRegisterModal(false);
      setRegForm({ deviceId: '', animalId: '', type: 'collar', animalType: 'cattle' });
      loadAll();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur d\'enregistrement');
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Chargement des capteurs IoT...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>📡</span> Tableau de bord IoT
              </h1>
              <p className="text-green-200 text-sm mt-0.5">Colliers RFID · Capteurs · Alertes temps réel</p>
            </div>
            <button
              onClick={refresh}
              className={`w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              ↻
            </button>
          </div>

          {/* Quick stats */}
          {dashData && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Appareils', value: dashData.totalDevices || devices.length, icon: '📱' },
                { label: 'En ligne', value: dashData.onlineDevices || 0, icon: '🟢' },
                { label: 'Alertes', value: alerts.length, icon: '⚠️' },
                { label: 'Hors ligne', value: dashData.offlineDevices || 0, icon: '🔴' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/15 rounded-xl p-2 text-center">
                  <div className="text-sm">{s.icon}</div>
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-xs text-green-200">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'devices', label: `Appareils (${devices.length})` },
              { id: 'alerts', label: `Alertes${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
              { id: 'readings', label: 'Relevés' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            {/* Active alerts */}
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <div className="space-y-2">
                <h2 className="font-semibold text-gray-900">Alertes actives</h2>
                {alerts.filter(a => !a.acknowledged).slice(0, 4).map((a, i) => (
                  <div key={i} className="bg-white rounded-xl border-l-4 border-l-red-500 p-4 flex items-start gap-3">
                    <span className="text-xl">{READING_ICONS[a.sensorType] || '⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{a.deviceId}</span>
                        <AlertBadge severity={a.severity} />
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(a.detectedAt || Date.now()).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Devices overview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Appareils enregistrés</h2>
                <button onClick={() => setRegisterModal(true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                  + Ajouter
                </button>
              </div>
              {devices.length === 0 ? (
                <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
                  <div className="text-5xl mb-3">📡</div>
                  <p className="font-medium">Aucun appareil enregistré</p>
                  <p className="text-sm mt-1">Ajoutez vos colliers RFID ou capteurs</p>
                  <button onClick={() => setRegisterModal(true)} className="mt-4 text-sm text-green-600 hover:underline">
                    Enregistrer un appareil
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {devices.slice(0, 4).map((d, i) => (
                    <button key={i} onClick={() => selectDevice(d)} className="bg-white rounded-xl border p-4 text-left hover:border-green-400 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">{d.deviceId}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="text-xs text-gray-500">
                        <span>Animal: {d.animalId || 'N/A'}</span>
                        <span className="mx-2">·</span>
                        <span>{d.animalType}</span>
                      </div>
                      {d.lastReading && (
                        <div className="mt-2 flex gap-3 text-xs">
                          {d.lastReading.temperature && (
                            <span className="text-orange-600">🌡️ {d.lastReading.temperature}°C</span>
                          )}
                          {d.lastReading.heartRate && (
                            <span className="text-red-600">❤️ {d.lastReading.heartRate} bpm</span>
                          )}
                        </div>
                      )}
                      {d.battery !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>🔋</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${d.battery > 50 ? 'bg-green-500' : d.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${d.battery}%` }}
                              />
                            </div>
                            <span>{d.battery}%</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* DEVICES TAB */}
        {tab === 'devices' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Tous les appareils</h2>
              <button onClick={() => setRegisterModal(true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                + Enregistrer appareil
              </button>
            </div>
            {devices.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <div className="text-5xl mb-3">📡</div>
                <p>Aucun appareil enregistré</p>
              </div>
            ) : (
              devices.map((d, i) => (
                <div key={i} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${d.type === 'collar' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {d.type === 'collar' ? '🏷️' : '📡'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{d.deviceId}</p>
                        <p className="text-xs text-gray-500">{d.type === 'collar' ? 'Collier RFID' : 'Capteur'} · {d.animalType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}
                      </span>
                    </div>
                  </div>
                  {d.lastReading && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {d.lastReading.temperature !== undefined && (
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <div className="text-lg">🌡️</div>
                          <div className="text-sm font-bold text-orange-700">{d.lastReading.temperature}°C</div>
                        </div>
                      )}
                      {d.lastReading.heartRate !== undefined && (
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <div className="text-lg">❤️</div>
                          <div className="text-sm font-bold text-red-700">{d.lastReading.heartRate} bpm</div>
                        </div>
                      )}
                      {d.lastReading.activity !== undefined && (
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-lg">🏃</div>
                          <div className="text-sm font-bold text-blue-700">{d.lastReading.activity}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {d.battery !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>🔋 Batterie</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${d.battery > 50 ? 'bg-green-500' : d.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${d.battery}%` }}
                        />
                      </div>
                      <span className="font-medium">{d.battery}%</span>
                    </div>
                  )}
                  <button
                    onClick={() => selectDevice(d)}
                    className="mt-3 w-full text-xs text-green-700 border border-green-300 py-2 rounded-lg hover:bg-green-50"
                  >
                    Voir l'historique des relevés
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">Alertes IoT</h2>
            {alerts.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-medium">Aucune alerte active</p>
                <p className="text-sm mt-1">Tous vos animaux sont dans les plages normales</p>
              </div>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className={`bg-white rounded-xl border p-4 border-l-4 ${a.severity === 'critical' ? 'border-l-red-500' : a.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{READING_ICONS[a.sensorType] || '⚠️'}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900 text-sm">{a.deviceId}</span>
                          <AlertBadge severity={a.severity} />
                        </div>
                        <p className="text-sm text-gray-700">{a.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Valeur: <span className="font-mono font-medium">{a.value}{READING_UNITS[a.sensorType] || ''}</span>
                          {a.normalRange && <span> (normale: {a.normalRange.min}–{a.normalRange.max})</span>}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(a.detectedAt || Date.now()).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                  {a.sensorType && a.value !== undefined && a.normalRange && (
                    <div className="mt-3">
                      <GaugeBar
                        value={a.value}
                        min={a.normalRange.min - (a.normalRange.max - a.normalRange.min) * 0.2}
                        max={a.normalRange.max + (a.normalRange.max - a.normalRange.min) * 0.2}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <a
                      href="/consultation"
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                    >
                      Consulter un vétérinaire
                    </a>
                    <a
                      href="/ia/questionnaire"
                      className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      Pré-diagnostic IA
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* READINGS TAB */}
        {tab === 'readings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {selectedDevice ? `Relevés: ${selectedDevice.deviceId}` : 'Relevés historiques'}
              </h2>
              {selectedDevice && (
                <button onClick={() => { setSelectedDevice(null); setReadings([]); }} className="text-xs text-gray-500 hover:text-gray-700">
                  Changer d'appareil
                </button>
              )}
            </div>
            {!selectedDevice ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
                <p>Sélectionnez un appareil dans l'onglet "Appareils" pour voir son historique</p>
                <button onClick={() => setTab('devices')} className="mt-3 text-sm text-green-600 hover:underline">
                  Voir les appareils
                </button>
              </div>
            ) : readings.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
                <p>Aucun relevé disponible pour cet appareil</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readings.slice(0, 20).map((r, i) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-gray-400">{new Date(r.timestamp || Date.now()).toLocaleString('fr-FR')}</span>
                      {r.anomaly && <AlertBadge severity={r.anomaly.severity} />}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {r.temperature !== undefined && (
                        <div className="text-center">
                          <div className="text-xl mb-1">🌡️</div>
                          <div className={`text-sm font-bold ${r.anomaly?.sensorType === 'temperature' ? 'text-red-600' : 'text-gray-700'}`}>
                            {r.temperature}°C
                          </div>
                        </div>
                      )}
                      {r.heartRate !== undefined && (
                        <div className="text-center">
                          <div className="text-xl mb-1">❤️</div>
                          <div className={`text-sm font-bold ${r.anomaly?.sensorType === 'heartRate' ? 'text-red-600' : 'text-gray-700'}`}>
                            {r.heartRate} bpm
                          </div>
                        </div>
                      )}
                      {r.activity !== undefined && (
                        <div className="text-center">
                          <div className="text-xl mb-1">🏃</div>
                          <div className={`text-sm font-bold ${r.anomaly?.sensorType === 'activity' ? 'text-orange-600' : 'text-gray-700'}`}>
                            {r.activity}
                          </div>
                        </div>
                      )}
                    </div>
                    {r.anomaly && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                        ⚠️ {r.anomaly.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Device Modal */}
      {registerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Enregistrer un appareil IoT</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">ID de l'appareil (RFID/Serial)</label>
                <input
                  value={regForm.deviceId}
                  onChange={e => setRegForm(p => ({ ...p, deviceId: e.target.value }))}
                  placeholder="Ex: COLLAR-001 ou IOT-SENSOR-42"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">ID de l'animal</label>
                <input
                  value={regForm.animalId}
                  onChange={e => setRegForm(p => ({ ...p, animalId: e.target.value }))}
                  placeholder="Ex: ANIMAL-001"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Type d'appareil</label>
                  <select
                    value={regForm.type}
                    onChange={e => setRegForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="collar">Collier RFID</option>
                    <option value="sensor">Capteur</option>
                    <option value="tag">Tag</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Espèce animale</label>
                  <select
                    value={regForm.animalType}
                    onChange={e => setRegForm(p => ({ ...p, animalType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="cattle">Bovin</option>
                    <option value="sheep">Ovin</option>
                    <option value="goat">Caprin</option>
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-medium mb-1">Connectivité supportée</p>
                <p>NB-IoT · LoRaWAN · WiFi · Bluetooth</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRegisterModal(false)} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={registerDevice} disabled={!regForm.deviceId} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
