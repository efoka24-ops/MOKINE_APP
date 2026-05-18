import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { marketKYC } from '../API';

/**
 * KYCForm - Formulaire de soumission des documents KYC
 * Licence commerciale, ID fiscal, compte bancaire, pièces d'identité, preuve d'adresse
 */
export default function KYCForm() {
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessLicense: null,
    taxId: null,
    bankAccount: null,
    ownerIdFront: null,
    ownerIdBack: null,
    proofOfAddress: null,
  });

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await marketKYC.getStatus();
      setKycStatus(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleFileSelect = (field, file) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Créer FormData pour upload
      const form = new FormData();
      Object.entries(formData).forEach(([key, file]) => {
        if (file) form.append(key, file);
      });

      await marketKYC.submit(formData);
      await loadStatus();
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const DOCUMENT_FIELDS = [
    {
      id: 'businessLicense',
      label: '📜 Licence Commerciale',
      description: 'Document officiel d\'enregistrement commercial',
      required: true,
    },
    {
      id: 'taxId',
      label: '🏛️ Numéro d\'Identification Fiscale (NIF)',
      description: 'Numéro d\'immatriculation fiscale',
      required: true,
    },
    {
      id: 'bankAccount',
      label: '🏦 Détails Compte Bancaire',
      description: 'Relevé d\'identité bancaire (RIB)',
      required: true,
    },
    {
      id: 'ownerIdFront',
      label: '🪪 Pièce d\'identité (Recto)',
      description: 'Carte nationale ou passeport (côté face)',
      required: true,
    },
    {
      id: 'ownerIdBack',
      label: '🪪 Pièce d\'identité (Verso)',
      description: 'Carte nationale ou passeport (côté dos)',
      required: true,
    },
    {
      id: 'proofOfAddress',
      label: '🏠 Preuve de Domicile',
      description: 'Facture récente (électricité, eau, téléphone)',
      required: false,
    },
  ];

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck size={28} className="text-orange-600" />
          Vérification KYC (Know Your Customer)
        </h2>
        <p className="text-sm text-gray-600 mt-1">Documents requis pour la conformité réglementaire</p>
      </div>

      {/* Status */}
      {kycStatus?.kycData && (
        <div className={`p-4 border rounded-lg ${
          kycStatus.kycData.status === 'approved'
            ? 'bg-green-50 border-green-200'
            : kycStatus.kycData.status === 'rejected'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            {kycStatus.kycData.status === 'approved' && (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            {kycStatus.kycData.status === 'rejected' && (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            {kycStatus.kycData.status === 'under_review' && (
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {kycStatus.kycData.status === 'approved' && '✅ KYC Approuvé'}
                {kycStatus.kycData.status === 'rejected' && '❌ KYC Rejeté'}
                {kycStatus.kycData.status === 'under_review' && '⏳ En Examen'}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {kycStatus.kycData.status === 'rejected' && kycStatus.kycData.rejectionReason
                  ? `Raison: ${kycStatus.kycData.rejectionReason}`
                  : kycStatus.kycData.comments || 'Vos documents sont en cours d\'examen'}
              </p>
              {kycStatus.kycData.reviewedAt && (
                <p className="text-xs text-gray-600 mt-2">
                  Examiné le {new Date(kycStatus.kycData.reviewedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          ℹ️ La vérification KYC est obligatoire pour vendre. Veuillez fournir des documents clairs et valides.
          Délai d'examen: 2-5 jours ouvrables.
        </p>
      </div>

      {/* Formulaire */}
      {!kycStatus?.kycData || kycStatus.kycData.status === 'rejected' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {DOCUMENT_FIELDS.map(field => (
            <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <label className="block mb-3">
                <p className="font-semibold text-gray-900">{field.label}</p>
                <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                {field.required && <span className="text-red-600 text-sm">* Obligatoire</span>}
              </label>

              {/* Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                <label className="cursor-pointer block">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {formData[field.id] ? (
                      <span className="text-green-600 font-medium">
                        ✓ {formData[field.id].name}
                      </span>
                    ) : (
                      <>
                        Cliquez pour télécharger un fichier
                        <br />
                        <span className="text-xs text-gray-500">PDF, JPG, PNG (Max 5 Mo)</span>
                      </>
                    )}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(field.id, e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 font-bold flex items-center justify-center gap-2"
          >
            {submitting ? '⏳ Envoi...' : '✓ Soumettre les documents'}
          </button>
        </form>
      ) : (
        <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-900">KYC Approuvé ✓</p>
          <p className="text-gray-600 mt-2">Vous pouvez maintenant ajouter et vendre des produits</p>
        </div>
      )}

      {/* Info supplémentaire */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">ℹ️ Conseils pour la soumission</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Assurez-vous que tous les documents sont en couleur et clairement lisibles</li>
          <li>• La date d'expiration doit être future</li>
          <li>• Les données personnelles doivent correspondre sur tous les documents</li>
          <li>• Compressez les images avant upload si possible</li>
          <li>• Attendez la confirmation avant de vendre</li>
        </ul>
      </div>
    </div>
  );
}
