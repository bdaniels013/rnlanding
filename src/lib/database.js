import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export class DatabaseService {
  // Backfill operations
  async backfillCapturedAtForPaidOrders() {
    try {
      // Find PAID orders missing capturedAt
      const missing = await prisma.order.findMany({
        where: { status: 'PAID', capturedAt: null },
        include: { payments: true }
      });

      let updated = 0;
      const updates = [];

      for (const order of missing) {
        // Prefer the timestamp of a COMPLETED payment if available
        const completedPayment = order.payments.find(p => p.status === 'COMPLETED');
        const ts = completedPayment?.createdAt || order.updatedAt || order.createdAt || new Date();
        updates.push(
          prisma.order.update({
            where: { id: order.id },
            data: { capturedAt: ts }
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        updated = updates.length;
      }

      return {
        totalPaidMissing: missing.length,
        updated
      };
    } catch (error) {
      console.error('Error backfilling capturedAt for paid orders:', error);
      throw error;
    }
  }
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
        orderBy: { order: 'asc' }
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
        badge: offer.badge,
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
          badge: updateData.badge || null,
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
        badge: offer.badge,
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

  async reorderOffers(offers) {
    try {
      // Update each offer with its new order
      const updatePromises = offers.map((offer, index) => 
        prisma.offer.update({
          where: { id: offer.id },
          data: { order: index }
        })
      );
      
      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error reordering offers:', error);
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

  // Social Media Photos operations
  async getSocialMediaPhotos(platform = null, activeOnly = true) {
    try {
      const where = {};
      if (platform) {
        where.platform = platform;
      }
      if (activeOnly) {
        where.isActive = true;
      }

      const photos = await prisma.socialMediaPhoto.findMany({
        where,
        orderBy: [
          { platform: 'asc' },
          { order: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      return photos;
    } catch (error) {
      console.error('Error fetching social media photos:', error);
      throw error;
    }
  }

  async createSocialMediaPhoto(photoData) {
    try {
      const photo = await prisma.socialMediaPhoto.create({
        data: {
          platform: photoData.platform,
          filename: photoData.filename,
          originalName: photoData.originalName,
          url: photoData.url,
          imageData: photoData.imageData || null,
          altText: photoData.altText || null,
          order: photoData.order || 0,
          isActive: photoData.isActive !== undefined ? photoData.isActive : true
        }
      });
      return photo;
    } catch (error) {
      console.error('Error creating social media photo:', error);
      throw error;
    }
  }

  async updateSocialMediaPhoto(id, updateData) {
    try {
      const photo = await prisma.socialMediaPhoto.update({
        where: { id },
        data: {
          platform: updateData.platform,
          filename: updateData.filename,
          originalName: updateData.originalName,
          url: updateData.url,
          imageData: updateData.imageData,
          altText: updateData.altText,
          order: updateData.order,
          isActive: updateData.isActive
        }
      });
      return photo;
    } catch (error) {
      console.error('Error updating social media photo:', error);
      throw error;
    }
  }

  async deleteSocialMediaPhoto(id) {
    try {
      await prisma.socialMediaPhoto.delete({
        where: { id }
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting social media photo:', error);
      throw error;
    }
  }

  async reorderSocialMediaPhotos(photoIds) {
    try {
      const updates = photoIds.map((id, index) => 
        prisma.socialMediaPhoto.update({
          where: { id },
          data: { order: index }
        })
      );
      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error reordering social media photos:', error);
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
      const capture = await prisma.customerInfoCapture.create({
        data: {
          name: customerInfo.name,
          email: customerInfo.email || '',
          phone: customerInfo.phone || null,
          platform: customerInfo.platform || null,
          username: customerInfo.username || null,
          action: customerInfo.action,
          selectedOffer: customerInfo.selectedOffer,
          timestamp: customerInfo.timestamp
        }
      });

      // Only upsert a Customer record when a valid email is provided
      if (customerInfo.email && customerInfo.email.includes('@')) {
        await prisma.customer.upsert({
          where: { email: customerInfo.email },
          update: {
            name: customerInfo.name,
            phone: customerInfo.phone || null,
            updatedAt: new Date()
          },
          create: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone || null
          }
        });
      }

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
      // Define period boundaries
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

      // Monday as start of week
      const startOfWeek = new Date(startOfToday);
      const day = startOfToday.getDay(); // 0=Sun,1=Mon,...
      const daysSinceMonday = (day + 6) % 7; // Sun->6, Mon->0
      startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Helper to fetch orders and revenue for a period using capturedAt (actual payment time)
      const getOrdersAndRevenue = async (gteDate, ltOrLteDate, useLt = true) => {
        const where = {
          status: 'PAID',
          capturedAt: {
            gte: gteDate,
            ...(useLt ? { lt: ltOrLteDate } : { lte: ltOrLteDate })
          }
        };
        const [ordersCount, revenueAgg] = await Promise.all([
          prisma.order.count({ where }),
          prisma.order.aggregate({ where, _sum: { totalCents: true } })
        ]);
        return {
          orders: ordersCount,
          revenueCents: revenueAgg._sum.totalCents || 0
        };
      };

      // Period metrics
      const [dayMetrics, weekMetrics, monthMetrics] = await Promise.all([
        getOrdersAndRevenue(startOfToday, startOfTomorrow, true),
        getOrdersAndRevenue(startOfWeek, now, false),
        getOrdersAndRevenue(startOfMonth, now, false)
      ]);

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

      // Category metrics for Live Reviews and Shoutouts
      const offerMatches = (keyword) => {
        const base = [
          { name: { contains: keyword, mode: 'insensitive' } },
          { sku: { contains: keyword, mode: 'insensitive' } }
        ];
        // Ensure Live Review metrics include the dedicated music-submission SKU
        if (/live\s*review/i.test(keyword)) {
          base.push({ sku: { equals: 'music-submission' } });
        }
        return { OR: base };
      };

      const sumItemsCents = (items) => items.reduce((sum, it) => sum + (it.unitPriceCents * it.qty), 0);

      const getCategoryMetrics = async (keyword, gteDate, ltOrLteDate, useLt = true) => {
        const where = {
          order: {
            status: 'PAID',
            capturedAt: {
              gte: gteDate,
              ...(useLt ? { lt: ltOrLteDate } : { lte: ltOrLteDate })
            }
          },
          offer: offerMatches(keyword)
        };
        const items = await prisma.orderItem.findMany({
          where,
          select: { orderId: true, qty: true, unitPriceCents: true }
        });
        const uniqueOrders = new Set(items.map(i => i.orderId));
        return {
          orders: uniqueOrders.size,
          revenueCents: sumItemsCents(items)
        };
      };

      const [
        liveDay, liveWeek, liveMonth,
        shoutDay, shoutWeek, shoutMonth
      ] = await Promise.all([
        getCategoryMetrics('live review', startOfToday, startOfTomorrow, true),
        getCategoryMetrics('live review', startOfWeek, now, false),
        getCategoryMetrics('live review', startOfMonth, now, false),
        getCategoryMetrics('shoutout', startOfToday, startOfTomorrow, true),
        getCategoryMetrics('shoutout', startOfWeek, now, false),
        getCategoryMetrics('shoutout', startOfMonth, now, false)
      ]);

      return {
        // Back-compat fields (based on capturedAt)
        revenue_today: dayMetrics.revenueCents / 100,
        orders_today: dayMetrics.orders,
        // New period-based aggregates
        revenue_period: {
          day: dayMetrics.revenueCents / 100,
          week: weekMetrics.revenueCents / 100,
          month: monthMetrics.revenueCents / 100
        },
        orders_period: {
          day: dayMetrics.orders,
          week: weekMetrics.orders,
          month: monthMetrics.orders
        },
        // Category breakdowns
        live_reviews: {
          day: { orders: liveDay.orders, revenue: liveDay.revenueCents / 100 },
          week: { orders: liveWeek.orders, revenue: liveWeek.revenueCents / 100 },
          month: { orders: liveMonth.orders, revenue: liveMonth.revenueCents / 100 }
        },
        shoutouts: {
          day: { orders: shoutDay.orders, revenue: shoutDay.revenueCents / 100 },
          week: { orders: shoutWeek.orders, revenue: shoutWeek.revenueCents / 100 },
          month: { orders: shoutMonth.orders, revenue: shoutMonth.revenueCents / 100 }
        },
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

  // NMI Gateway Sync
  async syncNMIGatewayTransactions({ startDate, endDate } = {}) {
    try {
      const apiKey = process.env.PAYMENT_CLOUD_SECRET_KEY;
      const nmiUser = process.env.NMI_USERNAME;
      const nmiPass = process.env.NMI_PASSWORD;
      if (!apiKey) {
        throw new Error('Missing PAYMENT_CLOUD_SECRET_KEY');
      }

      // Default range: last 30 days
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const s = startDate ? new Date(startDate) : defaultStart;
      const e = endDate ? new Date(endDate) : now;

      const fmtISO = (d) => {
        // YYYY-MM-DD (ISO date only)
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const fmtUS = (d) => {
        // MM/DD/YYYY
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const yyyy = d.getUTCFullYear();
        return `${mm}/${dd}/${yyyy}`;
      };

      const buildParams = (opts) => {
        const p = new URLSearchParams({
          report_type: 'transaction',
          format: 'xml',
          ...opts
        });
        // Prefer security_key, but allow username/password if provided
        if (apiKey) {
          p.set('security_key', apiKey);
        }
        if (nmiUser && nmiPass) {
          p.set('username', nmiUser);
          p.set('password', nmiPass);
        }
        return p;
      };

      const tryQuery = async (url, params) => {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const text = await resp.text();
        if (!resp.ok) {
          throw new Error(`NMI query failed: ${resp.status} ${text}`);
        }
        const transactions = parseNMIQueryXML(text);
        return { text, transactions };
      };

      // Attempt 1: ISO date format, default query_by
      const domains = [
        'https://secure.nmi.com/api/query.php',
        'https://secure.networkmerchants.com/api/query.php'
      ];

      let text = '';
      let transactions = [];

      // Attempt 1: ISO date format, default query_by
      for (const domain of domains) {
        const baseParams1 = buildParams({
          start_date: fmtISO(s),
          end_date: fmtISO(e),
          condition: 'complete'
        });
        ({ text, transactions } = await tryQuery(domain, baseParams1));
        if (transactions && transactions.length) break;
      }

      // If no transactions, Attempt 2: US date format (MM/DD/YYYY)
      if (!transactions || transactions.length === 0) {
        for (const domain of domains) {
          const baseParams2 = buildParams({
            start_date: fmtUS(s),
            end_date: fmtUS(e),
            condition: 'complete'
          });
          ({ text, transactions } = await tryQuery(domain, baseParams2));
          if (transactions && transactions.length) break;
        }
      }

      // If still none, Attempt 3: Explicit query_by transaction_date
      if (!transactions || transactions.length === 0) {
        for (const domain of domains) {
          const baseParams3 = buildParams({
            start_date: fmtUS(s),
            end_date: fmtUS(e),
            query_by: 'transaction_date',
            condition: 'complete'
          });
          ({ text, transactions } = await tryQuery(domain, baseParams3));
          if (transactions && transactions.length) break;
        }
      }

      // If still none, Attempt 4: condition closed (some processors)
      if (!transactions || transactions.length === 0) {
        for (const domain of domains) {
          const baseParams4 = buildParams({
            start_date: fmtUS(s),
            end_date: fmtUS(e),
            query_by: 'transaction_date',
            condition: 'closed'
          });
          ({ text, transactions } = await tryQuery(domain, baseParams4));
          if (transactions && transactions.length) break;
        }
      }

      // If still none, Attempt 5: omit condition
      if (!transactions || transactions.length === 0) {
        for (const domain of domains) {
          const baseParams5 = buildParams({
            start_date: fmtUS(s),
            end_date: fmtUS(e),
            query_by: 'transaction_date'
          });
          ({ text, transactions } = await tryQuery(domain, baseParams5));
          if (transactions && transactions.length) break;
        }
      }

      // If still none, Attempt 6: alternate query_by values common in NMI
      if (!transactions || transactions.length === 0) {
        const altQueryBy = ['transaction_create_date', 'settlement_date', 'last_modified'];
        for (const domain of domains) {
          for (const qb of altQueryBy) {
            const p = buildParams({
              start_date: fmtUS(s),
              end_date: fmtUS(e),
              query_by: qb
            });
            ({ text, transactions } = await tryQuery(domain, p));
            if (transactions && transactions.length) break;
          }
          if (transactions && transactions.length) break;
        }
      }

      // If the response had no transactions, log a concise diagnostic
      if (!transactions || transactions.length === 0) {
        const preview = (text || '').slice(0, 200).replace(/\s+/g, ' ').trim();
        console.warn('NMI query returned zero transactions for range', {
          start: fmtUS(s),
          end: fmtUS(e),
          preview
        });
      }

      let reconciled = 0;
      let updatedCapturedAt = 0;
      let notMatched = 0;
      let imported = 0;

      for (const tx of transactions) {
        const txnId = tx.transaction_id;
        if (!txnId) {
          continue;
        }
        const payment = await prisma.payment.findFirst({ where: { paypalTxnId: txnId } });
        if (payment) {
          // Ensure payment is completed
          if (payment.status !== 'COMPLETED') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED' }
            });
          }

          // Update order capturedAt from gateway timestamp if available
          const tsStr = tx.timestamp || tx.date;
          if (tsStr) {
            const ts = new Date(tsStr);
            const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
            if (order && !order.capturedAt) {
              await prisma.order.update({ where: { id: order.id }, data: { capturedAt: ts } });
              updatedCapturedAt++;
            }
          }

          reconciled++;
        } else {
          // Import unmatched transaction as a paid order with payment
          try {
            const amountCents = tx.amount ? Math.round(parseFloat(tx.amount) * 100) : 0;
            const tsStr = tx.timestamp || tx.date;
            const capturedTs = tsStr ? new Date(tsStr) : new Date();

            const rawEmail = (tx.email || '').trim();
            const safeEmail = rawEmail.length ? rawEmail : `noemail-${txnId}@placeholder.local`;

            // Find or create customer
            let customer = await prisma.customer.findUnique({ where: { email: safeEmail } });
            if (!customer) {
              customer = await prisma.customer.create({
                data: {
                  name: rawEmail ? rawEmail.split('@')[0] : 'Unknown',
                  email: safeEmail,
                  phone: null,
                  notes: 'Created via NMI gateway import'
                }
              });
            }

            // Choose offer: prefer price match; otherwise prefer Live Review; otherwise first active offer
            const offers = await prisma.offer.findMany();
            const priceMatches = amountCents ? offers.filter(o => o.priceCents === amountCents) : [];
            const liveReviewMatch = (list) => list.find(o =>
              (o.name && /live\s*review/i.test(o.name)) || (o.sku && /live/i.test(o.sku))
            );
            let offer = null;
            if (priceMatches.length > 0) {
              offer = liveReviewMatch(priceMatches) || priceMatches[0];
            } else {
              offer = liveReviewMatch(offers) || offers[0] || null;
            }

            // If no offers exist, we cannot import the transaction meaningfully
            if (!offer) {
              notMatched++;
              continue;
            }

            // Create order with one item and completed payment
            const order = await prisma.order.create({
              data: {
                customerId: customer.id,
                totalCents: amountCents || offer.priceCents,
                currency: 'USD',
                status: 'PAID',
                capturedAt: capturedTs,
                orderItems: {
                  create: {
                    offerId: offer.id,
                    qty: 1,
                    unitPriceCents: amountCents || offer.priceCents,
                    creditsAwarded: offer.creditsValue || 0
                  }
                },
                payments: {
                  create: {
                    amountCents: amountCents || offer.priceCents,
                    status: 'COMPLETED',
                    paypalTxnId: txnId
                  }
                }
              }
            });

            // Link to existing live review for this customer if present
            const pendingLiveReview = await prisma.liveReview.findFirst({
              where: { customerId: customer.id, orderId: null },
              orderBy: { createdAt: 'desc' }
            });
            if (pendingLiveReview) {
              await prisma.liveReview.update({
                where: { id: pendingLiveReview.id },
                data: { orderId: order.id }
              });
            }

            imported++;
          } catch (importErr) {
            console.error('Failed to import NMI transaction', txnId, importErr);
            notMatched++;
          }
        }
      }

      return {
        message: `NMI sync complete: ${reconciled} reconciled, ${updatedCapturedAt} capturedAt updated, ${imported} imported, ${notMatched} unmatched (total ${transactions.length})`,
        total: transactions.length,
        reconciled,
        updatedCapturedAt,
        imported,
        unmatched: notMatched
      };
    } catch (error) {
      console.error('Error syncing NMI gateway transactions:', error);
      throw error;
    }
  }
}

// Minimal XML parser for NMI Query API response
function parseNMIQueryXML(xmlText) {
  try {
    const txBlocks = [...xmlText.matchAll(/<transaction>([\s\S]*?)<\/transaction>/g)].map(m => m[1]);

    const get = (block, tag) => {
      const m = block.match(new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`));
      return m ? m[1].trim() : null;
    };

    const getAny = (block, tags) => {
      for (const t of tags) {
        const val = get(block, t);
        if (val !== null && val !== undefined) return val;
      }
      return null;
    };

    return txBlocks.map(block => ({
      // Support multiple NMI field variants
      transaction_id: getAny(block, ['transaction_id', 'transactionid', 'txn_id', 'id']),
      order_id: getAny(block, ['order_id', 'orderid']),
      order_description: getAny(block, ['order_description', 'orderdescription', 'description']),
      amount: getAny(block, ['amount', 'amount_authorized']),
      condition: getAny(block, ['condition', 'status']),
      transaction_type: getAny(block, ['transaction_type', 'type']),
      timestamp: getAny(block, ['timestamp', 'date', 'date_time', 'datetime']),
      email: getAny(block, ['email', 'customer_email', 'billing_email'])
    }));
  } catch (e) {
    console.error('Failed to parse NMI XML:', e);
    return [];
  }
}

export const db = new DatabaseService();
export default db;
