import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { code: 'fr',  label: 'Français',  flag: '🇫🇷' },
  { code: 'ful', label: 'Fulfuldé',  flag: '🌍' },
  { code: 'hau', label: 'Haoussa',   flag: '🌍' },
  { code: 'wol', label: 'Wolof',     flag: '🌍' },
  { code: 'en',  label: 'Anglais',   flag: '🇬🇧' },
  { code: 'ar',  label: 'Arabe',     flag: '🌙' },
];

const LANG_OPTIONS = ['Français', 'Fulfuldé', 'Haoussa', 'Wolof', 'Anglais', 'Arabe'];
const TRANSPORT   = ['Voiture', 'Moto', 'Vélo', 'À pied', 'Transport en commun'];
const DAYS        = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SPECIALTIES = [
  'Bovins / Bétail', 'Volaille', 'Caprins / Ovins', 'Porcins',
  'Animaux de compagnie', 'Faune sauvage', 'Médecine générale',
];
const FARM_CATEGORIES = [
  { id: 'cattle',    label: 'Bovins',        icon: '🐄' },
  { id: 'sheep',     label: 'Ovins',         icon: '🐑' },
  { id: 'goat',      label: 'Caprins',       icon: '🐐' },
  { id: 'chicken',   label: 'Volailles',     icon: '🐔' },
  { id: 'pig',       label: 'Porcins',       icon: '🐷' },
  { id: 'fish',      label: 'Pisciculture',  icon: '🐟' },
];
const FARMER_SUB_ROLES = [
  { id: 'owner',    label: 'Éleveur individuel', icon: '🧑‍🌾', desc: 'Je gère mon propre cheptel' },
  { id: 'manager',  label: 'Responsable de ferme', icon: '🏡', desc: 'Je dirige une exploitation avec des employés' },
  { id: 'assistant', label: 'Assistant / Berger', icon: '👨‍👧', desc: 'Je travaille pour un éleveur' },
];

