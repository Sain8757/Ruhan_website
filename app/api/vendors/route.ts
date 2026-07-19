import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
    ];
  }

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, company, openingBalance } = body;

  if (!name) {
    return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
  }

  const vendor = await prisma.vendor.create({
    data: {
      name,
      phone,
      company,
      balance: openingBalance ? parseFloat(openingBalance) : 0,
    },
  });

  return NextResponse.json(vendor);
}
