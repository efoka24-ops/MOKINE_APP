import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createCheckoutLink, initiateTransaction, getTransactionStatus, updateWebhook } from '../services/easyTransactService.js';
import db from '../db/index.js';

const router = express.Router();

// POST /api/payment/easytransact/checkout
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { description, amount, vendor_reference, success_url, cancel_url, plan } = req.body;
    if (!description || !vendor_reference) {
      return res.status(400).json({ error: 'description et vendor_reference requis' });
    }

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

    // Persist a pending payment record so the webhook can activate the subscription
    await db.payments.insert({
      id: vendor_reference,
      userId: req.user.id,
      plan: plan || null,
      amount: amount || null,
      vendor_reference,
      description,
      status: 'pending',
      paymentMethod: 'easy_transact',
      currency: 'XAF',
      createdAt: new Date().toISOString(),
    });

    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/payment/easytransact/initiate
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const result = await initiateTransaction(req.body);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/payment/easytransact/status?vendor_reference=xxx
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

// POST /api/payment/easytransact/webhook  (callback Easy Transact — pas d'auth JWT)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('[EasyTransact Webhook]', JSON.stringify(event));

    const { vendor_reference, status } = event;
    if (!vendor_reference) return res.json({ received: true });

    // Find the pending payment record
    const records = await db.payments.filter(p => p.vendor_reference === vendor_reference);
    const payment = records[0];
    if (!payment) return res.json({ received: true });

    const txStatus = (status || '').toUpperCase();

    if (txStatus === 'SUCCESS' && payment.status !== 'completed') {
      // Mark payment as completed
      await db.payments.update(payment.id, {
        ...payment,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Activate user subscription
      if (payment.userId && payment.plan && payment.plan !== 'gratuit') {
        const user = await db.users.findById(payment.userId).catch(() => null);
        if (user) {
          const planRows = await db.subscription_plans.filter(p => p.slug === payment.plan);
          const days = planRows[0]?.periodDays || 30;
          const expiry = new Date(Date.now() + days * 86400000).toISOString();
          await db.users.update(payment.userId, {
            ...user,
            subscriptionPlan: payment.plan,
            subscriptionExpiry: expiry,
          });
          console.log(`[EasyTransact] Abonnement "${payment.plan}" activé pour user ${payment.userId}`);
        }
      }
    } else if (['FAILED', 'TIMEOUT', 'EXPIRED', 'REVERSED'].includes(txStatus)) {
      await db.payments.update(payment.id, {
        ...payment,
        status: 'failed',
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[EasyTransact Webhook Error]', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
