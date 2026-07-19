import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transactions = await prisma.vendorTransaction.findMany({
    where: { vendorId: resolvedParams.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ transactions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, amount, description, date } = body;

  if (!type || !amount) {
    return NextResponse.json({ error: "Type and amount are required" }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create transaction
      const t = await tx.vendorTransaction.create({
        data: {
          vendorId: resolvedParams.id,
          type, // "PURCHASE" or "PAYMENT"
          amount: parsedAmount,
          description,
          date: date ? new Date(date) : new Date(),
        },
      });

      // 2. Update vendor balance
      // If we made a PURCHASE (Udhaar), the balance we owe INCREASES
      // If we made a PAYMENT to them, the balance we owe DECREASES
      const balanceChange = type === "PURCHASE" ? parsedAmount : -parsedAmount;

      await tx.vendor.update({
        where: { id: resolvedParams.id },
        data: {
          balance: { increment: balanceChange },
        },
      });

      return t;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}
