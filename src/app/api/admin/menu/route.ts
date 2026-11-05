import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin menu fetch failed:', error);
    return NextResponse.json({ error: 'Unable to load central menu' }, { status: 500 });
  }
}
