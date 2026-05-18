import React, { useState, useCallback, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Star, Plus, Package } from 'lucide-react';
import { marketProducts } from '../API';

/**
 * ProductCatalog - Catalogue de produits vétérinaires
 * Vaccins, médicaments, équipements avec filtres et recherche
 */
export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterInStock, setFilterInStock] = useState(false);
  const [cart, setCart] = useState([]);

  // Charger catégories et produits
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          marketProducts.getCategories(),
          marketProducts.getAll({
            category: selectedCategory,
            search,
            inStock: filterInStock ? 'true' : undefined,
          }),
        ]);
        setCategories(catRes.data.categories || []);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, selectedCategory, filterInStock]);

  const handleAddToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
  };

  const handleRemoveFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package size={28} className="text-green-600" />
          Catalogue Produits
        </h2>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
          <ShoppingCart size={20} className="text-green-600" />
          <span className="font-bold text-gray-900">{cart.length}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher produits, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Catégories */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Filter size={16} /> Catégorie
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === ''
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre stock */}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filterInStock}
            onChange={(e) => setFilterInStock(e.target.checked)}
            className="rounded border-gray-300"
          />
          En stock uniquement
        </label>
      </div>

      {/* Grille produits */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
              {/* Image */}
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover bg-gray-100"
                />
              )}

              {/* Contenu */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{product.category}</p>
                  <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                </div>

                {/* Avis */}
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">({product.reviewCount})</span>
                  </div>
                )}

                {/* Fournisseur */}
                <p className="text-xs text-gray-500">Par {product.fournisseurName}</p>

                {/* Prix et stock */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-green-600">{product.price.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-gray-600">
                      {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panier */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-bold mb-2">Panier ({cart.length})</h4>
          <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
            {cart.map(item => (
              <div key={item.cartId} className="flex justify-between items-start text-sm">
                <span className="flex-1">{item.name}</span>
                <button
                  onClick={() => handleRemoveFromCart(item.cartId)}
                  className="text-red-300 hover:text-red-100 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button className="w-full px-4 py-2 bg-white text-green-600 rounded font-bold hover:bg-gray-100 transition">
            Procéder au paiement
          </button>
        </div>
      )}
    </div>
  );
}
