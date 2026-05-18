import db from '../db/index.js';

/**
 * KYCController - Gestion KYC (Know Your Customer) pour fournisseurs
 * Documents, vérifications, compliance
 */

// POST /api/market/kyc/submit — soumettre documents KYC
export const submitKYC = async (req, res) => {
  try {
    const { businessLicense, taxId, bankAccount, ownerIdFront, ownerIdBack, proofOfAddress } = req.body;

    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.userId === req.user.id);

    if (!vendor) return res.status(404).json({ error: 'Profil fournisseur non trouvé' });

    const kyc = {
      id: `kyc_${Date.now()}`,
      vendorId: vendor.id,
      status: 'under_review', // under_review, approved, rejected
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      documents: {
        businessLicense: businessLicense || null,
        taxId: taxId || null,
        bankAccount: bankAccount || null,
        ownerIdFront: ownerIdFront || null,
        ownerIdBack: ownerIdBack || null,
        proofOfAddress: proofOfAddress || null,
      },
      verifications: {
        businessLicense: false,
        taxId: false,
        bankAccount: false,
        ownership: false,
        address: false,
      },
      comments: '',
      rejectionReason: null,
    };

    // Sauvegarder KYC
    await (db.market_kyc || { insert: async (d) => d }).insert?.(kyc);

    // Mettre à jour vendor
    const updated = { ...vendor, kycStatus: 'under_review', kycData: kyc };
    if (vendors.updateOne) {
      await vendors.updateOne({ id: vendor.id }, updated);
    }

    res.status(201).json({ message: 'Documents KYC soumis', kyc });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/kyc/status — statut KYC du fournisseur
export const getKYCStatus = async (req, res) => {
  try {
    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.userId === req.user.id);

    if (!vendor) return res.status(404).json({ error: 'Profil fournisseur non trouvé' });

    const kyc = db.market_kyc || {};
    const kycData = await kyc.findOne?.(k => k.vendorId === vendor.id);

    res.json({
      kycStatus: vendor.kycStatus,
      kycData: kycData || null,
      verified: vendor.verified,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/kyc/pending — demandes KYC en attente (admin)
export const getPendingKYC = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const kyc = await (db.market_kyc || { find: async () => [] }).find?.() || [];
    const pending = kyc.filter(k => k.status === 'under_review');

    // Enrichir avec infos vendor
    const enriched = await Promise.all(pending.map(async (k) => {
      const vendors = db.market_fournisseurs || {};
      const vendor = await vendors.findOne?.(v => v.id === k.vendorId);
      return { ...k, vendor };
    }));

    res.json({ kyc: enriched, total: enriched.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/kyc/:kycId/approve — approuver KYC (admin)
export const approveKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { verifications, comments } = req.body;

    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const kyc = db.market_kyc || {};
    const kycData = await kyc.findOne?.(k => k.id === kycId);

    if (!kycData) return res.status(404).json({ error: 'KYC introuvable' });

    const updated = {
      ...kycData,
      status: 'approved',
      verifications: verifications || kycData.verifications,
      comments: comments || kycData.comments,
      reviewedAt: new Date().toISOString(),
    };

    if (kyc.updateOne) {
      await kyc.updateOne({ id: kycId }, updated);
    }

    // Mettre à jour vendor
    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === kycData.vendorId);
    if (vendor) {
      const vendorUpdated = { ...vendor, kycStatus: 'approved', verified: true };
      if (vendors.updateOne) {
        await vendors.updateOne({ id: vendor.id }, vendorUpdated);
      }
    }

    res.json({ message: 'KYC approuvé', kyc: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/market/kyc/:kycId/reject — rejeter KYC (admin)
export const rejectKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { reason, comments } = req.body;

    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const kyc = db.market_kyc || {};
    const kycData = await kyc.findOne?.(k => k.id === kycId);

    if (!kycData) return res.status(404).json({ error: 'KYC introuvable' });

    const updated = {
      ...kycData,
      status: 'rejected',
      rejectionReason: reason || '',
      comments: comments || kycData.comments,
      reviewedAt: new Date().toISOString(),
    };

    if (kyc.updateOne) {
      await kyc.updateOne({ id: kycId }, updated);
    }

    // Mettre à jour vendor
    const vendors = db.market_fournisseurs || {};
    const vendor = await vendors.findOne?.(v => v.id === kycData.vendorId);
    if (vendor) {
      const vendorUpdated = { ...vendor, kycStatus: 'rejected', verified: false };
      if (vendors.updateOne) {
        await vendors.updateOne({ id: vendor.id }, vendorUpdated);
      }
    }

    res.json({ message: 'KYC rejeté', kyc: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/market/kyc/stats — statistiques KYC (admin)
export const getKYCStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Non autorisé' });

    const kyc = await (db.market_kyc || { find: async () => [] }).find?.() || [];

    const stats = {
      total: kyc.length,
      underReview: kyc.filter(k => k.status === 'under_review').length,
      approved: kyc.filter(k => k.status === 'approved').length,
      rejected: kyc.filter(k => k.status === 'rejected').length,
    };

    res.json(stats);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
