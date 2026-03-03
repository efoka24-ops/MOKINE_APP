// src/components/AddAppointmentModal.jsx
import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function AddAppointmentModal({ isOpen, onClose, onAddSuccess }) {
  const [formData, setFormData] = useState({
    nom: "",
    ville: "",
    jour: "",
    heure: "",
    desc: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici, vous enverriez les données à votre API ou les traiteriez localement.
    // Simuler un ajout réussi
    console.log("Nouveau rendez-vous:", formData);
    
    // Réinitialiser le formulaire
    setFormData({
      nom: "",
      ville: "",
      jour: "",
      heure: "",
      desc: "",
    });

    onClose(); // Fermer le modal
    onAddSuccess("Rendez-vous ajouté avec succès !");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Ajouter un rendez-vous</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom de l'éleveur</label>
            <input
              type="text"
              name="nom"
              id="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="ville" className="block text-sm font-medium text-gray-700">Ville</label>
            <input
              type="text"
              name="ville"
              id="ville"
              value={formData.ville}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="jour" className="block text-sm font-medium text-gray-700">Jour</label>
              <input
                type="date"
                name="jour"
                id="jour"
                value={formData.jour}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="heure" className="block text-sm font-medium text-gray-700">Heure</label>
              <input
                type="time"
                name="heure"
                id="heure"
                value={formData.heure}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="desc"
              id="desc"
              value={formData.desc}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            ></textarea>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}