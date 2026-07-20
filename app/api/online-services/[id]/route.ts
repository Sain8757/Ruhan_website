import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { title, description, tag, icon, order } = json;

    const category = await prisma.onlineServiceCategory.update({
      where: { id },
      data: {
        title,
        description,
        tag,
        icon,
        order,
      },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating online service category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.onlineServiceCategory.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting online service category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
