// src/components/ConsultationModal.jsx
import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ConsultationModal({ isOpen, onClose, onSave, consultationToEdit }) {
  const [formData, setFormData] = useState({
    animal: "",
    race: "",
    eleveur: "",
    maladie: "",
    traitement: "",
    date: "",
    statut: "En traitement",
  });

  useEffect(() => {
    if (consultationToEdit) {
      setFormData(consultationToEdit);
    } else {
      setFormData({
        animal: "",
        race: "",
        eleveur: "",
        maladie: "",
        traitement: "",
        date: "",
        statut: "En traitement",
      });
    }
  }, [consultationToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {consultationToEdit ? "Modifier la consultation" : "Ajouter une consultation"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eleveur" className="block text-sm font-medium text-gray-700">Nom de l'éleveur</label>
              <input
                type="text"
                name="eleveur"
                id="eleveur"
                value={formData.eleveur}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="animal" className="block text-sm font-medium text-gray-700">Animal</label>
              <input
                type="text"
                name="animal"
                id="animal"
                value={formData.animal}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="race" className="block text-sm font-medium text-gray-700">Race</label>
              <input
                type="text"
                name="race"
                id="race"
                value={formData.race}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="maladie" className="block text-sm font-medium text-gray-700">Maladie diagnostiquée</label>
              <input
                type="text"
                name="maladie"
                id="maladie"
                value={formData.maladie}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="traitement" className="block text-sm font-medium text-gray-700">Traitement prescrit</label>
            <textarea
              name="traitement"
              id="traitement"
              rows="3"
              value={formData.traitement}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date de consultation</label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700">Statut</label>
              <select
                name="statut"
                id="statut"
                value={formData.statut}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="En traitement">En traitement</option>
                <option value="Guéri">Guéri</option>
                <option value="Sous suivi">Sous suivi</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {consultationToEdit ? "Sauvegarder" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}