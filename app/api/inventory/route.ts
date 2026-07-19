import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  if (type === "product") {
    where.category = { not: "Service" };
  } else if (type === "service") {
    where.category = "Service";
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const item = await prisma.inventoryItem.create({
    data: {
      name: body.name,
      category: body.category,
      purchasePrice: parseFloat(body.purchasePrice) || 0,
      sellingPrice: parseFloat(body.sellingPrice) || 0,
      quantity: parseInt(body.quantity) || 0,
      minStock: parseInt(body.minStock) || 5,
      unit: body.unit || "piece",
    },
  });

  return NextResponse.json(item, { status: 201 });
}
