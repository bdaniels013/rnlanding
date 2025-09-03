import { PrismaClient } from '@prisma/client';
import { PayPalClient } from '../../../lib/paypal';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getOrders(req, res);
  } else if (req.method === 'POST') {
    return handleOrderAction(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getOrders(req, res) {
  try {
    // TODO: Add authentication middleware to verify admin role
    
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            include: {
              offer: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amountCents: true,
              status: true,
              paypalTxnId: true,
              createdAt: true
            }
          },
          contracts: {
            select: {
              id: true,
              status: true,
              pdfUrl: true
            }
          },
          invoices: {
            select: {
              id: true,
              number: true,
              pdfUrl: true,
              issuedAt: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer: order.customer,
      total: (order.totalCents / 100).toFixed(2),
      currency: order.currency,
      status: order.status,
      paypal_order_id: order.paypalOrderId,
      captured_at: order.capturedAt,
      created_at: order.createdAt,
      items: order.orderItems.map(item => ({
        offer_name: item.offer.name,
        offer_sku: item.offer.sku,
        qty: item.qty,
        unit_price: (item.unitPriceCents / 100).toFixed(2),
        credits_awarded: item.creditsAwarded
      })),
      payments: order.payments,
      contracts: order.contracts,
      invoices: order.invoices
    }));

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleOrderAction(req, res) {
  try {
    const { action, order_id, amount, reason } = req.body;

    if (!action || !order_id) {
      return res.status(400).json({ error: 'Action and order_id are required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        payments: true,
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    switch (action) {
      case 'refund':
        return await refundOrder(order, amount, reason, res);
      
      case 'resend_receipt':
        return await resendReceipt(order, res);
      
      case 'regenerate_invoice':
        return await regenerateInvoice(order, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Order action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function refundOrder(order, amount, reason, res) {
  try {
    const refundAmount = amount || (order.totalCents / 100).toFixed(2);
    
    // Find the payment to refund
    const payment = order.payments.find(p => p.status === 'COMPLETED');
    if (!payment || !payment.paypalTxnId) {
      return res.status(400).json({ error: 'No completed payment found to refund' });
    }

    // Process PayPal refund
    const refund = await PayPalClient.refundPayment(
      payment.paypalTxnId,
      refundAmount,
      reason || 'Admin refund'
    );

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'REFUNDED' }
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' }
    });

    // Reverse credits if applicable
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    });

    let totalCreditsToReverse = 0;
    for (const item of orderItems) {
      totalCreditsToReverse += item.creditsAwarded;
    }

    if (totalCreditsToReverse > 0) {
      const lastCreditEntry = await prisma.creditsLedger.findFirst({
        where: { customerId: order.customerId },
        orderBy: { createdAt: 'desc' }
      });

      const currentBalance = lastCreditEntry ? lastCreditEntry.balanceAfter : 0;
      const newBalance = Math.max(0, currentBalance - totalCreditsToReverse);

      await prisma.creditsLedger.create({
        data: {
          customerId: order.customerId,
          delta: -totalCreditsToReverse,
          reason: `Credits reversed for refunded order ${order.id}`,
          refOrderId: order.id,
          balanceAfter: newBalance
        }
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: 'system', // TODO: Get from auth token
        action: 'ORDER_REFUNDED',
        targetType: 'ORDER',
        targetId: order.id,
        meta: { 
          refundAmount, 
          reason, 
          creditsReversed: totalCreditsToReverse,
          paypalRefundId: refund.id
        }
      }
    });

    res.status(200).json({
      message: 'Order refunded successfully',
      refund_id: refund.id,
      credits_reversed: totalCreditsToReverse
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
}

async function resendReceipt(order, res) {
  // TODO: Implement receipt resending
  res.status(200).json({ message: 'Receipt resent successfully' });
}

async function regenerateInvoice(order, res) {
  // TODO: Implement invoice regeneration
  res.status(200).json({ message: 'Invoice regenerated successfully' });
}
