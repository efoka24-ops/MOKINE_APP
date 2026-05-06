import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Mokine',
    supportEmail: 'support@mokine.com',
    supportPhone: '+237123456789',
    commissionRate: 10,
    maintenanceMode: false,
    requireEmailVerification: true,
    maxUploadSize: 5,
  });

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    console.log('Paramètres sauvegardés:', settings);
    alert('Paramètres mis à jour avec succès!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres Généraux</h1>
          <p className="text-gray-600 mt-1">Configuration de la plateforme Mokine</p>
        </div>

        {/* Paramètres Généraux */}
        <div className="bg-white rounded-lg p-6 shadow space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Site</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Support</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone Support</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
                />
              </div>
            </div>
          </div>

          {/* Paiements */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Paiements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux de Commission (%)
                </label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
                />
                <p className="text-xs text-gray-500 mt-1">Commission appliquée sur chaque transaction</p>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Sécurité & Vérification</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailVerif"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="emailVerif" className="text-sm font-medium text-gray-700">
                  Exiger la vérification d'email à l'inscription
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">
                  Mode Maintenance (désactiver pour les utilisateurs)
                </label>
              </div>
            </div>
          </div>

          {/* Fichiers */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Fichiers</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille Max Upload (MB)
                </label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleChange('maxUploadSize', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#178A3B] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          <Save size={20} />
          Sauvegarder les Paramètres
        </button>

        {/* Sections Supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logs du Système */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Logs du Système</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Système opérationnel</p>
              <p>✓ Base de données connectée</p>
              <p>✓ Email configuré</p>
              <button className="mt-4 text-[#178A3B] hover:underline text-sm font-semibold">
                Voir tous les logs →
              </button>
            </div>
          </div>

          {/* Backups */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Backups</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">Dernier backup: Aujourd'hui à 02:00</p>
              <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition font-semibold text-sm">
                Créer un Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
