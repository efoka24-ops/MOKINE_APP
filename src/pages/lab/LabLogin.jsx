import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';

export default function LabLogin() {
  const { login } = useLabAuth();
  const navigate  = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/mokinelab/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: PRIMARY }}>M</div>
            <span className="font-bold text-gray-800 text-xl">
              Mokine<span style={{ color: PRIMARY }}>Lab</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">Connectez-vous à votre espace laboratoire</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Mot de passe</label>
            </div>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-60 mt-2"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2 text-sm text-gray-500">
          <p>
            Pas encore de compte ?{' '}
            <Link to="/mokinelab/register" className="font-semibold" style={{ color: PRIMARY }}>
              Créer un compte MokineLab
            </Link>
          </p>
          <p>
            <Link to="/mokinelab" className="text-gray-400 hover:text-gray-600 text-xs">
              ← Retour à MokineLab
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Vous cherchez MokineVeto ?{' '}
            <Link to="/login" className="underline hover:text-gray-600">Connexion MokineVeto →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
