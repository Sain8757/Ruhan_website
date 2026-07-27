import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // --- SMART SIMULATOR ARCHITECTURE ---
    // In a production environment, you would use service.serviceType (e.g. "PAN Card")
    // and service.referenceNo to call UTI/NSDL APIs.
    // Since we are mocking the Live Sync API for the Pro-Max feature demonstration:
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Determine mock status based on how old the service is
    const hoursSinceCreation = (Date.now() - new Date(service.createdAt).getTime()) / (1000 * 60 * 60);
    
    let newStatus = service.status;
    let syncMessage = "Checked Govt Portal: No updates yet.";

    if (service.status === 'PENDING') {
      newStatus = 'PROCESSING';
      syncMessage = "Govt Portal Status: Application accepted, currently under processing.";
    } else if (service.status === 'PROCESSING' && hoursSinceCreation > 24) {
      newStatus = 'APPROVED';
      syncMessage = "Govt Portal Status: Application APPROVED. Card is being dispatched.";
    }

    if (newStatus !== service.status) {
      await prisma.service.update({
        where: { id: serviceId },
        data: { status: newStatus as any }
      });
      
      // Log the automated change
      const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (systemUser) {
        await prisma.activityLog.create({
          data: {
            userId: systemUser.id,
            action: 'API Auto-Sync',
            entity: 'SERVICE',
            entityId: serviceId,
            details: syncMessage
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      message: syncMessage 
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Failed to sync with Government Portal' }, { status: 500 });
  }
}
