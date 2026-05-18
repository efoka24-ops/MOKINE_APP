import crypto from 'crypto';

// Read credentials lazily (at call time) so dotenv.config() has already run
const getBase    = () => process.env.CAMOO_BASE_URL || 'https://api.camoo.cm/v1/payment';
const getKey     = () => process.env.CAMOO_API_KEY;
const getSecret  = () => process.env.CAMOO_API_SECRET;
const getWebhookSecret = () => process.env.CAMOO_WEBHOOK_SECRET;

const assertCredentials = () => {
  if (!getKey() || !getSecret()) {
    throw Object.assign(
      new Error('CAMOO_API_KEY / CAMOO_API_SECRET non configurés. Vérifiez votre .env.'),
      { status: 503, code: 'CAMOO_NOT_CONFIGURED' }
    );
  }
};

const camooHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key':    getKey(),
  'X-Api-Secret': getSecret(),
});

// ─── Initiate payment collection (cashout request to customer phone) ──────────
export async function initiateCashout({ amount, phone_number, external_reference, notification_url, cartDetails }) {
  assertCredentials();
  const body = {
    amount,
    phone_number,
    currency: 'XAF',
    notification_url,
    external_reference,
    shopping_cart_details: cartDetails || {},
  };

  const res = await fetch(`${getBase()}/cashout`, {
    method: 'POST',
    headers: camooHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Camoo cashout failed'), { status: res.status, body: err });
  }

  return res.json();
}

// ─── Verify transaction status ────────────────────────────────────────────────
export async function verifyTransaction(id) {
  assertCredentials();
  const res = await fetch(`${getBase()}/verify?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: camooHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Camoo verify failed'), { status: res.status, body: err });
  }

  return res.json();
}

// ─── Verify webhook HMAC-SHA256 signature ────────────────────────────────────
export function verifyWebhookSignature(queryParams, receivedSig) {
  const secret = getWebhookSecret();
  if (!secret) return false;
  const payload = Object.keys(queryParams)
    .filter(k => k !== 'sig')
    .sort()
    .map(k => `${k}=${queryParams[k]}`)
    .join('&');

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(receivedSig, 'hex'));
  } catch {
    return false; // length mismatch — invalid sig
  }
}

// ─── Get account balance ──────────────────────────────────────────────────────
export async function getAccountBalance() {
  assertCredentials();
  const res = await fetch(`${getBase()}/account`, {
    method: 'GET',
    headers: camooHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Camoo account failed'), { status: res.status, body: err });
  }

  return res.json(); // { code, message, account: { balance, currency, date } }
}

// ─── Plan config ──────────────────────────────────────────────────────────────
export const PLAN_CONFIG = {
  starter: { price: 15000, label: 'Starter',    days: 30,  dailyLimit: 10000,  rateLimit: 100 },
  pro:     { price: 45000, label: 'Pro',         days: 30,  dailyLimit: 100000, rateLimit: 500 },
};

// ─── Generate Mokine API key pair ─────────────────────────────────────────────
export function generateApiKeys() {
  return {
    apiKey:  'mk_live_' + crypto.randomBytes(24).toString('hex'),
    testKey: 'mk_test_' + crypto.randomBytes(16).toString('hex'),
  };
}
