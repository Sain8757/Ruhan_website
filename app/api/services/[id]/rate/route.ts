import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { rating, feedback } = body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating. Must be between 1 and 5." },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        rating,
        feedback: feedback || null,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error rating service:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}
