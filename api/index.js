import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { PayPalClient } from '../src/lib/paypal.js';

const router = express.Router();
const prisma = new PrismaClient();

// Auth routes
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'STAFF'
      }
    });
    
    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name,
        email,
        phone
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Offers route
router.get('/offers', async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        priceCents: true,
        isSubscription: true,
        creditsValue: true,
        isCreditEligible: true
      }
    });
    
    res.json(offers);
  } catch (error) {
    console.error('Offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
