import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // Format: YYYY-MM
  const q = searchParams.get("q") || "";

  const where: any = {};
  
  if (q) {
    where.OR = [
      { category: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (month) {
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    where.date = {
      gte: startDate,
      lt: endDate,
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, amount, description, date } = body;

  if (!category || !amount) {
    return NextResponse.json({ error: "Category and amount are required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(expense);
}
