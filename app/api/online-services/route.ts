import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.onlineServiceCategory.findMany({
      include: {
        links: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching online services:", error);
    return NextResponse.json({ error: "Failed to fetch online services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { title, description, tag, icon, order } = json;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const category = await prisma.onlineServiceCategory.create({
      data: {
        title,
        description,
        tag,
        icon,
        order: order || 0,
      },
      include: {
        links: true,
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating online service category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
