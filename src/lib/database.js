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
          phone: customerData.phone
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
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
      // Store in a simple JSON field for now, or create a separate table
      const capture = await prisma.customer.upsert({
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

      // Also store the capture event in audit logs
      await prisma.auditLog.create({
        data: {
          actorUserId: 'system', // TODO: Get from auth context
          action: 'CUSTOMER_INFO_CAPTURED',
          targetType: 'CUSTOMER',
          targetId: capture.id,
          meta: {
            action: customerInfo.action,
            selectedOffer: customerInfo.selectedOffer,
            timestamp: customerInfo.timestamp
          }
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
      const captures = await prisma.auditLog.findMany({
        where: {
          action: 'CUSTOMER_INFO_CAPTURED'
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          actorUser: {
            select: { email: true }
          }
        }
      });

      return captures.map(capture => ({
        id: capture.id,
        name: capture.meta?.name || 'Unknown',
        email: capture.meta?.email || 'Unknown',
        phone: capture.meta?.phone || 'N/A',
        selectedOffer: capture.meta?.selectedOffer || 'Unknown',
        action: capture.meta?.action || 'checkout_started',
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
}

export const db = new DatabaseService();
export default db;
