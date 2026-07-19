import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    customers,
    services,
    invoices,
    books,
    inventoryItems,
    documents,
    shopSettings,
  ] = await Promise.all([
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, mobile: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, mobile: true } },
        items: true,
      },
    }),
    prisma.book.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: { transactions: true },
    }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, mobile: true } } },
    }),
    prisma.shopSettings.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  return NextResponse.json({
    app: "RA Seva Point",
    exportedAt: new Date().toISOString(),
    counts: {
      customers: customers.length,
      services: services.length,
      invoices: invoices.length,
      books: books.length,
      inventoryItems: inventoryItems.length,
      documents: documents.length,
      shopSettings: shopSettings.length,
    },
    customers,
    services,
    invoices,
    books,
    inventoryItems,
    documents,
    shopSettings,
  });
}
