import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Please enter a Mobile Number or Tracking ID' }, { status: 400 });
    }

    const cleanQuery = query.trim().toUpperCase();
    
    // Check if it's a mobile number (10 digits)
    const isMobile = /^\d{10}$/.test(cleanQuery);

    let services: any[] = [];

    if (isMobile) {
      // Find customer by mobile first, then their services
      const customer = await prisma.customer.findFirst({
        where: { mobile: cleanQuery },
        include: {
          services: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      if (customer) {
        services = customer.services.map(s => ({ ...s, customerName: customer.name }));
      }
    } else {
      // Find by tracking ID
      const service = await prisma.service.findUnique({
        where: { trackingId: cleanQuery },
        include: {
          customer: { select: { name: true } }
        }
      });
      if (service) {
        services = [{ ...service, customerName: service.customer.name }];
      }
    }

    if (services.length === 0) {
      return NextResponse.json({ error: 'No records found for this input' }, { status: 404 });
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
