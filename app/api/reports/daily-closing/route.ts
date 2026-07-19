import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // Format: YYYY-MM-DD
  
  // Set date boundaries
  let startDate = new Date();
  if (dateParam) {
    startDate = new Date(dateParam);
  }
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  const dateFilter = {
    gte: startDate,
    lte: endDate,
  };

  try {
    // 1. Get total settled invoices for today
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: dateFilter, // Using createdAt or if we had a settledDate
        paymentStatus: "PAID",
      },
    });
    
    // Partially paid invoices (if any) could be calculated by total - balance
    // Note: If Invoice model doesn't have balance, we use total - amountPaid
    const partialInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: dateFilter,
        paymentStatus: "PARTIAL",
      }
    });

    const invoiceIncome = 
      invoices.reduce((sum, inv) => sum + inv.amountPaid, 0) + 
      partialInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

    // 2. Get extra income
    const incomes = await prisma.income.findMany({
      where: { date: dateFilter }
    });
    const extraIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    // 3. Get expenses
    const expenses = await prisma.expense.findMany({
      where: { date: dateFilter }
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 4. Get vendor payments (Cash out)
    const vendorPayments = await prisma.vendorTransaction.findMany({
      where: { 
        date: dateFilter,
        type: "PAYMENT"
      }
    });
    const totalVendorPayments = vendorPayments.reduce((sum, txn) => sum + txn.amount, 0);

    // 5. Total calculation
    const totalCashIn = invoiceIncome + extraIncome;
    const totalCashOut = totalExpenses + totalVendorPayments;
    const netCash = totalCashIn - totalCashOut;

    return NextResponse.json({
      date: startDate,
      cashIn: {
        invoices: invoiceIncome,
        extra: extraIncome,
        total: totalCashIn
      },
      cashOut: {
        expenses: totalExpenses,
        vendorPayments: totalVendorPayments,
        total: totalCashOut
      },
      netCash
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
