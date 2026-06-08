import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { users as usersAPI, payments as paymentsAPI } from '../API';
import { useAuth } from '../context/AuthContext';
import { useSubscriptionPlans } from '../hooks/useSettings';

export function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('gratuit');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { plans, loading: plansLoading } = useSubscriptionPlans();

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          usersAPI.getProfile(),
          paymentsAPI.getHistory(),
        ]);
        setCurrentPlan(profileRes.data?.subscriptionPlan || 'gratuit');
        setHistory(historyRes.data?.payments || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading || plansLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Choisissez votre abonnement</h1>
        <p className="text-gray-500 mt-2">Tous les plans incluent un accès au diagnostic IA</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => {
          const isActive = currentPlan === plan.slug;
          return (
            <div key={plan.slug}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${isActive ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'} transition-all`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute -top-3 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Actif
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.priceLabel}</span>
                <span className="text-gray-400 text-sm ml-1">FCFA</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{plan.period}</p>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.price === 0 ? (
                <button onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition">
                  {isActive ? 'Plan actuel' : 'Commencer gratuitement'}
                </button>
              ) : (
                <button onClick={() => navigate(`/payment/${plan.slug}`)}
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}>
                  {isActive ? 'Abonnement actif' : <><span>Choisir {plan.name}</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des paiements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Méthode</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(p.transactionDate || p.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 capitalize">{p.plan || '—'}</td>
                    <td className="px-4 py-3">{Number(p.amount).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status}
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
  );
}

export default SubscriptionPlans;
