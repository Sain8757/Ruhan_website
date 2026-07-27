import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const logs = await prisma.activityLog.findMany({
    where: { entity: 'Service', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({ logs });
}
