import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create offers
  const offers = [
    {
      sku: 'monthly-creator-pass',
      name: 'Sign up for a month',
      priceCents: 100000, // $1,000
      isSubscription: false,
      creditsValue: 1,
      isCreditEligible: true
    },
    {
      sku: 'annual-plan',
      name: '1 year @ $10k',
      priceCents: 1000000, // $10,000
      isSubscription: false,
      creditsValue: 12,
      isCreditEligible: true
    },
    {
      sku: 'content-management',
      name: 'Ongoing Content Management Services',
      priceCents: 150000, // $1,500
      isSubscription: true,
      creditsValue: 0,
      isCreditEligible: false
    }
  ];

  console.log('📦 Creating offers...');
  for (const offer of offers) {
    await prisma.offer.upsert({
      where: { sku: offer.sku },
      update: offer,
      create: offer
    });
    console.log(`✅ Created/updated offer: ${offer.name}`);
  }

  // Create sample customers
  const customers = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0123'
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1-555-0124'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+1-555-0125'
    }
  ];

  console.log('👥 Creating sample customers...');
  for (const customer of customers) {
    const createdCustomer = await prisma.customer.upsert({
      where: { email: customer.email },
      update: customer,
      create: customer
    });
    console.log(`✅ Created/updated customer: ${customer.name}`);

    // Add some sample credits for each customer
    const creditsAmount = Math.floor(Math.random() * 10) + 1;
    await prisma.creditsLedger.create({
      data: {
        customerId: createdCustomer.id,
        delta: creditsAmount,
        reason: 'Initial credits for testing',
        balanceAfter: creditsAmount
      }
    });
    console.log(`✅ Added ${creditsAmount} credits to ${customer.name}`);
  }

  // Create sample orders
  console.log('🛒 Creating sample orders...');
  const sampleCustomers = await prisma.customer.findMany();
  const sampleOffers = await prisma.offer.findMany();

  for (let i = 0; i < 5; i++) {
    const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const offer = sampleOffers[Math.floor(Math.random() * sampleOffers.length)];
    
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        totalCents: offer.priceCents,
        currency: 'USD',
        status: 'PAID',
        paypalOrderId: `paypal_${Date.now()}_${i}`,
        capturedAt: new Date()
      }
    });

    // Create order item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        offerId: offer.id,
        qty: 1,
        unitPriceCents: offer.priceCents,
        creditsAwarded: offer.isCreditEligible ? offer.creditsValue : 0
      }
    });

    // Award credits if applicable
    if (offer.isCreditEligible) {
      const currentBalance = await prisma.creditsLedger.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' }
      });

      const newBalance = (currentBalance?.balanceAfter || 0) + offer.creditsValue;

      await prisma.creditsLedger.create({
        data: {
          customerId: customer.id,
          delta: offer.creditsValue,
          reason: `Payment for ${offer.name}`,
          refOrderId: order.id,
          balanceAfter: newBalance
        }
      });
    }

    console.log(`✅ Created order for ${customer.name}: ${offer.name}`);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
