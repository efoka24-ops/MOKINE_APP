import React from "react";
import logo from '../assets/logo.png'

export default function Footer() {
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
          <h5 className="font-semibold">Liens</h5>
          <ul className="mt-3 text-sm space-y-2">
            <li><a href="#about" className="hover:text-green-300 transition">À propos</a></li>
            <li><a href="#solution" className="hover:text-green-300 transition">Fonctionnalités</a></li>
            <li><a href="#faq" className="hover:text-green-300 transition">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Nos produits</h5>
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

        <div>
          <h5 className="font-semibold">Contact</h5>
          <p className="mt-3 text-sm">mokine@gmail.com</p>
          <p className="text-sm">+237 655 62 41 68</p>
        </div>
      </div>

      <div className="border-t border-white/20 text-center py-4 text-sm">© {new Date().getFullYear()} Mokine. Tous droits réservés.</div>
    </footer>
  );
}
