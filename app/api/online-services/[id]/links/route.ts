import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { title, href, order } = json;

    if (!title || !href) {
      return NextResponse.json({ error: "Title and href are required" }, { status: 400 });
    }

    const link = await prisma.onlineServiceLink.create({
      data: {
        categoryId,
        title,
        href,
        order: order || 0,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error creating online service link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}
