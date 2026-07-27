import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all services with missing documents that are not yet delivered
    const pendingServices = await prisma.service.findMany({
      where: {
        missingDocs: {
          not: null,
          notIn: ['', 'null']
        },
        status: {
          notIn: ['DELIVERED', 'CANCELLED']
        }
      },
      select: {
        id: true,
        trackingId: true,
        serviceType: true,
        missingDocs: true,
        status: true,
        customer: {
          select: {
            name: true,
            mobile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, pending: pendingServices });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
