import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const generateUniqueTrackingId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, mobile, serviceType } = data;

    if (!mobile || !serviceType || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert Customer (create if they don't exist based on mobile)
    let customer = await prisma.customer.findUnique({
      where: { mobile }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, mobile }
      });
    }

    // Create Service Request
    const trackingId = await generateUniqueTrackingId();
    
    const service = await prisma.service.create({
      data: {
        serviceType,
        customerId: customer.id,
        trackingId,
        status: 'PENDING',
        notes: 'Submitted via Kiosk QR'
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
          details: `${name} requested ${serviceType} via Kiosk`
        }
      });
    }

    // Get Queue Position
    const pendingCount = await prisma.service.count({
      where: { status: 'PENDING' }
    });

    return NextResponse.json({
      success: true,
      trackingId,
      queuePosition: pendingCount,
      message: 'Queue joined successfully'
    });

  } catch (error) {
    console.error('Kiosk Submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
