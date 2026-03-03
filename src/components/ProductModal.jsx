// src/components/ProductModal.jsx
import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
  const [formData, setFormData] = useState({
    nom: "",
    prix: "",
    note: 0,
    img: "",
    categorie: "",
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      setFormData({
        nom: "",
        prix: "",
        note: 0,
        img: "",
        categorie: "",
      });
    }
  }, [productToEdit]);

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
          {productToEdit ? "Modifier le produit" : "Ajouter un nouveau produit"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="nom"
                id="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="prix" className="block text-sm font-medium text-gray-700">Prix (F CFA)</label>
              <input
                type="number"
                name="prix"
                id="prix"
                value={formData.prix}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">Catégorie</label>
              <input
                type="text"
                name="categorie"
                id="categorie"
                value={formData.categorie}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note (0-5)</label>
              <input
                type="number"
                name="note"
                id="note"
                min="0"
                max="5"
                step="1"
                value={formData.note}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="img" className="block text-sm font-medium text-gray-700">URL de l'image</label>
            <input
              type="text"
              name="img"
              id="img"
              value={formData.img}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {productToEdit ? "Sauvegarder les modifications" : "Ajouter le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}