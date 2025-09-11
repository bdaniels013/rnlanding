import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Payment Cloud charge endpoint
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

    // Check if Payment Cloud secret key is configured
    if (!process.env.PAYMENT_CLOUD_SECRET_KEY) {
      console.error('PAYMENT_CLOUD_SECRET_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Payment system not configured. Please contact support.'
      });
    }

    // Prepare Payment Cloud API payload
    let payload = {
      security_key: process.env.PAYMENT_CLOUD_SECRET_KEY,
      amount: (amount / 100).toFixed(2), // Convert cents to dollars
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
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1'
    };

    // Add payment method specific data
    if (method === 'card') {
      if (!payment_data.token) {
        return res.status(400).json({
          success: false,
          error: 'Card token is required'
        });
      }
      payload.payment_token = payment_data.token;
    } else if (method === 'ach') {
      payload.payment = 'check';
      payload.checkname = payment_data.name;
      payload.checkaba = payment_data.routing;
      payload.checkaccount = payment_data.account;
      payload.account_holder_type = 'personal';
      payload.account_type = 'checking';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported payment method'
      });
    }

    console.log('Payment Cloud payload:', {
      ...payload,
      security_key: '[REDACTED]',
      payment_token: payload.payment_token ? '[REDACTED]' : undefined
    });

    // Make request to Payment Cloud API
    const formData = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('Payment Cloud Response:', responseText);

    // Parse Payment Cloud response
    const responseData = parsePaymentCloudResponse(responseText);

    if (responseData.response === '1' || responseData.response_code === '100') {
      // Payment successful
      console.log('✅ Payment successful:', {
        transaction_id: responseData.transactionid,
        amount: amount,
        method: method,
        customer_email: customer_info.email
      });

      // TODO: Store transaction in database
      // TODO: Send confirmation email
      // TODO: Award credits if applicable

      return res.json({
        success: true,
        transaction_id: responseData.transactionid,
        auth_code: responseData.auth_code,
        amount: amount,
        method: method,
        customer_info: customer_info,
        offer_id: offer_id,
        timestamp: new Date().toISOString(),
        response_data: {
          response_code: responseData.response_code,
          response_text: responseData.responsetext,
          avs_response: responseData.avsresponse,
          cvv_response: responseData.cvvresponse
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
    console.error('Payment Cloud charge error:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment processing failed: ' + error.message
    });
  }
});

function parsePaymentCloudResponse(responseText) {
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
