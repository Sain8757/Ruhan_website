import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public endpoint - used by TV Display Board and Kiosk
// Returns live queue state
export async function GET() {
  try {
    const pendingServices = await prisma.service.findMany({
      where: { 
        isKioskRequest: true,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      orderBy: { tokenNumber: 'asc' },
      select: {
        id: true,
        tokenNumber: true,
        status: true,
        serviceType: true,
        customer: { select: { name: true } },
        createdAt: true,
      }
    });

    const serving = pendingServices.find(s => s.status === 'PROCESSING');
    const waiting = pendingServices.filter(s => s.status === 'PENDING');

    return NextResponse.json({
      serving: serving || null,
      waiting,
      totalPending: waiting.length,
      estimatedWaitMinutes: waiting.length * 5,
    });
  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json({ serving: null, waiting: [], totalPending: 0, estimatedWaitMinutes: 0 });
  }
}
