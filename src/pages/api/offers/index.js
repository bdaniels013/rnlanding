import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const offers = await prisma.offer.findMany({
      where: {
        // Only show active offers
        // Add any additional filters here
      },
      select: {
        id: true,
        sku: true,
        name: true,
        priceCents: true,
        isSubscription: true,
        creditsValue: true,
        isCreditEligible: true,
        createdAt: true
      },
      orderBy: {
        priceCents: 'asc'
      }
    });

    // Format prices for display
    const formattedOffers = offers.map(offer => ({
      ...offer,
      price: (offer.priceCents / 100).toFixed(2),
      priceCents: undefined // Remove from response
    }));

    res.status(200).json(formattedOffers);

  } catch (error) {
    console.error('Offers fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
