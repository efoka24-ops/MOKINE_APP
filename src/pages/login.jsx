// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { smsAuth } from '../API';
import logo from '../assets/logo-removebg-preview.png';
import loginImage from '../assets/images/veterinaire.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'sms'

  // Email state
  const [formData, setFormData] = useState({ email: '', password: '' });

  // SMS OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ─── Email login ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  // ─── SMS: send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Entrez votre numéro de téléphone'); return; }
    setError('');
    setOtpLoading(true);
    try {
      const res = await smsAuth.sendOTP({ phone: phone.trim() });
      setOtpSent(true);
      if (res.data.devCode) setDevCode(res.data.devCode);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible d\'envoyer le code SMS');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── SMS: verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Entrez le code à 6 chiffres'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await smsAuth.verifyOTP({ phone: phone.trim(), otp: otp.trim() });
      const { token, user } = res.data;
      localStorage.setItem('mokine_token', token);
      localStorage.setItem('mokine_user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigit = (i, val, e) => {
    const arr = (otp + '      ').split('').slice(0, 6);
    arr[i] = val.replace(/\D/, '').slice(-1);
    setOtp(arr.join('').trimEnd());
    if (val && e.target.nextSibling) e.target.nextSibling.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-4xl">
        {/* Image gauche */}
        <div
          className="hidden md:block md:w-1/2 bg-center bg-cover"
          style={{ backgroundImage: `url(${loginImage})` }}
        >
          <div className="flex items-center justify-center h-full bg-black bg-opacity-30 p-6">
            <h2 className="text-white text-3xl font-extrabold text-center">
              Connectez-vous à votre espace Mokine
            </h2>
          </div>
        </div>

        {/* Formulaire droite */}
        <div className="w-full md:w-1/2 p-4 sm:p-10 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="MokineVet" className="h-16 w-auto object-contain mx-auto" />
          </div>
          <h2 className="text-center text-2xl font-extrabold text-gray-900">Connexion</h2>

          {/* Mode selector */}
          <div className="mt-4 flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => { setMode('email'); setError(''); setOtpSent(false); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${mode === 'email' ? 'bg-[#178A3B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📧 Email
            </button>
            <button
              onClick={() => { setMode('sms'); setError(''); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${mode === 'sms' ? 'bg-[#178A3B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📱 SMS OTP
            </button>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* EMAIL MODE */}
          {mode === 'email' && (
            <>
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <input
                  name="email" type="email" autoComplete="email" required
                  value={formData.email} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#178A3B] focus:border-[#178A3B] sm:text-sm"
                  placeholder="Adresse email"
                />
                <input
                  name="password" type="password" autoComplete="current-password" required
                  value={formData.password} onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#178A3B] focus:border-[#178A3B] sm:text-sm"
                  placeholder="Mot de passe"
                />
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-[#178A3B] hover:underline">Mot de passe oublié ?</Link>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2 text-sm font-medium rounded-md text-white bg-[#178A3B] hover:bg-[#136B2F] disabled:opacity-60"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            </>
          )}

          {/* SMS OTP MODE */}
          {mode === 'sms' && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Pas besoin d'email — votre numéro suffit.
              </p>

              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-3">
                  <div className="flex">
                    <span className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm font-mono">+237</span>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="655 123 456"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-[#178A3B] focus:border-[#178A3B]"
                    />
                  </div>
                  <button
                    type="submit" disabled={otpLoading}
                    className="w-full py-2.5 bg-[#178A3B] text-white rounded-md text-sm font-medium hover:bg-[#136B2F] disabled:opacity-60"
                  >
                    {otpLoading ? '⏳ Envoi...' : '📲 Envoyer le code SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 text-center">
                    Code envoyé au <strong>{phone}</strong>
                    {devCode && (
                      <div className="mt-1">Code de test: <strong className="font-mono text-lg">{devCode}</strong></div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <input
                        key={i}
                        type="text" inputMode="numeric" maxLength={1}
                        value={otp[i] || ''}
                        onChange={e => handleOtpDigit(i, e.target.value, e)}
                        onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && e.target.previousSibling) e.target.previousSibling.focus(); }}
                        className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#178A3B] transition-colors"
                      />
                    ))}
                  </div>
                  <button
                    type="submit" disabled={loading || otp.replace(/\s/g,'').length < 6}
                    className="w-full py-2.5 bg-[#178A3B] text-white rounded-md text-sm font-medium hover:bg-[#136B2F] disabled:opacity-60"
                  >
                    {loading ? 'Vérification...' : '✓ Valider le code'}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setDevCode(''); }} className="w-full text-xs text-gray-400 hover:underline">
                    ← Modifier le numéro
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-5 text-center text-sm space-y-1">
            <p className="text-gray-600">
              Pas encore de compte?{' '}
              <Link to="/register" className="font-medium text-[#178A3B] hover:text-[#136B2F]">S'inscrire</Link>
            </p>
            <p className="text-gray-600">
              <Link to="/" className="font-medium text-[#178A3B] hover:text-[#136B2F]">← Accueil</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
