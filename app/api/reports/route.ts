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
    inventorySalesTotal,
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
    // Inventory sales total in range
    prisma.invoice.aggregate({
      where: { paymentStatus: { in: ["PAID", "PARTIAL"] }, createdAt: { gte: startRange, lte: endRange } },
      _sum: { amountPaid: true },
      _count: true,
    }),
  ]);

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
      inventorySalesRevenue: inventorySalesTotal._sum.amountPaid || 0,
      inventorySalesCount: inventorySalesTotal._count,
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
  });
}
