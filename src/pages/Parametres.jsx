import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth as authAPI } from '../API';
import {
  UserIcon, LockClosedIcon, QuestionMarkCircleIcon,
  CameraIcon, CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// ─── TAB CONFIG ──────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Mon Profil', icon: UserIcon },
  { id: 'privacy', label: 'Confidentialité', icon: LockClosedIcon },
  { id: 'help', label: 'Aide', icon: QuestionMarkCircleIcon },
];

const ROLE_LABELS = { farmer: 'Éleveur', veterinarian: 'Vétérinaire', vendor: 'Fournisseur', admin: 'Administrateur' };

// ─── FAQ DATA ─────────────────────────────────────────────────
const FAQ = [
  { q: 'Comment consulter un vétérinaire ?', a: 'Allez dans "Consultation", cliquez sur "Nouvelle consultation", sélectionnez votre animal, décrivez le problème et choisissez un vétérinaire disponible. La discussion se fait en temps réel via le chat.' },
  { q: 'Comment ajouter un animal à mon cheptel ?', a: 'Depuis le Tableau de bord, cliquez sur "Ajouter un animal". Renseignez le nom, l\'espèce, la race, la date de naissance et le poids. Une photo et un collier QR peuvent être ajoutés optionnellement.' },
  { q: 'Comment fonctionne le prédiagnostic IA ?', a: 'L\'IA vous pose 10 questions sur les symptômes de votre animal (fièvre, toux, diarrhée, etc.). Elle analyse les réponses et vous propose un diagnostic probable avec un niveau de gravité et des conseils.' },
  { q: 'Comment passer une commande sur la marketplace ?', a: 'Allez dans "Marketplace", ajoutez les produits à votre panier, cliquez sur "Commander", renseignez votre adresse et votre numéro Mobile Money, puis confirmez.' },
  { q: 'Comment modifier mon mot de passe ?', a: 'La modification du mot de passe est disponible dans la section "Confidentialité" de cette page. Entrez votre mot de passe actuel puis le nouveau.' },
  { q: 'Comment contacter le support ?', a: 'Envoyez un email à support@mokineveto.com ou appelez le +237 6 55 00 00 00 du lundi au samedi de 8h à 18h.' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function Parametres() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => { setTab(searchParams.get('tab') || 'profile'); }, [searchParams]);

  const handleTabChange = (t) => {
    setTab(t);
    setSearchParams(t === 'profile' ? {} : { tab: t });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">⚙️ Paramètres</h2>
        <p className="text-sm text-gray-500 mt-1">Gérez votre compte, confidentialité et obtenez de l'aide.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
      {tab === 'privacy' && <PrivacyTab />}
      {tab === 'help' && <HelpTab />}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || 'Cameroun',
    // farmer
    farmName: user?.farmName || '',
    // vet
    licenseNumber: user?.licenseNumber || '',
    specialization: user?.specialization || '',
    isAvailable: user?.isAvailable ?? true,
    // vendor
    businessName: user?.businessName || '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const role = user?.role || 'farmer';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo trop lourde (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = { ...form, avatar };
      const res = await authAPI.updateProfile(payload);
      updateUser(res.data.user);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-green-200" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl font-bold border-4 border-green-200">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-1.5 hover:bg-green-700 transition shadow"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">{user?.name}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-green-600 hover:underline">
            Changer la photo
          </button>
        </div>
      </div>

      {/* Status banner */}
      {status === 'success' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
          <CheckCircleIcon className="h-5 w-5" />
          Profil mis à jour avec succès !
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm">
          <ExclamationCircleIcon className="h-5 w-5" />
          Erreur lors de la mise à jour. Veuillez réessayer.
        </div>
      )}

      {/* Informations générales */}
      <Section title="Informations générales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom complet *" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Téléphone" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="+237 6..." />
          <Field label="Ville" name="city" value={form.city} onChange={handleChange} placeholder="Ex: Douala" />
          <Field label="Pays" name="country" value={form.country} onChange={handleChange} placeholder="Ex: Cameroun" />
          <div className="sm:col-span-2">
            <Field label="Adresse" name="address" value={form.address} onChange={handleChange} placeholder="Quartier, rue..." />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez-vous en quelques mots..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>
        </div>
      </Section>

      {/* Role-specific */}
      {role === 'farmer' && (
        <Section title="Mon élevage">
          <Field label="Nom de l'exploitation" name="farmName" value={form.farmName} onChange={handleChange} placeholder="Ex: Ferme du Nord" />
        </Section>
      )}
      {role === 'veterinarian' && (
        <Section title="Informations professionnelles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Numéro de licence" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="VET-CM-2024-XXX" />
            <Field label="Spécialisation" name="specialization" value={form.specialization} onChange={handleChange} placeholder="Ex: Bovins & Ovins" />
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="isAvailable"
                name="isAvailable"
                type="checkbox"
                checked={form.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label htmlFor="isAvailable" className="text-sm text-gray-700">
                Disponible pour consultations
              </label>
            </div>
          </div>
        </Section>
      )}
      {role === 'vendor' && (
        <Section title="Mon commerce">
          <Field label="Nom du commerce" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Ex: AgroVet Express" />
        </Section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}

// ─── PRIVACY TAB ─────────────────────────────────────────────
function PrivacyTab() {
  const [prefs, setPrefs] = useState({
    notifConsultation: true,
    notifAppointment: true,
    notifAlerts: true,
    notifMarketing: false,
    profileVisible: true,
    shareData: false,
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState(null);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSavePrefs = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePw = (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwStatus('mismatch'); return; }
    if (pwForm.newPw.length < 6) { setPwStatus('short'); return; }
    // API call would go here
    setPwStatus('success');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      {/* Préférences notifications */}
      <Section title="Préférences de notifications">
        <div className="space-y-3">
          <Toggle label="Consultations" desc="Recevoir une notification lors d'une nouvelle consultation ou réponse" checked={prefs.notifConsultation} onChange={() => toggle('notifConsultation')} />
          <Toggle label="Rendez-vous" desc="Rappels avant vos rendez-vous" checked={prefs.notifAppointment} onChange={() => toggle('notifAppointment')} />
          <Toggle label="Alertes sanitaires" desc="Alertes de maladies animales dans votre région" checked={prefs.notifAlerts} onChange={() => toggle('notifAlerts')} />
          <Toggle label="Offres & actualités" desc="Promotions, nouvelles fonctionnalités, newsletter" checked={prefs.notifMarketing} onChange={() => toggle('notifMarketing')} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSavePrefs} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            Enregistrer préférences
          </button>
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Enregistré</span>}
        </div>
      </Section>

      {/* Visibilité du profil */}
      <Section title="Visibilité & données">
        <div className="space-y-3">
          <Toggle label="Profil visible" desc="Les autres utilisateurs de la plateforme peuvent voir votre profil" checked={prefs.profileVisible} onChange={() => toggle('profileVisible')} />
          <Toggle label="Partage de données anonymes" desc="Aider à améliorer la plateforme en partageant des données d'usage anonymisées" checked={prefs.shareData} onChange={() => toggle('shareData')} />
        </div>
      </Section>

      {/* Changer mot de passe */}
      <Section title="Changer le mot de passe">
        <form onSubmit={handleChangePw} className="space-y-4 max-w-sm">
          <Field label="Mot de passe actuel" name="current" value={pwForm.current} onChange={e => setPwForm(p => ({...p, current: e.target.value}))} type="password" placeholder="••••••••" />
          <Field label="Nouveau mot de passe" name="newPw" value={pwForm.newPw} onChange={e => setPwForm(p => ({...p, newPw: e.target.value}))} type="password" placeholder="Min. 6 caractères" />
          <Field label="Confirmer le nouveau mot de passe" name="confirm" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} type="password" placeholder="••••••••" />

          {pwStatus === 'mismatch' && <p className="text-sm text-red-600">Les mots de passe ne correspondent pas.</p>}
          {pwStatus === 'short' && <p className="text-sm text-red-600">Le mot de passe doit faire au moins 6 caractères.</p>}
          {pwStatus === 'success' && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Mot de passe modifié !</p>}

          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition">
            Changer le mot de passe
          </button>
        </form>
      </Section>

      {/* Danger zone */}
      <Section title="Zone de danger">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-red-700 font-medium">Supprimer mon compte</p>
          <p className="text-sm text-red-600">Cette action est irréversible. Toutes vos données seront supprimées définitivement.</p>
          <button className="mt-2 text-sm border border-red-400 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-100 transition" onClick={() => alert('Veuillez contacter le support pour supprimer votre compte.')}>
            Demander la suppression du compte
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── HELP TAB ────────────────────────────────────────────────
function HelpTab() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-6">
      {/* Contact */}
      <Section title="Nous contacter">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ContactCard icon="📧" label="Email" value="support@mokineveto.com" link="mailto:support@mokineveto.com" />
          <ContactCard icon="📞" label="Téléphone" value="+237 6 55 00 00 00" link="tel:+237655000000" />
          <ContactCard icon="💬" label="WhatsApp" value="Chat direct" link="https://wa.me/237655000000" />
        </div>
        <p className="text-xs text-gray-400 mt-2">Disponible Lun – Sam · 8h00 – 18h00 (GMT+1)</p>
      </Section>

      {/* FAQ */}
      <Section title="Questions fréquentes">
        <ul className="space-y-2">
          {FAQ.map((item, i) => (
            <li key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 text-left"
              >
                <span>{item.q}</span>
                <span className="ml-4 text-lg">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-4 pb-4 pt-1 text-sm text-gray-600 bg-gray-50">
                  {item.a}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* Version */}
      <div className="text-center text-xs text-gray-400 pb-4">
        MokineVeto — Version 1.0.0 · © 2026 Mokine Technologies<br />
        <a href="https://mokineveto.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">CGU</a>
        {' · '}
        <a href="https://mokineveto.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Politique de confidentialité</a>
      </div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function ContactCard({ icon, label, value, link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition text-center"
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-semibold">{value}</p>
    </a>
  );
}

