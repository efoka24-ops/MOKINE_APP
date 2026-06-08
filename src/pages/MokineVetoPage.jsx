import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '💬', title: 'Téléconsultations', desc: 'Chat en temps réel avec des vétérinaires certifiés, disponibles 24h/24.' },
  { icon: '🧠', title: 'Diagnostic IA', desc: 'Questionnaire symptomatique intelligent pour un pré-diagnostic immédiat.' },
  { icon: '📋', title: 'Ordonnances numériques', desc: 'Prescriptions signées électroniquement et archivées dans votre espace.' },
  { icon: '🛒', title: 'Marketplace vétérinaire', desc: 'Vaccins, médicaments et équipements livrés directement à la ferme.' },
  { icon: '🐄', title: 'Gestion du cheptel', desc: 'Suivi complet des animaux, carnet de santé, alertes sanitaires.' },
  { icon: '📊', title: 'Tableau de bord', desc: 'Vue d\'ensemble de la santé de votre troupeau en un coup d\'œil.' },
];

const STATS = [
  { value: '500+', label: 'Éleveurs actifs' },
  { value: '50+', label: 'Vétérinaires partenaires' },
  { value: '24/7', label: 'Disponibilité' },
  { value: '98%', label: 'Satisfaction' },
];

const PLANS = [
  { name: 'Gratuit', price: '0', period: 'mois', features: ['3 consultations/mois', 'Diagnostic IA basique', '10 animaux max', 'Marketplace en lecture'], cta: 'Commencer gratuitement', highlight: false },
  { name: 'Pro', price: '15 000', period: 'mois', features: ['Consultations illimitées', 'Diagnostic IA avancé', 'Animaux illimités', 'Ordonnances numériques', 'Support prioritaire'], cta: 'Choisir Pro', highlight: true },
  { name: 'Entreprise', price: '45 000', period: 'mois', features: ['Tout Pro inclus', 'Multi-exploitations', 'API d\'intégration', 'Rapport mensuel', 'Manager dédié'], cta: 'Nous contacter', highlight: false },
];

export default function MokineVetoPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#178A3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-gray-800 text-lg">Mokine<span className="text-[#178A3B]">Veto</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-[#178A3B]">Fonctionnalités</a>
            <a href="#stats" className="hover:text-[#178A3B]">Chiffres</a>
            <a href="#pricing" className="hover:text-[#178A3B]">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">
                Mon espace →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-[#178A3B]">Connexion</button>
                <button onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">
                  S'inscrire
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-[#178A3B] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            🌍 La santé animale connectée en Afrique
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            La vétérinaire dans votre poche,<br/>
            <span className="text-[#178A3B]">partout au Cameroun</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            MokineVeto connecte les éleveurs aux vétérinaires via téléconsultation, diagnostic IA et marketplace de produits vétérinaires — sans déplacement, en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="px-8 py-3.5 bg-[#178A3B] text-white font-semibold rounded-xl hover:bg-[#136B2F] shadow-lg shadow-green-200 transition-all">
              {isAuthenticated ? 'Accéder à mon espace' : 'Démarrer gratuitement'}
            </button>
            <button onClick={() => navigate('/consultation')}
              className="px-8 py-3.5 border-2 border-[#178A3B] text-[#178A3B] font-semibold rounded-xl hover:bg-green-50 transition-all">
              Voir une démo →
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-12 bg-[#178A3B]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{stat.value}</div>
              <div className="text-green-200 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Tout ce qu'il vous faut</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Une plateforme complète pensée pour les éleveurs et vétérinaires d'Afrique centrale</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-green-200 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Comment ça marche ?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📝', title: 'Inscrivez-vous', desc: 'Créez votre compte éleveur en 2 minutes avec votre numéro de téléphone.' },
              { step: '2', icon: '🐄', title: 'Ajoutez vos animaux', desc: 'Enregistrez votre cheptel et recevez des alertes sanitaires automatiques.' },
              { step: '3', icon: '💬', title: 'Consultez un vétérinaire', desc: 'Chat instantané ou vidéo avec un spécialiste, ordonnance en quelques minutes.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-[#178A3B] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Tarifs simples et transparents</h2>
            <p className="text-gray-500">En FCFA · Sans engagement · Résiliable à tout moment</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-xl p-6 border-2 ${plan.highlight ? 'border-[#178A3B] shadow-lg shadow-green-100 relative' : 'border-gray-200'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#178A3B] text-white text-xs px-3 py-1 rounded-full font-medium">
                    Le plus populaire
                  </div>
                )}
                <h3 className="font-bold text-gray-800 text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">F CFA/{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-[#178A3B]">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${plan.highlight ? 'bg-[#178A3B] text-white hover:bg-[#136B2F]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#178A3B] to-[#0f5e27] text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Prêt à moderniser votre élevage ?</h2>
        <p className="text-green-200 mb-8 max-w-md mx-auto">Rejoignez des centaines d'éleveurs camerounais qui font confiance à MokineVeto.</p>
        <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
          className="px-10 py-4 bg-white text-[#178A3B] font-bold rounded-xl hover:bg-green-50 shadow-xl transition-all text-lg">
          {isAuthenticated ? 'Mon tableau de bord →' : 'Créer mon compte gratuitement →'}
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© 2026 MokineVeto — Plateforme de santé animale connectée</p>
        <p className="mt-1">Garoua, Cameroun · infos@trugroup.cm</p>
      </footer>
    </div>
  );
}
