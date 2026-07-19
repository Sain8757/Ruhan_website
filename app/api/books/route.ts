import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const books = await prisma.book.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const book = await prisma.book.create({
    data: {
      name: body.name,
      author: body.author || null,
      category: body.category || null,
      purchasePrice: parseFloat(body.purchasePrice) || 0,
      sellingPrice: parseFloat(body.sellingPrice) || 0,
      quantity: parseInt(body.quantity) || 0,
      minStock: parseInt(body.minStock) || 5,
      barcode: body.barcode || null,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
