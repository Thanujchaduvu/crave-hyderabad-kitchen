import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIO } from '@/lib/socket-server';

const allowedStatuses = ['PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status transition' }, { status: 400 });
    }

    const current = await prisma.order.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (['COMPLETED', 'CANCELLED'].includes(current.status)) {
      return NextResponse.json({ error: 'This order is already closed' }, { status: 409 });
    }
    const validNext: Record<string, string[]> = {
      PLACED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['COMPLETED'],
    };
    if (!validNext[current.status]?.includes(status)) {
      return NextResponse.json({ error: `Cannot move order from ${current.status} to ${status}` }, { status: 409 });
    }

    const isLate = Date.now() >= current.promisedAt.getTime() + 10 * 60 * 1000;
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status, overdueFlag: isLate && !['COMPLETED', 'CANCELLED'].includes(status) },
      include: { outlet: true, customer: true },
    });

    const io = getIO();
    io?.to(`order_${params.id}`).emit('order_status_updated', {
      orderId: params.id, status: updatedOrder.status, updatedAt: updatedOrder.updatedAt,
    });
    io?.to(`kitchen_${updatedOrder.outletId}`).emit('order_status_changed', {
      orderId: params.id, status: updatedOrder.status,
    });
    if (isLate && !['COMPLETED', 'CANCELLED'].includes(status)) {
      io?.to(`kitchen_${updatedOrder.outletId}`).emit('order_overdue', {
        orderId: params.id, orderNumber: updatedOrder.orderNumber, promisedAt: updatedOrder.promisedAt,
      });
    }
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
