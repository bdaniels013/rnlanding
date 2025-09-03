import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return createBooking(req, res);
  } else if (req.method === 'GET') {
    return getBookings(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function createBooking(req, res) {
  try {
    const { customer_id, type, ref_id, slot_at } = req.body;

    // Validate input
    if (!customer_id || !type || !ref_id) {
      return res.status(400).json({ error: 'Customer ID, type, and ref_id are required' });
    }

    if (!['EVENT', 'PLATFORM'].includes(type)) {
      return res.status(400).json({ error: 'Type must be EVENT or PLATFORM' });
    }

    // Get customer's current credit balance
    const lastCreditEntry = await prisma.creditsLedger.findFirst({
      where: { customerId: customer_id },
      orderBy: { createdAt: 'desc' }
    });

    const currentBalance = lastCreditEntry ? lastCreditEntry.balanceAfter : 0;
    
    // Determine credits needed
    const creditsNeeded = type === 'EVENT' ? 1 : 2; // EVENT = 1 credit, PLATFORM = 2 credits

    // Check if customer has enough credits
    if (currentBalance < creditsNeeded) {
      return res.status(400).json({ 
        error: `Insufficient credits. Need ${creditsNeeded}, have ${currentBalance}` 
      });
    }

    // For platform bookings, check if slot is available
    if (type === 'PLATFORM') {
      const platformSlot = await prisma.platformSlot.findUnique({
        where: { id: ref_id }
      });

      if (!platformSlot || platformSlot.status !== 'AVAILABLE') {
        return res.status(400).json({ error: 'Platform slot not available' });
      }

      // Hold the slot
      await prisma.platformSlot.update({
        where: { id: ref_id },
        data: { status: 'HELD' }
      });
    }

    // Create booking with PENDING status
    const booking = await prisma.booking.create({
      data: {
        customerId: customer_id,
        type,
        refId: ref_id,
        slotAt: slot_at ? new Date(slot_at) : null,
        creditsSpent: creditsNeeded,
        status: 'PENDING'
      }
    });

    // Create a hold entry in credits ledger
    const newBalance = currentBalance - creditsNeeded;
    await prisma.creditsLedger.create({
      data: {
        customerId: customer_id,
        delta: -creditsNeeded,
        reason: `Credits held for ${type.toLowerCase()} booking ${booking.id}`,
        refBookingId: booking.id,
        balanceAfter: newBalance
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: 'system', // TODO: Get from auth token
        action: 'BOOKING_CREATED',
        targetType: 'BOOKING',
        targetId: booking.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        meta: { 
          type, 
          creditsSpent: creditsNeeded, 
          refId: ref_id 
        }
      }
    });

    res.status(201).json({
      booking_id: booking.id,
      credits_spent: creditsNeeded,
      remaining_credits: newBalance,
      status: 'PENDING',
      message: 'Booking created successfully. Awaiting confirmation.'
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getBookings(req, res) {
  try {
    const { customer_id } = req.query;

    if (!customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId: customer_id },
      orderBy: { createdAt: 'desc' },
      include: {
        creditsLedger: true
      }
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      type: booking.type,
      ref_id: booking.refId,
      slot_at: booking.slotAt,
      credits_spent: booking.creditsSpent,
      status: booking.status,
      created_at: booking.createdAt,
      updated_at: booking.updatedAt
    }));

    res.status(200).json(formattedBookings);

  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
