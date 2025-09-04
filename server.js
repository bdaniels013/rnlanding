import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import setupDatabase from './scripts/startup.js';

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

// Checkout endpoint (simplified for now)
app.post('/api/checkout/create', (req, res) => {
  try {
    const { customer_info, items } = req.body;
    
    // Validate input
    if (!customer_info || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Calculate total
    let totalCents = 0;
    let totalCredits = 0;
    
    for (const item of items) {
      // Find the offer by ID
      const offer = {
        'monthly-creator-pass': { priceCents: 100000, creditsValue: 1, isCreditEligible: true },
        'annual-plan': { priceCents: 1000000, creditsValue: 12, isCreditEligible: true },
        'content-management': { priceCents: 150000, creditsValue: 0, isCreditEligible: false }
      }[item.offer_id];
      
      if (offer) {
        totalCents += offer.priceCents * item.qty;
        totalCredits += offer.isCreditEligible ? offer.creditsValue * item.qty : 0;
      }
    }

    // For now, return a mock PayPal approval URL
    // In production, this would create a real PayPal order
    res.json({
      order_id: 'mock-order-' + Date.now(),
      paypal_approval_url: 'https://www.paypal.com/checkoutnow?token=mock-token',
      total_cents: totalCents,
      total_credits: totalCredits
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
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
