import db from '../db/index.js';

/**
 * MarketOrderController - Gestion des commandes du marketplace
 * Commande, suivi, paiement, livraison
 */

// GET /api/market/orders — mes commandes
export const getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    let orders = await db.market_orders.all?.() || [];

    if (req.user.role === 'admin') {
      // admin sees all marketplace orders
    } else if (req.user.role === 'vendor') {
      // vendor sees orders containing their own products
      const vendorProducts = await db.market_products.filter?.(p => p.fournisseurId === req.user.id) || [];
      const vendorProductIds = vendorProducts.map(p => p.id);
      orders = orders.filter(o => (o.items || []).some(item => vendorProductIds.includes(item.productId)));
    } else {
      // buyer sees only own orders
      orders = orders.filter(o => o.buyerId === req.user.id);
    }

    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    orders = orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/orders/:id — détail commande
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = db.market_orders || {};
    const order = await orders.findOne?.(o => o.id === id);

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    // Vérifier propriété
    if (order.buyerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Enrichir avec détails produits
    const enriched = {
      ...order,
      items: await Promise.all((order.items || []).map(async (item) => {
        const products = db.market_products || {};
        const product = await products.findOne?.(p => p.id === item.productId);
        return { ...item, product };
      })),
    };

    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/market/orders — créer commande
export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items requis (minimum 1)' });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'deliveryAddress requis' });
    }

    // Calculer total
    const products = db.market_products || {};
    let totalPrice = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await products.findOne?.(p => p.id === item.productId);
      if (!product) {
        return res.status(404).json({ error: `Produit ${item.productId} introuvable` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour ${product.name}` });
      }
      enrichedItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      });
      totalPrice += product.price * item.quantity;
    }

    const order = await db.market_orders.insert({
      id: `order_${Date.now()}`,
      buyerId: req.user.id,
      buyerName: req.user.name,
      buyerPhone: req.user.phone,
      items: enrichedItems,
      totalPrice,
      status: 'pending', // pending, paid, processing, shipped, delivered, cancelled
      paymentMethod: paymentMethod || 'mobile_money',
      paymentStatus: 'unpaid', // unpaid, paid, refunded
      deliveryAddress,
      deliveryStatus: 'not_shipped',
      trackingNumber: null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Commande créée', order });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/orders/:id/payment — marquer comme payée
export const completePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentRef } = req.body;

    const orders = db.market_orders || {};
    const order = await orders.findOne?.(o => o.id === id);

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const updated = {
      ...order,
      paymentStatus: 'paid',
      status: 'paid',
      transactionId: transactionId || '',
      paymentRef: paymentRef || '',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.market_orders.update(id, updated);

    res.json({ message: 'Paiement complété', order: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/orders/:id/shipping — mettre à jour livraison
export const updateShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, status, estimatedDelivery } = req.body;

    const orders = db.market_orders || {};
    const order = await orders.findOne?.(o => o.id === id);

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (req.user.role !== 'admin' && order.fournisseurId !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updated = {
      ...order,
      trackingNumber: trackingNumber || order.trackingNumber,
      deliveryStatus: status || order.deliveryStatus,
      estimatedDelivery: estimatedDelivery || order.estimatedDelivery,
      updatedAt: new Date().toISOString(),
    };

    await db.market_orders.update(id, updated);

    res.json({ message: 'Livraison mise à jour', order: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/orders/stats — statistiques commandes (admin/fournisseur)
export const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await db.market_orders.all?.() || [];

    // Pour fournisseur: filtrer ses produits
    // Pour admin: tous
    let filtered = orders;
    if (req.user.role === 'vendor') {
      const products = await db.market_products.all?.() || [];
      const vendorProducts = products.filter(p => p.fournisseurId === userId);
      const vendorProductIds = vendorProducts.map(p => p.id);
      filtered = orders.filter(o =>
        o.items?.some(item => vendorProductIds.includes(item.productId))
      );
    }

    const stats = {
      total: filtered.length,
      totalRevenue: filtered.reduce((sum, o) => sum + (o.status === 'paid' ? o.totalPrice : 0), 0),
      pending: filtered.filter(o => o.status === 'pending').length,
      paid: filtered.filter(o => o.paymentStatus === 'paid').length,
      shipped: filtered.filter(o => o.deliveryStatus === 'shipped').length,
      delivered: filtered.filter(o => o.deliveryStatus === 'delivered').length,
    };

    res.json(stats);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/orders/:id/cancel — annuler commande
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const orders = db.market_orders || {};
    const order = await orders.findOne?.(o => o.id === id);

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    if (['paid', 'shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Commande ne peut pas être annulée' });
    }

    const updated = {
      ...order,
      status: 'cancelled',
      cancellationReason: reason || '',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.market_orders.update(id, updated);

    res.json({ message: 'Commande annulée', order: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
