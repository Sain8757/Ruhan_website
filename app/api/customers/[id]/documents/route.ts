import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const document = await prisma.document.create({
    data: {
      customerId: id,
      name: body.name,
      type: body.type || "Document",
      url: body.url || "#",
    },
  });

  return NextResponse.json(document, { status: 201 });
}
