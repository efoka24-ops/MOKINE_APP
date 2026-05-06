import React from "react";
import logo from '../assets/logo.png'

export default function Footer() {
  return (
    <footer className="bg-[#0f5f33] text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-6">
       
         <div className="relative -top-4">
          <img src={logo} className="w-40 h-12" style={{aspectRatio: '1080 / 423', objectFit: 'cover'}} alt="Mokine" />
        </div>

        <div>
          <h4 className="font-bold text-xl">Mokine</h4>
          <p className="mt-2 text-sm">Connectez vos bovins. Surveillez leur santé. Optimisez votre élevage.</p>
        </div>

        <div>
          <h5 className="font-semibold">Liens</h5>
          <ul className="mt-3 text-sm space-y-2">
            <li>À propos</li>
            <li>Fonctionnalités</li>
            <li>FAQ</li>
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
