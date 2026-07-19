import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const today = new Date();
    const startToday = new Date(today.setHours(0,0,0,0));
    const endToday = new Date(today.setHours(23,59,59,999));
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log("Fetching todayInvoices...");
    const todayInvoices = await prisma.invoice.aggregate({
      where: {
        createdAt: { gte: startToday, lte: endToday },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
      _count: true,
    });
    
    console.log("Fetching recentActivities...");
    const act = await prisma.activityLog.findMany({ take: 1 });
    console.log(act);

    console.log("Fetching chartData...");
    const chart = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as invoices
      FROM "Invoice"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        AND "paymentStatus" = 'PAID'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
    console.log("Success", chart);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
