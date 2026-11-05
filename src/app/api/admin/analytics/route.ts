import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayOrders, todayRevenue, todayCancelled, todayOverdue, recentOrders, repeatCustomers, outlets] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfDay }, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: 'CANCELLED' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay }, overdueFlag: true, status: { in: ['PLACED', 'PREPARING', 'READY_FOR_PICKUP'] } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: last30Days } },
        select: { customerId: true, outletId: true, status: true, estPrepMins: true, totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { createdAt: { gte: last30Days }, status: { not: 'CANCELLED' } },
        _count: { _all: true },
        having: { customerId: { _count: { gte: 2 } } },
      }),
      prisma.outlet.findMany({ where: { active: true }, select: { id: true, name: true } }),
    ]);

    const outletStats = outlets.map((outlet) => {
      const orders = recentOrders.filter((order) => order.outletId === outlet.id);
      const completedOrActive = orders.filter((order) => order.status !== 'CANCELLED');
      const prepTotal = completedOrActive.reduce((sum, order) => sum + order.estPrepMins, 0);
      return {
        id: outlet.id,
        name: outlet.name,
        orders: orders.length,
        avgEstimatedPrepMins: completedOrActive.length ? Math.round(prepTotal / completedOrActive.length) : 0,
        cancellations: orders.filter((order) => order.status === 'CANCELLED').length,
        revenue: completedOrActive.reduce((sum, order) => sum + order.totalAmount, 0),
      };
    });

    const repeatRate = recentOrders.length
      ? Math.round((repeatCustomers.length / new Set(recentOrders.filter((o) => o.status !== 'CANCELLED').map((o) => o.customerId)).size) * 100)
      : 0;

    return NextResponse.json({
      today: { orders: todayOrders, revenue: todayRevenue._sum.totalAmount ?? 0, cancellations: todayCancelled, overdue: todayOverdue },
      last30Days: {
        orders: recentOrders.length,
        avgEstimatedPrepMins: recentOrders.length ? Math.round(recentOrders.reduce((sum, order) => sum + order.estPrepMins, 0) / recentOrders.length) : 0,
        repeatCustomers: repeatCustomers.length,
        repeatRate,
      },
      outlets: outletStats,
    });
  } catch (error) {
    console.error('Analytics aggregation failed:', error);
    return NextResponse.json({ error: 'Unable to load analytics' }, { status: 500 });
  }
}
