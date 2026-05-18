import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: '📚' },
  { id: 'sante', label: 'Santé animale', icon: '🏥' },
  { id: 'elevage', label: 'Bonnes pratiques', icon: '🌾' },
  { id: 'prevention', label: 'Prévention', icon: '🛡️' },
  { id: 'nutrition', label: 'Nutrition', icon: '🌿' },
  { id: 'iot', label: 'Technologie', icon: '📡' },
];

const COURSES = [
  {
    id: 1, category: 'sante', level: 'débutant', duration: '12 min',
    title: 'Reconnaître les signes de maladie chez les bovins',
    description: 'Apprenez à identifier les symptômes courants comme la fièvre aphteuse, la pasteurellose et la brucellose.',
    instructor: 'Dr. Amara Diallo', views: 1240, completed: false,
    lessons: [
      { title: 'Introduction aux maladies bovines', duration: '3 min' },
      { title: 'Signes visuels d\'alerte', duration: '4 min' },
      { title: 'Que faire en cas de doute ?', duration: '5 min' },
    ],
    icon: '🐄',
  },
  {
    id: 2, category: 'prevention', level: 'débutant', duration: '8 min',
    title: 'Programme de vaccination pour les petits ruminants',
    description: 'Guide complet sur les vaccins obligatoires et recommandés pour ovins et caprins en Afrique centrale.',
    instructor: 'Dr. Fatima Coulibaly', views: 890, completed: true,
    lessons: [
      { title: 'Pourquoi vacciner ?', duration: '2 min' },
      { title: 'Calendrier vaccinal', duration: '3 min' },
      { title: 'Conservation et administration', duration: '3 min' },
    ],
    icon: '🐑',
  },
  {
    id: 3, category: 'nutrition', level: 'intermédiaire', duration: '20 min',
    title: 'Alimentation équilibrée du troupeau en saison sèche',
    description: 'Stratégies pour maintenir la productivité de votre troupeau pendant les périodes de sécheresse.',
    instructor: 'Prof. Ibrahim Maïga', views: 2100, completed: false,
    lessons: [
      { title: 'Besoins nutritionnels de base', duration: '5 min' },
      { title: 'Compléments alimentaires locaux', duration: '8 min' },
      { title: 'Gestion des pâturages', duration: '7 min' },
    ],
    icon: '🌿',
  },
  {
    id: 4, category: 'iot', level: 'débutant', duration: '15 min',
    title: 'Utiliser le collier connecté Mokine',
    description: 'Tutoriel complet pour installer, configurer et interpréter les données du collier IoT Mokine.',
    instructor: 'Équipe Mokine', views: 3400, completed: false,
    lessons: [
      { title: 'Installation du collier', duration: '4 min' },
      { title: 'Configuration de l\'application', duration: '5 min' },
      { title: 'Interpréter les alertes', duration: '6 min' },
    ],
    icon: '📡',
  },
  {
    id: 5, category: 'elevage', level: 'avancé', duration: '30 min',
    title: 'Gestion sanitaire d\'un élevage bovin de 100+ têtes',
    description: 'Organisation, suivi, traçabilité et prévention des épizooties à grande échelle.',
    instructor: 'Dr. Oumar Sy', views: 760, completed: false,
    lessons: [
      { title: 'Organisation du troupeau', duration: '8 min' },
      { title: 'Registre sanitaire digital', duration: '10 min' },
      { title: 'Plan de biosécurité', duration: '12 min' },
    ],
    icon: '📋',
  },
  {
    id: 6, category: 'sante', level: 'intermédiaire', duration: '18 min',
    title: 'Premiers secours vétérinaires sur le terrain',
    description: 'Gestes d\'urgence pour stabiliser un animal blessé ou malade en attendant le vétérinaire.',
    instructor: 'Dr. Aïssatou Bah', views: 1800, completed: false,
    lessons: [
      { title: 'Évaluer l\'état de l\'animal', duration: '5 min' },
      { title: 'Pansements et immobilisation', duration: '7 min' },
      { title: 'Administration de médicaments', duration: '6 min' },
    ],
    icon: '🚑',
  },
];

