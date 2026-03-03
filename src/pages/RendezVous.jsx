import React, { useState } from "react";
import AddAppointmentModal from "../components/AddAppointmentModal";
import { PlusIcon } from "@heroicons/react/24/solid";

const rendezVous = [
  { id: 1, eleveur: "Aboubakar", animal: "Bœuf", date: "24/09/2025", heure: "09h00", lieu: "Maroua" },
  { id: 2, eleveur: "Hamadou", animal: "Chèvre", date: "24/09/2025", heure: "10h30", lieu: "Ngaoundéré" },
  { id: 3, eleveur: "Moussa", animal: "Mouton", date: "25/09/2025", heure: "11h00", lieu: "Garoua" },
  { id: 4, eleveur: "Ibrahim", animal: "Vache", date: "26/09/2025", heure: "14h00", lieu: "Maroua" },
];

export default function RendezVous() {
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
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">📅 Rendez-vous</h2>
        <button
          onClick={openModal}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden md:inline">Planifier un RDV</span>
        </button>
      </div>

      {confirmationMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-300">
          {confirmationMessage}
        </div>
      )}

      {/* Vue pour ordinateurs (table) */}
      <div className="hidden md:block bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Rendez-vous à venir</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 uppercase font-medium">
              <th className="py-3 px-4">Éleveur</th>
              <th className="py-3 px-4">Animal</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Heure</th>
              <th className="py-3 px-4">Lieu</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rendezVous.map((rdv) => (
              <tr key={rdv.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                <td className="py-4 px-4">{rdv.eleveur}</td>
                <td className="py-4 px-4">{rdv.animal}</td>
                <td className="py-4 px-4">{rdv.date}</td>
                <td className="py-4 px-4">{rdv.heure}</td>
                <td className="py-4 px-4">{rdv.lieu}</td>
                <td className="py-4 px-4">
                  <button className="text-sm text-blue-600 hover:underline">Détails</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue pour mobiles (cartes) */}
      <div className="md:hidden space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Rendez-vous à venir</h3>
        {rendezVous.map((rdv) => (
          <div key={rdv.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-gray-800">{rdv.eleveur}</div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{rdv.animal}</span>
            </div>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="font-medium">Date:</span> {rdv.date}
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">Heure:</span> {rdv.heure}
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="font-medium">Lieu:</span> {rdv.lieu}
              </div>
            </div>
            <div className="mt-4 text-right">
              <button className="text-blue-600 font-medium hover:underline">Détails</button>
            </div>
          </div>
        ))}
      </div>

      <AddAppointmentModal isOpen={isModalOpen} onClose={closeModal} onAddSuccess={handleAddSuccess} />
    </div>
  );
}