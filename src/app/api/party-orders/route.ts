import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const partyOrders = await prisma.partyOrder.findMany({
      include: { customer: { select: { name: true, phone: true } }, outlet: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ partyOrders });
  } catch (error) {
    console.error('Party order list failed:', error);
    return NextResponse.json({ error: 'Unable to load party orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const guestCount = Number(body.guestCount);
    const eventDate = new Date(body.eventDate);
    if (!Number.isInteger(guestCount) || guestCount < 20 || guestCount > 500 || !Number.isFinite(eventDate.getTime())) {
      return NextResponse.json({ error: 'Provide a valid guest count and event date' }, { status: 400 });
    }
    if (eventDate.getTime() < Date.now() + 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Party orders require at least 24 hours notice' }, { status: 400 });
    }
    const customer = body.customerId
      ? await prisma.user.findUnique({ where: { id: body.customerId } })
      : await prisma.user.findFirst({ where: { phone: body.customerPhone || '+919876543210', role: 'CUSTOMER' } });
    if (!customer) return NextResponse.json({ error: 'Customer account not found' }, { status: 400 });

    const partyOrder = await prisma.partyOrder.create({
      data: {
        customerId: customer.id,
        outletId: body.outletId || null,
        guestCount,
        eventDate,
        menuSummary: String(body.menuSummary || `${guestCount} guest catering request`).slice(0, 2000),
        estimatedQuote: Math.max(0, Number(body.estimatedQuote) || 0),
        managerNotes: body.managerNotes ? String(body.managerNotes).slice(0, 2000) : null,
      },
    });
    return NextResponse.json({ success: true, partyOrder }, { status: 201 });
  } catch (error) {
    console.error('Party order creation failed:', error);
    return NextResponse.json({ error: 'Unable to submit catering request' }, { status: 500 });
  }
}
