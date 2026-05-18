import db from '../db/index.js';

/**
 * MarketProductController - Gestion du catalogue de produits vétérinaires
 * Vaccins, médicaments, équipements avec catégories et stock
 */

// GET /api/market/products — liste des produits
export const getProducts = async (req, res) => {
  try {
    const { category, search, fournisseur, inStock } = req.query;
    
    let products = await (db.market_products || { find: async () => [] }).find?.() || [];

    // Filtrer par catégorie
    if (category) {
      products = products.filter(p => p.category === category);
    }

    // Filtrer par recherche
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Filtrer par fournisseur
    if (fournisseur) {
      products = products.filter(p => p.fournisseurId === fournisseur);
    }

    // Filtrer par stock
    if (inStock === 'true') {
      products = products.filter(p => p.stock > 0);
    }

    // Ajouter évaluations
    products = products.map(p => ({
      ...p,
      rating: p.reviews?.length > 0 
        ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
        : null,
      reviewCount: p.reviews?.length || 0,
    }));

    res.json({ products, total: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const products = db.market_products || {};
    const product = await products.findOne?.(p => p.id === id);

    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    // Ajouter détails
    const fournisseur = await (db.market_fournisseurs || {}).findOne?.(f => f.id === product.fournisseurId);
    const reviews = product.reviews || [];
    
    res.json({
      ...product,
      fournisseur,
      rating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null,
      reviews,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/market/products — créer produit (fournisseur ou admin)
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, sku, price, stock, images, specifications } = req.body;
    
    if (!name || !category || !price || !sku) {
      return res.status(400).json({ error: 'Champs requis: name, category, price, sku' });
    }

    // Vérifier que c'est un fournisseur approuvé
    const fournisseurs = db.market_fournisseurs || {};
    const fournisseur = await fournisseurs.findOne?.(f => f.userId === req.user.id && f.status === 'approved');
    
    if (!fournisseur && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous devez être un fournisseur approuvé' });
    }

    const product = await (db.market_products || { insert: async (d) => ({ ...d, id: `prod_${Date.now()}` }) }).insert?.({
      id: `prod_${Date.now()}`,
      name,
      description: description || '',
      category, // vaccins, medicaments, equipements, fournitures, autres
      sku,
      price,
      stock: stock || 0,
      images: images || [],
      specifications: specifications || {},
      fournisseurId: fournisseur?.id,
      fournisseurName: fournisseur?.name,
      reviews: [],
      rating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) || { id: `prod_${Date.now()}` };

    res.status(201).json({ message: 'Produit créé', product });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/products/:id — mettre à jour produit
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, images, specifications } = req.body;

    const products = db.market_products || {};
    const product = await products.findOne?.(p => p.id === id);

    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    // Vérifier propriété
    if (product.fournisseurId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updated = {
      ...product,
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      images: images || product.images,
      specifications: specifications || product.specifications,
      updatedAt: new Date().toISOString(),
    };

    if (products.updateOne) {
      await products.updateOne({ id }, updated);
    }

    res.json({ message: 'Produit mis à jour', product: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/market/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const products = db.market_products || {};
    const product = await products.findOne?.(p => p.id === id);

    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    if (product.fournisseurId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (products.deleteOne) {
      await products.deleteOne({ id });
    }

    res.json({ message: 'Produit supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/categories — catégories disponibles
export const getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'vaccins', label: '💉 Vaccins', icon: '💉' },
      { id: 'medicaments', label: '💊 Médicaments', icon: '💊' },
      { id: 'equipements', label: '🔧 Équipements', icon: '🔧' },
      { id: 'fournitures', label: '📦 Fournitures', icon: '📦' },
      { id: 'aliments', label: '🌾 Aliments Spécialisés', icon: '🌾' },
      { id: 'autres', label: '🛒 Autres', icon: '🛒' },
    ];
    res.json({ categories });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/market/products/:id/review — ajouter avis
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating doit être entre 1 et 5' });
    }

    const products = db.market_products || {};
    const product = await products.findOne?.(p => p.id === id);

    if (!product) return res.status(404).json({ error: 'Produit introuvable' });

    const review = {
      userId: req.user.id,
      userName: req.user.name,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    product.reviews = product.reviews || [];
    product.reviews.push(review);

    if (products.updateOne) {
      await products.updateOne({ id }, product);
    }

    res.status(201).json({ message: 'Avis ajouté', review });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
