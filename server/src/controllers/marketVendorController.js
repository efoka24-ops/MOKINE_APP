import db from '../db/index.js';

/**
 * MarketVendorController - Gestion des fournisseurs/vendeurs
 * Enregistrement, profil, KYC, statistiques
 */

// GET /api/market/vendors — liste des fournisseurs approuvés
export const getVendors = async (req, res) => {
  try {
    const { search, category } = req.query;

    let vendors = await (db.market_fournisseurs || { find: async () => [] }).find?.() || [];
    vendors = vendors.filter(v => v.status === 'approved');

    if (search) {
      const q = search.toLowerCase();
      vendors = vendors.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      vendors = vendors.filter(v => v.categories?.includes(category));
    }

    res.json({ vendors, total: vendors.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/vendors/:id
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === id);

    if (!vendor) return res.status(404).json({ error: 'Fournisseur introuvable' });

    // Récupérer les produits du fournisseur
    const products = await (db.market_products || { find: async () => [] }).find?.() || [];
    const vendorProducts = products.filter(p => p.fournisseurId === id);

    res.json({
      ...vendor,
      productsCount: vendorProducts.length,
      products: vendorProducts.slice(0, 10), // Top 10 produits
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/market/vendors/register — enregistrement fournisseur
export const registerVendor = async (req, res) => {
  try {
    const { name, description, phone, address, categories, businessType } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'name, phone, address requis' });
    }

    // Vérifier non-duplication
    const vendors = db.market_fournisseurs || {};
    const existing = await vendors.findOne?.(v => v.userId === req.user.id);
    if (existing) return res.status(400).json({ error: 'Vous êtes déjà enregistré comme fournisseur' });

    const vendor = await (db.market_fournisseurs || { insert: async (d) => ({ ...d, id: `vendor_${Date.now()}` }) }).insert?.({
      id: `vendor_${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      name,
      description: description || '',
      phone,
      address,
      businessType: businessType || 'individual', // individual, company, cooperative
      categories: categories || [],
      status: 'pending', // pending, approved, rejected
      rating: null,
      reviewCount: 0,
      productsCount: 0,
      verified: false,
      kycStatus: 'pending',
      kycData: null,
      documents: [],
      createdAt: new Date().toISOString(),
      approvedAt: null,
    }) || { id: `vendor_${Date.now()}` };

    res.status(201).json({ message: 'Candidature soumise', vendor });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/vendors/my-profile — mon profil fournisseur
export const getMyVendorProfile = async (req, res) => {
  try {
    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.userId === req.user.id);

    if (!vendor) return res.status(404).json({ error: 'Profil fournisseur non trouvé' });

    // Récupérer les produits et commandes
    const products = await (db.market_products || { find: async () => [] }).find?.() || [];
    const orders = await (db.market_orders || { find: async () => [] }).find?.() || [];

    const vendorProducts = products.filter(p => p.fournisseurId === vendor.id);
    const vendorOrders = orders.filter(o =>
      o.items?.some(item => vendorProducts.map(p => p.id).includes(item.productId))
    );

    const stats = {
      productsCount: vendorProducts.length,
      ordersCount: vendorOrders.length,
      totalRevenue: vendorOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalPrice, 0),
      rating: vendor.rating || 0,
      reviewCount: vendor.reviewCount || 0,
    };

    res.json({ ...vendor, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/vendors/:id — mettre à jour profil
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, phone, address, categories, bankInfo } = req.body;

    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === id);

    if (!vendor) return res.status(404).json({ error: 'Fournisseur introuvable' });
    if (vendor.userId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const updated = {
      ...vendor,
      description: description || vendor.description,
      phone: phone || vendor.phone,
      address: address || vendor.address,
      categories: categories || vendor.categories,
      bankInfo: bankInfo || vendor.bankInfo,
      updatedAt: new Date().toISOString(),
    };

    if (vendors.updateOne) {
      await vendors.updateOne({ id }, updated);
    }

    res.json({ message: 'Profil mis à jour', vendor: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/vendors/pending — fournisseurs en attente (admin)
export const getPendingVendors = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const vendors = await (db.market_fournisseurs || { find: async () => [] }).find?.() || [];
    const pending = vendors.filter(v => v.status === 'pending');

    res.json({ vendors: pending, total: pending.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/vendors/:id/approve — approuver fournisseur (admin)
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === id);

    if (!vendor) return res.status(404).json({ error: 'Fournisseur introuvable' });

    const updated = {
      ...vendor,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    };

    if (vendors.updateOne) {
      await vendors.updateOne({ id }, updated);
    }

    res.json({ message: 'Fournisseur approuvé', vendor: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/vendors/:id/reject — rejeter fournisseur (admin)
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === id);

    if (!vendor) return res.status(404).json({ error: 'Fournisseur introuvable' });

    const updated = {
      ...vendor,
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
    };

    if (vendors.updateOne) {
      await vendors.updateOne({ id }, updated);
    }

    res.json({ message: 'Fournisseur rejeté', vendor: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
