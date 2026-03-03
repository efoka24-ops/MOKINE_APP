export default function Parametres() {
  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold">⚙️ Paramètres du compte</h2>

      <form className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="block text-sm font-semibold">Nom</label>
          <input type="text" defaultValue="Dr Nasser" className="w-full border rounded p-2 mt-1" />
        </div>

        <div>
          <label className="block text-sm font-semibold">Email</label>
          <input type="email" defaultValue="nasser@example.com" className="w-full border rounded p-2 mt-1" />
        </div>

        <div>
          <label className="block text-sm font-semibold">Spécialité</label>
          <select className="w-full border rounded p-2 mt-1">
            <option>Médecine des bovins</option>
            <option>Parasitologie</option>
            <option>Chirurgie vétérinaire</option>
          </select>
        </div>

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Sauvegarder
        </button>
      </form>
    </div>
  );
}
