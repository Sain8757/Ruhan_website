import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get('mobile');
    const trackingId = searchParams.get('trackingId');

    if (!mobile || !trackingId) {
      return NextResponse.json({ error: 'Please enter both Mobile Number and Tracking ID' }, { status: 400 });
    }

    const cleanMobile = mobile.trim();
    const cleanTrackingId = trackingId.trim().toUpperCase();
    
    // Find service by tracking ID and verify mobile
    const service = await prisma.service.findUnique({
      where: { trackingId: cleanTrackingId },
      include: {
        customer: { select: { name: true, mobile: true } }
      }
    });

    let services: any[] = [];

    if (service && service.customer.mobile === cleanMobile) {
      services = [{ ...service, customerName: service.customer.name }];
    } else {
      return NextResponse.json({ error: 'Invalid Mobile Number or Tracking ID' }, { status: 404 });
    }

    // Return safe public data
    const safeServices = services.map(s => ({
      id: s.id,
      serviceType: s.serviceType,
      status: s.status,
      trackingId: s.trackingId,
      missingDocs: s.missingDocs,
      fees: s.fees,
      paymentStatus: s.paymentStatus,
      paymentMode: s.paymentMode,
      notes: s.notes, // Publicly exposing notes as requested
      createdAt: s.createdAt,
      customerName: s.customerName
    }));

    return NextResponse.json({
      success: true,
      services: safeServices
    });

  } catch (error) {
    console.error('Customer Status API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
