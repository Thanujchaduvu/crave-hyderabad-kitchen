import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'A non-empty items array is required' }, { status: 400 });
    }
    for (const item of body.items) {
      if (typeof item.id !== 'string' || !Number.isFinite(item.basePrice) || item.basePrice < 0) {
        return NextResponse.json({ error: 'Each item needs a valid id and non-negative price' }, { status: 400 });
      }
    }
    await prisma.$transaction(body.items.map((item: { id: string; basePrice: number }) =>
      prisma.menuItem.update({ where: { id: item.id }, data: { basePrice: item.basePrice } })
    ));
    return NextResponse.json({ success: true, updatedCount: body.items.length });
  } catch (error) {
    console.error('Price publish failed:', error);
    return NextResponse.json({ error: 'Unable to publish menu prices' }, { status: 500 });
  }
}
