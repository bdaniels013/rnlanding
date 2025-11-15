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
        return await getCustomers(req, res);
      case 'POST':
        return await createCustomer(req, res);
      case 'PUT':
        return await updateCustomer(req, res);
      case 'DELETE':
        return await deleteCustomer(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getCustomers(req, res) {
  const { page = 1, limit = 50, search = '' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: {
            id: true,
            totalCents: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        creditsLedger: {
          select: {
            delta: true,
            description: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        liveReviews: {
          select: {
            id: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.customer.count({ where })
  ]);

  // Calculate total credits for each customer
  const customersWithCredits = customers.map(customer => {
    const totalCredits = customer.creditsLedger.reduce((sum, entry) => sum + entry.delta, 0);
    const liveReviewsCount = Array.isArray(customer.liveReviews) ? customer.liveReviews.length : 0;
    return {
      ...customer,
      totalCredits,
      liveReviewsCount,
      creditsLedger: undefined // Remove detailed ledger from response
    };
  });

  res.status(200).json({
    customers: customersWithCredits,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function createCustomer(req, res) {
  const { name, email, phone, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if customer already exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { email }
  });

  if (existingCustomer) {
    return res.status(400).json({ error: 'Customer with this email already exists' });
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone: phone || null,
      notes: notes || null
    }
  });

  res.status(201).json(customer);
}

async function updateCustomer(req, res) {
  const { id } = req.query;
  const { name, email, phone, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check if email is being changed and if it conflicts
  const existingCustomer = await prisma.customer.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingCustomer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  if (email !== existingCustomer.email) {
    const emailConflict = await prisma.customer.findUnique({
      where: { email }
    });

    if (emailConflict) {
      return res.status(400).json({ error: 'Email already exists for another customer' });
    }
  }

  const customer = await prisma.customer.update({
    where: { id: parseInt(id) },
    data: {
      name,
      email,
      phone: phone || null,
      notes: notes || null
    }
  });

  res.status(200).json(customer);
}

async function deleteCustomer(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    include: {
      orders: true,
      creditsLedger: true
    }
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Check if customer has orders or credits
  if (customer.orders.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete customer with existing orders. Consider archiving instead.' 
    });
  }

  if (customer.creditsLedger.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete customer with credit history. Consider archiving instead.' 
    });
  }

  await prisma.customer.delete({
    where: { id: parseInt(id) }
  });

  res.status(200).json({ message: 'Customer deleted successfully' });
}
