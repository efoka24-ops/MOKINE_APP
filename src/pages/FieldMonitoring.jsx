import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Activity, BarChart3, TrendingUp, RefreshCw, MapPin, AlertCircle } from 'lucide-react';
import { fieldActivity } from '../API';
import { useAuth } from '../context/AuthContext';

/**
 * FieldMonitoring - Monitoring en temps réel des activités terrain
 * Heatmaps, timeline, performance des agents
 */
export default function FieldMonitoring({ farmId }) {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const mapRef = useRef(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tlRes, hmRes] = await Promise.all([
        fieldActivity.getTimeline(farmId, { days }),
        fieldActivity.getHeatmap(farmId, { days }),
      ]);
      setTimeline(tlRes.data.timeline || []);
      setHeatmap(hmRes.data.heatmap || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [farmId, days]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh tous les 30 secondes
    return () => clearInterval(interval);
  }, [loadData]);

  // Initialiser carte simple avec heatmap
  useEffect(() => {
    if (!mapRef.current || heatmap.length === 0) return;

    // Simple visualization sans Leaflet
    const canvas = document.createElement('canvas');
    mapRef.current.innerHTML = '';
    mapRef.current.appendChild(canvas);

    const container = mapRef.current;
    canvas.width = container.clientWidth;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    
    // Trouver les limites
    const lats = heatmap.map(h => h.lat);
    const lngs = heatmap.map(h => h.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Dessiner fond
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner heatmap
    heatmap.forEach(point => {
      const x = ((point.lng - minLng) / (maxLng - minLng || 1)) * canvas.width;
      const y = ((point.lat - minLat) / (maxLat - minLat || 1)) * canvas.height;

      // Couleur selon type
      const colors = {
        location_update: '#3b82f6',
        intervention_completed: '#10b981',
        animal_checked: '#f59e0b',
      };
      const color = colors[point.type] || '#6b7280';

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    });

    // Légende
    ctx.fillStyle = '#111';
    ctx.font = '12px Arial';
    let y = 20;
    Object.entries({
      'location_update': '#3b82f6',
      'intervention_completed': '#10b981',
      'animal_checked': '#f59e0b',
    }).forEach(([label, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(10, y, 12, 12);
      ctx.fillStyle = '#111';
      ctx.fillText(label, 25, y + 10);
      y += 20;
    });
  }, [heatmap]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-green-600" />
            Monitoring Temps Réel
          </h2>
          <p className="text-sm text-gray-600 mt-1">Suivi des activités et heatmaps</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <RefreshCw size={18} /> Rafraîchir
        </button>
      </div>

      {/* Contrôles */}
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Période:</span>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={1}>Derniers 24h</option>
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
          </select>
        </label>
      </div>

      {/* Heatmap */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin size={20} className="text-blue-600" />
          Heatmap des Activités ({heatmap.length} points)
        </h3>
        <div
          ref={mapRef}
          className="w-full bg-white border border-gray-200 rounded-lg p-4"
          style={{ minHeight: '400px' }}
        >
          {heatmap.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucune donnée de localisation disponible
            </div>
          ) : null}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity size={20} className="text-orange-600" />
          Timeline des Activités
        </h3>

        {timeline.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucune activité enregistrée</p>
            <p className="text-sm text-gray-500 mt-1">Les activités terrain apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((day, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-4">
                  <h4 className="font-semibold text-gray-900">{day.date}</h4>
                  <div className="flex gap-4 mt-2 text-sm">
                    {Object.entries(day.counts).map(([type, count]) => (
                      <span key={type} className="text-gray-700">
                        {type}: <span className="font-bold text-orange-600">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {day.activities.slice(0, 5).map((activity, j) => (
                    <div key={j} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">{activity.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {day.activities.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{day.activities.length - 5} autres activités
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Activités ({days}j)</p>
          <p className="text-3xl font-bold text-blue-700 mt-2">
            {timeline.reduce((sum, day) => sum + day.activities.length, 0)}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Points GPS</p>
          <p className="text-3xl font-bold text-orange-700 mt-2">{heatmap.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Jours d'Activité</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{timeline.length}</p>
        </div>
      </div>
    </div>
  );
}
