import React, { createContext, useContext, useState, useCallback } from 'react';
import fr from './translations/fr.js';
import ff from './translations/ff.js';
import ha from './translations/ha.js';
import wo from './translations/wo.js';
import en from './translations/en.js';
import ar from './translations/ar.js';

const TRANSLATIONS = { fr, ff, ha, wo, en, ar };

export const LANGUAGES = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷', nativeName: 'Français', rtl: false },
  { code: 'ff', label: 'Fulfuldé',  flag: '🌍',  nativeName: 'Fulfulde', rtl: false },
  { code: 'ha', label: 'Haoussa',   flag: '🌍',  nativeName: 'Hausa',    rtl: false },
  { code: 'wo', label: 'Wolof',     flag: '🌍',  nativeName: 'Wolof',    rtl: false },
  { code: 'en', label: 'Anglais',   flag: '🇬🇧', nativeName: 'English',  rtl: false },
  { code: 'ar', label: 'Arabe',     flag: '🌙',  nativeName: 'العربية',  rtl: true  },
];

const I18nContext = createContext(null);

// Deep get with dot notation: t('animals.cattle') → 'Bovin'
const deepGet = (obj, path) => {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = current[part];
  }
  return current;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('mokine_lang');
    return saved && TRANSLATIONS[saved] ? saved : 'fr';
  });

  const changeLang = useCallback((newLang) => {
    if (TRANSLATIONS[newLang]) {
      setLang(newLang);
      localStorage.setItem('mokine_lang', newLang);
      const isRtl = LANGUAGES.find(l => l.code === newLang)?.rtl;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }
  }, []);

  // t('animals.cattle') → translation string
  // t('offline.pending_actions', { count: 3 }) → 'Actions en attente: 3'
  const t = useCallback((key, vars) => {
    const translations = TRANSLATIONS[lang] || TRANSLATIONS.fr;
    let text = deepGet(translations, key);
    if (text == null) {
      // Fallback to French
      text = deepGet(TRANSLATIONS.fr, key);
    }
    if (text == null) return key;
    if (vars && typeof text === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, v);
      });
    }
    return text || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, changeLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export default I18nProvider;
