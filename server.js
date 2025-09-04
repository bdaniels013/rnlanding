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
      isSubscription: false,
      creditsValue: 1,
      isCreditEligible: true
    },
    {
      id: 'annual-plan',
      sku: 'annual-plan',
      name: '1 year @ $10k',
      priceCents: 1000000,
      isSubscription: false,
      creditsValue: 12,
      isCreditEligible: true
    },
    {
      id: 'content-management',
      sku: 'content-management',
      name: 'Ongoing Content Management Services',
      priceCents: 150000,
      isSubscription: true, // Now using PayPal subscription
      creditsValue: 0,
      isCreditEligible: false,
      paypalPlanId: 'P-9A346031N5163840TNC5AE3Q' // Your PayPal subscription plan ID
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
        'monthly-creator-pass': { priceCents: 100000, creditsValue: 1, isCreditEligible: true, isSubscription: false, name: 'Sign up for a month' },
        'annual-plan': { priceCents: 1000000, creditsValue: 12, isCreditEligible: true, isSubscription: false, name: '1 year @ $10k' },
        'content-management': { priceCents: 150000, creditsValue: 0, isCreditEligible: false, isSubscription: true, name: 'Ongoing Content Management Services', paypalPlanId: 'P-9A346031N5163840TNC5AE3Q' }
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

    // Check if any items are subscriptions
    const hasSubscriptions = items.some(item => {
      const offer = {
        'monthly-creator-pass': { isSubscription: false },
        'annual-plan': { isSubscription: false },
        'content-management': { isSubscription: true }
      }[item.offer_id];
      return offer && offer.isSubscription;
    });

    // Handle subscriptions vs one-time payments
    let paypalOrderData;
    
    if (hasSubscriptions) {
      // For subscriptions, we need to create a subscription order
      const subscriptionItem = items.find(item => {
        const offer = {
          'monthly-creator-pass': { isSubscription: false },
          'annual-plan': { isSubscription: false },
          'content-management': { isSubscription: true, paypalPlanId: 'P-9A346031N5163840TNC5AE3Q' }
        }[item.offer_id];
        return offer && offer.isSubscription;
      });
      
      if (subscriptionItem) {
        const offer = {
          'content-management': { paypalPlanId: 'P-9A346031N5163840TNC5AE3Q' }
        }[subscriptionItem.offer_id];
        
        // Create subscription order
        paypalOrderData = {
          plan_id: offer.paypalPlanId,
          subscriber: {
            name: {
              given_name: customer_info.name?.split(' ')[0] || 'Customer',
              surname: customer_info.name?.split(' ').slice(1).join(' ') || ''
            },
            email_address: customer_info.email
          },
          application_context: {
            brand_name: 'Rich Nick',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
            },
            return_url: `https://richhnick.org/checkout/success`,
            cancel_url: `https://richhnick.org/checkout/cancel`
          }
        };
      }
    } else {
      // For one-time payments, use regular order
      paypalOrderData = {
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
          return_url: `https://richhnick.org/checkout/success`,
          cancel_url: `https://richhnick.org/checkout/cancel`
        }
      };
    }

    console.log('Creating PayPal order with data:', JSON.stringify(paypalOrderData, null, 2));
    
    let paypalOrder;
    if (hasSubscriptions) {
      paypalOrder = await paypalService.createSubscription(paypalOrderData);
    } else {
      paypalOrder = await paypalService.createOrder(paypalOrderData);
    }
    
    console.log('PayPal order created:', paypalOrder);

    // Find the approval URL (different for subscriptions vs orders)
    let approvalUrl;
    if (hasSubscriptions) {
      // For subscriptions, look for 'approve' or 'edit' link
      approvalUrl = paypalOrder.links?.find(link => 
        link.rel === 'approve' || link.rel === 'edit'
      )?.href;
    } else {
      // For orders, look for 'approve' link
      approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;
    }
    
    if (!approvalUrl) {
      throw new Error('No approval URL received from PayPal');
    }

    res.json({
      order_id: paypalOrder.id,
      paypal_approval_url: approvalUrl,
      total_cents: totalCents,
      total_credits: totalCredits,
      is_subscription: hasSubscriptions,
      subscription_id: hasSubscriptions ? paypalOrder.id : null
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed: ' + error.message });
  }
});

// Simple authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminAuth = req.headers['x-admin-auth'];
  
  // For now, we'll accept the adminAuth header or basic auth
  if (adminAuth === 'true' || (authHeader && authHeader.includes('admin'))) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized access' });
  }
};

