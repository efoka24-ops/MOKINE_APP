// src/pages/MarketPlace.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { marketplace as marketplaceAPI } from "../API";

const CATEGORIES = ['Tous', 'vaccine', 'medicine', 'antiparasitic', 'nutrition', 'equipment', 'other'];
const CATEGORY_LABELS = { vaccine: 'Vaccins', medicine: 'Médicaments', antiparasitic: 'Antiparasitaires', nutrition: 'Nutrition', equipment: 'Équipement', other: 'Autres', Tous: 'Tous' };

export default function MarketPlace() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('Tous');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderForm, setOrderForm] = useState({ deliveryAddress: '', paymentMethod: 'mobile_money', phoneNumber: '' });
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'medicine', description: '', price: '', unit: 'flacon', stock: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const params = {};
        if (category !== 'Tous') params.category = category;
        if (search) params.search = search;
        const res = await marketplaceAPI.getProducts(params);
        setProducts(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, search]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, product }];
    });
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));
  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleOrder = async (e) => {
    e.preventDefault();
    setOrdering(true);
    try {
      const res = await marketplaceAPI.createOrder({
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        ...orderForm
      });
      setOrderSuccess(res.data.order);
      setCart([]);
      setShowCart(false);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdering(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await marketplaceAPI.createProduct(newProduct);
      setProducts(prev => [res.data.product, ...prev]);
      setShowVendorForm(false);
      setNewProduct({ name: '', category: 'medicine', description: '', price: '', unit: 'flacon', stock: '' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Marketplace</h2>
        <div className="flex items-center gap-3">
          {user?.role === 'vendor' && (
            <button onClick={() => setShowVendorForm(true)}
              className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg hover:bg-[#136B2F]">
              + Ajouter un produit
            </button>
          )}
          <button onClick={() => setShowCart(!showCart)}
            className="relative px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
            🛒 Panier
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Order success message */}
      {orderSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="font-semibold text-green-700">✅ Commande #{orderSuccess.id.slice(-6)} passée avec succès!</div>
          <p className="text-sm text-green-600 mt-1">Montant: {orderSuccess.totalAmount.toLocaleString()} FCFA — Statut: {orderSuccess.paymentMethod}</p>
          <button onClick={() => setOrderSuccess(null)} className="text-xs text-green-500 mt-1 hover:underline">Fermer</button>
        </div>
      )}

      {/* Vendor add product form */}
      {showVendorForm && (
        <div className="bg-white rounded-xl shadow p-5 border border-green-200">
          <h3 className="font-semibold text-gray-800 mb-4">Ajouter un produit</h3>
          <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-3">
            <input value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} required placeholder="Nom du produit *" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} placeholder="Description" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
            <select value={newProduct.category} onChange={e => setNewProduct(p => ({...p, category: e.target.value}))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CATEGORIES.filter(c => c !== 'Tous').map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <input value={newProduct.unit} onChange={e => setNewProduct(p => ({...p, unit: e.target.value}))} placeholder="Unité (flacon, kg...)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} required placeholder="Prix (FCFA) *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({...p, stock: e.target.value}))} placeholder="Stock disponible" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowVendorForm(false)} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-[#178A3B] text-white text-sm rounded-lg">Publier</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-colors ${category === cat ? 'bg-[#178A3B] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-[#178A3B]'}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      {showCart && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">🛒 Mon Panier</h3>
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Votre panier est vide</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-sm font-medium">{item.productName}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded-full text-sm hover:bg-gray-200">−</button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 bg-gray-100 rounded-full text-sm hover:bg-gray-200">+</button>
                    </div>
                    <div className="text-sm font-medium w-28 text-right">{(item.unitPrice * item.quantity).toLocaleString()} F</div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#178A3B]">{cartTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
              <form onSubmit={handleOrder} className="space-y-3">
                <input value={orderForm.deliveryAddress} onChange={e => setOrderForm(p => ({...p, deliveryAddress: e.target.value}))}
                  placeholder="Adresse de livraison *" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={orderForm.paymentMethod} onChange={e => setOrderForm(p => ({...p, paymentMethod: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="mobile_money">Orange Money</option>
                  <option value="mtn_money">MTN Mobile Money</option>
                  <option value="cash">Paiement à la livraison</option>
                </select>
                {(orderForm.paymentMethod === 'mobile_money' || orderForm.paymentMethod === 'mtn_money') && (
                  <input value={orderForm.phoneNumber} onChange={e => setOrderForm(p => ({...p, phoneNumber: e.target.value}))}
                    placeholder="Numéro Mobile Money *" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                )}
                <button type="submit" disabled={ordering}
                  className="w-full py-3 bg-[#178A3B] text-white font-medium rounded-lg hover:bg-[#136B2F] disabled:opacity-60">
                  {ordering ? 'Commande en cours...' : `Commander — ${cartTotal.toLocaleString()} FCFA`}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Chargement des produits...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📦</div>
          <p>Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-green-100 h-36 flex items-center justify-center">
                <span className="text-5xl">
                  {product.category === 'vaccine' ? '💉' :
                   product.category === 'medicine' ? '💊' :
                   product.category === 'antiparasitic' ? '🔬' :
                   product.category === 'nutrition' ? '🌾' :
                   product.category === 'equipment' ? '🔧' : '📦'}
                </span>
              </div>
              <div className="p-4">
                <div className="text-xs text-[#178A3B] font-medium mb-1">{CATEGORY_LABELS[product.category] || product.category}</div>
                <h3 className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#178A3B]">{product.price.toLocaleString()} F</div>
                    <div className="text-xs text-gray-400">/{product.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Stock: {product.stock}</div>
                    <button onClick={() => addToCart(product)} disabled={product.stock <= 0}
                      className="px-3 py-1.5 bg-[#178A3B] text-white text-xs rounded-lg hover:bg-[#136B2F] disabled:opacity-50 transition-colors">
                      {product.stock > 0 ? '+ Panier' : 'Rupture'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

