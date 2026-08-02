import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    // Ideally use a secret auth header to ensure only cron can trigger this.
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // Bypassed for development
    }

    const today = new Date();
    
    // Find all recurring invoices where nextRunDate is today or earlier
    const recurringInvoices = await prisma.invoice.findMany({
      where: {
        isRecurring: true,
        nextRunDate: { lte: today },
      },
      include: {
        items: true,
      }
    });

    if (recurringInvoices.length === 0) {
      return NextResponse.json({ message: "No recurring invoices to process today" });
    }

    const generated = [];

    for (const inv of recurringInvoices) {
      const invoiceNumber = generateInvoiceNumber();

      const newInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: inv.customerId,
          createdById: inv.createdById,
          subtotal: inv.subtotal,
          discount: inv.discount,
          gst: inv.gst,
          total: inv.total,
          amountPaid: 0, // Fresh invoice is unpaid
          paymentMode: "CASH",
          paymentStatus: "UNPAID",
          type: inv.type,
          dueDate: null,
          isRecurring: false, // The newly generated one isn't the master template
          parentId: inv.id,
          items: {
            create: inv.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            }))
          }
        }
      });

      // Update the nextRunDate of the parent
      let nextRun = new Date(inv.nextRunDate || today);
      if (inv.recurringInterval === "WEEKLY") nextRun.setDate(nextRun.getDate() + 7);
      else if (inv.recurringInterval === "MONTHLY") nextRun.setMonth(nextRun.getMonth() + 1);
      else if (inv.recurringInterval === "YEARLY") nextRun.setFullYear(nextRun.getFullYear() + 1);

      await prisma.invoice.update({
        where: { id: inv.id },
        data: { nextRunDate: nextRun }
      });

      generated.push(newInvoice);
    }

    return NextResponse.json({ 
      message: `Processed ${generated.length} recurring invoices`,
      generated
    });
  } catch (error) {
    console.error("Cron recurring invoices error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
