import React, { useState, useEffect, useRef } from 'react';

const LANG_CODES = { fr: 'fr-FR', ff: 'fr-FR', ha: 'ha', wo: 'fr-SN' };

export function VoiceButton({ text, lang = 'fr', size = 'md', className = '' }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  const speak = (e) => {
    e.stopPropagation();
    if (!supported || !text) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_CODES[lang] || 'fr-FR';
    utt.rate = 0.85;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  if (!supported) return null;

  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

  return (
    <button
      onClick={speak}
      title={speaking ? 'Arrêter' : 'Écouter'}
      aria-label={speaking ? 'Arrêter la lecture' : 'Lire à voix haute'}
      className={`inline-flex items-center justify-center rounded-full transition-all ${sizes[size]} ${speaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-700 hover:bg-green-200'} ${className}`}
    >
      {speaking ? '⏹' : '🔊'}
    </button>
  );
}

// PictogramButton — bouton avec icône large pour peu alphabétisés
export function PictogramButton({ icon, label, onClick, color = 'green', size = 'lg', className = '' }) {
  const colors = {
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    gray: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  };
  const sizes = { sm: 'p-2 text-xl min-w-[48px]', md: 'p-3 text-3xl min-w-[64px]', lg: 'p-4 text-4xl min-w-[80px]' };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl font-semibold shadow-md active:scale-95 transition-transform ${colors[color]} ${sizes[size]} ${className}`}
    >
      <span role="img" aria-label={label}>{icon}</span>
      {label && <span className="text-xs font-medium leading-tight text-center" style={{ fontSize: size === 'lg' ? 11 : 10 }}>{label}</span>}
    </button>
  );
}

// PictogramGrid — grille de boutons pictogrammes
export function PictogramGrid({ items, columns = 3, onSelect }) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item) => (
        <PictogramButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          color={item.color || 'green'}
          size="lg"
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  );
}

// SpeechInputButton — bouton micro pour saisie vocale (ASR)
export function SpeechInputButton({ onResult, lang = 'fr', placeholder = 'Parlez...', className = '' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = LANG_CODES[lang] || 'fr-FR';

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (onResult) onResult(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;

    return () => { try { rec.abort(); } catch (_) {} };
  }, [lang, onResult]);

  const toggle = (e) => {
    e.stopPropagation();
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.abort();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      title={listening ? 'Arrêter' : placeholder}
      aria-label={listening ? 'Arrêter la saisie vocale' : 'Saisie vocale'}
      className={`inline-flex items-center justify-center rounded-full w-9 h-9 transition-all ${listening ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} ${className}`}
    >
      {listening ? '⏹' : '🎙️'}
    </button>
  );
}

export default VoiceButton;
