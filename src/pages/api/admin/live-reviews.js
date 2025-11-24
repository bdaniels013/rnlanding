import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search, filter } = req.query;

      const whereClause = {
        order: { is: { status: 'PAID' } }
      };

      if (search) {
        whereClause.OR = [
          { songName: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search, mode: 'insensitive' } } }
        ];
      }

      if (filter && filter !== 'all') {
        whereClause.status = filter.toUpperCase();
      }

      // Reconcile: create LiveReview rows for PAID Live Review orders missing a record
      try {
        const recentPaidLiveOrders = await prisma.order.findMany({
          where: {
            status: 'PAID',
            orderItems: {
              some: {
                offer: {
                  OR: [
                    { name: { contains: 'Live Review', mode: 'insensitive' } },
                    { sku: { contains: 'music-submission', mode: 'insensitive' } },
                    { sku: { contains: 'live', mode: 'insensitive' } }
                  ]
                }
              }
            }
          },
          select: {
            id: true,
            customerId: true,
            createdAt: true,
            liveReviews: { select: { id: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        });

        const missing = recentPaidLiveOrders.filter(o => !o.liveReviews || o.liveReviews.length === 0);
        if (missing.length) {
          await prisma.$transaction(
            missing.map(o => prisma.liveReview.create({
              data: {
                customerId: o.customerId,
                orderId: o.id,
                songName: 'Pending Submission',
                status: 'PENDING',
                notes: 'Auto-created from reconciliation'
              }
            }))
          );
        }
      } catch (reconErr) {
        console.warn('Live Reviews reconciliation failed:', reconErr?.message || reconErr);
      }

      const liveReviews = await prisma.liveReview.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          order: { select: { id: true, totalCents: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ liveReviews });
    } catch (error) {
      console.error('Error fetching live reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch live reviews' });
    }
  } else if (req.method === 'POST') {
    try {
      const { customerId, orderId, songName, notes } = req.body;

      if (!customerId || !songName) {
        return res.status(400).json({ error: 'Customer ID and song name are required' });
      }

      const liveReview = await prisma.liveReview.create({
        data: {
          customerId,
          orderId: orderId || null,
          songName,
          status: 'PENDING',
          notes: notes || null
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          order: { select: { id: true, totalCents: true, status: true } }
        }
      });

      return res.status(201).json({ liveReview });
    } catch (error) {
      console.error('Error creating live review:', error);
      return res.status(500).json({ error: 'Failed to create live review' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, songName, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Live review ID is required' });
      }

      const liveReview = await prisma.liveReview.update({
        where: { id },
        data: {
          songName: songName || undefined,
          notes: notes || undefined
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          order: { select: { id: true, totalCents: true, status: true } }
        }
      });

      return res.status(200).json({ liveReview });
    } catch (error) {
      console.error('Error updating live review:', error);
      return res.status(500).json({ error: 'Failed to update live review' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Live review ID is required' });
      }

      await prisma.liveReview.delete({ where: { id } });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting live review:', error);
      return res.status(500).json({ error: 'Failed to delete live review' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
