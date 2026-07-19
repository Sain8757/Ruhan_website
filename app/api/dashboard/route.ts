import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { startOfDay, startOfMonth, endOfDay, subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startMonth = startOfMonth(today);

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
  ] = await Promise.all([
    // Today's invoices
    prisma.invoice.aggregate({
      where: {
        createdAt: { gte: startToday, lte: endToday },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
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
        paymentStatus: "PAID",
      },
      _sum: { total: true },
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
        paymentStatus: "PAID",
      },
      select: { total: true, createdAt: true },
    }),
    // Last 7 days services
    prisma.service.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        paymentStatus: "PAID",
      },
      select: { fees: true, createdAt: true },
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
      revenueByDate[d].revenue += inv.total;
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

  return NextResponse.json({
    todayIncome: (todayInvoices._sum.total || 0) + (todayServicesRevenue._sum.fees || 0),
    todayTransactions: todayInvoices._count,
    todayCustomers,
    pendingServices,
    completedToday,
    totalCustomers,
    monthlyRevenue: (monthlyInvoices._sum.total || 0) + (monthlyServicesRevenue._sum.fees || 0),
    recentServices,
    recentActivities,
    lowStockItems,
    chartData,
  });
}
