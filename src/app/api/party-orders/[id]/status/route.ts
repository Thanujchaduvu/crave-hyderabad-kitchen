import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const allowed = ['APPROVED', 'REJECTED', 'DEPOSIT_PAID', 'COMPLETED'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status, managerNotes } = await req.json();
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid party order status' }, { status: 400 });
    const partyOrder = await prisma.partyOrder.update({
      where: { id: params.id },
      data: { status, ...(typeof managerNotes === 'string' ? { managerNotes } : {}) },
    });
    return NextResponse.json({ success: true, partyOrder });
  } catch (error) {
    console.error('Party order status update failed:', error);
    return NextResponse.json({ error: 'Unable to update party order' }, { status: 500 });
  }
}
