import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add authentication middleware to verify admin role
    
    const now = new Date();

    const fmtParts = (date, opts) => new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      ...opts
    }).formatToParts(date);

    const getEtOffsetMs = (date) => {
      const parts = fmtParts(date, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const get = (t) => parseInt(parts.find(p => p.type === t).value, 10);
      const etGuessUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
      const utcNow = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
      return etGuessUtc - utcNow; // negative for ET (UTC-4/5)
    };

    const etOffsetMs = getEtOffsetMs(now);

    const getEtDayRange = (date) => {
      const parts = fmtParts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10);
      const day = parseInt(parts.find(p => p.type === 'day').value, 10);
      const startMs = Date.UTC(year, month - 1, day, 0, 0, 0) - etOffsetMs;
      const endMs = Date.UTC(year, month - 1, day + 1, 0, 0, 0) - etOffsetMs;
      return { start: new Date(startMs), end: new Date(endMs) };
    };

    const getEtMonthRange = (date) => {
      const parts = fmtParts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10);
      const startMs = Date.UTC(year, month - 1, 1, 0, 0, 0) - etOffsetMs;
      const endMs = Date.UTC(year, month, 1, 0, 0, 0) - etOffsetMs;
      return { start: new Date(startMs), end: new Date(endMs) };
    };

    const getEtLastNDaysRange = (n) => {
      const { start } = getEtDayRange(now);
      const startMs = start.getTime() - n * 24 * 60 * 60 * 1000;
      return { start: new Date(startMs), end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) };
    };

    const { start: todayStartET, end: todayEndET } = getEtDayRange(now);
    const { start: monthStartET, end: monthEndET } = getEtMonthRange(now);
    const { start: weekStartET } = getEtLastNDaysRange(7);

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
          createdAt: { gte: todayStartET, lt: todayEndET },
          status: 'PAID'
        }
      }),
      
      // Revenue today
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStartET, lt: todayEndET },
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
        createdAt: { gte: monthStartET, lt: monthEndET },
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

    // Rolling last 7 days by ET (inclusive of today)
    const weeklyRevenue = await prisma.order.aggregate({
      where: { createdAt: { gte: weekStartET, lt: todayEndET }, status: 'PAID' },
      _sum: { totalCents: true }
    });
    const weeklyOrders = await prisma.order.count({
      where: { createdAt: { gte: weekStartET, lt: todayEndET }, status: 'PAID' }
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
      week_orders: weeklyOrders,
      week_revenue: (weeklyRevenue._sum.totalCents || 0) / 100,
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
