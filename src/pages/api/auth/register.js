import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, phone } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

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
        role: 'STAFF', // Default role
      }
    });

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name,
        phone,
        email,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_REGISTERED',
        targetType: 'USER',
        targetId: user.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        meta: { customerId: customer.id }
      }
    });

    res.status(201).json({
      user_id: user.id,
      customer_id: customer.id,
      token,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
