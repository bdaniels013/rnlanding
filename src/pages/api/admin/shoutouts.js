import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search, filter } = req.query;
      
      let whereClause = {};
      
      // Apply search filter
      if (search) {
        whereClause.OR = [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
          { username: { contains: search, mode: 'insensitive' } },
          { platform: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      // Apply status filter
      if (filter && filter !== 'all') {
        whereClause.status = filter.toUpperCase();
      }
      
      const shoutouts = await prisma.shoutout.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              totalCents: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      res.status(200).json({ shoutouts });
    } catch (error) {
      console.error('Error fetching shoutouts:', error);
      res.status(500).json({ error: 'Failed to fetch shoutouts' });
    }
  } else if (req.method === 'POST') {
    try {
      const { customerId, orderId, platform, username, notes } = req.body;
      
      if (!customerId || !platform || !username) {
        return res.status(400).json({ error: 'Customer ID, platform, and username are required' });
      }
      
      const shoutout = await prisma.shoutout.create({
        data: {
          customerId,
          orderId: orderId || null,
          platform,
          username,
          status: 'PENDING',
          notes: notes || null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              totalCents: true,
              status: true
            }
          }
        }
      });
      
      res.status(201).json({ shoutout });
    } catch (error) {
      console.error('Error creating shoutout:', error);
      res.status(500).json({ error: 'Failed to create shoutout' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, platform, username, notes } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Shoutout ID is required' });
      }
      
      const shoutout = await prisma.shoutout.update({
        where: { id },
        data: {
          platform: platform || undefined,
          username: username || undefined,
          notes: notes || undefined
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              totalCents: true,
              status: true
            }
          }
        }
      });
      
      res.status(200).json({ shoutout });
    } catch (error) {
      console.error('Error updating shoutout:', error);
      res.status(500).json({ error: 'Failed to update shoutout' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Shoutout ID is required' });
      }
      
      await prisma.shoutout.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Shoutout deleted successfully' });
    } catch (error) {
      console.error('Error deleting shoutout:', error);
      res.status(500).json({ error: 'Failed to delete shoutout' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
