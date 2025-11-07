import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import dotenv from 'dotenv';
import setupDatabase from './scripts/startup.js';
import { paypalService } from './src/lib/paypal.js';
import { db } from './src/lib/database.js';
import paymentCloudRouter from './api/payment-cloud/charge.js';
import hppRouter from './api/payment-cloud/hpp.js';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Store pending orders in memory (in production, use Redis or database)
const pendingOrders = new Map();

// Setup database on startup
setupDatabase();

// Configure multer for file uploads - using memory storage for base64 conversion
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Payment Cloud API routes
app.use('/api/payment-cloud', paymentCloudRouter);
app.use('/api/payment-cloud/hpp', hppRouter);

// Test endpoint to verify basic setup
app.post('/api/payment-cloud/test', (req, res) => {
  console.log('=== TEST ENDPOINT HIT ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Environment check:', {
    PAYMENT_CLOUD_SECRET_KEY: !!process.env.PAYMENT_CLOUD_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV
  });
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body,
    envCheck: {
      hasSecretKey: !!process.env.PAYMENT_CLOUD_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Apple Pay merchant validation endpoint (NMI Integration)
app.post('/api/payment-cloud/validate-merchant', async (req, res) => {
  try {
    const { validationURL } = req.body;
    
    if (!validationURL) {
      return res.status(400).json({ error: 'Validation URL is required' });
    }

    // NMI Apple Pay requires merchant validation through their system
    // This endpoint should be configured in NMI merchant portal
    const response = await fetch('https://secure.networkmerchants.com/api/transact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        security_key: process.env.PAYMENT_CLOUD_SECRET_KEY,
        type: 'apple_pay_validate',
        validation_url: validationURL,
        merchant_id: process.env.APPLE_MERCHANT_ID,
        domain_name: process.env.APPLE_PAY_DOMAIN || 'richhnick.org'
      })
    });

    const responseText = await response.text();
    const responseData = parseNMIResponse(responseText);

    if (responseData.response === '1') {
      res.json({ merchantSession: responseData.merchant_session });
    } else {
      throw new Error(responseData.responsetext || 'Apple Pay validation failed');
    }
  } catch (error) {
    console.error('Apple Pay validation error:', error);
    res.status(500).json({ error: 'Merchant validation failed' });
  }
});

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

