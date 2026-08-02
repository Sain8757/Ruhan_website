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

  const fromDate = from ? startOfDay(new Date(from)) : startOfDay(new Date(new Date().getFullYear(), 3, 1)); // Apr 1
  const toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  // ─── REVENUE ───────────────────────────────────────────────────────────
  const [
    customerPayments,
    manualIncomes,
    services,
    inventoryItems,
    invoicesWithItems,
    expenses,
    vendorPayments,
  ] = await Promise.all([
    // 1. All customer payments in range
    prisma.customerPayment.aggregate({
      where: { date: { gte: fromDate, lte: toDate } },
      _sum: { amount: true },
    }),

    // 2. Manual income entries
    prisma.income.groupBy({
      by: ["category"],
      where: { date: { gte: fromDate, lte: toDate } },
      _sum: { amount: true },
    }),

    // 3. Services to split into revenue categories
    prisma.service.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { serviceType: true, fees: true, vendorCost: true, amountPaid: true },
    }),

    // 4. Inventory items for COGS calculation
    prisma.inventoryItem.findMany({
      select: { name: true, category: true, purchasePrice: true },
    }),

    // 5. Invoices with items for product vs service split
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        NOT: { notes: { contains: "Service ID:" } },
      },
      include: { items: true },
    }),

    // 6. Expenses grouped by category
    prisma.expense.groupBy({
      by: ["category"],
      where: { date: { gte: fromDate, lte: toDate } },
      _sum: { amount: true },
    }),

    // 7. Vendor payments (cost of goods)
    prisma.vendorTransaction.aggregate({
      where: {
        date: { gte: fromDate, lte: toDate },
        type: "PAYMENT",
      },
      _sum: { amount: true },
    }),
  ]);

  // ─── REVENUE CALCULATION ────────────────────────────────────────────────
  const inventoryMap = new Map(inventoryItems.map((i) => [i.name, i]));

  let productRevenue = 0;
  let productCOGS = 0;
  let posServiceRevenue = 0;

  for (const inv of invoicesWithItems) {
    for (const item of inv.items) {
      const invItem = inventoryMap.get(item.name);
      if (invItem?.category === "Service") {
        posServiceRevenue += item.total;
      } else {
        productRevenue += item.total;
        if (invItem) {
          productCOGS += invItem.purchasePrice * item.quantity;
        }
      }
    }
  }

  // Service revenue (direct services, not POS)
  const serviceRevenue = services.reduce((sum, s) => sum + (s.fees || 0), 0);
  const vendorCostTotal = services.reduce((sum, s) => sum + (s.vendorCost || 0), 0);

  // Manual income by category
  const manualIncomeByCategory = manualIncomes.map((m) => ({
    category: m.category,
    amount: m._sum.amount || 0,
  }));
  const manualIncomeTotal = manualIncomeByCategory.reduce((s, m) => s + m.amount, 0);

  // ─── TOTALS ─────────────────────────────────────────────────────────────
  const totalRevenue = productRevenue + serviceRevenue + posServiceRevenue + manualIncomeTotal;
  const totalCOGS = productCOGS + vendorCostTotal + (vendorPayments._sum.amount || 0);
  const grossProfit = totalRevenue - totalCOGS;

  const expenseBreakdown = expenses.map((e) => ({
    category: e.category,
    amount: e._sum.amount || 0,
  }));
  const totalExpenses = expenseBreakdown.reduce((s, e) => s + e.amount, 0);

  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return NextResponse.json({
    dateRange: { from: fromDate, to: toDate },
    revenue: {
      productSales: Math.round(productRevenue),
      serviceSales: Math.round(serviceRevenue + posServiceRevenue),
      manualIncome: Math.round(manualIncomeTotal),
      manualIncomeBreakdown: manualIncomeByCategory,
      total: Math.round(totalRevenue),
    },
    cogs: {
      inventoryCost: Math.round(productCOGS),
      vendorCost: Math.round(vendorCostTotal),
      vendorPayments: Math.round(vendorPayments._sum.amount || 0),
      total: Math.round(totalCOGS),
    },
    grossProfit: Math.round(grossProfit),
    grossMarginPercent: Math.round(grossMargin * 10) / 10,
    expenses: {
      breakdown: expenseBreakdown,
      total: Math.round(totalExpenses),
    },
    netProfit: Math.round(netProfit),
    netMarginPercent: Math.round(netMargin * 10) / 10,
    totalPaymentsReceived: Math.round(customerPayments._sum.amount || 0),
  });
}
