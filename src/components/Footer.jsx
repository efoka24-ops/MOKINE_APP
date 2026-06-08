import React from "react";
import logo from '../assets/logo.png';
import { useI18n } from '../i18n/index.js';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-[#0f5f33] text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="relative -top-4">
          <img src={logo} className="h-14 w-auto object-contain" alt="MokineVet" />
        </div>

        <div>
          <h4 className="font-bold text-xl">Mokine</h4>
          <p className="mt-2 text-sm">Connectez vos bovins. Surveillez leur santé. Optimisez votre élevage.</p>
        </div>

        <div>
          <h5 className="font-semibold">{t('home.footer.links')}</h5>
          <ul className="mt-3 text-sm space-y-2">
            <li><a href="#about" className="hover:text-green-300 transition">{t('home.footer.about_link')}</a></li>
            <li><a href="#solution" className="hover:text-green-300 transition">{t('home.footer.features_link')}</a></li>
            <li><a href="#faq" className="hover:text-green-300 transition">{t('home.footer.faq_link')}</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">{t('home.footer.products')}</h5>
          <ul className="mt-3 text-sm space-y-2">
            <li>
              <a href="/mokineveto" className="hover:text-green-300 transition flex items-center gap-1.5">
                🩺 <span>MokineVeto</span>
              </a>
            </li>
            <li>
              <a href="/mokinelab" className="hover:text-purple-300 transition flex items-center gap-1.5">
                🧬 <span>MokineLab</span>
                <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-medium">IA</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="border-t border-white/20 text-center py-4 text-sm">
        © {new Date().getFullYear()} Mokine. {t('home.footer.rights')}
      </div>
    </footer>
  );
}
