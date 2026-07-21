import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { amountPaid, paymentMode } = body;

    if (amountPaid === undefined || amountPaid === null) {
      return NextResponse.json({ error: "amountPaid is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const newAmountPaid = (invoice.amountPaid || 0) + Number(amountPaid);
    
    let paymentStatus = "PARTIAL";
    if (newAmountPaid >= invoice.total) {
      paymentStatus = "PAID";
    } else if (newAmountPaid <= 0) {
      paymentStatus = "UNPAID";
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: resolvedParams.id },
      data: {
        amountPaid: newAmountPaid,
        paymentStatus: paymentStatus as any,
        paymentMode: paymentMode || invoice.paymentMode,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("Error settling invoice:", error);
    return NextResponse.json(
      { error: "Failed to settle invoice" },
      { status: 500 }
    );
  }
}
