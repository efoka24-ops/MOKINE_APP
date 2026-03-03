import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Semaine 1", satisfaction: 2 },
  { name: "Semaine 2", satisfaction: 3 },
  { name: "Semaine 3", satisfaction: 2 },
  { name: "Semaine 4", satisfaction: 4 },
];

export default function ChartLine() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h2 className="mb-2 font-semibold">Performance satisfaction du mois</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="satisfaction" stroke="#16a34a" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
