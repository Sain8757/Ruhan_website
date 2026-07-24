import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const documents = await prisma.document.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!body.name || !body.url) {
    return NextResponse.json({ error: "Document name and URL are required" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      customerId: id,
      name: body.name,
      url: body.url,
      type: body.type || "OTHER",
    },
  });

  return NextResponse.json(document);
}
