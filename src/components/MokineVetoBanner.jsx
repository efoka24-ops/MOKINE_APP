import React from "react";
import { ChevronRight, Zap, Brain, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * MokineVetoBanner - Ligne d'accessibilité pour présenter MokineVeto
 * Placement: Après Hero Section dans App.js
 * Targets: Farmers + Veterinarians (generic)
 */

export default function MokineVetoBanner() {
  const navigate = useNavigate();

  const handleExplore = () => {
    // Route vers page MokineVeto dédiée (sera créée)
    navigate("/mokineveto");
    // Ou window.location.href = "https://mokineveto.com" si externe
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative py-12 px-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-t-4 border-green-500"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-10 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <Zap size={16} />
            NOUVEAU - MokineVeto est arrivé!
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Text content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              MokineVeto
              <span className="block text-green-600 text-2xl">
                Télémédecine vétérinaire + IA diagnostique
              </span>
            </h2>

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Consultez des vétérinaires expertes 24/7, obtenez un diagnostic IA basé sur 
              les symptômes, et accédez à une marketplace de produits vétérinaires - tout 
              depuis votre téléphone.
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <Brain className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>IA Diagnostic</strong> - Analyse rapide basée sur symptômes
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>Consultation Vétérinaire</strong> - Chat vidéo avec vrais vétérinaires
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>Marketplace</strong> - Médicaments, équipements, produits vétérinaires
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleExplore}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Découvrez MokineVeto
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Right side - Visual/Icon showcase */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              {/* Animated icons in circles */}
              <div className="flex flex-col gap-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center"
                >
                  <Brain size={64} className="text-green-600" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center ml-16"
                >
                  <Heart size={64} className="text-red-500" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center"
                >
                  <Zap size={64} className="text-yellow-500" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats/links */}
        <div className="mt-12 pt-8 border-t border-green-200 grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">500+</div>
            <p className="text-sm text-gray-600">Éleveurs connectés</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">50+</div>
            <p className="text-sm text-gray-600">Vétérinaires experts</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
            <p className="text-sm text-gray-600">Disponibilité consultations</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
