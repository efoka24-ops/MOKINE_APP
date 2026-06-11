/**
 * Camoo Payment API — Cashout / Verify / Account
 * Docs: https://api.camoo.cm/v1/payment
 * Auth: X-Api-Key + X-Api-Secret headers
 */
import crypto from 'crypto';

const getBase    = () => process.env.CAMOO_BASE_URL   || 'https://api.camoo.cm/v1/payment';
const getApiKey  = () => process.env.CAMOO_API_KEY;
const getSecret  = () => process.env.CAMOO_API_SECRET;

const assertConfig = () => {
  if (!getApiKey() || !getSecret()) {
    throw Object.assign(
      new Error('CAMOO_API_KEY / CAMOO_API_SECRET non configurés. Vérifiez votre .env.'),
      { status: 503, code: 'CAMOO_NOT_CONFIGURED' }
    );
  }
};

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key':    getApiKey(),
  'X-Api-Secret': getSecret(),
});

const handleResponse = async (res) => {
  const body = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw Object.assign(new Error(body.message || 'Camoo Payment error'), { status: res.status, body });
  return body;
};

// ── Initier un cashout (push vers le téléphone du client) ─────────────────
export async function createCashout({
  amount,
  phone_number,
  notification_url,
  external_reference,
  shopping_cart_details,
  currency = 'XAF',
}) {
  assertConfig();
  const res = await fetch(`${getBase()}/cashout`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount, phone_number, notification_url, external_reference, shopping_cart_details, currency }),
  });
  return handleResponse(res);
}

// ── Vérifier le statut d'une transaction ──────────────────────────────────
export async function verifyTransaction(id) {
  assertConfig();
  const url = new URL(`${getBase()}/verify`);
  url.searchParams.set('id', id);
  const res = await fetch(url.toString(), { headers: headers() });
  return handleResponse(res);
}

// ── Solde du compte ───────────────────────────────────────────────────────
export async function getAccountBalance() {
  assertConfig();
  const res = await fetch(`${getBase()}/account`, { headers: headers() });
  return handleResponse(res);
}

// ── Vérifier la signature HMAC-SHA256 d'une notification webhook ──────────
export function verifyWebhookSignature(queryParams, secret = process.env.CAMOO_WEBHOOK_SECRET) {
  const { sig, ...rest } = queryParams;
  if (!sig || !secret) return false;
  // Reconstruct the signed string: sorted key=value pairs joined by &
  const payload = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
