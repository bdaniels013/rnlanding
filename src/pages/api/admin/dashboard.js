import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add authentication middleware to verify admin role
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's metrics
    const [
      ordersToday,
      revenueToday,
      totalCustomers,
      activeSubscriptions,
      creditsOutstanding,
      upcomingSlots,
      recentOrders
    ] = await Promise.all([
      // Orders today
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: 'PAID'
        }
      }),
      
      // Revenue today
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: 'PAID'
        },
        _sum: {
          totalCents: true
        }
      }),
      
      // Total customers
      prisma.customer.count(),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // Credits outstanding
      prisma.creditsLedger.groupBy({
        by: ['customerId'],
        _sum: {
          delta: true
        },
        having: {
          delta: {
            _sum: {
              gt: 0
            }
          }
        }
      }),
      
      // Upcoming platform slots
      prisma.platformSlot.findMany({
        where: {
          slotAt: {
            gte: new Date()
          },
          status: 'AVAILABLE'
        },
        orderBy: {
          slotAt: 'asc'
        },
        take: 5
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          },
          orderItems: {
            include: {
              offer: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate MRR and ARR
    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
        status: 'PAID'
      },
      _sum: {
        totalCents: true
      }
    });

    const yearlyRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1)
        },
        status: 'PAID'
      },
      _sum: {
        totalCents: true
      }
    });

    // Calculate total outstanding credits
    const totalOutstandingCredits = creditsOutstanding.reduce((sum, entry) => {
      return sum + (entry._sum.delta || 0);
    }, 0);

    res.status(200).json({
      live_visitors: 0, // TODO: Implement real-time visitor tracking
      active_checkouts: 0, // TODO: Implement active checkout tracking
      orders_today: ordersToday,
      revenue_today: (revenueToday._sum.totalCents || 0) / 100,
      mrr: (monthlyRevenue._sum.totalCents || 0) / 100,
      arr: (yearlyRevenue._sum.totalCents || 0) / 100,
      total_customers: totalCustomers,
      active_subscriptions: activeSubscriptions,
      credits_outstanding: totalOutstandingCredits,
      upcoming_platform_slots: upcomingSlots,
      recent_orders: recentOrders.map(order => ({
        id: order.id,
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        total: (order.totalCents / 100).toFixed(2),
        status: order.status,
        items: order.orderItems.map(item => item.offer.name).join(', '),
        created_at: order.createdAt
      })),
      alerts: [] // TODO: Implement alert system
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
