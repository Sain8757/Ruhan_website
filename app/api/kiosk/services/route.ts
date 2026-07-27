import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        category: "Service",
      },
      select: {
        name: true,
        sellingPrice: true,
        requiredDocs: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch kiosk services:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
