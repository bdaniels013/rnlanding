import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, otp } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customers: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twofaSecret && !otp) {
      return res.status(401).json({ error: '2FA code required' });
    }

    // TODO: Implement 2FA verification
    // if (user.twofaSecret && otp) {
    //   const isValidOTP = verifyTOTP(user.twofaSecret, otp);
    //   if (!isValidOTP) {
    //     return res.status(401).json({ error: 'Invalid 2FA code' });
    //   }
    // }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        customerId: user.customers[0]?.id 
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_LOGIN',
        targetType: 'USER',
        targetId: user.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        meta: { success: true }
      }
    });

    res.status(200).json({
      token,
      role: user.role,
      customer_id: user.customers[0]?.id,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
