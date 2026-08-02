import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const q = searchParams.get("q") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { mobile: { contains: q } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        items: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const invoiceNumber = generateInvoiceNumber();

  const subtotal = body.items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );
  const discount = parseFloat(body.discount) || 0;
  const pointsRedeemed = parseInt(body.pointsRedeemed) || 0;
  const totalDiscount = discount + (pointsRedeemed); // 1 point = 1 Rs discount
  
  const gst = parseFloat(body.gst) || 0;
  const total = subtotal - totalDiscount + (subtotal * gst) / 100;

  // Calculate points earned (10 points per 100 Rs, approx 10% value, let's say 1 point per 10 Rs spent)
  // Let's make it simple: 2 points for every 100 Rs.
  const pointsEarned = Math.floor(total / 50);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: body.customerId,
      createdById: (session.user as any).id,
      subtotal,
      discount: totalDiscount,
      gst,
      total,
      amountPaid: Number(body.amountPaid) || 0,
      paymentMode: body.paymentMode || "CASH",
      paymentStatus: body.paymentStatus || "UNPAID",
      type: body.type || "INVOICE",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
      items: {
        create: body.items.map((item: any) => ({
          name: item.name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          total: parseInt(item.quantity) * parseFloat(item.price),
        })),
      },
    },
    include: {
      customer: { select: { id: true, name: true, mobile: true } },
      items: true,
    },
  });

  if (invoice.amountPaid > 0 && !invoice.notes?.includes("Service ID:")) {
    await prisma.customerPayment.create({
      data: {
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount: invoice.amountPaid,
        paymentMode: invoice.paymentMode,
        notes: "Advance/Full payment on invoice creation",
      },
    });
  }


  // Decrease inventory for each sold item
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      const qty = parseInt(item.quantity);
      if (qty > 0) {
        // Find if this item name exists in inventory and is NOT a Service
        await prisma.inventoryItem.updateMany({
          where: { 
            name: item.name,
            category: { not: "Service" }
          },
          data: {
            quantity: {
              decrement: qty,
            },
          },
        });
      }
    }
  }

  // Update customer loyalty points
  await prisma.customer.update({
    where: { id: body.customerId },
    data: {
      loyaltyPoints: {
        increment: pointsEarned - pointsRedeemed
      }
    }
  });

  return NextResponse.json({ ...invoice, pointsEarned, pointsRedeemed }, { status: 201 });
}
