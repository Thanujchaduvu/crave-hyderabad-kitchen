import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get('outletId');
  if (!outletId) return NextResponse.json({ error: 'outletId is required' }, { status: 400 });

  try {
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId, active: true } });
    if (!outlet) return NextResponse.json({ error: 'Outlet not found or inactive' }, { status: 404 });

    const inventory = await prisma.outletInventory.findMany({
      where: { outletId },
      include: { menuItem: { include: { category: true } } },
      orderBy: { menuItem: { category: { sortOrder: 'asc' } } },
    });
    const items = inventory
      .filter((entry) => entry.menuItem.active)
      .map(({ menuItem, isAvailable, customPriceOverride }) => ({
        ...menuItem,
        basePrice: customPriceOverride ?? menuItem.basePrice,
        isAvailable,
      }));
    return NextResponse.json({ items, outlet: { id: outlet.id, name: outlet.name, fssaiLicense: outlet.fssaiLicense } });
  } catch (error) {
    console.error('Menu fetch failed:', error);
    return NextResponse.json({ error: 'Unable to load menu' }, { status: 500 });
  }
}
