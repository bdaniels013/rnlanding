import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseService {
  // Customer operations
  async getCustomers() {
    try {
      const customers = await prisma.customer.findMany({
        include: {
          creditsLedger: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        credits: customer.creditsLedger[0]?.balanceAfter || 0,
        updatedAt: customer.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes || null
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id, updateData) {
    try {
      const customer = await prisma.customer.update({
        where: { id },
        data: {
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone,
          notes: updateData.notes || null
        }
      });
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id) {
    try {
      await prisma.customer.delete({
        where: { id }
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Offer operations
  async getOffers(activeOnly = false) {
    try {
      const whereClause = activeOnly ? { isActive: true } : {};
      const offers = await prisma.offer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return offers.map(offer => ({
        id: offer.id,
        sku: offer.sku,
        name: offer.name,
        priceCents: offer.priceCents,
        isSubscription: offer.isSubscription,
        creditsValue: offer.creditsValue,
        isCreditEligible: offer.isCreditEligible,
        description: offer.description,
        features: offer.features ? JSON.parse(offer.features) : [],
        isActive: offer.isActive,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  }

  async createOffer(offerData) {
    try {
      const offer = await prisma.offer.create({
        data: {
          sku: offerData.sku,
          name: offerData.name,
          priceCents: parseInt(offerData.priceCents),
          isSubscription: Boolean(offerData.isSubscription),
          creditsValue: parseInt(offerData.creditsValue) || 0,
          isCreditEligible: Boolean(offerData.isCreditEligible),
          description: offerData.description || null,
          features: offerData.features ? JSON.stringify(offerData.features) : null,
          isActive: Boolean(offerData.isActive)
        }
      });

      return {
        id: offer.id,
        sku: offer.sku,
        name: offer.name,
        priceCents: offer.priceCents,
        isSubscription: offer.isSubscription,
        creditsValue: offer.creditsValue,
        isCreditEligible: offer.isCreditEligible,
        description: offer.description,
        features: offer.features ? JSON.parse(offer.features) : [],
        isActive: offer.isActive,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt
      };
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async updateOffer(id, updateData) {
    try {
      const offer = await prisma.offer.update({
        where: { id },
        data: {
          sku: updateData.sku,
          name: updateData.name,
          priceCents: parseInt(updateData.priceCents),
          isSubscription: Boolean(updateData.isSubscription),
          creditsValue: parseInt(updateData.creditsValue) || 0,
          isCreditEligible: Boolean(updateData.isCreditEligible),
          description: updateData.description || null,
          features: updateData.features ? JSON.stringify(updateData.features) : null,
          isActive: Boolean(updateData.isActive)
        }
      });

      return {
        id: offer.id,
        sku: offer.sku,
        name: offer.name,
        priceCents: offer.priceCents,
        isSubscription: offer.isSubscription,
        creditsValue: offer.creditsValue,
        isCreditEligible: offer.isCreditEligible,
        description: offer.description,
        features: offer.features ? JSON.parse(offer.features) : [],
        isActive: offer.isActive,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt
      };
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  }

  async deleteOffer(id) {
    try {
      await prisma.offer.delete({
        where: { id }
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }

  async getCustomerById(id) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          creditsLedger: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async getCustomerByEmail(email) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email },
        include: {
          creditsLedger: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      return customer;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      throw error;
    }
  }

  // Credits operations
  async addCredits(customerId, amount, reason, type = 'MANUAL_ADD', refOrderId = null) {
    try {
      // Get current balance
      const customer = await this.getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentBalance = customer.creditsLedger[0]?.balanceAfter || 0;
      const newBalance = currentBalance + amount;

      // Create credits ledger entry
      const ledgerEntry = await prisma.creditsLedger.create({
        data: {
          customerId,
          delta: amount,
          reason,
          balanceAfter: newBalance,
          refOrderId
        }
      });

      return {
        success: true,
        newBalance,
        ledgerEntry
      };
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  }

  async deductCredits(customerId, amount, reason, type = 'MANUAL_DEDUCT', refOrderId = null) {
    try {
      // Get current balance
      const customer = await this.getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentBalance = customer.creditsLedger[0]?.balanceAfter || 0;
      
      if (currentBalance < amount) {
        throw new Error('Insufficient credits');
      }

      const newBalance = currentBalance - amount;

      // Create credits ledger entry
      const ledgerEntry = await prisma.creditsLedger.create({
        data: {
          customerId,
          delta: -amount,
          reason,
          balanceAfter: newBalance,
          refOrderId
        }
      });

      return {
        success: true,
        newBalance,
        ledgerEntry
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  }

  async getCreditsHistory(customerId) {
    try {
      const history = await prisma.creditsLedger.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { id: true }
          }
        }
      });

      return history.map(entry => ({
        id: entry.id,
        customerId: entry.customerId,
        delta: entry.delta,
        reason: entry.reason,
        type: entry.delta > 0 ? 'CREDIT' : 'DEBIT',
        balance_after: entry.balanceAfter,
        created_at: entry.createdAt,
        admin_user: 'admin', // TODO: Get from auth context
        ref_order_id: entry.refOrderId
      }));
    } catch (error) {
      console.error('Error fetching credits history:', error);
      throw error;
    }
  }

  // Customer info captures (for tracking checkout flow)
  async captureCustomerInfo(customerInfo) {
    try {
      // Store the customer info capture
      const capture = await prisma.customerInfoCapture.create({
        data: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          action: customerInfo.action,
          selectedOffer: customerInfo.selectedOffer,
          timestamp: customerInfo.timestamp
        }
      });

      // Also create or update the customer record for the credits system
      await prisma.customer.upsert({
        where: { email: customerInfo.email },
        update: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          updatedAt: new Date()
        },
        create: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        }
      });

      return capture;
    } catch (error) {
      console.error('Error capturing customer info:', error);
      throw error;
    }
  }

  async getRecentCustomerInfoCaptures() {
    try {
      const captures = await prisma.customerInfoCapture.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return captures.map(capture => ({
        id: capture.id,
        name: capture.name,
        email: capture.email,
        phone: capture.phone || 'N/A',
        selectedOffer: capture.selectedOffer,
        action: capture.action,
        createdAt: capture.createdAt
      }));
    } catch (error) {
      console.error('Error fetching customer info captures:', error);
      throw error;
    }
  }

  // Dashboard data
  async getDashboardData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's revenue
      const todayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: 'PAID'
        }
      });

      const revenueToday = todayOrders.reduce((sum, order) => sum + order.totalCents, 0);

      // Get total customers
      const totalCustomers = await prisma.customer.count();

      // Get active subscriptions
      const activeSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      });

      // Get recent orders
      const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, email: true }
          },
          orderItems: {
            include: {
              offer: {
                select: { name: true }
              }
            }
          }
        }
      });

      const formattedOrders = recentOrders.map(order => ({
        id: order.id,
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        items: order.orderItems.map(item => `${item.qty}x ${item.offer.name}`).join(', '),
        total: (order.totalCents / 100).toFixed(2),
        status: order.status,
        created_at: order.createdAt
      }));

      // Calculate MRR and ARR (simplified)
      const subscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: {
          offer: true
        }
      });

      const mrr = subscriptions.reduce((sum, sub) => {
        if (sub.offer.isSubscription) {
          return sum + sub.offer.priceCents;
        }
        return sum;
      }, 0);

      const arr = mrr * 12;

      return {
        revenue_today: revenueToday / 100,
        orders_today: todayOrders.length,
        total_customers: totalCustomers,
        credits_outstanding: 0, // TODO: Calculate from credits ledger
        active_subscriptions: activeSubscriptions,
        mrr: mrr / 100,
        arr: arr / 100,
        upcoming_platform_slots: [], // TODO: Implement platform slots
        recent_orders: formattedOrders,
        alerts: [] // TODO: Implement alerts system
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Order operations
  async createOrder(orderData) {
    try {
      const order = await prisma.order.create({
        data: {
          customerId: orderData.customerId,
          totalCents: orderData.totalCents,
          currency: orderData.currency || 'USD',
          status: orderData.status || 'CREATED',
          paypalOrderId: orderData.paypalOrderId
        }
      });
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status, paypalOrderId = null) {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          paypalOrderId,
          capturedAt: status === 'PAID' ? new Date() : null
        }
      });
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async processPaymentSuccess(paypalOrderId, customerEmail, items) {
    try {
      // Find or create customer
      let customer = await this.getCustomerByEmail(customerEmail);
      if (!customer) {
        // Create customer if they don't exist
        customer = await this.createCustomer({
          name: customerEmail.split('@')[0], // Use email prefix as name
          email: customerEmail,
          phone: null
        });
      }

      // Calculate total and credits
      let totalCents = 0;
      let totalCredits = 0;
      const orderItems = [];

      // Fetch offers to get current pricing
      const offers = await prisma.offer.findMany();
      
      for (const item of items) {
        const offer = offers.find(o => o.id === item.offer_id);
        if (offer) {
          totalCents += offer.priceCents * item.qty;
          totalCredits += offer.isCreditEligible ? offer.creditsValue * item.qty : 0;
          
          orderItems.push({
            offerId: offer.id,
            qty: item.qty,
            unitPriceCents: offer.priceCents,
            creditsAwarded: offer.isCreditEligible ? offer.creditsValue * item.qty : 0
          });
        }
      }

      // Create order
      const order = await this.createOrder({
        customerId: customer.id,
        totalCents,
        currency: 'USD',
        status: 'PAID',
        paypalOrderId
      });

      // Create order items
      for (const item of orderItems) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            offerId: item.offerId,
            qty: item.qty,
            unitPriceCents: item.unitPriceCents,
            creditsAwarded: item.creditsAwarded
          }
        });
      }

      // Award credits if any
      if (totalCredits > 0) {
        const currentBalance = customer.creditsLedger[0]?.balanceAfter || 0;
        const newBalance = currentBalance + totalCredits;

        await prisma.creditsLedger.create({
          data: {
            customerId: customer.id,
            delta: totalCredits,
            reason: `Payment for order ${order.id}`,
            refOrderId: order.id,
            balanceAfter: newBalance
          }
        });

        console.log(`✅ Awarded ${totalCredits} credits to ${customer.email}. New balance: ${newBalance}`);
      }

      return {
        order,
        customer,
        creditsAwarded: totalCredits
      };
    } catch (error) {
      console.error('Error processing payment success:', error);
      throw error;
    }
  }

  async processSubscriptionPayment(subscriptionId, customerEmail, amountCents) {
    try {
      // Find or create customer
      let customer = await this.getCustomerByEmail(customerEmail);
      if (!customer) {
        customer = await this.createCustomer({
          name: customerEmail.split('@')[0],
          email: customerEmail,
          phone: null
        });
      }

      // Create subscription record
      const subscription = await prisma.subscription.create({
        data: {
          customerId: customer.id,
          offerId: 'content-management', // Default to content management subscription
          status: 'ACTIVE',
          startAt: new Date(),
          paypalSubId: subscriptionId
        }
      });

      console.log(`✅ Created subscription for ${customer.email}: ${subscription.id}`);

      return {
        subscription,
        customer
      };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();
export default db;
