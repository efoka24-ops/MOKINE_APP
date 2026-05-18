import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, MapPin, Activity } from 'lucide-react';
import AgentDashboard from './AgentDashboard';
import InterventionDashboard from './InterventionDashboard';
import FieldMonitoring from './FieldMonitoring';

/**
 * MokineFieldPage - Page d'intégration complète de MokineField
 * Combine agents, interventions et monitoring
 */
export default function MokineFieldPage() {
  const [farmId] = useState('farm_default'); // À récupérer du contexte/URL
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');

  // Les trois onglets principaux
  const TABS = [
    { id: 'agents', label: '🤖 Agents Terrain', icon: MapPin },
    { id: 'interventions', label: '⚡ Interventions', icon: Zap },
    { id: 'monitoring', label: '📊 Monitoring', icon: Activity },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'agents':
        return <AgentDashboard farmId={farmId} />;
      case 'interventions':
        return <InterventionDashboard farmId={farmId} agents={agents} />;
      case 'monitoring':
        return <FieldMonitoring farmId={farmId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🌾 MokineField</h1>
          <p className="text-orange-100">Gestion terrain intelligente — agents, interventions et monitoring en temps réel</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderTab()}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 À propos de MokineField</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ <strong>Agents Terrain:</strong> Enregistrez et gérez vos agents avec suivi GPS en temps réel</li>
            <li>✅ <strong>Interventions:</strong> Créez et assignez des tâches terrain avec priorités et dates d'échéance</li>
            <li>✅ <strong>Monitoring:</strong> Suivez les activités en direct avec heatmaps et analytics</li>
            <li>✅ <strong>Hors-Ligne:</strong> Les données se synchronisent automatiquement quand la connexion revient</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
