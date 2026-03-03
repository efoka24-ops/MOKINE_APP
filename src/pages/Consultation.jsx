// src/pages/Consultation.jsx
import React, { useState } from "react";
import ConsultationModal from "../components/ConsultationModal";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const initialConsultations = [
  { id: 1, eleveur: "Aboubakar", animal: "Bœuf", race: "Zébu", maladie: "Fièvre aphteuse", traitement: "Vaccination", date: "2025-09-24", statut: "En traitement" },
  { id: 2, eleveur: "Mohamadou", animal: "Chèvre", race: "Kirdi", maladie: "Parasites intestinaux", traitement: "Vermifuge", date: "2025-09-23", statut: "Guéri" },
  { id: 3, eleveur: "Moussa", animal: "Mouton", race: "Bali-bali", maladie: "Brucellose", traitement: "Antibiotiques", date: "2025-09-22", statut: "Sous suivi" },
];

export default function Consultation() {
  const [consultations, setConsultations] = useState(initialConsultations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consultationToEdit, setConsultationToEdit] = useState(null);

  const openModal = (consultation = null) => {
    setConsultationToEdit(consultation);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSaveConsultation = (consultationData) => {
    if (consultationToEdit) {
      setConsultations(consultations.map(c => c.id === consultationData.id ? consultationData : c));
    } else {
      const newConsultation = { ...consultationData, id: consultations.length + 1 };
      setConsultations([...consultations, newConsultation]);
    }
  };

  const handleDeleteConsultation = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette consultation ?")) {
      setConsultations(consultations.filter(c => c.id !== id));
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case "Guéri":
        return "bg-green-500";
      case "En traitement":
        return "bg-yellow-500";
      case "Sous suivi":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">👨‍⚕️ Dossiers de consultation</h2>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden md:inline">Nouvelle consultation</span>
        </button>
      </div>

      {/* Tableau des consultations pour ordinateurs */}
      <div className="hidden md:block bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Historique des consultations</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 uppercase font-medium">
              <th className="py-3 px-4">Éleveur</th>
              <th className="py-3 px-4">Animal</th>
              <th className="py-3 px-4">Maladie</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                <td className="py-4 px-4 font-medium text-gray-800">{c.eleveur}</td>
                <td className="py-4 px-4">{c.animal} ({c.race})</td>
                <td className="py-4 px-4 text-gray-600">{c.maladie}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-white font-medium text-xs ${getStatusColor(c.statut)}`}
                  >
                    {c.statut}
                  </span>
                </td>
                <td className="py-4 px-4 space-x-2">
                  <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-800">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteConsultation(c.id)} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes des consultations pour mobiles */}
      <div className="md:hidden space-y-4">
        {consultations.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-gray-800">{c.eleveur}</div>
              <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(c.statut)}`}>
                {c.statut}
              </span>
            </div>
            <div className="space-y-1 text-gray-600">
              <p><span className="font-medium">Animal:</span> {c.animal} ({c.race})</p>
              <p><span className="font-medium">Maladie:</span> {c.maladie}</p>
              <p><span className="font-medium">Traitement:</span> {c.traitement}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => openModal(c)} className="p-2 text-blue-600 hover:text-blue-800 bg-gray-100 rounded-full">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button onClick={() => handleDeleteConsultation(c.id)} className="p-2 text-red-600 hover:text-red-800 bg-gray-100 rounded-full">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConsultationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveConsultation}
        consultationToEdit={consultationToEdit}
      />
    </div>
  );
}