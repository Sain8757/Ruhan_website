import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type") || "all"; // all | income | expense | payment

  const fromDate = from ? startOfDay(new Date(from)) : startOfDay(new Date(Date.now() - 30 * 86400000));
  const toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  // Fetch all transaction types in parallel
  const [payments, incomes, expenses, vendorTxns] = await Promise.all([
    (type === "all" || type === "payment")
      ? prisma.customerPayment.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          include: {
            customer: { select: { name: true } },
            invoice: { select: { invoiceNumber: true } },
            service: { select: { serviceType: true } },
          },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),

    (type === "all" || type === "income")
      ? prisma.income.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),

    (type === "all" || type === "expense")
      ? prisma.expense.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),

    (type === "all")
      ? prisma.vendorTransaction.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          include: { vendor: { select: { name: true } } },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Combine into unified ledger entries
  const entries: {
    id: string;
    date: Date;
    description: string;
    credit: number;  // Money IN
    debit: number;   // Money OUT
    type: "PAYMENT" | "INCOME" | "EXPENSE" | "VENDOR";
    category: string;
    reference: string;
    paymentMode?: string;
  }[] = [];

  // Customer Payments → Credit (money received)
  for (const p of payments) {
    entries.push({
      id: p.id,
      date: p.date,
      description: p.invoice?.invoiceNumber
        ? `Invoice #${p.invoice.invoiceNumber} — ${p.customer.name}`
        : p.service?.serviceType
        ? `${p.service.serviceType} — ${p.customer.name}`
        : `Payment — ${p.customer.name}`,
      credit: p.amount,
      debit: 0,
      type: "PAYMENT",
      category: p.service ? "Service Revenue" : "Sales Revenue",
      reference: p.invoice?.invoiceNumber || p.service?.serviceType || p.id,
      paymentMode: p.paymentMode,
    });
  }

  // Manual Income → Credit
  for (const inc of incomes) {
    entries.push({
      id: inc.id,
      date: inc.date,
      description: inc.description || inc.category,
      credit: inc.amount,
      debit: 0,
      type: "INCOME",
      category: inc.category,
      reference: inc.category,
    });
  }

  // Expenses → Debit (money going out)
  for (const exp of expenses) {
    entries.push({
      id: exp.id,
      date: exp.date,
      description: exp.description || exp.category,
      credit: 0,
      debit: exp.amount,
      type: "EXPENSE",
      category: exp.category,
      reference: exp.category,
    });
  }

  // Vendor Transactions → Debit (payments to vendor)
  for (const vt of vendorTxns) {
    const isPayment = vt.type === "PAYMENT";
    entries.push({
      id: vt.id,
      date: vt.date,
      description: vt.description || `Vendor: ${vt.vendor.name}`,
      credit: isPayment ? 0 : vt.amount, // Credit if advance received back
      debit: isPayment ? vt.amount : 0,
      type: "VENDOR",
      category: `Vendor — ${vt.vendor.name}`,
      reference: vt.vendor.name,
    });
  }

  // Sort by date ascending for running balance
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let balance = 0;
  const ledger = entries.map((entry) => {
    balance += entry.credit - entry.debit;
    return {
      ...entry,
      balance: Math.round(balance * 100) / 100,
    };
  });

  // Summary totals
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);

  return NextResponse.json({
    ledger: ledger.reverse(), // Show newest first for UI
    summary: {
      totalCredit: Math.round(totalCredit),
      totalDebit: Math.round(totalDebit),
      netBalance: Math.round(totalCredit - totalDebit),
      entryCount: ledger.length,
    },
    dateRange: { from: fromDate, to: toDate },
  });
}
