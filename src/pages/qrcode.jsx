import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { animals as animalsAPI } from "../API";
import { useAuth } from "../context/AuthContext";

export default function QRCodeGenerator() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    animalsAPI.getAll()
      .then(res => {
        const list = res.data || [];
        setAnimals(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const qrValue = selected
    ? JSON.stringify({
        id: selected.id,
        name: selected.name,
        species: selected.species,
        breed: selected.breed,
        ownerId: user?.id,
        ownerName: user?.name,
        platform: 'MokineVeto',
        url: `${window.location.origin}/animals/${selected.id}`,
      })
    : `${window.location.origin}`;

  const handleDownload = () => {
    const canvas = document.getElementById('mokine-qr');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr_${selected?.name || 'animal'}_${selected?.id || ''}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">🔲 QR Code Animal</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Générez un QR code unique pour chaque animal de votre cheptel.
        </p>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Chargement du cheptel…</div>
        ) : animals.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Aucun animal enregistré.</p>
            <a href="/animals/add" className="text-green-600 text-sm hover:underline mt-2 block">+ Ajouter un animal</a>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un animal</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={selected?.id || ''}
                onChange={e => setSelected(animals.find(a => a.id === e.target.value) || null)}
              >
                {animals.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.species}{a.breed ? ` (${a.breed})` : ''}</option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="mb-4 bg-green-50 rounded-xl p-3 text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Nom :</span> {selected.name}</p>
                <p><span className="font-medium">Espèce :</span> {selected.species}</p>
                {selected.breed && <p><span className="font-medium">Race :</span> {selected.breed}</p>}
                {selected.age && <p><span className="font-medium">Âge :</span> {selected.age} {selected.age > 1 ? 'ans' : 'an'}</p>}
              </div>
            )}

            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2 border-green-200 rounded-xl shadow-sm">
                <QRCodeCanvas
                  id="mokine-qr"
                  value={qrValue}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#1B4332"
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Télécharger le QR code (PNG)
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Scannez ce QR pour accéder à la fiche de {selected?.name}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
