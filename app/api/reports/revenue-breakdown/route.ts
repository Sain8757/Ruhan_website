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
      const invoices = await prisma.invoice.findMany({
        where: { paymentStatus: "PAID" },
        select: { total: true, createdAt: true },
      });

      const grouped = new Map<string, number>();
      for (const inv of invoices) {
        const monthYear = format(new Date(inv.createdAt), "MMM yyyy");
        grouped.set(monthYear, (grouped.get(monthYear) || 0) + inv.total);
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

      const invoices = await prisma.invoice.findMany({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: start, lte: end },
        },
        select: { total: true, createdAt: true },
      });

      const grouped = new Map<string, number>();
      for (const inv of invoices) {
        const dayLabel = format(new Date(inv.createdAt), "dd MMM");
        grouped.set(dayLabel, (grouped.get(dayLabel) || 0) + inv.total);
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

      const invoices = await prisma.invoice.findMany({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: start, lte: end },
        },
        select: { 
          id: true, 
          invoiceNumber: true, 
          total: true, 
          createdAt: true,
          customer: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const results = invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer?.name || "Unknown",
        time: format(new Date(inv.createdAt), "hh:mm a"),
        revenue: inv.total
      }));

      return NextResponse.json({ type: "list", data: results });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Revenue breakdown error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue breakdown" }, { status: 500 });
  }
}
