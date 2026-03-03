import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { region: "Adamaoua", "Fièvre aphteuse": 10, "Parasites": 7, "Brucellose": 5, "Blessures": 3 },
  { region: "Extrême-nord", "Fièvre aphteuse": 8, "Parasites": 6, "Brucellose": 4, "Blessures": 2 },
  { region: "Nord", "Fièvre aphteuse": 6, "Parasites": 4, "Brucellose": 2, "Blessures": 1 },
  { region: "Ouest", "Fièvre aphteuse": 3, "Parasites": 2, "Brucellose": 1, "Blessures": 1 },
];

export default function ChartBar() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h2 className="mb-2 font-semibold">Analyse : maladies les plus fréquentes</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Fièvre aphteuse" fill="#2563eb" />
          <Bar dataKey="Parasites" fill="#dc2626" />
          <Bar dataKey="Brucellose" fill="#16a34a" />
          <Bar dataKey="Blessures" fill="#facc15" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
