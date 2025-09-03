import { PrismaClient } from '@prisma/client';
import { PayPalClient } from '../../../lib/paypal';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const isValid = PayPalClient.verifyWebhookSignature(
      req.headers,
      req.body,
      process.env.PAYPAL_WEBHOOK_ID
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event_type, resource } = req.body;

    // Store webhook payload for audit
    const webhookData = {
      event_type,
      resource,
      headers: req.headers,
      timestamp: new Date().toISOString()
    };

    // Handle different webhook events
    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(resource, webhookData);
        break;
      
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(resource, webhookData);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(resource, webhookData);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event_type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handlePaymentCompleted(resource, webhookData) {
  try {
    const { id: captureId, amount, seller_protection } = resource;
    
    // Find order by PayPal capture ID
    const payment = await prisma.payment.findFirst({
      where: { paypalTxnId: captureId },
      include: { order: true }
    });

    if (!payment) {
      console.error(`Payment not found for capture ID: ${captureId}`);
      return;
    }

    const order = payment.order;

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'COMPLETED',
        rawWebhook: webhookData
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: 'PAID',
        capturedAt: new Date()
      }
    });

    // Award credits
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    });

    let totalCredits = 0;
    for (const item of orderItems) {
      totalCredits += item.creditsAwarded;
    }

    if (totalCredits > 0) {
      // Get current credit balance
      const lastCreditEntry = await prisma.creditsLedger.findFirst({
        where: { customerId: order.customerId },
        orderBy: { createdAt: 'desc' }
      });

      const currentBalance = lastCreditEntry ? lastCreditEntry.balanceAfter : 0;
      const newBalance = currentBalance + totalCredits;

      // Create credit ledger entry
      await prisma.creditsLedger.create({
        data: {
          customerId: order.customerId,
          delta: totalCredits,
          reason: `Credits awarded for order ${order.id}`,
          refOrderId: order.id,
          balanceAfter: newBalance
        }
      });
    }

    // Generate invoice
    await generateInvoice(order.id);

    // Send notifications
    await sendPaymentNotifications(order.id);

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorUserId: 'system',
        action: 'PAYMENT_COMPLETED',
        targetType: 'ORDER',
        targetId: order.id,
        meta: { 
          captureId, 
          amount: amount.value, 
          creditsAwarded: totalCredits 
        }
      }
    });

  } catch (error) {
    console.error('Payment completed handling error:', error);
    throw error;
  }
}

async function handleOrderApproved(resource, webhookData) {
  // Handle order approval if needed
  console.log('Order approved:', resource.id);
}

async function handlePaymentDenied(resource, webhookData) {
  try {
    const { id: captureId } = resource;
    
    // Find and update payment status
    const payment = await prisma.payment.findFirst({
      where: { paypalTxnId: captureId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'FAILED',
          rawWebhook: webhookData
        }
      });
    }

  } catch (error) {
    console.error('Payment denied handling error:', error);
    throw error;
  }
}

async function generateInvoice(orderId) {
  // TODO: Implement invoice generation
  console.log('Generating invoice for order:', orderId);
}

async function sendPaymentNotifications(orderId) {
  // TODO: Implement email/SMS notifications
  console.log('Sending payment notifications for order:', orderId);
}
