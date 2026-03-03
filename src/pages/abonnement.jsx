import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "par mois",
    description: "Votre plan actuel. Parfait pour découvrir nos services.",
    features: [
      "5 prédiagnostics d'image (pieds, bouche, peau)",
      "5 prédiagnostics par texte",
      "Accès limité aux fonctionnalités de base",
      "Support standard"
    ],
    isCurrent: true,
  },
  {
    name: "Standard",
    price: "5.000",
    period: "par mois",
    description: "Accès illimité pour une utilisation régulière.",
    features: [
      "Accès illimité aux 3 modèles d'image (pieds, bouche, peau)",
      "Accès illimité au prédiagnostic par texte",
      "Accès illimité au prédiagnostic par voix",
      "Support prioritaire"
    ],
    isCurrent: false,
  },
  {
    name: "Premium",
    price: "12.000",
    period: "par 3 mois",
    description: "Le meilleur rapport qualité-prix pour une utilisation intensive.",
    features: [
      "Accès illimité aux 3 modèles d'image (pieds, bouche, peau)",
      "Accès illimité au prédiagnostic par texte",
      "Accès illimité au prédiagnostic par voix",
      "Mises à jour et nouvelles fonctionnalités en avant-première",
      "Support 24/7"
    ],
    isCurrent: false,
  },
  {
    name: "Entreprise",
    price: "45.000",
    period: "par an",
    description: "La solution complète pour les professionnels.",
    features: [
      "Accès illimité aux 3 modèles d'image (pieds, bouche, peau)",
      "Accès illimité au prédiagnostic par texte",
      "Accès illimité au prédiagnostic par voix",
      "Nouvelles fonctionnalités en avant-première",
      "Support 24/7 et assistance dédiée",
      "Facturation personnalisée"
    ],
    isCurrent: false,
  },
];

export function SubscriptionPlans() {
    const navigate = useNavigate();
  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Choisissez le plan qui vous convient
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Passez à un plan payant pour débloquer toutes les fonctionnalités et obtenir un accès illimité.
        </p>
      </div>

      <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-white border rounded-lg shadow-lg p-8 transition-transform transform hover:scale-105 ${
              plan.isCurrent ? 'border-green-500 ring-2 ring-green-500' : ''
            }`}
          >
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
            {plan.isCurrent && (
              <span className="mt-2 inline-block text-sm font-medium text-green-700 bg-green-100 rounded-full px-3 py-1">
                Plan Actuel
              </span>
            )}
            <p className="mt-4 text-sm text-gray-600">{plan.description}</p>
            <div className="mt-4 flex items-baseline justify-center">
              <span className="text-4xl font-extrabold text-gray-900">
                {plan.price}
              </span>
              <span className="text-xl font-medium text-gray-500">
                FCFA
              </span>
              <span className="ml-1 text-base font-medium text-gray-500">{plan.period}</span>
            </div>

            <ul className="mt-8 space-y-4 text-left">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="ml-3 text-base text-gray-700">{feature}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {plan.isCurrent ? (
                <button
                  className="w-full bg-gray-300 text-gray-600 font-bold py-3 px-6 rounded-full cursor-not-allowed"
                  disabled
                >
                  Plan Actuel
                </button>
              ) : (
                <button
                  className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 transition-colors"
                  onClick={() => { navigate('/paiement/'+plan.name) }}
                >
                  Souscrire <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}