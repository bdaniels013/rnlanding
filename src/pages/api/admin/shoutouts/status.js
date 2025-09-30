import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id, status, postedAt } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ error: 'Shoutout ID and status are required' });
    }
    
    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be PENDING, COMPLETED, or CANCELLED' });
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    // Set postedAt if status is COMPLETED
    if (status === 'COMPLETED' && postedAt) {
      updateData.postedAt = new Date(postedAt);
    } else if (status !== 'COMPLETED') {
      updateData.postedAt = null;
    }
    
    const shoutout = await prisma.shoutout.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating shoutout status:', error);
    res.status(500).json({ error: 'Failed to update shoutout status' });
  }
}
