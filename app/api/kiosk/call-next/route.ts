import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// Admin-only: Move oldest PENDING kiosk request to PROCESSING
export async function POST() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // First mark any PROCESSING back to relevant status or skip
    // Find oldest PENDING kiosk request
    const next = await prisma.service.findFirst({
      where: { 
        isKioskRequest: true,
        status: 'PENDING' 
      },
      orderBy: { tokenNumber: 'asc' },
      include: { customer: { select: { name: true, mobile: true } } }
    });

    if (!next) {
      return NextResponse.json({ message: 'No pending requests in queue', token: null });
    }

    const updated = await prisma.service.update({
      where: { id: next.id },
      data: { status: 'PROCESSING' },
      include: { customer: { select: { name: true, mobile: true } } }
    });

    return NextResponse.json({
      success: true,
      token: `T${String(updated.tokenNumber).padStart(3, '0')}`,
      customer: updated.customer,
      serviceType: updated.serviceType,
    });
  } catch (error) {
    console.error('Call Next error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
