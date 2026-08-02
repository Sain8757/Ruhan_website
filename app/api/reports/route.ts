import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7"; // "7" | "30" | "90"
  const days = parseInt(range);

  const today = new Date();
  const startRange = startOfDay(subDays(today, days - 1));
  const endRange = endOfDay(today);
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  // Generate date labels for chart
  const dateLabels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dateLabels.push(format(subDays(today, i), "dd MMM"));
  }

  const [
    allTimePayments,
    monthPayments,
    todayPayments,
    paymentsInRange,
    totalServices,
    totalCustomers,
    topServices,
    invoicesByPaymentStatus,
    recentLargeInvoices,
    invoicesWithItems,
    inventoryItems,
    serviceSalesTotalInRange,
    expensesInRange,
  ] = await Promise.all([
    // Total all-time Payments
    prisma.customerPayment.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    // This month Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: startMonth, lte: endMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    // Today Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { amount: true },
      _count: true,
    }),
    // Payments for chart range
    prisma.customerPayment.findMany({
      where: { date: { gte: startRange, lte: endRange } },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    // Total services counts
    prisma.service.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Total customers
    prisma.customer.count(),
    // Top service types by count
    prisma.service.groupBy({
      by: ["serviceType"],
      _count: { serviceType: true },
      orderBy: { _count: { serviceType: "desc" } },
      take: 5,
    }),
    // Invoices by payment status
    prisma.invoice.groupBy({
      by: ["paymentStatus"],
      where: {
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { total: true },
      _count: true,
    }),
    // Recent large invoices
    prisma.invoice.findMany({
      take: 5,
      orderBy: { total: "desc" },
      where: {
        createdAt: { gte: startRange, lte: endRange },
        NOT: { notes: { contains: "Service ID:" } }
      },
      include: {
        customer: { select: { name: true, mobile: true } },
      },
    }),
    // Invoices with items for accurate Product vs POS Service separation
    prisma.invoice.findMany({
      where: { 
        createdAt: { gte: startRange, lte: endRange },
        NOT: { notes: { contains: "Service ID:" } }
      },
      include: { items: true },
    }),
    prisma.inventoryItem.findMany({
      select: { name: true, category: true }
    }),
    // Service sales total in range
    prisma.service.aggregate({
      where: { createdAt: { gte: startRange, lte: endRange } },
      _sum: { fees: true },
      _count: true,
    }),
    // Total expenses in range
    prisma.expense.aggregate({
      where: { date: { gte: startRange, lte: endRange } },
      _sum: { amount: true },
    })
  ]);

  // Separate Product vs Service revenue for POS Invoices
  const inventoryMap = new Map(inventoryItems.map(i => [i.name, i.category]));
  let posProductRevenue = 0;
  let posServiceRevenue = 0;
  let posProductCount = 0;

  for (const inv of invoicesWithItems) {
    let invProductTotal = 0;
    let invServiceTotal = 0;
    
    for (const item of inv.items) {
      const category = inventoryMap.get(item.name);
      if (category === "Service") {
        invServiceTotal += item.total;
      } else {
        invProductTotal += item.total;
        posProductCount += item.quantity; // approximate product sales count
      }
    }

    posProductRevenue += invProductTotal;
    posServiceRevenue += invServiceTotal;
  }

  // Build daily chart data
  const revenueByDate: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const label = format(subDays(today, i), "dd MMM");
    revenueByDate[label] = 0;
  }
  for (const pay of paymentsInRange) {
    const label = format(new Date(pay.date), "dd MMM");
    if (label in revenueByDate) {
      revenueByDate[label] += pay.amount || 0;
    }
  }
  const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue),
  }));

  // Calculate pending dues per customer
  const [unpaidInvoices, unpaidServices] = await Promise.all([
    prisma.invoice.findMany({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
      include: { customer: true },
    }),
    prisma.service.findMany({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
      include: { customer: true },
    }),
  ]);

  const customerDuesMap: Record<string, { customer: any; totalDue: number; totalBilled: number; invoiceCount: number; serviceCount: number }> = {};

  for (const inv of unpaidInvoices) {
    if (!inv.customer) continue;
    const cid = inv.customerId;
    const due = inv.total - inv.amountPaid;
    if (due <= 0) continue;

    if (!customerDuesMap[cid]) {
      customerDuesMap[cid] = {
        customer: inv.customer,
        totalDue: 0,
        totalBilled: 0,
        invoiceCount: 0,
        serviceCount: 0,
      };
    }
    customerDuesMap[cid].totalDue += due;
    customerDuesMap[cid].totalBilled += inv.total;
    customerDuesMap[cid].invoiceCount += 1;
  }

  for (const srv of unpaidServices) {
    if (!srv.customer) continue;
    const cid = srv.customerId;
    const due = srv.fees;
    if (due <= 0) continue;

    if (!customerDuesMap[cid]) {
      customerDuesMap[cid] = {
        customer: srv.customer,
        totalDue: 0,
        totalBilled: 0,
        invoiceCount: 0,
        serviceCount: 0,
      };
    }
    customerDuesMap[cid].totalDue += due;
    customerDuesMap[cid].totalBilled += srv.fees;
    customerDuesMap[cid].serviceCount += 1;
  }

  const pendingDueCustomers = Object.values(customerDuesMap).sort((a, b) => b.totalDue - a.totalDue);
  const totalPendingDueBalance = pendingDueCustomers.reduce((acc, c) => acc + c.totalDue, 0);

  // Service status breakdown
  const serviceStats: Record<string, number> = {};
  for (const s of totalServices) {
    serviceStats[s.status] = s._count;
  }

  return NextResponse.json({
    summary: {
      allTimeRevenue: allTimePayments._sum.amount || 0,
      allTimeInvoices: allTimePayments._count || 0,
      monthRevenue: monthPayments._sum.amount || 0,
      monthInvoices: monthPayments._count || 0,
      todayRevenue: todayPayments._sum.amount || 0,
      todayInvoices: todayPayments._count || 0,
      totalCustomers,
      inventorySalesRevenue: Math.round(posProductRevenue),
      inventorySalesCount: posProductCount,
      serviceSalesRevenue: Math.round((serviceSalesTotalInRange._sum.fees || 0) + posServiceRevenue),
      serviceSalesCount: serviceSalesTotalInRange._count,
      totalPendingDueBalance,
      totalExpenses: expensesInRange._sum.amount || 0,
    },
    chartData,
    serviceStats,
    topServices: topServices.map((s) => ({
      name: s.serviceType,
      count: s._count.serviceType,
    })),
    invoicesByPaymentStatus: invoicesByPaymentStatus.map((s) => ({
      status: s.paymentStatus,
      total: s._sum.total || 0,
      count: s._count,
    })),
    recentLargeInvoices,
    pendingDueCustomers,
  });
}
