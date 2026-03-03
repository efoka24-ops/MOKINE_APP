// src/pages/MarketPlace.jsx
import React, { useState } from "react";
import ProductModal from "../components/ProductModal";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import medoc from '../assets/medoc.jpg'

const initialProducts = [
  { id: 1, nom: "Vermifuge Bovins", prix: 20000, note: 5, img: "/src/assets/dashboard.jpg", categorie: "Bovins" },
  { id: 2, nom: "Vaccin Brucellose", prix: 35000, note: 4, img: "/src/assets/dashboard.jpg", categorie: "Bovins" },
  { id: 3, nom: "Supplément Minéral", prix: 12000, note: 4, img: "/src/assets/dashboard.jpg", categorie: "Général" },
];

export default function MarketPlace() {
  const [products, setProducts] = useState(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const openModal = (product = null) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSaveProduct = (productData) => {
    if (productToEdit) {
      // Logic for editing
      setProducts(products.map(p => p.id === productData.id ? productData : p));
    } else {
      // Logic for adding
      const newProduct = { ...productData, id: products.length + 1 };
      setProducts([...products, newProduct]);
    }
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">⚙️ Gestion Market Place</h2>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="hidden md:inline">Ajouter un produit</span>
        </button>
      </div>

      {/* Tableau des produits pour ordinateurs */}
      <div className="hidden md:block bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Liste des produits</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 uppercase font-medium">
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Nom</th>
              <th className="py-3 px-4">Prix</th>
              <th className="py-3 px-4">Catégorie</th>
              <th className="py-3 px-4">Note</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-100 transition-colors">
                <td className="py-4 px-4">
                  <img src={medoc} alt={p.nom} className="w-12 h-12 object-cover rounded-lg" />
                </td>
                <td className="py-4 px-4 font-medium text-gray-800">{p.nom}</td>
                <td className="py-4 px-4 text-gray-600">{p.prix.toLocaleString("fr-FR")} F CFA</td>
                <td className="py-4 px-4 text-gray-600">{p.categorie}</td>
                <td className="py-4 px-4 text-yellow-500">{"★".repeat(p.note)}</td>
                <td className="py-4 px-4 space-x-2">
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes des produits pour mobiles */}
      <div className="md:hidden space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-3">
              <img src={medoc} alt={p.nom} className="w-16 h-16 object-cover rounded-lg" />
              <div>
                <h3 className="font-bold text-lg text-gray-800">{p.nom}</h3>
                <p className="text-green-600 font-semibold">{p.prix.toLocaleString("fr-FR")} F CFA</p>
                <div className="text-yellow-500 mt-1">{"★".repeat(p.note)}</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
              <span>Catégorie: <span className="font-medium">{p.categorie}</span></span>
              <div className="space-x-2">
                <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-800">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />
    </div>
  );
}