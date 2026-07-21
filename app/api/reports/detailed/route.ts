import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30";
  const days = parseInt(range, 10);
  
  const today = new Date();
  const startRange = startOfDay(subDays(today, days - 1));

  try {
    // 1. Get all PAID invoices within range
    const invoices = await prisma.invoice.findMany({
      where: {
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        createdAt: { gte: startRange },
      },
      include: { items: true },
    });

    // 2. Aggregate InvoiceItems
    const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const current = productSalesMap.get(item.name) || { quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.total;
        productSalesMap.set(item.name, current);
      }
    }

    // 3. Get all Inventory items to find purchase prices and categories
    const inventory = await prisma.inventoryItem.findMany({
      select: { name: true, purchasePrice: true, category: true },
    });
    const inventoryMap = new Map<string, { purchasePrice: number; isService: boolean }>();
    for (const inv of inventory) {
      inventoryMap.set(inv.name, {
        purchasePrice: inv.purchasePrice,
        isService: inv.category === "Service"
      });
    }

    // 4. Calculate product profit and separate POS services
    const productSales: any[] = [];
    const serviceSalesMap = new Map<string, { quantity: number; profit: number }>();

    for (const [name, data] of Array.from(productSalesMap.entries())) {
      const invData = inventoryMap.get(name);
      
      if (invData?.isService) {
        // This is a POS Service (100% profit usually, or just use revenue)
        serviceSalesMap.set(name, {
          quantity: data.quantity,
          profit: data.revenue,
        });
      } else {
        // This is a Product
        const purchasePrice = invData?.purchasePrice || 0;
        const totalPurchaseCost = purchasePrice * data.quantity;
        const profit = data.revenue - totalPurchaseCost;

        productSales.push({
          name,
          quantity: data.quantity,
          revenue: data.revenue,
          purchasePrice,
          totalPurchaseCost,
          profit,
        });
      }
    }

    // 5. Get all PAID services within range
    const services = await prisma.service.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startRange },
      },
      select: { serviceType: true, fees: true },
    });

    // 6. Aggregate Service Profits into the existing serviceSalesMap
    for (const srv of services) {
      const current = serviceSalesMap.get(srv.serviceType) || { quantity: 0, profit: 0 };
      current.quantity += 1;
      current.profit += srv.fees;
      serviceSalesMap.set(srv.serviceType, current);
    }

    const serviceSales = Array.from(serviceSalesMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      profit: data.profit,
    }));

    return NextResponse.json({
      productSales: productSales.sort((a, b) => b.profit - a.profit),
      serviceSales: serviceSales.sort((a, b) => b.profit - a.profit),
      dateRange: { start: startRange.toISOString(), end: today.toISOString() },
    });
  } catch (error) {
    console.error("Detailed report fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch detailed report" }, { status: 500 });
  }
}
