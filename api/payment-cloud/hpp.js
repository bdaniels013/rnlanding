import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

function parseGatewayResponse(body) {
  const lines = String(body || '').split('\n');
  const out = {};
  for (const line of lines) {
    if (!line || !line.includes('=')) continue;
    const [k, v] = line.split('=', 2);
    out[k.trim()] = (v || '').trim();
  }
  return out;
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Start a hosted payment page session and redirect the customer to NMI
router.get('/start', async (req, res) => {
  try {
    if (!process.env.PAYMENT_CLOUD_SECRET_KEY) {
      if (String(process.env.PAYMENT_CLOUD_MODE || '').toLowerCase() === 'demo') {
        // Redirect to a local demo page so reviewers can see the hosted flow intent
        return res.redirect(302, '/secure-checkout-demo.html');
      }
      return res.status(500).send('Payment gateway not configured');
    }

    const amountCents = Number(req.query.amount_cents || '0');
    const offerId = String(req.query.offer_id || 'monthly-creator-pass');
    const amount = (amountCents / 100).toFixed(2);
    if (!(amountCents > 0)) return res.status(400).send('Invalid amount');

    const redirectUrl = `${getBaseUrl(req)}/api/payment-cloud/hpp/return`;

    const form = new URLSearchParams();
    form.append('security_key', process.env.PAYMENT_CLOUD_SECRET_KEY);
    form.append('amount', amount);
    form.append('type', 'sale');
    form.append('redirect_url', redirectUrl);
    form.append('orderid', `RN-${Date.now()}`);
    form.append('order_description', `Rich Nick - ${offerId}`);

    const resp = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const text = await resp.text();
    const data = parseGatewayResponse(text);

    if (data.form_url) {
      return res.redirect(302, data.form_url);
    }

    return res.status(400).send(data.responsetext || 'Failed to start hosted checkout');
  } catch (err) {
    console.error('HPP start error:', err);
    return res.status(500).send('Internal error starting hosted checkout');
  }
});

// NMI posts back here with token-id; finish the sale and redirect customer
router.post('/return', async (req, res) => {
  try {
    const tokenId = req.body['token-id'] || req.query['token-id'];
    if (!tokenId) return res.redirect('/checkout/cancel');

    const form = new URLSearchParams();
    form.append('security_key', process.env.PAYMENT_CLOUD_SECRET_KEY);
    form.append('type', 'sale');
    form.append('tokenid', tokenId);

    const resp = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const text = await resp.text();
    const data = parseGatewayResponse(text);

    if (data.response === '1' || data.response_code === '100' || /APPROVED/i.test(text)) {
      return res.redirect(`/checkout/success?payment=hosted&txn=${encodeURIComponent(data.transactionid || '')}`);
    }

    return res.redirect(`/checkout/cancel?reason=${encodeURIComponent(data.responsetext || 'Declined')}`);
  } catch (err) {
    console.error('HPP return error:', err);
    return res.redirect('/checkout/cancel');
  }
});

export default router;


