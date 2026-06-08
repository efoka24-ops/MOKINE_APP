/**
 * Easy Transact Gateway API — Mobile Money (Cash-In / Cash-Out)
 * Docs: /api/v1/partner/...
 * Auth: Bearer token (EASY_TRANSACT_TOKEN in .env)
 */

const getBase = () => process.env.EASY_TRANSACT_BASE_URL || 'https://api.easytransact.cm';
const getToken = () => process.env.EASY_TRANSACT_TOKEN;

const assertConfig = () => {
  if (!getToken()) {
    throw Object.assign(
      new Error('EASY_TRANSACT_TOKEN non configuré. Vérifiez votre .env.'),
      { status: 503, code: 'EASYTRANSACT_NOT_CONFIGURED' }
    );
  }
};

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const body = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw Object.assign(new Error(body.message || 'Easy Transact error'), { status: res.status, body });
  return body;
};

// ── Update webhook & callback URLs ────────────────────────────────────────
export async function updateWebhook({ webhook_url, success_callback_url, failure_callback_url }) {
  assertConfig();
  const form = new URLSearchParams();
  if (webhook_url)          form.append('webhook_url', webhook_url);
  if (success_callback_url) form.append('success_callback_url', success_callback_url);
  if (failure_callback_url) form.append('failure_callback_url', failure_callback_url);

  const res = await fetch(`${getBase()}/api/v1/partner/profile/webhook/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  return handleResponse(res);
}

// ── Create a checkout link (redirect user to payment page) ────────────────
export async function createCheckoutLink({
  description,
  vendor_reference,
  amount,
  currency_code = 'XAF',
  service_code = 'DEPOSIT',
  success_url,
  cancel_url,
  expires_in_minutes = 1440,
}) {
  assertConfig();
  const res = await fetch(`${getBase()}/api/v1/partner/transactions/checkout-link/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ description, vendor_reference, amount, currency_code, service_code, success_url, cancel_url, expires_in_minutes }),
  });
  return handleResponse(res);
}

// ── Initiate a direct transaction (push to customer phone) ────────────────
export async function initiateTransaction(payload) {
  assertConfig();
  const res = await fetch(`${getBase()}/api/v1/partner/transactions/initiate/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Get transaction status ────────────────────────────────────────────────
export async function getTransactionStatus(vendor_reference) {
  assertConfig();
  const url = new URL(`${getBase()}/api/v1/partner/transactions/status/`);
  if (vendor_reference) url.searchParams.set('vendor_reference', vendor_reference);
  const res = await fetch(url.toString(), { headers: headers() });
  return handleResponse(res);
}
