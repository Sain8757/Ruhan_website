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
    todayPayments,
    todayCustomers,
    pendingServices,
    completedToday,
    totalCustomers,
    monthlyPayments,
    recentServices,
    recentActivities,
    lowStockItems,
    paymentsLast7,
    partialInvoicesCount,
    yesterdayPayments,
    yesterdayCustomers,
    lastWeekDayPayments,
    lastMonthPayments,
    topServicesRaw,
    overdueServices,
    dueTodayServices,
    todayIncomeRaw,
    monthlyIncomeRaw,
    incomeLast7,
    yesterdayIncomeRaw,
    lastWeekDayIncomeRaw,
    lastMonthIncomeRaw,
  ] = await Promise.all([
    // Today's Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: startToday, lte: endToday } },
      _sum: { amount: true },
      _count: true,
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
    // Monthly Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: startMonth } },
      _sum: { amount: true },
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
    // Last 7 days Payments
    prisma.customerPayment.findMany({
      where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { amount: true, date: true, invoiceId: true },
    }),
    // Partial Invoices Count
    prisma.invoice.count({
      where: { 
        paymentStatus: "PARTIAL",
        NOT: { notes: { contains: "Service ID:" } }
      }
    }),
    // Yesterday Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { amount: true },
    }),
    // Yesterday customers
    prisma.customer.count({
      where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    }),
    // Last week same day Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: lastWeekDayStart, lte: lastWeekDayEnd } },
      _sum: { amount: true },
    }),
    // Last month Payments
    prisma.customerPayment.aggregate({
      where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
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
    // Today's Income (Manual)
    prisma.income.aggregate({
      where: { date: { gte: startToday, lte: endToday } },
      _sum: { amount: true },
    }),
    // Monthly Income (Manual)
    prisma.income.aggregate({
      where: { date: { gte: startMonth } },
      _sum: { amount: true },
    }),
    // Last 7 days Income (Manual)
    prisma.income.findMany({
      where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { amount: true, date: true },
    }),
    // Yesterday Income (Manual)
    prisma.income.aggregate({
      where: { date: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { amount: true },
    }),
    // Last week same day Income (Manual)
    prisma.income.aggregate({
      where: { date: { gte: lastWeekDayStart, lte: lastWeekDayEnd } },
      _sum: { amount: true },
    }),
    // Last month Income (Manual)
    prisma.income.aggregate({
      where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
  ]);

  // Build daily chart data for last 7 days
  const revenueByDate: Record<string, { revenue: number; invoices: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    revenueByDate[d] = { revenue: 0, invoices: 0 };
  }
  
  for (const pay of paymentsLast7) {
    const d = format(new Date(pay.date), "yyyy-MM-dd");
    if (d in revenueByDate) {
      revenueByDate[d].revenue += pay.amount || 0;
      if (pay.invoiceId) {
        revenueByDate[d].invoices += 1;
      }
    }
  }
  
  for (const inc of incomeLast7) {
    const d = format(new Date(inc.date), "yyyy-MM-dd");
    if (d in revenueByDate) {
      revenueByDate[d].revenue += inc.amount || 0;
    }
  }

  const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue),
    invoices: data.invoices,
  }));

  // Calculate real % changes
  const todayIncome = (todayPayments._sum.amount || 0) + (todayIncomeRaw._sum.amount || 0);
  const yesterdayIncome = (yesterdayPayments._sum.amount || 0) + (yesterdayIncomeRaw._sum.amount || 0);
  const lastWeekDayIncome = (lastWeekDayPayments._sum.amount || 0) + (lastWeekDayIncomeRaw._sum.amount || 0);
  const monthlyRevenue = (monthlyPayments._sum.amount || 0) + (monthlyIncomeRaw._sum.amount || 0);
  const lastMonthRevenue = (lastMonthPayments._sum.amount || 0) + (lastMonthIncomeRaw._sum.amount || 0);

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
    todayTransactions: todayPayments._count,
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
