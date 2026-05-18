import React, { useState } from 'react';
import { CreditCard, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { payments as paymentsAPI } from '../API';
import { useAuth } from '../context/AuthContext';

const PLAN_CONFIG = {
  standard: { name: 'Standard', price: 5000, priceLabel: '5.000', period: '/mois', ia: '/ia/standard' },
  entreprise: { name: 'Entreprise', price: 45000, priceLabel: '45.000', period: '/an', ia: '/ia/entreprise' },
};

const COUNTRIES = [
  { code: 'CM', name: 'Cameroun', prefix: '+237' },
  { code: 'CI', name: "Côte d'Ivoire", prefix: '+225' },
  { code: 'SN', name: 'Sénégal', prefix: '+221' },
  { code: 'ML', name: 'Mali', prefix: '+223' },
];

export function PaymentPage({ onBack }) {
  const { plan: planParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = PLAN_CONFIG[planParam] || PLAN_CONFIG.standard;

  const [form, setForm] = useState({
    payorName: user?.name || '',
    phoneNumber: '',
    country: 'CM',
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!form.agreeTerms) return;
    if (!form.phoneNumber || form.phoneNumber.length < 8) {
      setErrorMsg('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const countryObj = COUNTRIES.find(c => c.code === form.country);
      const fullPhone = `${countryObj.prefix}${form.phoneNumber.replace(/^0+/, '')}`;
      await paymentsAPI.process({
        amount: plan.price,
        paymentMethod: 'mobile_money',
        payorName: form.payorName,
        phone: fullPhone,
        country: form.country,
        plan: planParam || 'standard',
        currency: 'XAF',
      });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors du paiement. Veuillez réessayer.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Paiement initié !</h2>
          <p className="text-gray-600 mb-2">
            Un message de confirmation a été envoyé au <strong>{form.phoneNumber}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">Veuillez valider le paiement sur votre téléphone.</p>
          <button onClick={() => navigate(plan.ia)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
            Accéder à mon espace {plan.name}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack || (() => navigate(-1))} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">Paiement Mobile Money</h2>
        </div>

        {/* Récap plan */}
        <div className="mb-6 text-center bg-green-50 rounded-xl p-4">
          <p className="text-gray-600">Plan <span className="font-semibold text-green-700">{plan.name}</span></p>
          <p className="text-4xl font-extrabold text-gray-900 mt-1">
            {plan.priceLabel} <span className="text-lg font-medium text-gray-500">FCFA{plan.period}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Orange Money / MTN MoMo</h3>
            <CreditCard size={20} className="text-orange-500" />
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input type="text" value={form.payorName} onChange={e => set('payorName', e.target.value)}
                placeholder="Votre nom" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.prefix})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                  {COUNTRIES.find(c => c.code === form.country)?.prefix}
                </span>
                <input type="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                  placeholder="6XX XXX XXX" required
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="terms" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded" />
              <label htmlFor="terms" className="text-sm text-gray-700">
                J'accepte les <a href="#" className="text-green-600 hover:underline">conditions d'utilisation</a>
              </label>
            </div>

            <button type="submit" disabled={!form.agreeTerms || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Lock size={18} /><span>Payer {plan.priceLabel} FCFA</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
          <Lock size={12} /> Paiement sécurisé — MokineVeto ne stocke pas vos données bancaires.
        </p>
      </div>
    </div>
  );
}
