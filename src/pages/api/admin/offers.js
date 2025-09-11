import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Basic auth check (you should implement proper JWT auth)
  const authHeader = req.headers['x-admin-auth'];
  if (authHeader !== 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getOffers(req, res);
      case 'POST':
        return await createOffer(req, res);
      case 'PUT':
        return await updateOffer(req, res);
      case 'DELETE':
        return await deleteOffer(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Offers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getOffers(req, res) {
  const { page = 1, limit = 50, search = '' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          select: {
            id: true,
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    }),
    prisma.offer.count({ where })
  ]);

  // Calculate sales metrics for each offer
  const offersWithMetrics = offers.map(offer => {
    const totalSales = offer.orderItems.length;
    const paidSales = offer.orderItems.filter(item => item.order.status === 'PAID').length;
    const totalRevenue = offer.orderItems
      .filter(item => item.order.status === 'PAID')
      .reduce((sum, item) => sum + offer.priceCents, 0);

    return {
      ...offer,
      totalSales,
      paidSales,
      totalRevenue,
      orderItems: undefined // Remove detailed order items from response
    };
  });

  res.status(200).json({
    offers: offersWithMetrics,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function createOffer(req, res) {
  const { 
    sku, 
    name, 
    priceCents, 
    isSubscription, 
    creditsValue, 
    isCreditEligible,
    description,
    features,
    isActive = true
  } = req.body;

  if (!sku || !name || !priceCents) {
    return res.status(400).json({ error: 'SKU, name, and price are required' });
  }

  // Check if SKU already exists
  const existingOffer = await prisma.offer.findUnique({
    where: { sku }
  });

  if (existingOffer) {
    return res.status(400).json({ error: 'Offer with this SKU already exists' });
  }

  const offer = await prisma.offer.create({
    data: {
      sku,
      name,
      priceCents: parseInt(priceCents),
      isSubscription: Boolean(isSubscription),
      creditsValue: parseInt(creditsValue) || 0,
      isCreditEligible: Boolean(isCreditEligible),
      description: description || null,
      features: features ? JSON.stringify(features) : null,
      isActive: Boolean(isActive)
    }
  });

  res.status(201).json(offer);
}

async function updateOffer(req, res) {
  const { id } = req.query;
  const { 
    sku, 
    name, 
    priceCents, 
    isSubscription, 
    creditsValue, 
    isCreditEligible,
    description,
    features,
    isActive
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Offer ID is required' });
  }

  if (!sku || !name || !priceCents) {
    return res.status(400).json({ error: 'SKU, name, and price are required' });
  }

  // Check if offer exists
  const existingOffer = await prisma.offer.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingOffer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  // Check if SKU is being changed and if it conflicts
  if (sku !== existingOffer.sku) {
    const skuConflict = await prisma.offer.findUnique({
      where: { sku }
    });

    if (skuConflict) {
      return res.status(400).json({ error: 'SKU already exists for another offer' });
    }
  }

  const offer = await prisma.offer.update({
    where: { id: parseInt(id) },
    data: {
      sku,
      name,
      priceCents: parseInt(priceCents),
      isSubscription: Boolean(isSubscription),
      creditsValue: parseInt(creditsValue) || 0,
      isCreditEligible: Boolean(isCreditEligible),
      description: description || null,
      features: features ? JSON.stringify(features) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : existingOffer.isActive
    }
  });

  res.status(200).json(offer);
}

async function deleteOffer(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Offer ID is required' });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: parseInt(id) },
    include: {
      orderItems: true
    }
  });

  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  // Check if offer has been used in orders
  if (offer.orderItems.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete offer that has been used in orders. Consider deactivating instead.' 
    });
  }

  await prisma.offer.delete({
    where: { id: parseInt(id) }
  });

  res.status(200).json({ message: 'Offer deleted successfully' });
}
