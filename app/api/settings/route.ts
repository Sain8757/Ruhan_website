import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Default settings
const DEFAULTS: Record<string, string> = {
  shopName: "RA Seva Point",
  tagline: "One Stop for Books, Print & Digital Services",
  upiId: "rasevapoint@upi",
  gstEnabled: "false",
  shopAddress: "",
  shopPhone: "",
  shopEmail: "",
};

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await prisma.shopSettings.findMany();
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Upsert each key-value pair
  const updates = Object.entries(body).filter(([key]) => key in DEFAULTS);

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.shopSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  // Log the action
  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "UPDATE_SETTINGS",
      entity: "ShopSettings",
      details: `Updated shop settings`,
    },
  });

  return NextResponse.json({ success: true });
}
