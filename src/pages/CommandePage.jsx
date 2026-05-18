import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';

const PLANS = [
  { id: 'box',      label: 'Mokine Box',      price: '45 000 FCFA', desc: 'Collier connecté + accès 6 mois', icon: '📦' },
  { id: 'eleveur',  label: 'Pack Éleveur',     price: '75 000 FCFA', desc: 'Box + abonnement 12 mois + support prioritaire', icon: '🐄' },
  { id: 'ferme',    label: 'Pack Ferme',       price: 'Sur devis',   desc: 'Solution multi-animaux pour les grandes exploitations', icon: '🏡' },
];

const INITIAL = {
  plan: 'box',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  region: '',
  animalCount: '',
  message: '',
};

export default function CommandePage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PRIMARY_L }}>
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande reçue !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Merci <strong>{form.firstName}</strong>, notre équipe vous contactera sous <strong>48h</strong> au <strong>{form.phone}</strong> pour finaliser votre commande.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 text-white rounded-xl font-semibold transition-all text-sm"
              style={{ background: PRIMARY }}>
              Retour à l'accueil
            </button>
            <button
              onClick={() => { setForm(INITIAL); setSubmitted(false); }}
              className="px-6 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all hover:bg-green-50"
              style={{ borderColor: PRIMARY, color: PRIMARY }}>
              Nouvelle commande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: PRIMARY }}>M</div>
            <span className="font-bold text-gray-800 text-lg">Mokine</span>
          </button>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-green-600 transition">
            ← Retour à l'accueil
          </button>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 pb-12 px-4 text-center" style={{ background: PRIMARY_L }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
          style={{ background: '#bbf7d0', color: PRIMARY_D }}>
          📦 Commander votre Mokine Box
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Démarrez votre suivi connecté</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Remplissez ce formulaire et notre équipe vous contacte sous 48h pour finaliser votre commande et organiser la livraison.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Choix du plan */}
        <div className="mb-8">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Choisissez votre offre</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PLANS.map(p => (
              <button key={p.id} type="button" onClick={() => set('plan', p.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  form.plan === p.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}>
                <div className="text-2xl mb-2">{p.icon}</div>
                <div className="font-bold text-gray-900 text-sm">{p.label}</div>
                <div className="font-semibold text-sm mt-0.5" style={{ color: PRIMARY }}>{p.price}</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-5">
          <h2 className="font-bold text-gray-800 text-lg mb-1">Vos coordonnées</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prénom *</label>
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}
                placeholder="Jean" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom *</label>
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)}
                placeholder="Nkomo" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Téléphone *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+237 6XX XX XX XX" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jean.nkomo@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Région *</label>
              <select required value={form.region} onChange={e => set('region', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                <option value="">Sélectionnez une région</option>
                {['Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral', 'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre d'animaux</label>
              <input type="number" min="1" value={form.animalCount} onChange={e => set('animalCount', e.target.value)}
                placeholder="ex : 12" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message / précisions</label>
            <textarea rows={4} value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Type d'animaux, questions, délai souhaité..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>

          {/* Résumé commande */}
          {form.plan && (
            <div className="rounded-xl p-4 border border-green-200" style={{ background: PRIMARY_L }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Offre sélectionnée</p>
                  <p className="font-bold text-gray-900">
                    {PLANS.find(p => p.id === form.plan)?.icon}{' '}
                    {PLANS.find(p => p.id === form.plan)?.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{PLANS.find(p => p.id === form.plan)?.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Prix</p>
                  <p className="font-bold text-lg" style={{ color: PRIMARY }}>{PLANS.find(p => p.id === form.plan)?.price}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
            {loading ? '⏳ Envoi en cours...' : '📩 Envoyer ma commande'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Notre équipe vous contactera sous 48h · Paiement à la livraison possible
          </p>
        </form>
      </div>

      {/* Footer minimal */}
      <footer className="py-6 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© {new Date().getFullYear()} Mokine · <a href="/" className="hover:text-white transition">Accueil</a> · <a href="/mokinelab" className="hover:text-green-400 transition">MokineLab</a></p>
      </footer>
    </div>
  );
}
