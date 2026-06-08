import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createCheckoutLink, initiateTransaction, getTransactionStatus, updateWebhook } from '../services/easyTransactService.js';

const router = express.Router();

// POST /api/payment/easytransact/checkout
// Crée un lien de paiement (redirection vers la page de paiement Easy Transact)
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { description, amount, vendor_reference, success_url, cancel_url } = req.body;
    if (!description || !vendor_reference) return res.status(400).json({ error: 'description et vendor_reference requis' });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const result = await createCheckoutLink({
      description,
      vendor_reference,
      amount,
      currency_code: 'XAF',
      service_code: 'DEPOSIT',
      success_url: success_url || `${frontendUrl}/payment/success`,
      cancel_url:  cancel_url  || `${frontendUrl}/payment/cancel`,
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/payment/easytransact/initiate
// Initie une transaction directe (paiement push)
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const result = await initiateTransaction(req.body);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/payment/easytransact/status?vendor_reference=xxx
// Vérifie le statut d'une transaction
router.get('/status', verifyToken, async (req, res) => {
  try {
    const { vendor_reference } = req.query;
    const result = await getTransactionStatus(vendor_reference);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/payment/easytransact/webhook-config  (admin only)
router.post('/webhook-config', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux admins' });
    const result = await updateWebhook(req.body);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/payment/easytransact/webhook  (callback Easy Transact)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('[EasyTransact Webhook]', JSON.stringify(event));
    // TODO: update order/payment status in DB based on event.status
    res.json({ received: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
