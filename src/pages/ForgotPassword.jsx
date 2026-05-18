// src/pages/ForgotPassword.jsx — Demande de réinitialisation mot de passe
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { auth } from '../API';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [resetToken, setResetToken] = useState(''); // dev only — shows token for testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Veuillez saisir votre adresse email.'); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { setError('Adresse email invalide.'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await auth.forgotPassword(email.trim());
      setDone(true);
      if (res.data?.resetToken) setResetToken(res.data.resetToken); // dev
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <EnvelopeIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mt-1">
            Saisissez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {done ? (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium text-sm">Demande envoyée !</p>
                <p className="text-green-700 text-sm mt-0.5">
                  Si <strong>{email}</strong> correspond à un compte, un lien de réinitialisation a été généré.
                </p>
              </div>
            </div>

            {resetToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="text-amber-800 font-semibold mb-1">Mode développement</p>
                <p className="text-amber-700 text-xs mb-2">En production, ce token serait envoyé par email. Pour tester :</p>
                <button
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                  Ouvrir le formulaire de réinitialisation
                </button>
              </div>
            )}

            <Link to="/login"
              className="flex items-center justify-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium">
              <ArrowLeftIcon className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors">
              {loading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-green-700 hover:underline flex items-center justify-center gap-1">
                <ArrowLeftIcon className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
