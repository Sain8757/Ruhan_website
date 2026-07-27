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

    // Validation 1: Check active services limit (Max 2)
    const activeServicesCount = await prisma.service.count({
      where: {
        customerId: customer.id,
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      }
    });

    if (activeServicesCount >= 2) {
      return NextResponse.json({ error: 'You already have 2 active requests pending. Please wait for them to be processed.' }, { status: 400 });
    }

    // Validation 2: Check for duplicate exact service type
    const duplicateService = await prisma.service.findFirst({
      where: {
        customerId: customer.id,
        serviceType: serviceType,
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      }
    });

    if (duplicateService) {
      return NextResponse.json({ error: 'A request for this service is already pending.' }, { status: 400 });
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
        status: 'SUBMITTED', // Using SUBMITTED as the "Pending Approval" state for Kiosk
        fees: master?.sellingPrice || 0,
        requiredDocs: master?.requiredDocs || [],
        notes: 'Submitted via Kiosk QR'
      }
    });

    // Count SUBMITTED services ahead (queue position)
    const pendingAhead = await prisma.service.count({
      where: {
        isKioskRequest: true,
        status: 'SUBMITTED',
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
