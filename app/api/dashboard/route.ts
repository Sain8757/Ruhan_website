import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { startOfDay, startOfMonth, endOfDay, subDays, format, startOfYesterday, endOfYesterday, subMonths } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startMonth = startOfMonth(today);
  const yesterdayStart = startOfYesterday();
  const yesterdayEnd = endOfYesterday();
  const lastWeekDayStart = startOfDay(subDays(today, 7));
  const lastWeekDayEnd = endOfDay(subDays(today, 7));
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfDay(subDays(startMonth, 1));

  const [
    todayInvoices,
    todayServicesRevenue,
    todayCustomers,
    pendingServices,
    completedToday,
    totalCustomers,
    monthlyInvoices,
    monthlyServicesRevenue,
    recentServices,
    recentActivities,
    lowStockItems,
    invoicesLast7,
    servicesLast7,
    partialInvoicesCount,
    yesterdayInvoices,
    yesterdayServicesRevenue,
    yesterdayCustomers,
    lastWeekDayInvoices,
    lastWeekDayServicesRevenue,
    lastMonthInvoices,
    lastMonthServicesRevenue,
    topServicesRaw,
    overdueServices,
    dueTodayServices,
  ] = await Promise.all([
    // Today's invoices
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: startToday, lte: endToday },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { amountPaid: true },
      _count: true,
    }),
    // Today's services fees
    prisma.service.aggregate({
      where: {
        createdAt: { gte: startToday, lte: endToday },
        paymentStatus: "PAID",
      },
      _sum: { fees: true },
    }),
    // Today's new customers
    prisma.customer.count({
      where: { createdAt: { gte: startToday, lte: endToday } },
    }),
    // Pending services count
    prisma.service.count({
      where: { status: { in: ["PENDING", "SUBMITTED", "PROCESSING"] } },
    }),
    // Completed today
    prisma.service.count({
      where: { status: "DELIVERED", updatedAt: { gte: startToday, lte: endToday } },
    }),
    // Total customers
    prisma.customer.count(),
    // Monthly invoice revenue
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: startMonth },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { amountPaid: true },
    }),
    // Monthly service revenue
    prisma.service.aggregate({
      where: {
        createdAt: { gte: startMonth },
        paymentStatus: "PAID",
      },
      _sum: { fees: true },
    }),
    // Recent services
    prisma.service.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, mobile: true } } },
    }),
    // Recent activity logs
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    // Low stock items (where quantity <= minStock)
    prisma.$queryRaw`
      SELECT id, name, category, quantity, "minStock", "sellingPrice"
      FROM "InventoryItem"
      WHERE quantity <= "minStock"
      ORDER BY quantity ASC
      LIMIT 5
    `.catch(() => []),
    // Last 7 days invoices
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      select: { amountPaid: true, createdAt: true },
    }),
    // Last 7 days services
    prisma.service.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        paymentStatus: "PAID",
      },
      select: { fees: true, createdAt: true },
    }),
    // Partial Invoices Count
    prisma.invoice.count({
      where: { 
        paymentStatus: "PARTIAL",
        NOT: { notes: { contains: "Service ID:" } }
      }
    }),
    // Yesterday invoices
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { amountPaid: true },
      _count: true,
    }),
    // Yesterday services
    prisma.service.aggregate({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        paymentStatus: "PAID",
      },
      _sum: { fees: true },
    }),
    // Yesterday customers
    prisma.customer.count({
      where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    }),
    // Last week same day invoices
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: lastWeekDayStart, lte: lastWeekDayEnd },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { amountPaid: true },
    }),
    // Last week same day services
    prisma.service.aggregate({
      where: {
        createdAt: { gte: lastWeekDayStart, lte: lastWeekDayEnd },
        paymentStatus: "PAID",
      },
      _sum: { fees: true },
    }),
    // Last month invoices
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        NOT: { notes: { contains: "Service ID:" } }
      },
      _sum: { amountPaid: true },
    }),
    // Last month services
    prisma.service.aggregate({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        paymentStatus: "PAID",
      },
      _sum: { fees: true },
    }),
    // Top services last 30 days
    prisma.service.groupBy({
      by: ["serviceType"],
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { serviceType: true },
      orderBy: { _count: { serviceType: "desc" } },
      take: 5,
    }),
    // Overdue services (deadline passed, not delivered/cancelled)
    prisma.service.findMany({
      where: {
        deadline: { lt: startToday },
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: { customer: { select: { name: true, mobile: true } } },
      orderBy: { deadline: "asc" },
    }),
    // Due today services (deadline is today, not delivered/cancelled)
    prisma.service.findMany({
      where: {
        deadline: { gte: startToday, lte: endToday },
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: { customer: { select: { name: true, mobile: true } } },
      orderBy: { deadline: "asc" },
    }),
  ]);

  // Build daily chart data for last 7 days
  const revenueByDate: Record<string, { revenue: number; invoices: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    revenueByDate[d] = { revenue: 0, invoices: 0 };
  }
  
  for (const inv of invoicesLast7) {
    const d = format(new Date(inv.createdAt), "yyyy-MM-dd");
    if (d in revenueByDate) {
      revenueByDate[d].revenue += inv.amountPaid || 0;
      revenueByDate[d].invoices += 1;
    }
  }
  
  for (const srv of servicesLast7) {
    const d = format(new Date(srv.createdAt), "yyyy-MM-dd");
    if (d in revenueByDate) {
      revenueByDate[d].revenue += srv.fees;
    }
  }

  const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue),
    invoices: data.invoices,
  }));

  // Calculate real % changes
  const todayIncome = (todayInvoices._sum.amountPaid || 0) + (todayServicesRevenue._sum.fees || 0);
  const yesterdayIncome = (yesterdayInvoices._sum.amountPaid || 0) + (yesterdayServicesRevenue._sum.fees || 0);
  const lastWeekDayIncome = (lastWeekDayInvoices._sum.amountPaid || 0) + (lastWeekDayServicesRevenue._sum.fees || 0);
  const monthlyRevenue = (monthlyInvoices._sum.amountPaid || 0) + (monthlyServicesRevenue._sum.fees || 0);
  const lastMonthRevenue = (lastMonthInvoices._sum.amountPaid || 0) + (lastMonthServicesRevenue._sum.fees || 0);

  const calcChange = (current: number, previous: number): { value: string; positive: boolean } => {
    if (previous === 0) return current > 0 ? { value: "+100%", positive: true } : { value: "—", positive: true };
    const pct = ((current - previous) / previous) * 100;
    return {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      positive: pct >= 0,
    };
  };

  const topServices = topServicesRaw.map((s: { serviceType: string; _count: { serviceType: number } }) => ({
    name: s.serviceType,
    count: s._count.serviceType,
  }));

  return NextResponse.json({
    todayIncome,
    todayTransactions: todayInvoices._count,
    todayCustomers,
    pendingServices,
    completedToday,
    totalCustomers,
    monthlyRevenue,
    recentServices,
    recentActivities,
    lowStockItems,
    chartData,
    partialInvoicesCount,
    topServices,
    overdueServices,
    dueTodayServices,
    percentChanges: {
      income: calcChange(todayIncome, yesterdayIncome),
      customers: calcChange(todayCustomers, yesterdayCustomers),
      monthlyRevenue: calcChange(monthlyRevenue, lastMonthRevenue),
      weeklyIncome: calcChange(todayIncome, lastWeekDayIncome),
    },
  });
}
