import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { mobile: { contains: q } },
          { aadhaarNumber: { contains: q } },
          { panNumber: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customersData, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { services: true, invoices: true, documents: true } },
        invoices: { where: { paymentStatus: { not: "PAID" } }, select: { total: true, amountPaid: true } },
        services: { where: { paymentStatus: { not: "PAID" } }, select: { fees: true, amountPaid: true } }
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const customers = customersData.map(c => {
    const invoiceDues = c.invoices.reduce((acc, inv) => acc + (inv.total - inv.amountPaid), 0);
    const serviceDues = c.services.reduce((acc, srv) => acc + (srv.fees - srv.amountPaid), 0);
    const totalDues = invoiceDues + serviceDues;
    const { invoices, services, ...rest } = c;
    return { ...rest, totalDues };
  });

  return NextResponse.json({ customers, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        mobile: body.mobile,
        email: body.email || null,
        address: body.address || null,
        aadhaarNumber: body.aadhaarNumber || null,
        panNumber: body.panNumber || null,
        notes: body.notes || null,
        walletBalance: body.walletBalance ? Number(body.walletBalance) : 0,
        rating: body.rating ? Number(body.rating) : null,
        tags: body.tags || [],
        dob: body.dob ? new Date(body.dob) : null,
        anniversary: body.anniversary ? new Date(body.anniversary) : null,
        referredById: body.referredById || null,
        groupId: body.groupId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE_CUSTOMER",
        entity: "Customer",
        entityId: customer.id,
        details: `Created customer: ${customer.name}`,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A customer with this mobile number already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
