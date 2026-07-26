import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { ids, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No service IDs provided" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "No status provided" },
        { status: 400 }
      );
    }

    // Prepare update data based on status
    const updateData: any = { status };
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    } else if (status === "APPROVED") {
      updateData.approvedAt = new Date();
    } else if (status === "SUBMITTED") {
      updateData.submittedAt = new Date();
    }

    const updatedServices = await prisma.service.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      count: updatedServices.count,
    });
  } catch (error: any) {
    console.error("Error bulk updating services:", error);
    return NextResponse.json(
      { error: "Failed to update services" },
      { status: 500 }
    );
  }
}
