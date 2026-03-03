export default function Navbar() {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-500">{today}</span>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
          <span className="text-sm">Dr Nasser</span>
        </div>
      </div>
    </header>
  );
}
