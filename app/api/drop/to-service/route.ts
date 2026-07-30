import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Defaulting to "admin-hardcoded" if no session to ensure it works in Kiosk mode
    const userId = (session?.user as any)?.id || "admin-hardcoded";

    const body = await req.json();
    const { customerName, mobileNumber, serviceType, fees, files } = body;

    if (!mobileNumber || !files || files.length === 0) {
      return NextResponse.json({ error: 'Missing mobile number or files' }, { status: 400 });
    }

    // 1. Find or Create Customer
    let customer = await prisma.customer.findUnique({
      where: { mobile: mobileNumber }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName || "Unknown Customer",
          mobile: mobileNumber
        }
      });
    } else if (customerName && customerName !== "Unknown Customer" && customer.name === "Unknown Customer") {
      // Update name if we have a better one
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: customerName }
      });
    }

    // 2. Extract URLs from files
    const fileUrls = files.map((f: any) => f.url);
    const fileIds = files.map((f: any) => f.id);

    // 3. Create Service
    const service = await prisma.service.create({
      data: {
        serviceType: serviceType || "File Drop Documents",
        status: "SUBMITTED",
        customerId: customer.id,
        assignedToId: userId !== "admin-hardcoded" ? userId : null,
        fees: parseFloat(fees) || 0,
        paymentStatus: "UNPAID",
        paymentMode: "PENDING",
        serviceDocUrls: fileUrls,
        submittedAt: new Date()
      }
    });

    // 4. Activity Log (only if logged in)
    if (userId !== "admin-hardcoded") {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: "CREATE_SERVICE_FROM_DROP",
          entity: "Service",
          entityId: service.id,
          details: `Created service from File Drop for ${customer.name}`
        }
      });
    }

    // 5. Delete these files from FileDrop to clear the dashboard
    await prisma.fileDrop.deleteMany({
      where: {
        id: { in: fileIds }
      }
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error('Move to Service Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to move to services' }, { status: 500 });
  }
}
