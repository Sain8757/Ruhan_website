import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get('mobile');
    const trackingId = searchParams.get('trackingId');

    if (!mobile || !trackingId) {
      return NextResponse.json({ error: 'Mobile and Tracking ID required' }, { status: 400 });
    }

    // Clean tracking ID (remove spaces, uppercase)
    const cleanId = trackingId.trim().toUpperCase();
    const cleanMobile = mobile.trim();

    // Look up service by tracking ID, and ensure the customer's mobile matches
    const service = await prisma.service.findUnique({
      where: { trackingId: cleanId },
      include: {
        customer: { select: { mobile: true, name: true } }
      }
    });

    if (!service || service.customer.mobile !== cleanMobile) {
      return NextResponse.json({ error: 'Invalid Tracking ID or Mobile Number' }, { status: 404 });
    }

    // Return safe public data
    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        serviceType: service.serviceType,
        status: service.status,
        trackingId: service.trackingId,
        missingDocs: service.missingDocs,
        fees: service.fees,
        paymentStatus: service.paymentStatus,
        createdAt: service.createdAt,
        customerName: service.customer.name
      }
    });

  } catch (error) {
    console.error('Customer Status API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
