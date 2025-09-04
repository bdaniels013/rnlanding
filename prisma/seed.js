import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@richhnick.com' },
    update: {},
    create: {
      email: 'admin@richhnick.com',
      passwordHash: adminPassword,
      role: 'OWNER',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create offers based on Rich Nick's updated specification
  const offers = [
    {
      sku: 'monthly-creator-pass',
      name: 'Sign up for a month',
      priceCents: 100000, // $1,000
      isSubscription: true,
      creditsValue: 1,
      isCreditEligible: true,
    },
    {
      sku: 'annual-plan',
      name: '1 year @ $10k',
      priceCents: 1000000, // $10,000
      isSubscription: true,
      creditsValue: 12,
      isCreditEligible: true,
    },
    {
      sku: 'content-management',
      name: 'Ongoing Content Management Services',
      priceCents: 150000, // $1,500
      isSubscription: true,
      creditsValue: 0,
      isCreditEligible: false,
    },
  ];

  for (const offer of offers) {
    await prisma.offer.upsert({
      where: { sku: offer.sku },
      update: offer,
      create: offer,
    });
    console.log(`✅ Offer created: ${offer.name} - $${(offer.priceCents / 100).toFixed(2)}`);
  }

  // Create sample platform slots based on Rich Nick's specification
  const platformSlots = [
    {
      name: 'Famous Animal Feature',
      partner: 'Famous Animal',
      slotAt: new Date('2025-10-01T10:00:00Z'),
      status: 'AVAILABLE',
      notes: 'Monthly feature slot on Famous Animal platform - 2 credits required',
    },
    {
      name: 'The Debut Feature',
      partner: 'The Debut',
      slotAt: new Date('2025-10-15T14:00:00Z'),
      status: 'AVAILABLE',
      notes: 'Bi-weekly feature slot on The Debut platform - 2 credits required',
    },
    {
      name: 'We Go Tampa Feature',
      partner: 'We Go Tampa',
      slotAt: new Date('2025-10-30T16:00:00Z'),
      status: 'AVAILABLE',
      notes: 'Monthly feature slot on We Go Tampa platform - 2 credits required',
    },
    {
      name: 'Ugly Money Podcast Feature',
      partner: 'Ugly Money Podcast',
      slotAt: new Date('2025-11-01T12:00:00Z'),
      status: 'AVAILABLE',
      notes: 'Weekly podcast feature slot - 2 credits required',
    },
  ];

  for (const slot of platformSlots) {
    await prisma.platformSlot.upsert({
      where: { 
        name_partner: {
          name: slot.name,
          partner: slot.partner
        }
      },
      update: slot,
      create: slot,
    });
    console.log(`✅ Platform slot created: ${slot.name} - ${slot.partner}`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
