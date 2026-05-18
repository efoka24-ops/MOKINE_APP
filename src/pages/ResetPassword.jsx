// src/pages/ResetPassword.jsx — Formulaire de réinitialisation mot de passe
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockClosedIcon, ArrowLeftIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { auth } from '../API';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) { setError('Token de réinitialisation manquant. Refaites une demande.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation. Le token est peut-être expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <LockClosedIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez un mot de passe sécurisé</p>
        </div>

        {done ? (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium text-sm">Mot de passe réinitialisé !</p>
                <p className="text-green-700 text-sm mt-0.5">Redirection vers la connexion dans 3 secondes…</p>
              </div>
            </div>
            <Link to="/login"
              className="flex items-center justify-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium">
              <ArrowLeftIcon className="h-4 w-4" />
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!token && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
                Token introuvable dans l'URL. Utilisez le lien fourni dans votre email ou la page mot de passe oublié.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-1 flex gap-1">
                  {[6, 8, 12].map(len => (
                    <div key={len}
                      className={`h-1 flex-1 rounded-full transition-colors ${password.length >= len ? 'bg-green-500' : 'bg-gray-200'}`} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    {password.length < 6 ? 'Trop court' : password.length < 8 ? 'Acceptable' : password.length < 12 ? 'Bon' : 'Fort'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none text-sm ${
                    confirm && confirm !== password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {confirm && confirm !== password && (
                <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors">
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-green-700 hover:underline">
                Refaire une demande
              </Link>
              {' · '}
              <Link to="/login" className="text-sm text-green-700 hover:underline">
                Connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
