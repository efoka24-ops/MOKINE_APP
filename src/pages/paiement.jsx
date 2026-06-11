import React, { useEffect, useState } from 'react';
import { CreditCard, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { payments as paymentsAPI, camooPayment as camooAPI } from '../API';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
  { code: 'CM', name: 'Cameroun',      prefix: '+237' },
  { code: 'CI', name: "Côte d'Ivoire", prefix: '+225' },
  { code: 'SN', name: 'Sénégal',       prefix: '+221' },
  { code: 'ML', name: 'Mali',          prefix: '+223' },
];

export function PaymentPage() {
  const { plan: planSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [form, setForm] = useState({ payorName: user?.name || '', phoneNumber: '', country: 'CM', agreeTerms: false });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'pending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [camooTxId, setCamooTxId] = useState('');
  const [vendorRef, setVendorRef] = useState('');

  useEffect(() => {
    fetch(`/api/subscription-plans/${planSlug || 'standard'}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPlan(data); setLoadingPlan(false); })
      .catch(() => setLoadingPlan(false));
  }, [planSlug]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!form.agreeTerms) { setErrorMsg('Veuillez accepter les conditions.'); return; }
    if (!form.phoneNumber || form.phoneNumber.length < 8) { setErrorMsg('Numéro de téléphone invalide.'); return; }
    if (!plan) return;

    setLoading(true);
    setErrorMsg('');

    const countryObj = COUNTRIES.find(c => c.code === form.country);
    const fullPhone = `${countryObj.prefix}${form.phoneNumber.replace(/^0+/, '')}`;
    const ref = `MOKINE-${plan.slug.toUpperCase()}-${Date.now()}`;

    try {
      const { data } = await camooAPI.cashout({
        amount: plan.price,
        phone_number: fullPhone,
        plan: plan.slug,
        external_reference: ref,
        shopping_cart_details: {
          customerName: form.payorName,
          description: `Abonnement Mokine ${plan.name}`,
          langKey: 'fr',
        },
      });

      const txId = data?.cashOut?.id;
      setCamooTxId(txId || '');
      setVendorRef(ref);
      setStatus('pending');

      // Redirect to success page so user knows to validate on phone
      navigate(`/payment/success?plan=${plan.slug}&ref=${ref}${txId ? `&id=${txId}` : ''}`);
    } catch (err) {
      // Fallback: record payment locally if Camoo fails
      try {
        await paymentsAPI.process({
          amount: plan.price,
          paymentMethod: 'mobile_money',
          payorName: form.payorName,
          phone: fullPhone,
          country: form.country,
          plan: plan.slug,
          currency: plan.currency || 'XAF',
          vendor_reference: ref,
        });
        setStatus('success');
      } catch {
        setErrorMsg(err.response?.data?.error || 'Erreur lors du paiement. Veuillez réessayer.');
        setStatus('error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlan) {
    return <div className="flex justify-center items-center min-h-screen"><Loader className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-red-500 mb-4">Plan introuvable.</p>
          <button onClick={() => navigate('/abonnement')} className="text-green-600 underline">Voir les plans</button>
        </div>
      </div>
    );
  }

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
          <button onClick={() => navigate('/dashboard')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
            Accéder à mon espace {plan.name}
          </button>
        </div>
      </div>
    );
  }

  const countryObj = COUNTRIES.find(c => c.code === form.country) || COUNTRIES[0];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <button onClick={() => navigate('/abonnement')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* Plan summary */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-800">Plan {plan.name}</p>
            <p className="text-sm text-gray-500">{plan.period}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-green-700">{plan.priceLabel} FCFA</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" /> Paiement Mobile Money
        </h2>

        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input value={form.payorName} onChange={e => set('payorName', e.target.value)} required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <select value={form.country} onChange={e => set('country', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500">
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.prefix})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                {countryObj.prefix}
              </span>
              <input type="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="6XXXXXXXX" required
                className="flex-1 border border-gray-300 rounded-r-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)}
              className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300" />
            <span className="text-sm text-gray-600">
              J'accepte les <a href="/terms" className="text-green-600 underline">conditions d'utilisation</a> et la politique de confidentialité.
            </span>
          </label>

          <button type="submit" disabled={loading || !form.agreeTerms}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {loading ? 'Traitement...' : `Payer ${plan.priceLabel} FCFA`}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Paiement sécurisé via Camoo
        </p>
      </div>
    </div>
  );
}

export default PaymentPage;
