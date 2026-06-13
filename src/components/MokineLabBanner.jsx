import React from "react";
import { ChevronRight, FlaskConical, Microscope, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function MokineLabBanner() {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative py-12 px-6 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border-t-4 border-purple-500"
    >
      <div className="absolute top-0 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20" />
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-20" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <Zap size={16} />
            NOUVEAU — MokineLab, le labo IA vétérinaire
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              MokineLab
              <span className="block text-purple-600 text-2xl">
                Laboratoire IA · Diagnostic · Dataset · API
              </span>
            </h2>

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Rejoignez la communauté scientifique Mokine : contribuez au dataset Tebe,
              créez vos propres modèles IA vétérinaires, et accédez à l'API de diagnostic
              pour vos applications.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <Microscope className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>Chercheurs &amp; Vétérinaires</strong> — Scan Tebe IA, questionnaire symptômes, contribution dataset
                </span>
              </div>
              <div className="flex items-start gap-3">
                <FlaskConical className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>Développeurs</strong> — Créez et entraînez vos modèles IA, accédez au dataset et à l'API
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">
                  <strong>API publique</strong> — Intégrez le diagnostic Tebe dans vos propres applications
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/mokinelab/register")}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Rejoindre MokineLab
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => navigate("/mokinelab")}
                className="inline-flex items-center gap-2 border border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                En savoir plus
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="flex flex-col gap-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center"
                >
                  <Microscope size={64} className="text-purple-600" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center ml-16"
                >
                  <FlaskConical size={64} className="text-violet-500" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="bg-white rounded-full p-6 shadow-lg w-32 h-32 flex items-center justify-center"
                >
                  <Zap size={64} className="text-indigo-500" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-purple-200 grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">847</div>
            <p className="text-sm text-gray-600">Images dataset</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">7</div>
            <p className="text-sm text-gray-600">Pathologies détectées</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">v0.3</div>
            <p className="text-sm text-gray-600">Modèle Tebe actuel</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
