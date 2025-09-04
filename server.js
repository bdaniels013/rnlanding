import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import setupDatabase from './scripts/startup.js';
import { paypalService } from './src/lib/paypal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup database on startup
setupDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API endpoints
app.get('/api/offers', (req, res) => {
  res.json([
    {
      id: 'monthly-creator-pass',
      sku: 'monthly-creator-pass',
      name: 'Sign up for a month',
      priceCents: 100000,
      isSubscription: true,
      creditsValue: 1,
      isCreditEligible: true
    },
    {
      id: 'annual-plan',
      sku: 'annual-plan',
      name: '1 year @ $10k',
      priceCents: 1000000,
      isSubscription: true,
      creditsValue: 12,
      isCreditEligible: true
    },
    {
      id: 'content-management',
      sku: 'content-management',
      name: 'Ongoing Content Management Services',
      priceCents: 150000,
      isSubscription: true,
      creditsValue: 0,
      isCreditEligible: false
    }
  ]);
});

// Checkout endpoint with real PayPal integration
app.post('/api/checkout/create', async (req, res) => {
  try {
    const { customer_info, items } = req.body;
    
    // Validate input
    if (!customer_info || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Calculate total
    let totalCents = 0;
    let totalCredits = 0;
    const orderItems = [];
    
    for (const item of items) {
      // Find the offer by ID
      const offer = {
        'monthly-creator-pass': { priceCents: 100000, creditsValue: 1, isCreditEligible: true, name: 'Sign up for a month' },
        'annual-plan': { priceCents: 1000000, creditsValue: 12, isCreditEligible: true, name: '1 year @ $10k' },
        'content-management': { priceCents: 150000, creditsValue: 0, isCreditEligible: false, name: 'Ongoing Content Management Services' }
      }[item.offer_id];
      
      if (offer) {
        totalCents += offer.priceCents * item.qty;
        totalCredits += offer.isCreditEligible ? offer.creditsValue * item.qty : 0;
        orderItems.push({
          name: offer.name,
          quantity: item.qty.toString(),
          unit_amount: {
            currency_code: 'USD',
            value: (offer.priceCents / 100).toFixed(2)
          }
        });
      }
    }

    // Create PayPal order
    const paypalOrderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: (totalCents / 100).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: (totalCents / 100).toFixed(2)
            }
          }
        },
        items: orderItems,
        description: `Rich Nick Offer - ${items.length} item(s)`
      }],
      application_context: {
        brand_name: 'Rich Nick',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`
      }
    };

    console.log('Creating PayPal order with data:', JSON.stringify(paypalOrderData, null, 2));
    
    const paypalOrder = await paypalService.createOrder(paypalOrderData);
    
    console.log('PayPal order created:', paypalOrder);

    // Find the approval URL
    const approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      throw new Error('No approval URL received from PayPal');
    }

    res.json({
      order_id: paypalOrder.id,
      paypal_approval_url: approvalUrl,
      total_cents: totalCents,
      total_credits: totalCredits
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed: ' + error.message });
  }
});

// Admin dashboard endpoint (simplified for now)
app.get('/api/admin/dashboard', (req, res) => {
  try {
    // TODO: Add authentication middleware to verify admin role
    
    // Return mock dashboard data for now
    res.json({
      revenue_today: 0,
      orders_today: 0,
      total_customers: 0,
      credits_outstanding: 0,
      active_subscriptions: 0,
      upcoming_slots: [],
      recent_orders: [],
      alerts: []
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// PayPal success endpoint
app.get('/api/paypal/success', async (req, res) => {
  try {
    const { token, PayerID } = req.query;
    
    if (!token || !PayerID) {
      return res.status(400).json({ error: 'Missing PayPal parameters' });
    }

    // Capture the PayPal order
    const captureResult = await paypalService.captureOrder(token);
    
    console.log('PayPal order captured:', captureResult);
    
    // TODO: Update database with successful payment
    // TODO: Award credits to customer
    // TODO: Send confirmation emails
    
    res.json({
      success: true,
      order_id: token,
      capture_id: captureResult.id,
      status: captureResult.status
    });
    
  } catch (error) {
    console.error('PayPal success error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// PayPal cancel endpoint
app.get('/api/paypal/cancel', (req, res) => {
  res.json({
    success: false,
    message: 'Payment was cancelled'
  });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
