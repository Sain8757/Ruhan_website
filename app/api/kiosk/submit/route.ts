import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const generateTrackingId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, mobile, serviceType } = data;

    if (!mobile || !serviceType || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert Customer
    let customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { name, mobile } });
    }

    // Generate sequential token number for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastToken = await prisma.service.findFirst({
      where: {
        isKioskRequest: true,
        createdAt: { gte: todayStart }
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true }
    });

    const nextTokenNumber = (lastToken?.tokenNumber || 0) + 1;
    const trackingId = generateTrackingId();

    // Fetch Service Master Data
    const master = await prisma.inventoryItem.findFirst({
      where: {
        category: 'Service',
        name: serviceType
      }
    });

    // Create Service Request
    const service = await prisma.service.create({
      data: {
        serviceType,
        customerId: customer.id,
        trackingId,
        tokenNumber: nextTokenNumber,
        isKioskRequest: true,
        status: 'PENDING',
        fees: master?.sellingPrice || 0,
        requiredDocs: master?.requiredDocs || [],
        notes: 'Submitted via Kiosk QR'
      }
    });

    // Count PENDING services ahead (queue position)
    const pendingAhead = await prisma.service.count({
      where: {
        isKioskRequest: true,
        status: 'PENDING',
        tokenNumber: { lt: nextTokenNumber }
      }
    });

    // Log Activity
    const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (systemUser) {
      await prisma.activityLog.create({
        data: {
          userId: systemUser.id,
          action: 'Self-Service Request',
          entity: 'SERVICE',
          entityId: service.id,
          details: `${name} requested ${serviceType} via Kiosk — Token T${String(nextTokenNumber).padStart(3, '0')}`
        }
      }).catch(() => {}); // non-critical
    }

    return NextResponse.json({
      success: true,
      trackingId,
      tokenNumber: nextTokenNumber,
      tokenLabel: `T${String(nextTokenNumber).padStart(3, '0')}`,
      queuePosition: pendingAhead + 1,
      estimatedWaitMinutes: (pendingAhead + 1) * 5,
      message: 'Queue joined successfully'
    });

  } catch (error) {
    console.error('Kiosk Submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
