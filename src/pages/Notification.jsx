const notifications = [
  { id: 1, msg: "Un nouveau cas urgent signalé à Maroua", date: "24/09/2025", statut: "Non lu" },
  { id: 2, msg: "Rappel : rendez-vous avec Aboubakar demain", date: "23/09/2025", statut: "Lu" },
  { id: 3, msg: "Stock faible : Vermifuge Bovins", date: "22/09/2025", statut: "Non lu" },
];

export default function Notification() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🔔 Notifications</h2>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-lg shadow flex justify-between items-center ${
              n.statut === "Non lu" ? "bg-green-50 border-l-4 border-green-500" : "bg-white"
            }`}
          >
            <div>
              <p>{n.msg}</p>
              <span className="text-sm text-gray-500">{n.date}</span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded ${
                n.statut === "Non lu" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"
              }`}
            >
              {n.statut}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
