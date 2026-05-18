import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { users as usersAPI, payments as paymentsAPI } from '../API';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    slug: 'gratuit',
    name: 'Gratuit',
    price: 0,
    priceLabel: '0',
    period: 'par mois',
    description: 'Parfait pour découvrir nos services.',
    features: [
      "5 prédiagnostics d'image (pieds, bouche, peau)",
      "5 prédiagnostics par texte",
      "Accès limité aux fonctionnalités de base",
      "Support standard",
    ],
    color: 'border-gray-200',
    badge: null,
  },
  {
    slug: 'standard',
    name: 'Standard',
    price: 5000,
    priceLabel: '5.000',
    period: 'par mois',
    description: 'Accès illimité pour une utilisation régulière.',
    features: [
      "Accès illimité aux 3 modèles d'image",
      "Prédiagnostic par texte illimité",
      "Prédiagnostic par voix illimité",
      "Support prioritaire",
    ],
    color: 'border-green-400',
    badge: 'Populaire',
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 12000,
    priceLabel: '12.000',
    period: 'par 3 mois',
    description: 'Le meilleur rapport qualité-prix.',
    features: [
      "Tout le plan Standard",
      "Nouvelles fonctionnalités en avant-première",
      "Support 24/7",
      "Consultation prioritaire vétérinaire",
    ],
    color: 'border-blue-400',
    badge: null,
  },
  {
    slug: 'entreprise',
    name: 'Entreprise',
    price: 45000,
    priceLabel: '45.000',
    period: 'par an',
    description: 'La solution complète pour les professionnels.',
    features: [
      "Tout le plan Premium",
      "Assistance dédiée",
      "Facturation personnalisée",
      "Accès API (intégration)",
    ],
    color: 'border-purple-400',
    badge: null,
  },
];

export function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('gratuit');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.getSubscription().catch(() => null),
      paymentsAPI.getHistory().catch(() => null),
    ]).then(([subRes, histRes]) => {
      if (subRes?.data?.plan) setCurrentPlan(subRes.data.plan);
      if (histRes?.data) setHistory(histRes.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Choisissez votre plan</h2>
          <p className="mt-3 text-gray-500">
            {loading ? 'Chargement de votre abonnement…' : `Plan actuel : `}
            {!loading && <span className="font-semibold text-green-700 capitalize">{currentPlan}</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => {
            const isCurrent = plan.slug === currentPlan;
            return (
              <div key={plan.slug}
                className={`bg-white border-2 rounded-2xl shadow-sm p-6 flex flex-col transition-transform hover:scale-105 ${plan.color} ${isCurrent ? 'ring-2 ring-green-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.badge && (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">{plan.badge}</span>
                  )}
                </div>
                {isCurrent && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 w-fit mb-2">Plan actuel</span>
                )}
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.priceLabel}</span>
                  <span className="text-sm text-gray-500 ml-1">FCFA {plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="w-full bg-gray-200 text-gray-500 font-medium py-2.5 rounded-xl cursor-not-allowed">
                    Plan actuel
                  </button>
                ) : (
                  <button onClick={() => navigate(`/paiement/${plan.slug}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    Souscrire <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Historique des paiements */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Historique des paiements</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100 text-xs uppercase">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Montant</th>
                    <th className="py-2 pr-4">Méthode</th>
                    <th className="py-2 pr-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-600">{new Date(p.transactionDate).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2 pr-4 font-medium">{p.amount?.toLocaleString()} FCFA</td>
                      <td className="py-2 pr-4 text-gray-500 capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status === 'completed' ? 'Complété' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
