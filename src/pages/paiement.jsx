import React, { useState } from 'react';
import { CreditCard, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import orangeMoneyLogo from '../assets/images/orange-money-logo.png'; // Assurez-vous d'avoir ce fichier

export function PaymentPage({ onBack }) {
  const [payorName, setPayorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('CM'); // Par défaut, Cameroun
  const [city, setCity] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const countries = [
    { code: 'CM', name: 'Cameroun' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'SN', name: 'Sénégal' },
    { code: 'ML', name: 'Mali' },
  ];

  const cities = {
    'CM': ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Maroua'],
    'CI': ['Abidjan', 'Bouaké', 'Yamoussoukro'],
    'SN': ['Dakar', 'Thiès', 'Kaolack'],
    'ML': ['Bamako', 'Sikasso', 'Mopti'],
  };

  const planSlug = "standard"; // Remplacez ceci par le vrai slug du plan

  const handlePayment = (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Veuillez accepter les conditions d'utilisation.");
      return;
    }
    
    // Logique de traitement du paiement
    console.log({ payorName, phoneNumber, country, city, agreeTerms });
    
    // Afficher une alerte de confirmation
    alert(`Paiement de 5.000 FCFA initié pour ${payorName} (${phoneNumber}). Veuillez confirmer sur votre téléphone.`);

    // Redirection vers la page de confirmation du plan
    window.location.href = `/ia/${planSlug}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 transform transition-transform duration-300 hover:scale-105">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">
            Informations de Paiement
          </h2>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            Vous vous apprêtez à souscrire au plan <span className="font-semibold text-green-600">Standard</span>.
          </p>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">
            5.000 <span className="text-xl font-medium text-gray-500">FCFA</span>
          </p>
        </div>

        {/* Paiement */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Moyen de paiement</h3>
            <div className="flex items-center space-x-2">
              <CreditCard size={20} className="text-gray-600" />
              <img src={orangeMoneyLogo} alt="Orange Money" className="h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Paiement sécurisé via Orange Money.
          </p>

          <form onSubmit={handlePayment} className="space-y-6">
            {/* Nouveau champ pour le nom */}
            <div>
              <label htmlFor="payorName" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="payorName"
                type="text"
                value={payorName}
                onChange={(e) => setPayorName(e.target.value)}
                placeholder="Entrez votre nom complet"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            {/* Fin du nouveau champ */}

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Numéro de téléphone Orange Money
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 699123456"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Pays
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {cities[country] && (
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ville
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionnez votre ville</option>
                  {cities[country].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-start">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                J'accepte les <a href="#" className="font-medium text-green-600 hover:text-green-500">conditions d'utilisation</a>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              disabled={!agreeTerms}
            >
              <Lock size={20} />
              <span>Payer maintenant</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}