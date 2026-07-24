import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, mobile: true, address: true } },
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const subtotal = body.items.reduce((sum: number, item: any) => sum + ((Number(item.quantity) || 1) * (Number(item.price) || 0)), 0);
  const discount = parseFloat(body.discount) || 0;
  const gst = parseFloat(body.gst) || 0;
  const total = subtotal - discount + ((subtotal * gst) / 100);
  let amountPaid = parseFloat(body.amountPaid) || 0;
  if (body.paymentStatus === "PAID") amountPaid = total;
  else if (body.paymentStatus === "UNPAID") amountPaid = 0;

  try {
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // Update invoice and re-create items
      return tx.invoice.update({
        where: { id },
        data: {
          customerId: body.customerId,
          subtotal,
          discount,
          gst,
          total,
          amountPaid,
          paymentMode: body.paymentMode,
          paymentStatus: body.paymentStatus,
          notes: body.notes || null,
          items: {
            create: body.items.map((item: any) => ({
              name: item.name,
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
              total: (Number(item.quantity) || 1) * (Number(item.price) || 0),
            })),
          },
        },
        include: {
          customer: { select: { id: true, name: true, mobile: true, address: true } },
          items: true,
          createdBy: { select: { name: true } },
        },
      });
    });

    const userId = (session.user as any).id;
    if (userId && userId !== "admin-hardcoded") {
      try {
        await prisma.activityLog.create({
          data: {
            userId,
            action: "UPDATE_INVOICE",
            entity: "Invoice",
            entityId: updatedInvoice.id,
            details: `Updated invoice #${updatedInvoice.invoiceNumber}`,
          },
        });
      } catch {}
    }

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