// Basic API endpoints
app.get('/api/offers', async (req, res) => {
  try {
    const offers = await db.getOffers(true); // Only return active offers
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Social Media Photos API endpoints
app.get('/api/social-media/photos', async (req, res) => {
  try {
    const { platform } = req.query;
    const photos = await db.getSocialMediaPhotos(platform, true);
    res.json({ photos });
  } catch (error) {
    console.error('Error fetching social media photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});


// Checkout endpoint with real PayPal integration
app.post('/api/checkout/create', async (req, res) => {
  try {
    const { customer_info, items } = req.body;
    
    // Validate input
    if (!customer_info || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Get offers from database
    const offerIds = items.map(item => item.offer_id);
    const offers = await db.getOffers();
    const validOffers = offers.filter(offer => offerIds.includes(offer.id));
    
    if (validOffers.length !== offerIds.length) {
      return res.status(400).json({ error: 'One or more offers not found' });
    }

    // Calculate total
    let totalCents = 0;
    let totalCredits = 0;
    const orderItems = [];
    
    for (const item of items) {
      const offer = validOffers.find(o => o.id === item.offer_id);
      
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
      const offer = validOffers.find(o => o.id === item.offer_id);
      return offer && offer.isSubscription;
    });

    // Handle subscriptions vs one-time payments
    let paypalOrderData;
    
    if (hasSubscriptions) {
      // For subscriptions, we need to create a subscription order
      const subscriptionItem = items.find(item => {
        const offer = validOffers.find(o => o.id === item.offer_id);
        return offer && offer.isSubscription;
      });
      
      if (subscriptionItem) {
        const offer = validOffers.find(o => o.id === subscriptionItem.offer_id);
        
        // Create subscription order
        paypalOrderData = {
          plan_id: offer.paypalPlanId || 'P-9A346031N5163840TNC5AE3Q', // Fallback plan ID
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
    try {
      if (hasSubscriptions) {
        paypalOrder = await paypalService.createSubscription(paypalOrderData);
      } else {
        paypalOrder = await paypalService.createOrder(paypalOrderData);
      }
      console.log('PayPal order created:', paypalOrder);
    } catch (paypalError) {
      console.error('PayPal error:', paypalError);
      // Create a mock PayPal order for testing
      paypalOrder = {
        id: 'test-order-' + Date.now(),
        links: [
          { rel: 'approve', href: 'https://example.com/approve' }
        ]
      };
      console.log('Using mock PayPal order for testing:', paypalOrder);
    }

    // Create customer and order in database
    try {
      // Find or create customer
      let customer = await db.getCustomerByEmail(customer_info.email);
      if (!customer) {
        customer = await db.createCustomer({
          name: customer_info.name,
          email: customer_info.email,
          phone: customer_info.phone
        });
      }

      // Create order
      const order = await db.createOrder({
        customerId: customer.id,
        totalCents,
        currency: 'USD',
        status: 'CREATED',
        paypalOrderId: paypalOrder.id
      });

      // Create order items
      for (const item of items) {
        const offer = validOffers.find(o => o.id === item.offer_id);
        if (offer) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              offerId: offer.id,
              qty: item.qty,
              unitPriceCents: offer.priceCents,
              creditsAwarded: offer.isCreditEligible ? offer.creditsValue * item.qty : 0
            }
          });
        }
      }

      console.log('✅ Order created in database:', order.id);
    } catch (dbError) {
      console.error('Database error during checkout:', dbError);
      // Don't fail the checkout, but log the error
    }

    // Store order data for later processing
    pendingOrders.set(paypalOrder.id, {
      customer_info,
      items,
      totalCents,
      totalCredits,
      hasSubscriptions,
      createdAt: new Date()
    });

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

// Admin dashboard endpoint
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const dashboardData = await db.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Admin endpoints for social media photos
app.get('/api/admin/social-media/photos', authenticateAdmin, async (req, res) => {
  try {
    const { platform } = req.query;
    const photos = await db.getSocialMediaPhotos(platform, false); // Get all photos for admin
    res.json({ photos });
  } catch (error) {
    console.error('Error fetching social media photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

app.post('/api/admin/social-media/photos', authenticateAdmin, async (req, res) => {
  try {
    const photoData = req.body;
    const photo = await db.createSocialMediaPhoto(photoData);
    res.json(photo);
  } catch (error) {
    console.error('Error creating social media photo:', error);
    res.status(500).json({ error: 'Failed to create photo' });
  }
});

app.put('/api/admin/social-media/photos', authenticateAdmin, async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const photo = await db.updateSocialMediaPhoto(id, updateData);
    res.json(photo);
  } catch (error) {
    console.error('Error updating social media photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

app.delete('/api/admin/social-media/photos', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;
    await db.deleteSocialMediaPhoto(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting social media photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

app.post('/api/admin/social-media/photos/reorder', authenticateAdmin, async (req, res) => {
  try {
    const { photoIds } = req.body;
    await db.reorderSocialMediaPhotos(photoIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering social media photos:', error);
    res.status(500).json({ error: 'Failed to reorder photos' });
  }
});

// File upload endpoint - stores images as base64 in database for persistence
app.post('/api/admin/social-media/photos/upload', authenticateAdmin, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { platform, altText } = req.body;
    
    console.log('Received platform:', platform);
    console.log('Platform type:', typeof platform);
    console.log('Platform lowercase:', platform?.toLowerCase());
    
    if (!platform || !['facebook', 'instagram', 'youtube', 'tiktok'].includes(platform.toLowerCase())) {
      console.log('Platform validation failed for:', platform);
      return res.status(400).json({ error: 'Invalid platform. Must be facebook, instagram, youtube, or tiktok' });
    }

    const uploadedPhotos = [];
    
    for (const file of req.files) {
      // Convert file to base64
      const imageData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Generate filename since we're using memory storage
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      
      const photoData = {
        platform,
        filename: filename,
        originalName: file.originalname,
        url: `/uploads/social-media/${filename}`, // Keep for compatibility
        imageData: imageData, // Store base64 data
        altText: altText || null,
        order: 0
      };
      
      const photo = await db.createSocialMediaPhoto(photoData);
      uploadedPhotos.push(photo);
    }

    res.json({ photos: uploadedPhotos });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Get all customers with credits
app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const customers = await db.getCustomers();
    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create new customer
app.post('/api/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const customerData = req.body;
    const customer = await db.createCustomer(customerData);
    res.json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
app.put('/api/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const customer = await db.updateCustomer(id, updateData);
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
app.delete('/api/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;
    await db.deleteCustomer(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Get all offers
app.get('/api/admin/offers', authenticateAdmin, async (req, res) => {
  try {
    const offers = await db.getOffers();
    res.json({ offers });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Create new offer
app.post('/api/admin/offers', authenticateAdmin, async (req, res) => {
  try {
    const offerData = req.body;
    const offer = await db.createOffer(offerData);
    res.json(offer);
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// Update offer
app.put('/api/admin/offers', authenticateAdmin, async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }
    const offer = await db.updateOffer(id, updateData);
    res.json(offer);
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// Delete offer
app.delete('/api/admin/offers', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }
    await db.deleteOffer(id);
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

// Reorder offers
app.put('/api/admin/offers/reorder', authenticateAdmin, async (req, res) => {
  try {
    const { offers } = req.body;
    if (!offers || !Array.isArray(offers)) {
      return res.status(400).json({ error: 'Offers array is required' });
    }
    
    await db.reorderOffers(offers);
    res.json({ message: 'Offers reordered successfully' });
  } catch (error) {
    console.error('Reorder offers error:', error);
    res.status(500).json({ error: 'Failed to reorder offers' });
  }
});

// Add credits to customer
app.post('/api/admin/credits/add', authenticateAdmin, async (req, res) => {
  try {
    const { customerId, amount, reason, type } = req.body;
    
    if (!customerId || !amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await db.addCredits(customerId, amount, reason, type);
    
    res.json({
      success: true,
      message: `Successfully added ${amount} credits`,
      customerId,
      amount,
      reason,
      type,
      newBalance: result.newBalance
    });
    
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits: ' + error.message });
  }
});

// Deduct credits from customer
app.post('/api/admin/credits/deduct', authenticateAdmin, async (req, res) => {
  try {
    const { customerId, amount, reason, type } = req.body;
    
    if (!customerId || !amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await db.deductCredits(customerId, amount, reason, type);
    
    res.json({
      success: true,
      message: `Successfully deducted ${amount} credits`,
      customerId,
      amount,
      reason,
      type,
      newBalance: result.newBalance
    });
    
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({ error: 'Failed to deduct credits: ' + error.message });
  }
});

// Capture customer info for admin dashboard (public endpoint for checkout)
app.post('/api/customer-info', async (req, res) => {
  try {
    const { name, email, phone, platform, username, timestamp, action, selectedOffer } = req.body;
    
    const customerInfo = {
      name,
      email,
      phone,
      platform,
      username,
      timestamp,
      action,
      selectedOffer
    };
    
    await db.captureCustomerInfo(customerInfo);
    
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

// Capture customer info for admin dashboard (admin endpoint)
app.post('/api/admin/customer-info', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, phone, timestamp, action, selectedOffer } = req.body;
    
    const customerInfo = {
      name,
      email,
      phone,
      timestamp,
      action,
      selectedOffer
    };
    
    await db.captureCustomerInfo(customerInfo);
    
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
app.get('/api/admin/customer-info', authenticateAdmin, async (req, res) => {
  try {
    const captures = await db.getRecentCustomerInfoCaptures();
    res.json(captures);
  } catch (error) {
    console.error('Get customer info error:', error);
    res.status(500).json({ error: 'Failed to fetch customer info' });
  }
});

// Get credits history for a customer
app.get('/api/admin/credits/history/:customerId', authenticateAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const history = await db.getCreditsHistory(customerId);
    res.json(history);
    
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

    // Get the stored order data
    const orderData = pendingOrders.get(token);
    if (!orderData) {
      console.error('No order data found for token:', token);
      return res.status(400).json({ error: 'Order data not found' });
    }

    // Capture the PayPal order
    const captureResult = await paypalService.captureOrder(token);
    console.log('PayPal order captured:', captureResult);
    
    // Process the payment in the database
    try {
      const result = await db.processPaymentSuccess(
        token,
        orderData.customer_info.email,
        orderData.items
      );
      
      console.log('✅ Payment processed successfully:', {
        orderId: result.order.id,
        customerEmail: result.customer.email,
        creditsAwarded: result.creditsAwarded
      });
      
      // Clean up pending order
      pendingOrders.delete(token);
      
    } catch (dbError) {
      console.error('Database processing error:', dbError);
      // Don't fail the PayPal response, but log the error
    }
    
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
app.post('/api/paypal/subscription-webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('PayPal subscription webhook received:', JSON.stringify(webhookData, null, 2));
    
    // Handle different subscription events
    switch (webhookData.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log('Subscription activated:', webhookData.resource.id);
        try {
          const subscriber = webhookData.resource.subscriber;
          if (subscriber?.email_address) {
            await db.processSubscriptionPayment(
              webhookData.resource.id,
              subscriber.email_address,
              150000 // $1,500 for content management
            );
          }
        } catch (error) {
          console.error('Error processing subscription activation:', error);
        }
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

// Serve the React app for all other routes, but let /livereview and /livereview.html pass through
app.get('*', (req, res, next) => {
  if (req.path === '/livereview' || req.path === '/livereview.html') return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Configure Gmail SMTP transporter (free for low-volume usage)
const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: (process.env.SMTP_SECURE || 'true') === 'true', // 465 TLS by default
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Utility to escape HTML in email content
function escapeHtml(str) {
  const s = String(str || '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Add MP3 upload storage for music submissions
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads', 'music-submissions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${timestamp}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `submission-${unique}${ext}`);
  }
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const extOk = /\.(mp3|mpeg)$/i.test(file.originalname);
    const mimeOk = /^audio\/(mpeg|mp3)$/.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only MP3 files up to 20MB are allowed.'));
  }
});

// Music submission upload endpoint
app.post('/api/music-submission/upload', audioUpload.single('mp3'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'MP3 file is required' });
    }
    const fileUrl = `/uploads/music-submissions/${req.file.filename}`;
    return res.json({ success: true, fileUrl });
  } catch (err) {
    console.error('MP3 upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to upload MP3' });
  }
});

// Music submission notify endpoint (sends email with attachment)
app.post('/api/music-submission/notify', async (req, res) => {
  try {
    const { name, songName, email, fileUrl, transaction } = req.body;

    if (!name || !songName || !fileUrl) {
      return res.status(400).json({ success: false, error: 'name, songName, and fileUrl are required' });
    }

    const fullPath = path.join(__dirname, 'public', fileUrl.replace(/^\/+/, ''));

    const now = new Date();
    const subject = `RN Music Submission - ${now.toLocaleString()}`;
    const to = 'richhtalk3@gmail.com';
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

    await mailTransporter.sendMail({
      from,
      to,
      replyTo: 'richhtalk3@gmail.com',
      subject,
      text: [
        'New music submission:',
        `Name: ${name}`,
        `Song Name: ${songName}`,
        `Customer Email: ${email || 'N/A'}`,
        `Transaction ID: ${transaction?.transaction_id || 'N/A'}`,
        `Amount: $${((transaction?.amount || 2500) / 100).toFixed(2)}`,
        `Time: ${now.toISOString()}`
      ].join('\n'),
      html: `
        <p><strong>New music submission</strong></p>
        <ul>
          <li>Name: ${name}</li>
          <li>Song Name: ${songName}</li>
          <li>Customer Email: ${email || 'N/A'}</li>
          <li>Transaction ID: ${transaction?.transaction_id || 'N/A'}</li>
          <li>Amount: $${((transaction?.amount || 2500) / 100).toFixed(2)}</li>
          <li>Time: ${now.toLocaleString()}</li>
        </ul>
      `,
      attachments: [
        { path: fullPath, filename: path.basename(fullPath), contentType: 'audio/mpeg' }
      ]
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Submission email error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send submission email' });
  }
});

// Serve the Live Review page
// Allow both /livereview and /livereview.html
app.get('/livereview.html', (req, res) => res.redirect('/livereview'));

app.get('/livereview', (req, res) => {
  res.sendFile(path.join(__dirname, 'livereview.html'));
});
