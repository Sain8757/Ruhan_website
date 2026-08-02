import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customerData = await prisma.customer.findUnique({
    where: { id },
    include: {
      services: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" }, include: { items: true } },
      documents: { orderBy: { createdAt: "desc" } },
      _count: { select: { services: true, invoices: true, documents: true } }
    },
  });

  if (!customerData) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Calculate dues
  const invoiceDues = customerData.invoices.reduce((acc, inv) => acc + (inv.total - inv.amountPaid), 0);
  const serviceDues = customerData.services.reduce((acc, srv) => acc + (srv.fees - srv.amountPaid), 0);
  const totalDues = invoiceDues + serviceDues;

  const customer = { ...customerData, totalDues };

  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const dataToUpdate: any = {};
  if (body.name !== undefined) dataToUpdate.name = body.name;
  if (body.mobile !== undefined) dataToUpdate.mobile = body.mobile;
  if (body.email !== undefined) dataToUpdate.email = body.email || null;
  if (body.address !== undefined) dataToUpdate.address = body.address || null;
  if (body.aadhaarNumber !== undefined) dataToUpdate.aadhaarNumber = body.aadhaarNumber || null;
  if (body.panNumber !== undefined) dataToUpdate.panNumber = body.panNumber || null;
  if (body.notes !== undefined) dataToUpdate.notes = body.notes || null;

  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
    select: { walletBalance: true }
  });

  if (body.walletBalance !== undefined) {
    const newWalletBalance = Number(body.walletBalance);
    dataToUpdate.walletBalance = newWalletBalance;
  }
  if (body.rating !== undefined) dataToUpdate.rating = body.rating ? Number(body.rating) : null;
  if (body.tags !== undefined) dataToUpdate.tags = body.tags;
  if (body.dob !== undefined) dataToUpdate.dob = body.dob ? new Date(body.dob) : null;
  if (body.anniversary !== undefined) dataToUpdate.anniversary = body.anniversary ? new Date(body.anniversary) : null;
  if (body.groupId !== undefined) dataToUpdate.groupId = body.groupId || null;

  const customer = await prisma.customer.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.$transaction([
      prisma.service.deleteMany({ where: { customerId: id } }),
      prisma.document.deleteMany({ where: { customerId: id } }),
      prisma.invoice.deleteMany({ where: { customerId: id } }),
      prisma.customer.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json({ error: "Failed to delete customer due to existing relations." }, { status: 500 });
  }
}
