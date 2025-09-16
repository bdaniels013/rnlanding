import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// NMI Payment API - Comprehensive payment processing
router.post('/charge', async (req, res) => {
  try {
    const { method, customer_info, payment_data, amount, offer_id } = req.body;

    // Validate required fields
    if (!method || !customer_info || !payment_data || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if NMI API key is configured
    if (!process.env.PAYMENT_CLOUD_SECRET_KEY) {
      console.error('PAYMENT_CLOUD_SECRET_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Payment system not configured. Please contact support.'
      });
    }

    // Prepare base NMI API payload
    let payload = {
      security_key: process.env.PAYMENT_CLOUD_SECRET_KEY,
      type: 'sale',
      amount: (amount / 100).toFixed(2),
      first_name: customer_info.name?.split(' ')[0] || '',
      last_name: customer_info.name?.split(' ').slice(1).join(' ') || '',
      email: customer_info.email,
      phone: customer_info.phone || '',
      address1: customer_info.address || '',
      city: customer_info.city || '',
      state: customer_info.state || '',
      zip: customer_info.zip || '',
      country: 'US',
      orderid: `RN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_description: `Rich Nick - ${offer_id}`,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1',
      customer_vault: 'add_customer' // Store customer for future use
    };

    // Process different payment methods based on NMI documentation
    switch (method) {
      case 'card':
        await processCardPayment(payload, payment_data);
        break;
      case 'ach':
        await processACHPayment(payload, payment_data);
        break;
      case 'apple_pay':
        await processApplePay(payload, payment_data);
        break;
      case 'google_pay':
        await processGooglePay(payload, payment_data);
        break;
      case 'crypto':
        await processCrypto(payload, payment_data);
        break;
      case 'wallet':
        await processWallet(payload, payment_data);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported payment method'
        });
    }

    // Make request to NMI Payment API
    const formData = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
      formData.append(key, value);
      }
    });

    console.log('NMI Payment API payload:', {
      ...payload,
      security_key: '[REDACTED]',
      ccnumber: payload.ccnumber ? '[REDACTED]' : undefined,
      cvv: payload.cvv ? '[REDACTED]' : undefined,
      checkaba: payload.checkaba ? '[REDACTED]' : undefined,
      checkaccount: payload.checkaccount ? '[REDACTED]' : undefined
    });

    const response = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('NMI Payment API Response:', responseText);

    // Parse NMI response
    const responseData = parseNMIResponse(responseText);

    if (responseData.response === '1' || responseData.response_code === '100') {
      // Payment successful
      console.log('✅ Payment successful:', {
        transaction_id: responseData.transactionid,
        amount: amount,
        method: method,
        customer_email: customer_info.email,
        customer_vault_id: responseData.customer_vault_id
      });

      return res.json({
        success: true,
        transaction_id: responseData.transactionid,
        auth_code: responseData.auth_code,
        amount: amount,
        method: method,
        customer_info: customer_info,
        offer_id: offer_id,
        customer_vault_id: responseData.customer_vault_id,
        timestamp: new Date().toISOString(),
        response_data: {
          response_code: responseData.response_code,
          response_text: responseData.responsetext,
          avs_response: responseData.avsresponse,
          cvv_response: responseData.cvvresponse,
          orderid: responseData.orderid
        }
      });
    } else {
      // Payment failed
      console.log('❌ Payment failed:', {
        response_code: responseData.response_code,
        response_text: responseData.responsetext,
        customer_email: customer_info.email
      });

      return res.status(400).json({
        success: false,
        error: responseData.responsetext || 'Payment failed',
        response_code: responseData.response_code,
        details: responseData
      });
    }

  } catch (error) {
    console.error('NMI Payment API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment processing failed: ' + error.message
    });
  }
});

// Card Payment Processing
async function processCardPayment(payload, payment_data) {
  if (!payment_data.number || !payment_data.expiry || !payment_data.cvv) {
    throw new Error('Card number, expiry, and CVV are required');
  }

  // Format card data for NMI
  payload.ccnumber = payment_data.number.replace(/\s/g, '');
  
  // Parse expiry date (MM/YY format)
  const [month, year] = payment_data.expiry.split('/');
  payload.ccexp = `${month}${year}`;
  payload.cvv = payment_data.cvv;
  
  // Add cardholder name if provided
  if (payment_data.name) {
    payload.cardholder_name = payment_data.name;
  }
}

// ACH Payment Processing
async function processACHPayment(payload, payment_data) {
  if (!payment_data.routing || !payment_data.account || !payment_data.name) {
    throw new Error('Routing number, account number, and account holder name are required');
  }

  payload.payment = 'check';
  payload.checkname = payment_data.name;
  payload.checkaba = payment_data.routing;
  payload.checkaccount = payment_data.account;
  payload.account_holder_type = payment_data.account_type || 'personal';
  payload.account_type = payment_data.checking_savings || 'checking';
}

// Apple Pay Processing (NMI Integration)
async function processApplePay(payload, payment_data) {
  if (!payment_data.payment_data || !payment_data.payment_method) {
    throw new Error('Apple Pay payment data is required');
  }

  // NMI Apple Pay requires specific merchant configuration
  // This would need to be set up in NMI merchant portal first
  payload.payment = 'apple_pay';
  payload.apple_pay_payment_data = JSON.stringify(payment_data.payment_data);
  payload.apple_pay_payment_method = JSON.stringify(payment_data.payment_method);
  
  // Additional NMI Apple Pay parameters
  payload.apple_pay_merchant_id = process.env.APPLE_MERCHANT_ID;
  payload.apple_pay_domain_name = process.env.APPLE_PAY_DOMAIN || 'richhnick.org';
}

// Google Pay Processing (NMI Integration)
async function processGooglePay(payload, payment_data) {
  if (!payment_data.payment_method_data) {
    throw new Error('Google Pay payment method data is required');
  }

  // NMI Google Pay requires specific merchant configuration
  // This would need to be set up in NMI merchant portal first
  payload.payment = 'google_pay';
  payload.google_pay_payment_method_data = JSON.stringify(payment_data.payment_method_data);
  
  // Additional NMI Google Pay parameters
  payload.google_pay_merchant_id = process.env.GOOGLE_PAY_MERCHANT_ID;
}


// Crypto Payment Processing
async function processCrypto(payload, payment_data) {
  if (!payment_data.crypto_type || !payment_data.crypto_address) {
    throw new Error('Crypto type and address are required');
  }

  payload.payment = 'crypto';
  payload.crypto_type = payment_data.crypto_type; // bitcoin, ethereum, etc.
  payload.crypto_address = payment_data.crypto_address;
}

// Digital Wallet Processing
async function processWallet(payload, payment_data) {
  if (!payment_data.wallet_type || !payment_data.wallet_token) {
    throw new Error('Wallet type and token are required');
  }

  payload.payment = 'wallet';
  payload.wallet_type = payment_data.wallet_type; // venmo, cashapp, etc.
  payload.wallet_token = payment_data.wallet_token;
}

function parseNMIResponse(responseText) {
  const lines = responseText.split('\n');
  const data = {};
  
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=', 2);
      data[key.trim()] = value.trim();
    }
  });
  
  return data;
}

export default router;