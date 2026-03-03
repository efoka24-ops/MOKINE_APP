import React, { useState, useEffect } from "react";
import AddAppointmentModal from "./AddAppointmentModal";

const appointments = [
  { nom: "Aboubakar", ville: "Maroua", jour: "23/09/2025", heure: "10h30", desc: "Aucune" },
  { nom: "Hamadou", ville: "Maroua", jour: "23/09/2025", heure: "11h10", desc: "Aucune" },
  { nom: "Moussa", ville: "Maroua", jour: "23/09/2025", heure: "11h50", desc: "Aucune" },
  { nom: "Ibrahim", ville: "Maroua", jour: "23/09/2025", heure: "12h30", desc: "Aucune" },
];

export default function AppointmentTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddSuccess = (message) => {
    setConfirmationMessage(message);
    setTimeout(() => {
      setConfirmationMessage(null);
    }, 3000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Rendez-vous du jour</h2>
        <button
          onClick={openModal}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {confirmationMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fadeInOut">
          {confirmationMessage}
        </div>
      )}

      {/* Responsive Table for Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 uppercase font-medium">
              <th className="py-3 px-4">Nom éleveur</th>
              <th className="py-3 px-4">Ville</th>
              <th className="py-3 px-4">Jour</th>
              <th className="py-3 px-4">Heure</th>
              <th className="py-3 px-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                <td className="py-3 px-4">{a.nom}</td>
                <td className="py-3 px-4">{a.ville}</td>
                <td className="py-3 px-4">{a.jour}</td>
                <td className="py-3 px-4">{a.heure}</td>
                <td className="py-3 px-4">{a.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card Layout for Mobile */}
      <div className="md:hidden space-y-4">
        {appointments.map((a, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="font-semibold text-gray-800">{a.nom}</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Ville:</span> {a.ville}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Jour:</span> {a.jour}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Heure:</span> {a.heure}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Description:</span> {a.desc}
            </div>
          </div>
        ))}
      </div>

      <AddAppointmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
}