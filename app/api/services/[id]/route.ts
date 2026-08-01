import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, mobile: true, email: true, address: true, aadhaarNumber: true, panNumber: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const oldService = await prisma.service.findUnique({ where: { id } });
    if (!oldService) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const userId = (session.user as any)?.id || "admin-hardcoded";

    const service = await prisma.service.update({
      where: { id },
      data: {
        status: body.status,
        fees: parseFloat(body.fees) || 0,
        paymentStatus: body.paymentStatus,
        paymentMode: body.paymentMode,
        notes: body.notes || null,
        requiredDocs: body.requiredDocs !== undefined ? body.requiredDocs : undefined,
        submittedAt: body.status === "SUBMITTED" ? new Date() : undefined,
        approvedAt: body.status === "APPROVED" ? new Date() : undefined,
        deliveredAt: body.status === "DELIVERED" ? new Date() : undefined,
        deadline: body.deadline !== undefined ? (body.deadline ? new Date(body.deadline) : null) : undefined,
        referenceNo: body.referenceNo !== undefined ? (body.referenceNo || null) : undefined,
        vendorId: body.vendorId !== undefined ? (body.vendorId || null) : undefined,
        vendorCost: body.vendorCost !== undefined ? parseFloat(body.vendorCost) : undefined,
        missingDocs: body.missingDocs !== undefined ? (body.missingDocs || null) : undefined,
        tasks: body.tasks !== undefined ? body.tasks : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
        callbackAt: body.callbackAt !== undefined ? (body.callbackAt ? new Date(body.callbackAt) : null) : undefined,
      },
    });

    if (userId !== "admin-hardcoded") {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: "UPDATE_SERVICE_STATUS",
          entity: "Service",
          entityId: service.id,
          details: `Updated service status to ${service.status}`,
        },
      });
    }

    // Auto-Billing logic
    if (body.status === "DELIVERED" && oldService.status !== "DELIVERED" && service.fees > 0) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { notes: { contains: service.id } }
      });
      if (!existingInvoice) {
        const invNumber = 'INV-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        await prisma.invoice.create({
          data: {
            invoiceNumber: invNumber,
            customerId: service.customerId,
            createdById: userId,
            subtotal: service.fees,
            total: service.fees,
            amountPaid: service.paymentStatus === 'PAID' ? service.fees : 0,
            paymentMode: service.paymentMode,
            paymentStatus: service.paymentStatus,
            notes: `Auto-generated for Service ID: ${service.id}`,
            items: {
              create: [{
                name: service.serviceType,
                quantity: 1,
                price: service.fees,
                total: service.fees
              }]
            }
          }
        });
      }

      // Add Loyalty Points to Customer
      // 10% of fees as points (e.g., ₹100 spent = 10 points)
      const pointsToAward = Math.floor(service.fees / 10);
      if (pointsToAward > 0) {
        await prisma.customer.update({
          where: { id: service.customerId },
          data: {
            loyaltyPoints: {
              increment: pointsToAward
            }
          }
        });
      }
    }

    return NextResponse.json(service);
  } catch (error: any) {
    console.error("PUT /api/services/[id] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
