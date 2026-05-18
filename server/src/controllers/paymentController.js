import db from '../db/index.js';
import {
  initiateCashout,
  verifyTransaction,
  verifyWebhookSignature,
  generateApiKeys,
  getAccountBalance,
} from '../services/camooService.js';

export const processPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, appointmentId, plan, currency, payorName, phone, country } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    const payment = {
      id: Date.now().toString(),
      userId: req.user.id,
      appointmentId: appointmentId || null,
      amount,
      paymentMethod,
      plan: plan || null,
      currency: currency || 'XAF',
      payorName: payorName || req.user.name || '',
      phone: phone || '',
      country: country || '',
      status: 'completed',
      transactionDate: new Date().toISOString(),
    };

    await db.payments.insert(payment);

    // Update user subscription plan when payment is for a plan
    if (plan && plan !== 'gratuit') {
      const PLAN_DURATIONS = { standard: 30, premium: 90, entreprise: 365 };
      const days = PLAN_DURATIONS[plan] || 30;
      const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await db.users.update(req.user.id, { subscriptionPlan: plan, subscriptionExpiry: expiry });
    }

    res.status(201).json({ message: 'Payment processed successfully', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await db.payments.filter(p => p.userId === req.user.id);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'Payment ID is required' });

    const refund = {
      id: Date.now().toString(),
      paymentId,
      reason: reason || '',
      status: 'completed',
      refundDate: new Date().toISOString(),
    };

    res.status(200).json({ message: 'Refund processed', refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMERCIAL API SUBSCRIPTIONS (Camoo Payment)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payments/commercial/initiate
export const initiateCommercialPayment = async (req, res) => {
  try {
    const { plan, phone, firstName, lastName, email, organization, country, useCase, message } = req.body;

    if (!plan || !phone || !firstName || !email) {
      return res.status(400).json({ error: 'Champs obligatoires manquants : plan, phone, firstName, email.' });
    }

    const plans = await db.api_plans.filter(p => p.slug === plan && p.isActive);
    const planCfg = plans[0];
    if (!planCfg) {
      return res.status(400).json({ error: `Plan "${plan}" introuvable ou inactif.` });
    }

    const amount = process.env.PAYMENT_TEST_AMOUNT
      ? parseInt(process.env.PAYMENT_TEST_AMOUNT, 10)
      : planCfg.price;

    // Normalize phone to E.164 (Camoo requires international format)
    // Handles: "691227149" → "+237691227149", "237691227149" → "+237691227149", "+237691227149" → "+237691227149"
    let normalizedPhone = phone.replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.startsWith('237')) {
        normalizedPhone = `+${normalizedPhone}`;
      } else {
        normalizedPhone = `+237${normalizedPhone}`;
      }
    }

    const subId = Date.now().toString();
    const notifUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/commercial/webhook`;

    let camooResult;
    try {
      camooResult = await initiateCashout({
        amount,
        phone_number: normalizedPhone,
        external_reference: `mokine-api-${plan}-${subId}`,
        notification_url: notifUrl,
        cartDetails: {
          order_id: subId,
          email,
          customerName: `${firstName} ${lastName}`,
          description: `Abonnement API MokineLab ${planCfg.name} — ${planCfg.periodDays} jours`,
          langKey: 'fr',
          items: [{ item_id: `plan-${plan}`, name: `API ${planCfg.name}`, quantity: 1, unit_price: planCfg.price }],
        },
      });
    } catch (camooErr) {
      console.error('[Camoo] cashout error:', camooErr.message, camooErr.body || '');
      const httpStatus = camooErr.code === 'CAMOO_NOT_CONFIGURED' ? 503 : 502;
      const userMsg = camooErr.code === 'CAMOO_NOT_CONFIGURED'
        ? 'Service de paiement non configuré. Contactez l\'administrateur.'
        : `Erreur passerelle Camoo: ${camooErr.message || 'Vérifiez votre numéro et réessayez.'}`;
      return res.status(httpStatus).json({ error: userMsg, detail: camooErr.body || null });
    }

    const camooTxId = camooResult?.cashOut?.id || null;

    const subscription = {
      id: subId,
      plan,
      planLabel: planCfg.name,
      status: 'pending',
      apiKey: null,
      testKey: null,
      email,
      phone,
      firstName,
      lastName,
      organization: organization || '',
      country: country || '',
      useCase: useCase || '',
      notes: message || '',
      camooTransactionId: camooTxId,
      camooStatus: camooResult?.cashOut?.status || 'PENDING',
      amount,
      currency: 'XAF',
      dailyLimit: planCfg.limits?.dailyRequests || 10000,
      rateLimit:  planCfg.limits?.ratePerMinute || 100,
      dailyUsage: 0,
      dailyReset: new Date().toISOString().split('T')[0],
      expiresAt: null,
      activatedAt: null,
      createdAt: new Date().toISOString(),
    };

    await db.api_subscriptions.insert(subscription);

    res.status(201).json({
      message: 'Paiement initié. Approuvez la demande sur votre téléphone.',
      subscriptionId: subId,
      transactionId: camooTxId,
      amount,
      plan: planCfg.name,
      camooStatus: camooResult?.cashOut?.status,
    });
  } catch (err) {
    console.error('[commercial/initiate]', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments/commercial/verify?subscriptionId=xxx
export const verifyCommercialPayment = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId requis.' });
    }

    const sub = await db.api_subscriptions.findById(subscriptionId);
    if (!sub) {
      return res.status(404).json({ error: 'Souscription introuvable.' });
    }

    if (sub.status === 'active') {
      return res.json({ status: 'active', apiKey: sub.apiKey, testKey: sub.testKey, plan: sub.plan, expiresAt: sub.expiresAt });
    }

    if (!sub.camooTransactionId) {
      return res.json({ status: sub.status });
    }

    let camooData;
    try {
      camooData = await verifyTransaction(sub.camooTransactionId);
    } catch (e) {
      return res.json({ status: sub.status, camooStatus: 'unreachable' });
    }

    const camooStatus = (camooData?.verify?.status || '').toLowerCase();

    if (camooStatus === 'success') {
      if (sub.status !== 'active') {
        await activateSubscription(sub);
        const updated = await db.api_subscriptions.findById(subscriptionId);
        return res.json({ status: 'active', apiKey: updated.apiKey, testKey: updated.testKey, plan: updated.plan, expiresAt: updated.expiresAt });
      }
      return res.json({ status: 'active', apiKey: sub.apiKey, testKey: sub.testKey, plan: sub.plan, expiresAt: sub.expiresAt });
    }

    if (['failed', 'rejected', 'cancelled'].includes(camooStatus)) {
      await db.api_subscriptions.update(subscriptionId, { ...sub, status: 'failed', camooStatus });
      return res.json({ status: 'failed', camooStatus });
    }

    return res.json({ status: 'pending', camooStatus });
  } catch (err) {
    console.error('[commercial/verify]', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments/commercial/webhook — Camoo signed notification
export const camooWebhook = async (req, res) => {
  try {
    const { sig, id, status, external_reference } = req.query;

    if (!sig || !id) {
      return res.status(400).json({ error: 'Signature ou id manquant.' });
    }

    const isValid = verifyWebhookSignature(req.query, sig);
    if (!isValid) {
      console.warn('[Camoo webhook] Invalid signature');
      return res.status(401).json({ error: 'Signature invalide.' });
    }

    const camooStatus = (status || '').toLowerCase();
    const ref = external_reference || '';
    const subId = ref.replace(/^mokine-api-[a-z]+-/, '');

    let sub = await db.api_subscriptions.findById(subId).catch(() => null);
    if (!sub) {
      const allSubs = await db.api_subscriptions.filter(s => s.camooTransactionId === id);
      sub = allSubs[0] || null;
    }

    if (sub && camooStatus === 'success' && sub.status !== 'active') {
      await activateSubscription(sub);
    } else if (sub && ['failed', 'rejected', 'cancelled'].includes(camooStatus)) {
      await db.api_subscriptions.update(sub.id, { ...sub, status: 'failed', camooStatus });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[camooWebhook]', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments/commercial/dashboard — nécessite clé API valide
export const getCommercialDashboard = async (req, res) => {
  try {
    const sub = req.apiSubscription;
    const planCfg = PLAN_CONFIG[sub.plan] || {};

    const today = new Date().toISOString().split('T')[0];
    const dailyUsage = sub.dailyReset === today ? sub.dailyUsage : 0;

    const daysLeft = sub.expiresAt
      ? Math.max(0, Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000))
      : 0;

    res.json({
      plan:       sub.plan,
      planLabel:  sub.planLabel,
      status:     sub.status,
      email:      sub.email,
      organization: sub.organization,
      apiKey:     sub.apiKey,
      testKey:    sub.testKey,
      isTestMode: req.isTestMode,
      expiresAt:  sub.expiresAt,
      daysLeft,
      usage: {
        today:      dailyUsage,
        dailyLimit: sub.dailyLimit,
        remaining:  sub.dailyLimit - dailyUsage,
        rateLimit:  sub.rateLimit,
      },
      endpoints: getEndpointsForPlan(sub.plan),
      createdAt: sub.createdAt,
      activatedAt: sub.activatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments/commercial/balance — admin only: Camoo account balance
export const getCamooBalance = async (req, res) => {
  try {
    const data = await getAccountBalance();
    res.json(data); // { code, message, account: { balance, currency, date } }
  } catch (err) {
    const httpStatus = err.code === 'CAMOO_NOT_CONFIGURED' ? 503 : (err.status || 502);
    const message = err.code === 'CAMOO_NOT_CONFIGURED'
      ? 'Camoo non configuré. Ajoutez CAMOO_API_KEY et CAMOO_API_SECRET dans .env.'
      : `Erreur Camoo: ${err.message}`;
    res.status(httpStatus).json({ error: message });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function activateSubscription(sub) {
  const { apiKey, testKey } = generateApiKeys();
  const plans = await db.api_plans.filter(p => p.slug === sub.plan);
  const planCfg = plans[0];
  const days = planCfg?.periodDays || 30;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  await db.api_subscriptions.update(sub.id, {
    ...sub,
    status: 'active',
    apiKey,
    testKey,
    expiresAt,
    activatedAt: new Date().toISOString(),
    camooStatus: 'success',
  });
}

function getEndpointsForPlan(plan) {
  const base = [
    'GET  /tebe/stats',
    'GET  /tebe/conditions',
    'POST /tebe/analyze-image',
    'POST /tebe/analyze-video',
    'POST /tebe/contribute',
    'GET  /tebe/history',
  ];
  if (plan === 'pro') {
    return [...base, 'POST /tebe/batch-analyze', 'GET  /tebe/analytics', 'POST /tebe/webhook/register'];
  }
  return base;
}

