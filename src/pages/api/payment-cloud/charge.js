import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { method, customer_info, payment_data, amount, offer_id } = await request.json();

    // Validate required fields
    if (!method || !customer_info || !payment_data || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
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
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    };

    // Add payment method specific data
    if (method === 'card') {
      if (!payment_data.token) {
        return NextResponse.json(
          { success: false, error: 'Card token is required' },
          { status: 400 }
        );
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
      return NextResponse.json(
        { success: false, error: 'Unsupported payment method' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({
        success: true,
        transaction_id: responseData.transactionid,
        auth_code: responseData.auth_code,
        amount: amount,
        method: method,
        customer_info: customer_info,
        offer_id: offer_id,
        timestamp: new Date().toISOString()
      });
    } else {
      // Payment failed
      return NextResponse.json({
        success: false,
        error: responseData.responsetext || 'Payment failed',
        response_code: responseData.response_code
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment Cloud charge error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed: ' + error.message },
      { status: 500 }
    );
  }
}

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

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
