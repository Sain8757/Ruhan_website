import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: { where: { paymentStatus: { not: "PAID" } }, orderBy: { createdAt: "asc" } },
        services: { where: { paymentStatus: { not: "PAID" } }, orderBy: { createdAt: "asc" } }
      }
    });

    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (customer.walletBalance <= 0) return NextResponse.json({ error: "No wallet balance" }, { status: 400 });

    let remainingWallet = customer.walletBalance;

    // Settle invoices first
    for (const invoice of customer.invoices) {
      if (remainingWallet <= 0) break;
      const due = invoice.total - invoice.amountPaid;
      if (due > 0) {
        const settleAmount = Math.min(due, remainingWallet);
        remainingWallet -= settleAmount;
        
        const newPaid = invoice.amountPaid + settleAmount;
        const newStatus = newPaid >= invoice.total ? "PAID" : "PARTIAL";
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { amountPaid: newPaid, paymentStatus: newStatus }
        });

        await prisma.customerPayment.create({
          data: {
            customerId: customerId,
            invoiceId: invoice.id,
            amount: settleAmount,
            paymentMode: "CASH",
            notes: "Settled via Wallet Balance",
          }
        });
      }
    }

    // Settle services next
    for (const service of customer.services) {
      if (remainingWallet <= 0) break;
      const due = service.fees - service.amountPaid;
      if (due > 0) {
        const settleAmount = Math.min(due, remainingWallet);
        remainingWallet -= settleAmount;
        
        const newPaid = service.amountPaid + settleAmount;
        const newStatus = newPaid >= service.fees ? "PAID" : "PARTIAL";
        
        await prisma.service.update({
          where: { id: service.id },
          data: { amountPaid: newPaid, paymentStatus: newStatus }
        });

        await prisma.customerPayment.create({
          data: {
            customerId: customerId,
            serviceId: service.id,
            amount: settleAmount,
            paymentMode: "CASH",
            notes: "Settled via Wallet Balance",
          }
        });
      }
    }

    // Update wallet balance
    await prisma.customer.update({
      where: { id: customerId },
      data: { walletBalance: remainingWallet }
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "AUTO_SETTLE_WALLET",
        entity: "Customer",
        entityId: customer.id,
        details: `Settled ${customer.walletBalance - remainingWallet} from wallet.`,
      },
    });

    return NextResponse.json({ success: true, remainingWallet });
  } catch (error: any) {
    console.error("Wallet Settle Error:", error);
    return NextResponse.json({ error: "Failed to settle from wallet" }, { status: 500 });
  }
}
