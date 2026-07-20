import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { title, href, order } = json;

    const link = await prisma.onlineServiceLink.update({
      where: { id: linkId },
      data: {
        title,
        href,
        order,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Error updating online service link:", error);
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.onlineServiceLink.delete({
      where: { id: linkId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting online service link:", error);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
