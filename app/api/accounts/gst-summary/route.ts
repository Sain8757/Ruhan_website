import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let fromDate: Date;
  let toDate: Date;

  if (month) {
    fromDate = startOfDay(new Date(`${month}-01`));
    toDate = endOfDay(new Date(new Date(fromDate).setMonth(fromDate.getMonth() + 1) - 1));
  } else {
    fromDate = from ? startOfDay(new Date(from)) : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());
  }

  // Get all invoices in range that have GST
  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      gst: { gt: 0 },
    },
    select: {
      id: true,
      invoiceNumber: true,
      subtotal: true,
      discount: true,
      gst: true,
      total: true,
      paymentStatus: true,
      paymentMode: true,
      createdAt: true,
      customer: { select: { name: true, mobile: true } },
    },
  });

  // Get input GST from Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: fromDate, lte: toDate },
      gstAmount: { gt: 0 },
    },
  });

  // Get input GST from Vendor Transactions
  const vendorTransactions = await prisma.vendorTransaction.findMany({
    where: {
      date: { gte: fromDate, lte: toDate },
      gstAmount: { gt: 0 },
    },
  });

  // Calculate GST output (collected from customers)
  let totalOutputGST = 0;
  let totalTaxableAmount = 0;

  const gstBreakdown: {
    rate: number;
    taxableAmount: number;
    gstAmount: number;
    count: number;
  }[] = [];

  const rateMap = new Map<number, { taxable: number; gst: number; count: number }>();

  for (const inv of invoices) {
    const gstRate = inv.gst; // e.g., 18 (percent)
    const taxableValue = inv.subtotal - inv.discount;
    const gstAmount = (taxableValue * gstRate) / 100;

    totalOutputGST += gstAmount;
    totalTaxableAmount += taxableValue;

    const existing = rateMap.get(gstRate) || { taxable: 0, gst: 0, count: 0 };
    rateMap.set(gstRate, {
      taxable: existing.taxable + taxableValue,
      gst: existing.gst + gstAmount,
      count: existing.count + 1,
    });
  }

  for (const [rate, data] of rateMap.entries()) {
    gstBreakdown.push({
      rate,
      taxableAmount: Math.round(data.taxable),
      gstAmount: Math.round(data.gst),
      count: data.count,
    });
  }

  gstBreakdown.sort((a, b) => a.rate - b.rate);

  // CGST + SGST split (for Indian GST — each is half)
  const cgst = totalOutputGST / 2;
  const sgst = totalOutputGST / 2;

  // Calculate Input GST
  const totalExpenseGST = expenses.reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);
  const totalVendorGST = vendorTransactions.reduce((sum, vt) => sum + (vt.gstAmount || 0), 0);
  const totalInputGST = totalExpenseGST + totalVendorGST;

  return NextResponse.json({
    dateRange: { from: fromDate, to: toDate },
    period: month || `${format(fromDate, "dd MMM yyyy")} – ${format(toDate, "dd MMM yyyy")}`,
    summary: {
      totalInvoicesWithGST: invoices.length,
      totalTaxableAmount: Math.round(totalTaxableAmount),
      totalOutputGST: Math.round(totalOutputGST),
      totalInputGST: Math.round(totalInputGST),
      cgst: Math.round(cgst),
      sgst: Math.round(sgst),
      netGSTPayable: Math.round(totalOutputGST - totalInputGST), 
    },
    breakdown: gstBreakdown,
    invoices: invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.createdAt,
      customer: inv.customer.name,
      mobile: inv.customer.mobile,
      taxableAmount: Math.round(inv.subtotal - inv.discount),
      gstRate: inv.gst,
      gstAmount: Math.round(((inv.subtotal - inv.discount) * inv.gst) / 100),
      total: inv.total,
      paymentStatus: inv.paymentStatus,
    })),
  });
}
