import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getIO } from '@/lib/socket-server';

export async function POST(req: Request) {
  try {
    const { outletId, menuItemId, isAvailable } = await req.json();

    if (!outletId || !menuItemId || isAvailable === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const updatedInventory = await prisma.outletInventory.upsert({
      where: {
        outletId_menuItemId: { outletId, menuItemId },
      },
      update: { isAvailable },
      create: { outletId, menuItemId, isAvailable },
    });

    // Broadcast 86ing event to all active customer menus for this outlet
    const io = getIO();
    if (io) {
      io.to(`menu_${outletId}`).emit('inventory_updated', { menuItemId, isAvailable });
    }

    return NextResponse.json({ success: true, inventory: updatedInventory });
  } catch (error) {
    console.error('Inventory Toggle Error:', error);
    return NextResponse.json({ error: 'Failed to update inventory status' }, { status: 500 });
  }
}