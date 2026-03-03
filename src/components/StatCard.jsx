export default function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl shadow-sm ${color} flex flex-col items-center`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <p className="text-gray-600">{title}</p>
    </div>
  );
}
