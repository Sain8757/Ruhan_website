import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const [pendingServices, lowStockItems] = await Promise.all([
      prisma.service.findMany({
        where: {
          status: { notIn: ["DELIVERED", "CANCELLED"] },
          createdAt: { lt: startOfToday },
        },
        include: { customer: { select: { name: true, mobile: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.$queryRaw`
        SELECT id, name, category, quantity, "minStock", "sellingPrice"
        FROM "InventoryItem"
        WHERE quantity <= "minStock"
        ORDER BY quantity ASC
      `.catch(() => []),
    ]);

    return NextResponse.json({
      pendingServices,
      lowStockItems,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
