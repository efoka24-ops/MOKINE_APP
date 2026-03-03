import StatCard from "../components/StatCard";
import ChartLine from "../components/ChartLine";
import ChartBar from "../components/ChartBar";
import AppointmentTable from "../components/AppointmentTable";
import ProductCard from "../components/ProductCard";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Animaux suivis" value="178" icon="🐮" color="bg-orange-100" />
        <StatCard title="Cas urgent" value="50" icon="⚠️" color="bg-red-100" />
        <StatCard title="En traitement" value="40" icon="😊" color="bg-yellow-100" />
        <StatCard title="Rendez-vous du jour" value="05" icon="📅" color="bg-purple-100" />
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartLine />
        <ChartBar />
      </div>

      {/* Tableau + Produits */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AppointmentTable />
        <div className="space-y-4">
          <ProductCard name="Vermifuge" price="20.000 F CFA" />
          <ProductCard name="Vermifuge" price="15.000 F CFA" />
        </div>
      </div>
    </div>
  );
}
