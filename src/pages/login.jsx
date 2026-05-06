// src/pages/LoginPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; // Assurez-vous que le chemin est correct
import loginImage from '../assets/images/veterinaire.png'; // Image pour le fond PC

export default function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Logique de connexion ici
    console.log('Tentative de connexion...');
  };

  const navigate= useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-4xl">
        {/* Partie gauche avec l'image (visible uniquement sur les grands écrans) */}
        <div 
          className="hidden md:block md:w-1/2 bg-center"
          style={{ backgroundImage: `url(${loginImage})` }}
        >
          {/* Vous pouvez ajouter un overlay ou du contenu ici si nécessaire */}
          <div className="flex items-center justify-center h-full bg-black bg-opacity-30 p-6">
            <h2 className="text-white text-3xl font-extrabold text-center">
              Connectez-vous à votre espace Mokine
            </h2>
          </div>
        </div>

        {/* Partie droite avec le formulaire de connexion */}
        <div className="w-full md:w-1/2 p-4 sm:p-10 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Mokine Logo" className="w-44 h-16 object-cover" style={{aspectRatio: '1080 / 423'}} />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte pour gérer vos animaux.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#178A3B] focus:border-[#178A3B] sm:text-sm"
                placeholder="Adresse email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#178A3B] focus:border-[#178A3B] sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#178A3B] focus:ring-[#178A3B] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 text-xs">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-xs">
                <Link to="/forgot-password" className="font-medium text-[#178A3B] hover:text-[#136B2F]">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <button
              onClick={()=>navigate('/dashboard')}
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#178A3B] hover:bg-[#136B2F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#178A3B]"
              >
                Se connecter
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Retour a{' '}
              <Link to="/" className="font-medium text-[#178A3B] hover:text-[#136B2F]">
                l'Accueil
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}