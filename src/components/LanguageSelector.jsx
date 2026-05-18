import React, { useState } from 'react';
import { useI18n, LANGUAGES } from '../i18n/index.js';

export default function LanguageSelector({ compact = false }) {
  const { lang, changeLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium transition"
      >
        <span>{current.flag}</span>
        {!compact && <span>{current.nativeName}</span>}
        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { changeLang(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-green-50 transition ${lang === l.code ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'}`}
              >
                <span className="text-lg">{l.flag}</span>
                <div className="text-left">
                  <div>{l.nativeName}</div>
                  <div className="text-xs text-gray-400">{l.label}</div>
                </div>
                {lang === l.code && <span className="ml-auto text-green-600">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
