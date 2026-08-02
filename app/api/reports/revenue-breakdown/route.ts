import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "all-time" | "this-month" | "today"
  const today = new Date();

  try {
    if (type === "all-time") {
      const payments = await prisma.customerPayment.findMany({
        select: { amount: true, date: true },
      });

      const grouped = new Map<string, number>();
      for (const pay of payments) {
        const monthYear = format(new Date(pay.date), "MMM yyyy");
        grouped.set(monthYear, (grouped.get(monthYear) || 0) + pay.amount);
      }

      // Format for response
      const results = Array.from(grouped.entries()).map(([dateLabel, revenue]) => ({
        dateLabel,
        revenue,
      }));

      // Sort chronologically
      results.sort((a, b) => new Date(`1 ${a.dateLabel}`).getTime() - new Date(`1 ${b.dateLabel}`).getTime());

      return NextResponse.json({ type: "grouped", data: results });

    } else if (type === "this-month") {
      const start = startOfMonth(today);
      const end = endOfMonth(today);

      const payments = await prisma.customerPayment.findMany({
        where: { date: { gte: start, lte: end } },
        select: { amount: true, date: true },
      });

      const grouped = new Map<string, number>();
      for (const pay of payments) {
        const dayLabel = format(new Date(pay.date), "dd MMM");
        grouped.set(dayLabel, (grouped.get(dayLabel) || 0) + pay.amount);
      }

      const results = Array.from(grouped.entries()).map(([dateLabel, revenue]) => ({
        dateLabel,
        revenue,
      }));

      results.sort((a, b) => new Date(`${a.dateLabel} ${today.getFullYear()}`).getTime() - new Date(`${b.dateLabel} ${today.getFullYear()}`).getTime());

      return NextResponse.json({ type: "grouped", data: results });

    } else if (type === "today") {
      const start = startOfDay(today);
      const end = endOfDay(today);

      const payments = await prisma.customerPayment.findMany({
        where: { date: { gte: start, lte: end } },
        select: { 
          id: true, 
          amount: true, 
          date: true,
          customer: { select: { name: true } },
          invoice: { select: { invoiceNumber: true } },
          service: { select: { serviceType: true, trackingId: true } }
        },
        orderBy: { date: 'desc' }
      });

      const results = payments.map(pay => ({
        id: pay.id,
        invoiceNumber: pay.invoice?.invoiceNumber || pay.service?.trackingId || pay.service?.serviceType || "Payment",
        customerName: pay.customer?.name || "Unknown",
        time: format(new Date(pay.date), "hh:mm a"),
        revenue: pay.amount
      }));

      return NextResponse.json({ type: "list", data: results });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Revenue breakdown error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue breakdown" }, { status: 500 });
  }
}
