import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [unpaidInvoices, unpaidServices] = await Promise.all([
      prisma.invoice.findMany({
        where: { 
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
          NOT: { notes: { contains: "Service ID:" } }
        },
        include: { customer: true },
      }),
      prisma.service.findMany({
        where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
        include: { customer: true },
      }),
    ]);

    const customerDuesMap: Record<string, { customer: any; totalDue: number; totalBilled: number; invoiceCount: number; serviceCount: number; items: any[] }> = {};

    for (const inv of unpaidInvoices) {
      if (!inv.customer) continue;
      const cid = inv.customerId;
      const due = inv.total - inv.amountPaid;
      if (due <= 0) continue;

      if (!customerDuesMap[cid]) {
        customerDuesMap[cid] = {
          customer: inv.customer,
          totalDue: 0,
          totalBilled: 0,
          invoiceCount: 0,
          serviceCount: 0,
          items: []
        };
      }
      customerDuesMap[cid].totalDue += due;
      customerDuesMap[cid].totalBilled += inv.total;
      customerDuesMap[cid].invoiceCount += 1;
      customerDuesMap[cid].items.push({
        id: inv.id,
        type: "INVOICE",
        number: inv.invoiceNumber,
        total: inv.total,
        paid: inv.amountPaid,
        due,
        date: inv.createdAt,
        dueDate: inv.dueDate,
        status: inv.paymentStatus
      });
    }

    for (const srv of unpaidServices) {
      if (!srv.customer) continue;
      const cid = srv.customerId;
      const due = srv.fees - (srv.amountPaid || 0);
      if (due <= 0) continue;

      if (!customerDuesMap[cid]) {
        customerDuesMap[cid] = {
          customer: srv.customer,
          totalDue: 0,
          totalBilled: 0,
          invoiceCount: 0,
          serviceCount: 0,
          items: []
        };
      }
      customerDuesMap[cid].totalDue += due;
      customerDuesMap[cid].totalBilled += srv.fees;
      customerDuesMap[cid].serviceCount += 1;
      customerDuesMap[cid].items.push({
        id: srv.id,
        type: "SERVICE",
        number: srv.serviceType,
        total: srv.fees,
        paid: srv.amountPaid || 0,
        due,
        date: srv.createdAt,
        dueDate: srv.deadline,
        status: srv.paymentStatus
      });
    }

    const pendingDueCustomers = Object.values(customerDuesMap).sort((a, b) => b.totalDue - a.totalDue);
    const totalPendingDueBalance = pendingDueCustomers.reduce((acc, c) => acc + c.totalDue, 0);

    return NextResponse.json({
      customers: pendingDueCustomers,
      totalDue: totalPendingDueBalance,
    });
  } catch (error) {
    console.error("Error fetching Udhaar ledger:", error);
    return NextResponse.json({ error: "Failed to fetch Udhaar ledger" }, { status: 500 });
  }
}
