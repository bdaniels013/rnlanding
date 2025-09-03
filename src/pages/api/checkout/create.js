import { PrismaClient } from '@prisma/client';
import { PayPalClient } from '../../../lib/paypal';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer_info, items, contract_template_id } = req.body;

    // Validate input
    if (!customer_info || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Validate customer info
    if (!customer_info.name || !customer_info.email) {
      return res.status(400).json({ error: 'Customer name and email are required' });
    }

    // Get or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: customer_info.email }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customer_info.name,
          email: customer_info.email,
          phone: customer_info.phone,
          socials: customer_info.socials || {}
        }
      });
    }

    // Validate and get offers
    const offerIds = items.map(item => item.offer_id);
    const offers = await prisma.offer.findMany({
      where: { id: { in: offerIds } }
    });

    if (offers.length !== offerIds.length) {
      return res.status(400).json({ error: 'One or more offers not found' });
    }

    // Calculate totals and credits
    let totalCents = 0;
    let totalCredits = 0;
    const orderItems = [];

    for (const item of items) {
      const offer = offers.find(o => o.id === item.offer_id);
      if (!offer) continue;

      const itemTotal = offer.priceCents * item.qty;
      const itemCredits = offer.isCreditEligible ? offer.creditsValue * item.qty : 0;

      totalCents += itemTotal;
      totalCredits += itemCredits;

      orderItems.push({
        offer_id: offer.id,
        qty: item.qty,
        unit_price_cents: offer.priceCents,
        credits_awarded: itemCredits
      });
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        totalCents,
        currency: 'USD',
        status: 'CREATED'
      }
    });

    // Create order items
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          offerId: item.offer_id,
          qty: item.qty,
          unitPriceCents: item.unit_price_cents,
          creditsAwarded: item.credits_awarded
        }
      });
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        customerId: customer.id,
        orderId: order.id,
        templateId: contract_template_id || 'standard-v1',
        status: 'DRAFT'
      }
    });

    // Create PayPal order
    const paypalOrder = await PayPalClient.createOrder({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.id,
        amount: {
          currency_code: 'USD',
          value: (totalCents / 100).toFixed(2)
        },
        description: `Rich Nick Offer - ${items.length} item(s)`
      }]
    });

    // Update order with PayPal ID
    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalOrder.id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: customer.userId || 'system',
        action: 'ORDER_CREATED',
        targetType: 'ORDER',
        targetId: order.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        meta: { 
          totalCents, 
          totalCredits, 
          itemCount: items.length,
          paypalOrderId: paypalOrder.id
        }
      }
    });

    res.status(201).json({
      order_id: order.id,
      paypal_order_id: paypalOrder.id,
      contract_preview_url: `/api/contracts/${contract.id}/preview`,
      total: (totalCents / 100).toFixed(2),
      credits_to_award: totalCredits,
      paypal_approval_url: paypalOrder.links.find(link => link.rel === 'approve')?.href
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
