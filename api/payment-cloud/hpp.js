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
    console.log('HPP Start Request:', {
      query: req.query,
      hasSecretKey: !!process.env.PAYMENT_CLOUD_SECRET_KEY,
      environment: process.env.PAYMENT_CLOUD_ENVIRONMENT
    });

    if (!process.env.PAYMENT_CLOUD_SECRET_KEY) {
      console.error('PAYMENT_CLOUD_SECRET_KEY not configured');
      return res.status(500).send('Payment gateway not configured');
    }

    const amountCents = Number(req.query.amount_cents || '0');
    const offerId = String(req.query.offer_id || 'monthly-creator-pass');
    const amount = (amountCents / 100).toFixed(2);
    
    console.log('Processing HPP request:', { amountCents, amount, offerId });
    
    if (!(amountCents > 0)) {
      console.error('Invalid amount:', amountCents);
      return res.status(400).send('Invalid amount');
    }

    // For now, let's redirect to the secure checkout page instead of HPP
    // This will use the direct API integration we have in SecureCheckout.jsx
    const checkoutUrl = `${getBaseUrl(req)}/secure-checkout?amount_cents=${amountCents}&offer_id=${offerId}&name=${encodeURIComponent(req.query.name || '')}&email=${encodeURIComponent(req.query.email || '')}`;
    
    console.log('Redirecting to secure checkout:', checkoutUrl);
    return res.redirect(302, checkoutUrl);
    
  } catch (err) {
    console.error('HPP start error:', err);
    return res.status(500).send('Internal error starting hosted checkout: ' + err.message);
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


