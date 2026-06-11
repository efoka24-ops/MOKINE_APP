import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createCashout, verifyTransaction, getAccountBalance, verifyWebhookSignature } from '../services/camooPaymentService.js';
import { sendPaymentReceiptEmail, sendPaymentInitiatedEmail } from '../services/emailService.js';
import db from '../db/index.js';

const router = express.Router();

// POST /api/payment/camoo/cashout
router.post('/cashout', verifyToken, async (req, res) => {
  try {
    const { amount, phone_number, plan, external_reference, shopping_cart_details } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number requis' });
    if (!amount)       return res.status(400).json({ error: 'amount requis' });

    const backendUrl      = process.env.BACKEND_URL  || `http://localhost:${process.env.PORT || 5000}`;
    const vendorRef       = external_reference || `MOKINE-${(plan || 'sub').toUpperCase()}-${Date.now()}`;
    const notificationUrl = `${backendUrl}/api/payment/camoo/webhook`;

    const result = await createCashout({
      amount: Number(amount),
      phone_number,
      notification_url: notificationUrl,
      external_reference: vendorRef,
      shopping_cart_details: shopping_cart_details || {
        description: `Abonnement Mokine ${plan || ''}`,
        langKey: 'fr',
      },
    });

    const camooId = result?.cashOut?.id;
    const network = result?.cashOut?.network || '';

    // Persist a pending payment so the webhook can activate the subscription
    await db.payments.insert({
      id: vendorRef,
      camooId: camooId || null,
      userId: req.user.id,
      plan: plan || null,
      amount: Number(amount),
      phone: phone_number,
      network,
      external_reference: vendorRef,
      status: 'pending',
      paymentMethod: 'camoo',
      currency: 'XAF',
      createdAt: new Date().toISOString(),
    });

    // Send "payment initiated" email (non-blocking)
    const user = await db.users.findById(req.user.id).catch(() => null);
    if (user?.email) {
      sendPaymentInitiatedEmail({
        to: user.email,
        userName: user.name || user.email,
        amount: Number(amount),
        currency: 'XAF',
        phone: phone_number,
        planName: plan || null,
        externalRef: vendorRef,
      }).catch(err => console.error('[Email] Initiation paiement:', err.message));
    }

    res.status(201).json({ ...result, external_reference: vendorRef });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/payment/camoo/verify?id=xxx
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id requis' });
    const result = await verifyTransaction(id);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/payment/camoo/account  (admin only)
router.get('/account', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux admins' });
    const result = await getAccountBalance();
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/payment/camoo/webhook  (notification Camoo — pas d'auth JWT)
router.get('/webhook', async (req, res) => {
  try {
    console.log('[Camoo Webhook]', req.query);

    // En développement sans secret configuré, on accepte quand même (pour les tests)
    const isDev = process.env.NODE_ENV !== 'production';
    const hasSecret = !!process.env.CAMOO_WEBHOOK_SECRET;

    if (hasSecret && !verifyWebhookSignature(req.query)) {
      console.warn('[Camoo Webhook] Signature invalide');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    if (!hasSecret && !isDev) {
      console.warn('[Camoo Webhook] CAMOO_WEBHOOK_SECRET non configuré en production');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    const { id, status, external_reference } = req.query;

    // Look up by Camoo transaction id first, then by external_reference
    let records = id ? await db.payments.filter(p => p.camooId === id) : [];
    if (!records.length && external_reference) {
      records = await db.payments.filter(p => p.external_reference === external_reference);
    }
    const payment = records[0];
    if (!payment) return res.json({ received: true });

    const txStatus = (status || '').toLowerCase();

    if (txStatus === 'success' && payment.status !== 'completed') {
      const completedAt = new Date().toISOString();
      await db.payments.update(payment.id, {
        ...payment,
        camooId: id || payment.camooId,
        status: 'completed',
        completedAt,
      });

      let planName = null;
      if (payment.userId && payment.plan && payment.plan !== 'gratuit') {
        const user = await db.users.findById(payment.userId).catch(() => null);
        if (user) {
          const planRows = await db.subscription_plans.filter(p => p.slug === payment.plan);
          const planRow = planRows[0];
          planName = planRow?.name || payment.plan;
          const days = planRow?.periodDays || 30;
          const expiry = new Date(Date.now() + days * 86400000).toISOString();
          await db.users.update(payment.userId, {
            ...user,
            subscriptionPlan: payment.plan,
            subscriptionExpiry: expiry,
          });
          console.log(`[Camoo] Abonnement "${payment.plan}" activé pour user ${payment.userId}`);

          // Envoyer le reçu email (non-blocking)
          if (user.email) {
            sendPaymentReceiptEmail({
              to: user.email,
              userName: user.name || user.email,
              amount: payment.amount,
              currency: payment.currency || 'XAF',
              network: payment.network || '',
              transactionId: id || payment.camooId,
              externalRef: payment.external_reference,
              paymentId: payment.id,
              planName,
              completedAt,
            }).catch(err => console.error('[Email] Reçu paiement:', err.message));
          }
        }
      }
    } else if (['failed', 'timeout', 'expired', 'reversed'].includes(txStatus)) {
      await db.payments.update(payment.id, {
        ...payment,
        status: 'failed',
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[Camoo Webhook Error]', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
