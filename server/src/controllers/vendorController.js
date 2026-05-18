// Vendor Dashboard — KYC, tracking, stats, multi-point, Mobile Money
import db from '../db/index.js';
import { pushNotification } from './notificationController.js';

// ─── KYC Validation ───────────────────────────────────────────────
export const submitKYC = async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Réservé aux vendeurs' });
    const { businessName, businessType, registrationNumber, taxId, address, phone, bankAccount, documents } = req.body;
    if (!businessName || !registrationNumber) {
      return res.status(400).json({ error: 'Nom commercial et numéro d\'enregistrement requis' });
    }
    const existing = await db.kyc.findOne(k => k.vendorId === req.user.id);
    if (existing && existing.status === 'approved') {
      return res.status(409).json({ error: 'KYC déjà approuvé' });
    }
    const kyc = {
      id: existing ? existing.id : Date.now().toString(),
      vendorId: req.user.id,
      businessName, businessType: businessType || 'agrovet',
      registrationNumber, taxId: taxId || '',
      address: address || '',
      phone: phone || '',
      bankAccount: bankAccount || '',
      documents: documents || [],
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    if (existing) {
      await db.kyc.update(existing.id, kyc);
    } else {
      await db.kyc.insert(kyc);
    }
    res.status(201).json({ message: 'Dossier KYC soumis. Validation sous 24-48h.', kyc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getKYCStatus = async (req, res) => {
  try {
    const kyc = await db.kyc.findOne(k => k.vendorId === req.user.id);
    if (!kyc) return res.status(200).json({ status: 'not_submitted', message: 'KYC non soumis' });
    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveKYC = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
    const kyc = await db.kyc.findById(req.params.id);
    if (!kyc) return res.status(404).json({ error: 'KYC non trouvé' });
    const newStatus = req.body.action === 'approve' ? 'approved' : 'rejected';
    const updated = await db.kyc.update(req.params.id, { status: newStatus, reviewedAt: new Date().toISOString(), reviewNote: req.body.note || '' });
    await db.users.update(kyc.vendorId, { kycStatus: newStatus });
    pushNotification(kyc.vendorId, {
      type: 'kyc',
      title: newStatus === 'approved' ? 'KYC Approuvé ✓' : 'KYC Refusé',
      message: newStatus === 'approved'
        ? 'Votre vérification d\'identité a été approuvée. Vous pouvez maintenant vendre.'
        : `Votre KYC a été refusé: ${req.body.note || ''}`,
      link: '/profil/kyc'
    });
    res.status(200).json({ message: `KYC ${newStatus}`, kyc: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Vendor Dashboard Stats ───────────────────────────────────────
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendorProducts = await db.products.filter(p => p.vendorId === vendorId);
    const productIds = new Set(vendorProducts.map(p => p.id));
    const allOrders = await db.orders.all();
    const vendorOrders = allOrders.filter(o => o.items.some(i => productIds.has(i.productId)));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);

    const paid = vendorOrders.filter(o => o.paymentStatus === 'paid');
    const todayOrders = vendorOrders.filter(o => new Date(o.createdAt) >= today);
    const monthOrders = vendorOrders.filter(o => new Date(o.createdAt) >= thisMonth);
    const totalRevenue = paid.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const monthRevenue = paid.filter(o => new Date(o.paidAt || o.createdAt) >= thisMonth).reduce((s, o) => s + (o.totalAmount || 0), 0);
    const todayRevenue = paid.filter(o => new Date(o.paidAt || o.createdAt) >= today).reduce((s, o) => s + (o.totalAmount || 0), 0);
    const lowStockProducts = vendorProducts.filter(p => p.stock < 5 && p.isActive);
    const pendingOrders = vendorOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    const kyc = await db.kyc.findOne(k => k.vendorId === vendorId);

    res.status(200).json({
      stats: {
        totalProducts: vendorProducts.length, activeProducts: vendorProducts.filter(p => p.isActive).length,
        totalOrders: vendorOrders.length, pendingOrders: pendingOrders.length,
        todayOrders: todayOrders.length, monthOrders: monthOrders.length,
        totalRevenue, monthRevenue, todayRevenue, lowStockAlerts: lowStockProducts.length,
      },
      pendingOrders: pendingOrders.slice(0, 10), lowStockProducts,
      recentOrders: vendorOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      kycStatus: kyc?.status || 'not_submitted',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Delivery Tracking ────────────────────────────────────────────
const DELIVERY_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'in_transit', 'delivered'];

export const updateDeliveryStatus = async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    const vendorProducts = (await db.products.filter(p => p.vendorId === req.user.id)).map(p => p.id);
    const ownsProduct = order.items.some(i => vendorProducts.includes(i.productId));
    if (!ownsProduct && req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé pour cette commande' });

    const { status, trackingNote, estimatedDelivery, trackingNumber } = req.body;
    if (!DELIVERY_STATUSES.includes(status)) return res.status(400).json({ error: `Statut invalide. Valeurs: ${DELIVERY_STATUSES.join(', ')}` });

    const patch = {
      status,
      tracking: [...(order.tracking || []), { status, note: trackingNote || '', timestamp: new Date().toISOString(), updatedBy: req.user.id }],
    };
    if (estimatedDelivery) patch.estimatedDelivery = estimatedDelivery;
    if (trackingNumber) patch.trackingNumber = trackingNumber;
    const updated = await db.orders.update(req.params.id, patch);

    const statusLabels = { confirmed: 'confirmée', preparing: 'en préparation', ready: 'prête', dispatched: 'expédiée', in_transit: 'en transit', delivered: 'livrée' };
    if (statusLabels[status]) {
      pushNotification(order.buyerId, {
        type: 'order', title: `Commande ${statusLabels[status]}`,
        message: `Votre commande #${order.id.slice(-6)} est ${statusLabels[status]}${trackingNote ? ': ' + trackingNote : ''}`,
        link: `/marketplace/orders/${order.id}`
      });
    }
    res.status(200).json({ message: 'Statut mis à jour', order: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDeliveryTracking = async (req, res) => {
  try {
    const order = await db.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.status(200).json({ orderId: order.id, status: order.status, trackingNumber: order.trackingNumber || null, estimatedDelivery: order.estimatedDelivery || null, tracking: order.tracking || [], items: order.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Mobile Money Integration ─────────────────────────────────────
const MM_PROVIDERS = {
  orange_money: { name: 'Orange Money', prefix: 'OM', fee: 0.015 },
  mtn_momo: { name: 'MTN Mobile Money', prefix: 'MTN', fee: 0.01 },
  moov_money: { name: 'Moov Money', prefix: 'MOOV', fee: 0.012 }
};

// In-memory transaction store (payments are also in db.payments)
let paymentTransactions = [];

export const initiateMobileMoneyPayment = async (req, res) => {
  try {
    const { orderId, provider, phoneNumber, amount } = req.body;
    if (!orderId || !provider || !phoneNumber) return res.status(400).json({ error: 'orderId, provider et phoneNumber requis' });
    const mmProvider = MM_PROVIDERS[provider];
    if (!mmProvider) return res.status(400).json({ error: `Provider invalide. Options: ${Object.keys(MM_PROVIDERS).join(', ')}` });
    const order = await db.orders.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const paymentAmount = amount || order.totalAmount;
    const fee = Math.round(paymentAmount * mmProvider.fee);
    const ref = `${mmProvider.prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const transaction = {
      id: Date.now().toString(),
      ref, orderId, buyerId: order.buyerId,
      provider, providerName: mmProvider.name,
      phoneNumber, amount: paymentAmount, fee,
      netAmount: paymentAmount - fee, currency: 'XAF',
      status: 'initiated',
      initiatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    paymentTransactions.push(transaction);
    await db.orders.update(orderId, { paymentStatus: 'awaiting_confirmation', paymentRef: ref, paymentProvider: provider });
    res.status(200).json({
      message: `Paiement ${mmProvider.name} initié. Confirmez sur votre téléphone.`,
      transaction: { ref, provider: mmProvider.name, amount: paymentAmount, fee, expiresAt: transaction.expiresAt },
      confirmUrl: `/api/vendor/payment/${transaction.id}/webhook`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmMobileMoneyWebhook = async (req, res) => {
  try {
    const transaction = paymentTransactions.find(t => t.id === req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction non trouvée' });
    if (new Date() > new Date(transaction.expiresAt)) {
      transaction.status = 'expired';
      return res.status(410).json({ error: 'Paiement expiré' });
    }
    transaction.status = 'success';
    transaction.confirmedAt = new Date().toISOString();
    const order = await db.orders.findById(transaction.orderId);
    if (order) {
      await db.orders.update(transaction.orderId, { paymentStatus: 'paid', status: 'confirmed', paidAt: new Date().toISOString() });
      pushNotification(order.buyerId, {
        type: 'payment', title: 'Paiement confirmé ✓',
        message: `Paiement de ${transaction.amount.toLocaleString()} XAF via ${transaction.providerName} confirmé`,
        link: `/marketplace/orders/${order.id}`
      });
    }
    res.status(200).json({ message: 'Paiement confirmé', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Multi-Point de Vente ─────────────────────────────────────────
export const createSalesPoint = async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Réservé aux vendeurs' });
    const { name, address, phone, gpsLat, gpsLng, openingHours } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'Nom et adresse requis' });
    const point = {
      id: Date.now().toString(),
      vendorId: req.user.id,
      name, address, phone: phone || '',
      gps: gpsLat && gpsLng ? { lat: parseFloat(gpsLat), lng: parseFloat(gpsLng) } : null,
      openingHours: openingHours || 'Lun-Ven 8h-18h',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await db.sales_points.insert(point);
    res.status(201).json({ message: 'Point de vente créé', point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSalesPoints = async (req, res) => {
  try {
    const points = await db.sales_points.filter(p => p.vendorId === req.user.id);
    res.status(200).json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
