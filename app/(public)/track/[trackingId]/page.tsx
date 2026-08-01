import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import TrackClient from "@/components/tracking/TrackClient";

export default async function TrackServicePage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;

  const service = await prisma.service.findUnique({
    where: { trackingId },
    include: {
      customer: { select: { name: true, mobile: true, loyaltyPoints: true } }
    }
  });

  if (!service) {
    return notFound();
  }

  // Get Shop Settings
  const settingsRaw = await prisma.shopSettings.findMany();
  const settings: Record<string, string> = {};
  settingsRaw.forEach((s) => {
    settings[s.key] = s.value;
  });

  // Calculate Queue Position (Feature 5)
  // How many PENDING services were created before this one today?
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  let queuePosition = 0;
  if (service.status === 'PENDING') {
    queuePosition = await prisma.service.count({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: startOfDay,
          lte: service.createdAt
        }
      }
    });
  }

  return (
    <TrackClient 
      service={service} 
      settings={settings}
      queuePosition={queuePosition}
    />
  );
}
