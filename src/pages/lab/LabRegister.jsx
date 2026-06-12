import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';

const LANGUAGES = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'en', label: 'Anglais',   flag: '🇬🇧' },
  { code: 'ar', label: 'Arabe',     flag: '🌙' },
];

const ROLES = [
  {
    id: 'researcher',
    icon: '🔬',
    title: 'Chercheur',
    desc: 'Académique, agronome ou étudiant — contribuez au dataset et utilisez les outils de diagnostic IA.',
  },
  {
    id: 'developer',
    icon: '🔌',
    title: 'Développeur',
    desc: 'Créez vos propres modèles IA vétérinaires, entraînez-les sur l\'infra Mokine et déployez-les.',
  },
  {
    id: 'veterinarian',
    icon: '🩺',
    title: 'Vétérinaire',
    desc: 'Validez les contributions du dataset (valeur x2) et accédez aux détails cliniques avancés.',
  },
];

const validatePassword = (pw) => {
  if (pw.length < 8)          return 'Min. 8 caractères.';
  if (!/[A-Z]/.test(pw))      return 'Au moins une majuscule.';
  if (!/[0-9]/.test(pw))      return 'Au moins un chiffre.';
  if (!/[!@#$%^&*]/.test(pw)) return 'Au moins un caractère spécial (!@#$%^&*).';
  return null;
};

export default function LabRegister() {
  const { register } = useLabAuth();
  const navigate = useNavigate();

  const [step, setStep]     = useState(0);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    appLanguage: 'fr',
    role: 'researcher',
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    // Chercheur
    institution: '', researchDomain: '',
    // Développeur
    company: '', intendedUse: '',
    // Vétérinaire
    ovnNumber: '', specialization: '',
  });

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const totalSteps = 3;
  const progress   = Math.round((step / totalSteps) * 100);

  const handleNext = () => { setError(''); setStep(s => s + 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwErr = validatePassword(form.password);
    if (pwErr) { setError(pwErr); return; }
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.role === 'veterinarian' && !form.ovnNumber.trim()) {
      setError('Le numéro OVN est obligatoire.'); return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/mokinelab/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: PRIMARY }}>M</div>
            <span className="font-bold text-gray-800 text-lg">
              Mokine<span style={{ color: PRIMARY }}>Lab</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm">Créez votre compte — Laboratoire IA vétérinaire</p>
        </div>

        {/* Barre de progression */}
        {step > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Étape {step}/{totalSteps}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: PRIMARY }} />
            </div>
          </div>
        )}

        {/* ── STEP 0 : Langue ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Choisissez votre langue</h2>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => set('appLanguage', l.code)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    form.appLanguage === l.code ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'
                  }`}>
                  <span className="text-2xl">{l.flag}</span>
                  <span className="font-medium text-gray-800">{l.label}</span>
                  {form.appLanguage === l.code && <span className="ml-auto" style={{ color: PRIMARY }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={handleNext}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all"
              style={{ background: PRIMARY }}>
              Continuer →
            </button>
            <p className="text-center mt-4 text-sm text-gray-500">
              Déjà membre ? <Link to="/mokinelab/login" className="font-medium" style={{ color: PRIMARY }}>Se connecter</Link>
            </p>
          </div>
        )}

        {/* ── STEP 1 : Rôle ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">← Retour</button>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quel est votre profil ?</h2>
            <div className="space-y-3 mb-6">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => set('role', r.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    form.role === r.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <span className="text-3xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </div>
                  {form.role === r.id && <span className="ml-auto flex-shrink-0 text-lg" style={{ color: PRIMARY }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={handleNext}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all"
              style={{ background: PRIMARY }}>
              Continuer →
            </button>
          </div>
        )}

        {/* ── STEP 2 : Informations personnelles ──────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600">← Retour</button>
              <span className="text-sm font-medium" style={{ color: PRIMARY }}>
                {ROLES.find(r => r.id === form.role)?.icon} {ROLES.find(r => r.id === form.role)?.title}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">
                {error}
              </div>
            )}

            {/* Champs communs */}
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Nom complet *"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />

            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="Email *"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />

            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="Téléphone (ex: +237655...)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />

            {/* Champs spécifiques au rôle */}
            {form.role === 'researcher' && (
              <>
                <input value={form.institution} onChange={e => set('institution', e.target.value)}
                  placeholder="Institution / Université"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                <input value={form.researchDomain} onChange={e => set('researchDomain', e.target.value)}
                  placeholder="Domaine de recherche (ex: Santé animale, Agro-IA…)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </>
            )}

            {form.role === 'developer' && (
              <>
                <input value={form.company} onChange={e => set('company', e.target.value)}
                  placeholder="Entreprise / Organisation"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                <textarea value={form.intendedUse} onChange={e => set('intendedUse', e.target.value)}
                  placeholder="Usage prévu (ex: app mobile vétérinaire, système d'alerte…)"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
              </>
            )}

            {form.role === 'veterinarian' && (
              <>
                <input required value={form.ovnNumber} onChange={e => set('ovnNumber', e.target.value)}
                  placeholder="Numéro OVN * (ex: OVC/CM/2024/0123)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                <input value={form.specialization} onChange={e => set('specialization', e.target.value)}
                  placeholder="Spécialisation (ex: Bovins, Volailles…)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </>
            )}

            {/* Mot de passe */}
            <div>
              <input required type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Mot de passe *"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              <p className="text-xs text-gray-400 mt-1">Min. 8 car., 1 majuscule, 1 chiffre, 1 spécial (!@#$%^&*)</p>
            </div>
            <input required type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              placeholder="Confirmer le mot de passe *"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />

            <button type="submit" disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {loading ? 'Création du compte…' : 'Créer mon compte MokineLab →'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Déjà membre ? <Link to="/mokinelab/login" className="font-medium" style={{ color: PRIMARY }}>Se connecter</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
