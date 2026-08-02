import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const totalCustomers = await prisma.customer.count();
    
    // Total wallet balance
    const walletAggr = await prisma.customer.aggregate({
      _sum: { walletBalance: true }
    });
    const totalWallet = walletAggr._sum.walletBalance || 0;

    // Total Dues from Invoices
    const invoiceDues = await prisma.invoice.aggregate({
      where: { paymentStatus: { not: "PAID" } },
      _sum: { total: true, amountPaid: true }
    });
    const totalInvoiceDue = (invoiceDues._sum.total || 0) - (invoiceDues._sum.amountPaid || 0);

    // Total Dues from Services
    const serviceDues = await prisma.service.aggregate({
      where: { paymentStatus: { not: "PAID" } },
      _sum: { fees: true, amountPaid: true }
    });
    const totalServiceDue = (serviceDues._sum.fees || 0) - (serviceDues._sum.amountPaid || 0);

    const totalDues = totalInvoiceDue + totalServiceDue;

    return NextResponse.json({ totalCustomers, totalWallet, totalDues });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
