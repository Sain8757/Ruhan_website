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
    // 1. Get total settled payments for today
    const payments = await prisma.customerPayment.findMany({
      where: {
        date: dateFilter,
      },
    });

    const invoiceIncome = payments.reduce((sum, pay) => sum + pay.amount, 0);

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
