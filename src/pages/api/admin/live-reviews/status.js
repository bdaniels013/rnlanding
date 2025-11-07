import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id, status, fulfilledAt } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Live review ID and status are required' });
    }

    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be PENDING, COMPLETED, or CANCELLED' });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'COMPLETED') {
      updateData.fulfilledAt = fulfilledAt ? new Date(fulfilledAt) : new Date();
    } else {
      updateData.fulfilledAt = null;
    }

    const liveReview = await prisma.liveReview.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, totalCents: true, status: true } }
      }
    });

    return res.status(200).json({ liveReview });
  } catch (error) {
    console.error('Error updating live review status:', error);
    return res.status(500).json({ error: 'Failed to update live review status' });
  }
}