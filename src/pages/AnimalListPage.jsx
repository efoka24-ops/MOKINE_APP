import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { animals as animalsAPI } from '../API';

const TYPE_ICON = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷',
  poultry: '🐓', horse: '🐴', fish: '🐟',
};
const TYPE_LABEL = {
  cattle: 'Bovin', goat: 'Caprin', sheep: 'Ovin', pig: 'Porcin',
  poultry: 'Volaille', horse: 'Équin', fish: 'Poisson',
};
const STATUS = {
  healthy: { label: 'Sain',        cls: 'bg-green-100 text-green-700' },
  sick:    { label: 'Malade',      cls: 'bg-red-100 text-red-700' },
  treatment:{ label:'En traitement',cls: 'bg-yellow-100 text-yellow-700' },
};

export default function AnimalListPage() {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    animalsAPI.getAll()
      .then(r => setAnimals(r.data || []))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  }, []);

  const types = ['all', ...new Set(animals.map(a => a.type))];

  const filtered = animals.filter(a => {
    const matchType = filterType === 'all' || a.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q || (a.name || '').toLowerCase().includes(q)
      || (a.breed || '').toLowerCase().includes(q)
      || (a.collarId || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Cheptel</h1>
          <p className="text-sm text-gray-500 mt-0.5">{animals.length} animal{animals.length !== 1 ? 'aux' : ''} enregistré{animals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/animals/add')}
          className="bg-[#178A3B] hover:bg-[#136B2F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Ajouter un animal
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, race, collier…"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
        />
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-[#178A3B] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Tous' : (TYPE_ICON[t] || '') + ' ' + (TYPE_LABEL[t] || t)}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-gray-500 font-medium">Aucun animal trouvé</p>
          {animals.length === 0 && (
            <button
              onClick={() => navigate('/animals/add')}
              className="mt-4 bg-[#178A3B] text-white text-sm px-5 py-2.5 rounded-xl"
            >
              Ajouter mon premier animal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => {
            const st = STATUS[a.status] || STATUS.healthy;
            return (
              <div
                key={a.id}
                onClick={() => navigate(`/animals/${a.id}`)}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#178A3B] hover:shadow-md cursor-pointer transition-all"
              >
                {/* Icône + Nom + Statut */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{TYPE_ICON[a.type] || '🐾'}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-base leading-tight">
                        {a.name || <span className="italic text-gray-400">Sans nom</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {TYPE_LABEL[a.type] || a.type}{a.breed ? ` — ${a.breed}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                {/* Infos secondaires */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    {a.collarId ? (
                      <>
                        <span>🏷️</span>
                        <span className="font-mono font-medium text-gray-700">{a.collarId}</span>
                        {a.collarStatus === 'pending' && (
                          <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full">En attente</span>
                        )}
                        {a.collarStatus === 'active' && (
                          <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full">Actif</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300 italic">Pas de collier</span>
                    )}
                  </div>
                  {a.weight && <span>{a.weight} kg</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
