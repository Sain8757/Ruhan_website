import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GlobalSearchResult } from "@/lib/search";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const requestedLimit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 5), 20)
    : 10;

  if (query.length < 2) {
    return NextResponse.json({ results: [] satisfies GlobalSearchResult[] });
  }

  const mode = "insensitive" as const;
  const perGroup = Math.max(3, Math.ceil(limit / 3));
  const customerWhere = {
    OR: [
      { name: { contains: query, mode } },
      { mobile: { contains: query } },
      { aadhaarNumber: { contains: query } },
      { panNumber: { contains: query, mode } },
      { email: { contains: query, mode } },
    ],
  };

  const [customers, invoices, services, books, inventoryItems] = await Promise.all([
    prisma.customer.findMany({
      where: customerWhere,
      take: perGroup,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        mobile: true,
        aadhaarNumber: true,
        panNumber: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: query, mode } },
          { notes: { contains: query, mode } },
          { customer: { is: customerWhere } },
          { items: { some: { name: { contains: query, mode } } } },
        ],
      },
      take: perGroup,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paymentStatus: true,
        customer: { select: { name: true, mobile: true } },
      },
    }),
    prisma.service.findMany({
      where: {
        OR: [
          { serviceType: { contains: query, mode } },
          { notes: { contains: query, mode } },
          { customer: { is: customerWhere } },
        ],
      },
      take: perGroup,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        serviceType: true,
        status: true,
        fees: true,
        customer: { select: { name: true, mobile: true } },
      },
    }),
    prisma.book.findMany({
      where: {
        OR: [
          { name: { contains: query, mode } },
          { author: { contains: query, mode } },
          { category: { contains: query, mode } },
          { isbn: { contains: query, mode } },
          { barcode: { contains: query } },
        ],
      },
      take: perGroup,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        author: true,
        isbn: true,
        barcode: true,
        quantity: true,
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        OR: [
          { name: { contains: query, mode } },
          { category: { contains: query, mode } },
        ],
      },
      take: perGroup,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        unit: true,
      },
    }),
  ]);

  const results: GlobalSearchResult[] = [
    ...customers.map((customer) => ({
      id: customer.id,
      type: "customer" as const,
      title: customer.name,
      subtitle: [customer.mobile, customer.panNumber, customer.aadhaarNumber]
        .filter(Boolean)
        .join(" | "),
      href: `/customers/${customer.id}`,
      badge: "Customer",
    })),
    ...invoices.map((invoice) => ({
      id: invoice.id,
      type: "invoice" as const,
      title: invoice.invoiceNumber,
      subtitle: `${invoice.customer.name} | ${invoice.customer.mobile} | Rs ${invoice.total.toLocaleString("en-IN")}`,
      href: `/billing/${invoice.id}`,
      badge: invoice.paymentStatus,
    })),
    ...services.map((service) => ({
      id: service.id,
      type: "service" as const,
      title: service.serviceType,
      subtitle: `${service.customer.name} | ${service.customer.mobile} | Ref ${service.id.slice(-6).toUpperCase()}`,
      href: `/services/${service.id}`,
      badge: service.status,
    })),
    ...books.map((book) => ({
      id: book.id,
      type: "book" as const,
      title: book.name,
      subtitle: [book.author, book.isbn, book.barcode, `Stock ${book.quantity}`]
        .filter(Boolean)
        .join(" | "),
      href: "/books",
      badge: "Book",
    })),
    ...inventoryItems.map((item) => ({
      id: item.id,
      type: "inventory" as const,
      title: item.name,
      subtitle: `${item.category} | Stock ${item.quantity} ${item.unit}`,
      href: `/inventory?edit=${item.id}`,
      badge: "Product",
    })),
  ].slice(0, limit);

  return NextResponse.json({ results });
}
