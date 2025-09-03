import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function withAuth(handler, requiredRole = null) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          customers: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check role if required
      if (requiredRole) {
        const roleHierarchy = {
          'READONLY': 1,
          'STAFF': 2,
          'ADMIN': 3,
          'OWNER': 4
        };

        const userRoleLevel = roleHierarchy[user.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customers[0]?.id
      };

      return handler(req, res);

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  };
}

export function requireAdmin(handler) {
  return withAuth(handler, 'ADMIN');
}

export function requireOwner(handler) {
  return withAuth(handler, 'OWNER');
}