const LEVEL_COLORS = {
  'débutant': 'bg-green-100 text-green-700',
  'intermédiaire': 'bg-yellow-100 text-yellow-700',
  'avancé': 'bg-red-100 text-red-700',
};

const STORAGE_KEY = 'mokine_training_completed';

export default function VideoTraining() {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);

  // Load completed course IDs from localStorage
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return COURSES.filter(c => c.completed).map(c => c.id);
    }
  });

  // Persist completedIds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
  }, [completedIds]);

  const filtered = COURSES.filter(c => category === 'all' || c.category === category);

  const markComplete = (courseId) => {
    setCompletedIds(prev => prev.includes(courseId) ? prev : [...prev, courseId]);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎓 Formation Mokine</h1>
            <p className="text-green-200 text-sm mt-1">Renforcez vos compétences en élevage et santé animale</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completedIds.length}/{COURSES.length}</div>
            <div className="text-green-200 text-xs">cours complétés</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full">
          <div
            className="h-2 bg-white rounded-full transition-all"
            style={{ width: `${(completedIds.length / COURSES.length) * 100}%` }}
          />
        </div>
      </div>

      {!selectedCourse ? (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === c.id ? 'bg-[#178A3B] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(course => {
              const isCompleted = completedIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  onClick={() => { setSelectedCourse(course); setActiveLesson(0); }}
                  className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md transition-all overflow-hidden ${isCompleted ? 'border-green-300' : 'border-gray-200 hover:border-green-400'}`}
                >
                  {/* Thumbnail area */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 h-28 flex items-center justify-center text-5xl relative">
                    {course.icon}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[course.level]}`}>{course.level}</span>
                      <span className="text-xs text-gray-400">⏱️ {course.duration}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{course.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span>👤 {course.instructor}</span>
                      <span>👁️ {course.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Course player */
        <div className="space-y-4">
          <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            ← Retour aux cours
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Video player */}
            <div className="lg:col-span-2 space-y-4">
              {/* Mock video player */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">{selectedCourse.icon}</div>
                  <h3 className="font-semibold text-lg">{selectedCourse.lessons[activeLesson].title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedCourse.lessons[activeLesson].duration}</p>
                </div>
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all backdrop-blur-sm border border-white/30">
                    <span className="text-white text-2xl ml-1">▶</span>
                  </div>
                </div>
              </div>

              {/* Course info */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{selectedCourse.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{selectedCourse.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
                      <span>👤 {selectedCourse.instructor}</span>
                      <span>•</span>
                      <span>⏱️ {selectedCourse.duration}</span>
                      <span>•</span>
                      <span>{selectedCourse.lessons.length} leçons</span>
                      <span>•</span>
                      <span>👁️ {selectedCourse.views.toLocaleString()} vues</span>
                    </div>
                  </div>
                  {!completedIds.includes(selectedCourse.id) && (
                    <button
                      onClick={() => markComplete(selectedCourse.id)}
                      className="bg-green-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-700 whitespace-nowrap flex-shrink-0"
                    >
                      ✓ Marquer terminé
                    </button>
                  )}
                  {completedIds.includes(selectedCourse.id) && (
                    <span className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-xl font-medium">✓ Terminé</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lessons sidebar */}
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 text-sm">Contenu du cours</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCourse.lessons.length} leçons · {selectedCourse.duration}</p>
              </div>
              <div className="divide-y">
                {selectedCourse.lessons.map((lesson, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveLesson(i)}
                    className={`w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeLesson === i ? 'bg-green-50' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${activeLesson === i ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${activeLesson === i ? 'text-green-700' : 'text-gray-800'}`}>{lesson.title}</p>
                      <p className="text-xs text-gray-400">{lesson.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={() => setActiveLesson(Math.min(activeLesson + 1, selectedCourse.lessons.length - 1))}
                  disabled={activeLesson >= selectedCourse.lessons.length - 1}
                  className="w-full bg-[#178A3B] text-white text-sm py-2.5 rounded-xl hover:bg-[#136B2F] disabled:opacity-40 font-medium"
                >
                  Leçon suivante →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
