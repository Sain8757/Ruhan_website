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
      customer: { select: { id: true, name: true, mobile: true, email: true, address: true } },
      assignedTo: { select: { name: true } },
    },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const service = await prisma.service.update({
    where: { id },
    data: {
      status: body.status,
      fees: parseFloat(body.fees) || 0,
      paymentStatus: body.paymentStatus,
      paymentMode: body.paymentMode,
      notes: body.notes || null,
      requiredDocs: body.requiredDocs,
      submittedAt: body.status === "SUBMITTED" ? new Date() : undefined,
      approvedAt: body.status === "APPROVED" ? new Date() : undefined,
      deliveredAt: body.status === "DELIVERED" ? new Date() : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "UPDATE_SERVICE_STATUS",
      entity: "Service",
      entityId: service.id,
      details: `Updated service status to ${service.status}`,
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
