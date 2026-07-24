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
    totalSalesAgg,
    totalServiceSalesAgg,
    monthSalesAgg,
    monthServiceSalesAgg,
    todaySalesAgg,
    todayServiceSalesAgg,
    invoicesInRange,
    servicesInRange,
    totalServices,
    totalCustomers,
    topServices,
    invoicesByPaymentStatus,
    recentLargeInvoices,
    invoicesWithItems,
    inventoryItems,
    serviceSalesTotalInRange,
  ] = await Promise.all([
    // Total all-time invoice revenue
    prisma.invoice.aggregate({
      where: { paymentStatus: { in: ["PAID", "PARTIAL"] } },
      _sum: { amountPaid: true },
      _count: true,
    }),
    // Total all-time service revenue
    prisma.service.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { fees: true },
    }),
    // This month invoice revenue
    prisma.invoice.aggregate({
      where: {
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        createdAt: { gte: startMonth, lte: endMonth },
      },
      _sum: { amountPaid: true },
      _count: true,
    }),
    // This month service revenue
    prisma.service.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startMonth, lte: endMonth },
      },
      _sum: { fees: true },
    }),
    // Today invoice revenue
    prisma.invoice.aggregate({
      where: {
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      _sum: { amountPaid: true },
      _count: true,
    }),
    // Today service revenue
    prisma.service.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      _sum: { fees: true },
    }),
    // Invoices for chart range
    prisma.invoice.findMany({
      where: {
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        createdAt: { gte: startRange, lte: endRange },
      },
      select: { amountPaid: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Services for chart range
    prisma.service.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startRange, lte: endRange },
      },
      select: { fees: true, createdAt: true },
      orderBy: { createdAt: "asc" },
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
      _sum: { total: true },
      _count: true,
    }),
    // Recent large invoices
    prisma.invoice.findMany({
      take: 5,
      orderBy: { total: "desc" },
      where: {
        createdAt: { gte: startRange, lte: endRange },
      },
      include: {
        customer: { select: { name: true, mobile: true } },
      },
    }),
    // Invoices with items for accurate Product vs POS Service separation
    prisma.invoice.findMany({
      where: { paymentStatus: { in: ["PAID", "PARTIAL"] }, createdAt: { gte: startRange, lte: endRange } },
      include: { items: true },
    }),
    prisma.inventoryItem.findMany({
      select: { name: true, category: true }
    }),
    // Service sales total in range
    prisma.service.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startRange, lte: endRange } },
      _sum: { fees: true },
      _count: true,
    }),
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

    if (inv.paymentStatus === "PAID") {
      posProductRevenue += invProductTotal;
      posServiceRevenue += invServiceTotal;
    } else if (inv.paymentStatus === "PARTIAL") {
      // distribute amountPaid proportionally
      const ratio = inv.total > 0 ? (inv.amountPaid / inv.total) : 0;
      posProductRevenue += (invProductTotal * ratio);
      posServiceRevenue += (invServiceTotal * ratio);
    }
  }

  // Build daily chart data
  const revenueByDate: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const label = format(subDays(today, i), "dd MMM");
    revenueByDate[label] = 0;
  }
  for (const inv of invoicesInRange) {
    const label = format(new Date(inv.createdAt), "dd MMM");
    if (label in revenueByDate) {
      revenueByDate[label] += inv.amountPaid || 0;
    }
  }
  for (const srv of servicesInRange) {
    const label = format(new Date(srv.createdAt), "dd MMM");
    if (label in revenueByDate) {
      revenueByDate[label] += srv.fees;
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
      allTimeRevenue: (totalSalesAgg._sum.amountPaid || 0) + (totalServiceSalesAgg._sum.fees || 0),
      allTimeInvoices: totalSalesAgg._count,
      monthRevenue: (monthSalesAgg._sum.amountPaid || 0) + (monthServiceSalesAgg._sum.fees || 0),
      monthInvoices: monthSalesAgg._count,
      todayRevenue: (todaySalesAgg._sum.amountPaid || 0) + (todayServiceSalesAgg._sum.fees || 0),
      todayInvoices: todaySalesAgg._count,
      totalCustomers,
      inventorySalesRevenue: Math.round(posProductRevenue),
      inventorySalesCount: posProductCount,
      serviceSalesRevenue: Math.round((serviceSalesTotalInRange._sum.fees || 0) + posServiceRevenue),
      serviceSalesCount: serviceSalesTotalInRange._count,
      totalPendingDueBalance,
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