// Admin dashboard endpoint (simplified for now)
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  try {
    // Return mock dashboard data for now
    res.json({
      revenue_today: 0,
      orders_today: 0,
      total_customers: 0,
      credits_outstanding: 0,
      active_subscriptions: 0,
      mrr: 0,
      arr: 0,
      upcoming_platform_slots: [],
      recent_orders: [],
      alerts: []
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all customers with credits
app.get('/api/admin/customers', authenticateAdmin, (req, res) => {
  try {
    // Mock customer data for now - in production this would come from the database
    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        credits: 5,
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        credits: 12,
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1-555-0125',
        credits: 0,
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json(mockCustomers);
    
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Add credits to customer
app.post('/api/admin/credits/add', authenticateAdmin, (req, res) => {
  try {
    const { customerId, amount, reason, type } = req.body;
    
    if (!customerId || !amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // TODO: In production, this would:
    // 1. Validate customer exists
    // 2. Add credits to customer record
    // 3. Create audit log entry
    // 4. Update credits ledger
    
    console.log(`Adding ${amount} credits to customer ${customerId}. Reason: ${reason}`);
    
    res.json({
      success: true,
      message: `Successfully added ${amount} credits`,
      customerId,
      amount,
      reason,
      type
    });
    
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Deduct credits from customer
app.post('/api/admin/credits/deduct', authenticateAdmin, (req, res) => {
  try {
    const { customerId, amount, reason, type } = req.body;
    
    if (!customerId || !amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // TODO: In production, this would:
    // 1. Validate customer exists
    // 2. Check if customer has enough credits
    // 3. Deduct credits from customer record
    // 4. Create audit log entry
    // 5. Update credits ledger
    
    console.log(`Deducting ${amount} credits from customer ${customerId}. Reason: ${reason}`);
    
    res.json({
      success: true,
      message: `Successfully deducted ${amount} credits`,
      customerId,
      amount,
      reason,
      type
    });
    
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

// Store customer info captures (in-memory for now)
let customerInfoCaptures = [];

// Capture customer info for admin dashboard
app.post('/api/admin/customer-info', authenticateAdmin, (req, res) => {
  try {
    const { name, email, phone, timestamp, action, selectedOffer } = req.body;
    
    const customerInfo = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      timestamp,
      action,
      selectedOffer,
      createdAt: new Date().toISOString()
    };
    
    // Store in memory (in production, this would go to database)
    customerInfoCaptures.unshift(customerInfo); // Add to beginning
    
    // Keep only last 50 captures
    if (customerInfoCaptures.length > 50) {
      customerInfoCaptures = customerInfoCaptures.slice(0, 50);
    }
    
    console.log('Customer info captured:', customerInfo);
    
    res.json({
      success: true,
      message: 'Customer info captured successfully'
    });
    
  } catch (error) {
    console.error('Customer info capture error:', error);
    res.status(500).json({ error: 'Failed to capture customer info' });
  }
});

// Get customer info captures for admin dashboard
app.get('/api/admin/customer-info', authenticateAdmin, (req, res) => {
  try {
    res.json(customerInfoCaptures);
  } catch (error) {
    console.error('Get customer info error:', error);
    res.status(500).json({ error: 'Failed to fetch customer info' });
  }
});

// Get credits history for a customer
app.get('/api/admin/credits/history/:customerId', authenticateAdmin, (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Mock credits history data for now - in production this would come from the database
    const mockHistory = [
      {
        id: '1',
        customerId: customerId,
        delta: 1,
        reason: 'Monthly Creator Pass - Payment processed',
        type: 'PAYMENT_CREDITS',
        balance_after: 5,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        admin_user: 'admin',
        ref_order_id: 'ord_1234567890'
      },
      {
        id: '2',
        customerId: customerId,
        delta: -1,
        reason: 'Event booking - Rich Nick Monthly Intensive',
        type: 'EVENT_BOOKING',
        balance_after: 4,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        admin_user: 'admin',
        ref_order_id: null
      },
      {
        id: '3',
        customerId: customerId,
        delta: 1,
        reason: 'Manual credit addition - Offline payment processed',
        type: 'MANUAL_ADD',
        balance_after: 5,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        admin_user: 'admin',
        ref_order_id: null
      }
    ];
    
    res.json(mockHistory);
    
  } catch (error) {
    console.error('Get credits history error:', error);
    res.status(500).json({ error: 'Failed to fetch credits history' });
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

// PayPal subscription webhook endpoint
app.post('/api/paypal/subscription-webhook', (req, res) => {
  try {
    const webhookData = req.body;
    console.log('PayPal subscription webhook received:', JSON.stringify(webhookData, null, 2));
    
    // Handle different subscription events
    switch (webhookData.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log('Subscription activated:', webhookData.resource.id);
        // TODO: Update database with active subscription
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('Subscription cancelled:', webhookData.resource.id);
        // TODO: Update database with cancelled subscription
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        console.log('Subscription payment completed:', webhookData.resource.id);
        // TODO: Process recurring payment
        break;
        
      case 'PAYMENT.SALE.DENIED':
        console.log('Subscription payment denied:', webhookData.resource.id);
        // TODO: Handle failed payment
        break;
        
      default:
        console.log('Unhandled subscription webhook event:', webhookData.event_type);
    }
    
    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Subscription webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
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
