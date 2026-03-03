import produit from "../assets/dashboard.jpg";

export default function ProductCard({ name, price }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
      <img src={produit} alt={name} className="w-16 h-16 rounded-md" />
      <div>
        <h3 className="font-semibold">{name}</h3>
        <div className="text-yellow-500">★★★★★</div>
        <p className="text-gray-600">{price}</p>
      </div>
    </div>
  );
}
