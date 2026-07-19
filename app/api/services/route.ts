import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const customerId = searchParams.get("customerId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (type) where.serviceType = { contains: type, mode: "insensitive" };
  if (customerId) where.customerId = customerId;

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return NextResponse.json({ services, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const service = await prisma.service.create({
    data: {
      customerId: body.customerId,
      serviceType: body.serviceType,
      status: "PENDING",
      fees: parseFloat(body.fees) || 0,
      paymentStatus: body.paymentStatus || "UNPAID",
      paymentMode: body.paymentMode || "PENDING",
      notes: body.notes || null,
      requiredDocs: body.requiredDocs || [],
      assignedToId: (session.user as any).id,
    },
    include: {
      customer: { select: { id: true, name: true, mobile: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "CREATE_SERVICE",
      entity: "Service",
      entityId: service.id,
      details: `Created service: ${service.serviceType} for ${service.customer.name}`,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