const validatePassword = (pw) => {
  if (pw.length < 8)          return 'Min. 8 caractères.';
  if (!/[A-Z]/.test(pw))      return 'Au moins une majuscule.';
  if (!/[0-9]/.test(pw))      return 'Au moins un chiffre.';
  if (!/[!@#$%^&*]/.test(pw)) return 'Au moins un caractère spécial (!@#$%^&*).';
  return null;
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(0); // 0=lang, 1=role, 2=info, 3=vet-profile
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]             = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [formData, setFormData] = useState({
    // language
    appLanguage: 'fr',
    // role
    role: 'farmer',
    farmRole: 'owner',
    // basic info
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    dob: '', gender: '', domicile: '',
    // farmer specific
    farmName: '', farmCategories: [],
    // vet specific
    licenseNumber: '', specialization: '',
    zone: '', city: '',
    languages: [], transport: [], availableDays: [],
    availableFrom: '08:00', availableTo: '18:00',
    // vendor specific
    businessName: '',
  });

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleMulti = (field, val) => setFormData(prev => {
    const arr = prev[field];
    return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  // ── Step handlers ──────────────────────────────────────────────────────────
  const handleStep2 = (e) => {
    e.preventDefault();
    const pwErr = validatePassword(formData.password);
    if (pwErr) { setError(pwErr); return; }
    if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (formData.role === 'veterinarian' && !formData.licenseNumber.trim()) {
      setError('Le numéro OVN est obligatoire pour les vétérinaires.');
      return;
    }
    setError('');
    if (formData.role === 'veterinarian') { setStep(3); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
      setStep(formData.role === 'veterinarian' ? 3 : 2);
    } finally { setLoading(false); }
  };

  // ── Progress bar ───────────────────────────────────────────────────────────
  const totalSteps = formData.role === 'veterinarian' ? 4 : 3;
  const progress   = Math.round(((step) / totalSteps) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-3xl font-bold text-[#178A3B]">MokineVeto</div>
          <p className="text-gray-500 text-sm mt-1">Créez votre compte</p>
        </div>

        {/* Progress */}
        {step > 0 && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Étape {step}/{totalSteps - 1}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#178A3B] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── STEP 0 : Langue ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Choisissez votre langue
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => set('appLanguage', l.code)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    formData.appLanguage === l.code
                      ? 'border-[#178A3B] bg-green-50'
                      : 'border-gray-200 hover:border-[#178A3B]'
                  }`}>
                  <span className="text-2xl">{l.flag}</span>
                  <span className="font-medium text-gray-800 text-sm">{l.label}</span>
                  {formData.appLanguage === l.code && <span className="ml-auto text-[#178A3B]">✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full py-2.5 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors">
              Continuer →
            </button>
            <p className="text-center mt-3 text-sm text-gray-500">
              Déjà un compte ? <Link to="/login" className="text-[#178A3B] font-medium">Se connecter</Link>
            </p>
          </div>
        )}

        {/* ── STEP 1 : Rôle + sous-rôle ──────────────────────────────────── */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} className="text-gray-400 hover:text-gray-600 text-sm mb-3">← Retour</button>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quel est votre profil ?</h2>

            <div className="space-y-2 mb-4">
              {[
                { id: 'farmer',       icon: '🐄', title: 'Éleveur / Ferme', desc: 'Gérez votre cheptel, consultez les vétérinaires' },
                { id: 'veterinarian', icon: '👨‍⚕️', title: 'Vétérinaire', desc: 'Proposez vos services de téléconsultation' },
                { id: 'vendor',       icon: '🏪', title: 'Fournisseur', desc: 'Vendez médicaments et équipements' },
              ].map(role => (
                <button key={role.id} onClick={() => set('role', role.id)}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                    formData.role === role.id ? 'border-[#178A3B] bg-green-50' : 'border-gray-200 hover:border-[#178A3B]'
                  }`}>
                  <span className="text-3xl">{role.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{role.title}</div>
                    <div className="text-xs text-gray-500">{role.desc}</div>
                  </div>
                  {formData.role === role.id && <span className="ml-auto text-[#178A3B] text-xl">✓</span>}
                </button>
              ))}
            </div>

            {/* Sub-role for farmer */}
            {formData.role === 'farmer' && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Votre fonction</p>
                <div className="space-y-2">
                  {FARMER_SUB_ROLES.map(sr => (
                    <button key={sr.id} onClick={() => set('farmRole', sr.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        formData.farmRole === sr.id ? 'border-[#178A3B] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <span className="text-xl">{sr.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{sr.label}</div>
                        <div className="text-xs text-gray-500">{sr.desc}</div>
                      </div>
                      {formData.farmRole === sr.id && <span className="ml-auto text-[#178A3B]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)}
              className="mt-5 w-full py-2.5 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors">
              Continuer →
            </button>
            <p className="text-center mt-3 text-sm text-gray-500">
              Déjà un compte ? <Link to="/login" className="text-[#178A3B] font-medium">Se connecter</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2 : Informations ───────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
              <span className="text-sm font-medium text-[#178A3B]">
                {formData.role === 'farmer' ? '🐄 Éleveur' : formData.role === 'veterinarian' ? '👨‍⚕️ Vétérinaire' : '🏪 Fournisseur'}
                {formData.role === 'veterinarian' && <span className="text-gray-400 ml-1">(étape 1/2)</span>}
              </span>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

            <input required value={formData.name} onChange={e => set('name', e.target.value)}
              placeholder="Nom complet *" className="input-field" />
            <input required type="email" value={formData.email} onChange={e => set('email', e.target.value)}
              placeholder="Email *" className="input-field" />
            <input required type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)}
              placeholder="Téléphone * (ex: +237655...)" className="input-field" />

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={formData.dob} onChange={e => set('dob', e.target.value)}
                placeholder="Date de naissance" className="input-field" />
              <select value={formData.gender} onChange={e => set('gender', e.target.value)} className="input-field">
                <option value="">Sexe</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <input value={formData.domicile} onChange={e => set('domicile', e.target.value)}
              placeholder="Village / Ville de résidence" className="input-field" />

            {/* Farmer-specific */}
            {formData.role === 'farmer' && (
              <>
                <input value={formData.farmName} onChange={e => set('farmName', e.target.value)}
                  placeholder="Nom de l'exploitation (optionnel)" className="input-field" />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Catégories d'élevage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FARM_CATEGORIES.map(c => (
                      <button key={c.id} type="button" onClick={() => toggleMulti('farmCategories', c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                          formData.farmCategories.includes(c.id)
                            ? 'bg-[#178A3B] text-white border-[#178A3B]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#178A3B]'
                        }`}>
                        <span>{c.icon}</span>{c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Vet-specific step 1 */}
            {formData.role === 'veterinarian' && (
              <>
                <div>
                  <input
                    required
                    value={formData.licenseNumber}
                    onChange={e => set('licenseNumber', e.target.value)}
                    placeholder="Numéro OVN (Ordre Vétérinaire National) *"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">Ex: OVC/CM/2024/0123 — Obligatoire pour les vétérinaires</p>
                </div>
                <select value={formData.specialization} onChange={e => set('specialization', e.target.value)} className="input-field">
                  <option value="">Spécialité</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}

            {/* Vendor-specific */}
            {formData.role === 'vendor' && (
              <input value={formData.businessName} onChange={e => set('businessName', e.target.value)}
                placeholder="Nom de l'entreprise" className="input-field" />
            )}

            <div>
              <div style={{ position: 'relative' }}>
                <input required type={showPw ? 'text' : 'password'} value={formData.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Mot de passe *" className="input-field" style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', lineHeight: 1 }}
                  title={showPw ? 'Masquer' : 'Afficher le mot de passe'}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Min. 8 car., 1 majuscule, 1 chiffre, 1 spécial (!@#$%^&*)</p>
            </div>
            <div style={{ position: 'relative' }}>
              <input required type={showConfirmPw ? 'text' : 'password'} value={formData.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Confirmer le mot de passe *" className="input-field" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', lineHeight: 1 }}
                title={showConfirmPw ? 'Masquer' : 'Afficher le mot de passe'}>
                {showConfirmPw ? '🙈' : '👁'}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors disabled:opacity-60">
              {formData.role === 'veterinarian' ? 'Continuer →' : loading ? 'Inscription...' : "S'inscrire"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Déjà un compte ? <Link to="/login" className="text-[#178A3B] font-medium">Se connecter</Link>
            </p>
          </form>
        )}

        {/* ── STEP 3 : Profil vétérinaire ─────────────────────────────────── */}
        {step === 3 && formData.role === 'veterinarian' && (
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
              <span className="text-sm font-medium text-[#178A3B]">👨‍⚕️ Profil vétérinaire <span className="text-gray-400">(étape 2/2)</span></span>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Zone d'intervention</label>
              <input value={formData.city} onChange={e => set('city', e.target.value)}
                placeholder="Ville principale (ex: Yaoundé)" className="input-field mb-2" />
              <input value={formData.zone} onChange={e => set('zone', e.target.value)}
                placeholder="Région / zone couverte (ex: Centre, Est...)" className="input-field" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Langues parlées</label>
              <div className="flex flex-wrap gap-2">
                {LANG_OPTIONS.map(lang => (
                  <button key={lang} type="button" onClick={() => toggleMulti('languages', lang)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.languages.includes(lang)
                        ? 'bg-[#178A3B] text-white border-[#178A3B]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#178A3B]'
                    }`}>{lang}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Moyens de transport</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT.map(t => (
                  <button key={t} type="button" onClick={() => toggleMulti('transport', t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.transport.includes(t)
                        ? 'bg-[#178A3B] text-white border-[#178A3B]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#178A3B]'
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jours disponibles</label>
              <div className="flex gap-1">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleMulti('availableDays', d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      formData.availableDays.includes(d)
                        ? 'bg-[#178A3B] text-white border-[#178A3B]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#178A3B]'
                    }`}>{d}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Heure début</label>
                <input type="time" value={formData.availableFrom} onChange={e => set('availableFrom', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Heure fin</label>
                <input type="time" value={formData.availableTo} onChange={e => set('availableTo', e.target.value)} className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Création du compte...' : 'Créer mon compte vétérinaire'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.875rem;
          display: block;
        }
        .input-field:focus {
          border-color: #178A3B;
          box-shadow: 0 0 0 2px rgba(23, 138, 59, 0.2);
        }
      `}</style>
    </div>
  );
}
