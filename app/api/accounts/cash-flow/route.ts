import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, format, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // Single day YYYY-MM-DD
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const days = parseInt(searchParams.get("days") || "7");

  let fromDate: Date;
  let toDate: Date;

  if (date) {
    fromDate = startOfDay(new Date(date));
    toDate = endOfDay(new Date(date));
  } else if (from && to) {
    fromDate = startOfDay(new Date(from));
    toDate = endOfDay(new Date(to));
  } else {
    fromDate = startOfDay(subDays(new Date(), days - 1));
    toDate = endOfDay(new Date());
  }

  // Build day-by-day array
  const dayCount = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
  const dayLabels: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    dayLabels.push(format(d, "yyyy-MM-dd"));
  }

  // Fetch payments, expenses, opening balances in range
  const [payments, expenses, openingBalances] = await Promise.all([
    prisma.customerPayment.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { amount: true, paymentMode: true, date: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { amount: true, category: true, date: true },
    }),
    prisma.accountBalance.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { date: true, opening: true, notes: true },
    }),
  ]);

  // Group by day
  const payByDay = new Map<string, { cash: number; upi: number; card: number; total: number }>();
  const expByDay = new Map<string, number>();
  const openingByDay = new Map<string, number>();

  for (const label of dayLabels) {
    payByDay.set(label, { cash: 0, upi: 0, card: 0, total: 0 });
    expByDay.set(label, 0);
  }

  for (const p of payments) {
    const label = format(new Date(p.date), "yyyy-MM-dd");
    if (payByDay.has(label)) {
      const cur = payByDay.get(label)!;
      cur.total += p.amount;
      if (p.paymentMode === "CASH") cur.cash += p.amount;
      else if (p.paymentMode === "UPI") cur.upi += p.amount;
      else if (p.paymentMode === "CARD") cur.card += p.amount;
    }
  }

  for (const e of expenses) {
    const label = format(new Date(e.date), "yyyy-MM-dd");
    if (expByDay.has(label)) {
      expByDay.set(label, (expByDay.get(label) || 0) + e.amount);
    }
  }

  for (const ob of openingBalances) {
    const label = format(new Date(ob.date), "yyyy-MM-dd");
    openingByDay.set(label, ob.opening);
  }

  // Build daily cash flow rows
  let runningBalance = 0;
  const dailyFlow = dayLabels.map((label) => {
    const opening = openingByDay.get(label) ?? runningBalance;
    const income = payByDay.get(label)?.total || 0;
    const expense = expByDay.get(label) || 0;
    const net = income - expense;
    const closing = opening + net;
    runningBalance = closing;

    return {
      date: label,
      displayDate: format(new Date(label), "dd MMM yyyy"),
      opening: Math.round(opening),
      cashIn: Math.round(income),
      cashOut: Math.round(expense),
      net: Math.round(net),
      closing: Math.round(closing),
      cashBreakdown: payByDay.get(label) || { cash: 0, upi: 0, card: 0, total: 0 },
    };
  });

  // Overall summary
  const totalIn = dailyFlow.reduce((s, d) => s + d.cashIn, 0);
  const totalOut = dailyFlow.reduce((s, d) => s + d.cashOut, 0);

  return NextResponse.json({
    dateRange: { from: fromDate, to: toDate },
    dailyFlow,
    summary: {
      totalCashIn: Math.round(totalIn),
      totalCashOut: Math.round(totalOut),
      netCashFlow: Math.round(totalIn - totalOut),
      openingBalance: dailyFlow[0]?.opening || 0,
      closingBalance: dailyFlow[dailyFlow.length - 1]?.closing || 0,
    },
  });
}

// POST — Set opening balance for a specific date
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, opening, notes } = body;

  if (!date || opening === undefined) {
    return NextResponse.json({ error: "date and opening are required" }, { status: 400 });
  }

  const record = await prisma.accountBalance.upsert({
    where: { date: startOfDay(new Date(date)) },
    update: { opening: parseFloat(opening), notes },
    create: { date: startOfDay(new Date(date)), opening: parseFloat(opening), notes },
  });

  return NextResponse.json(record);
}
