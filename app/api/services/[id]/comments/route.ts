import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id }, select: { comments: true } });
  return NextResponse.json({ comments: service?.comments || [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

  const service = await prisma.service.findUnique({ where: { id }, select: { comments: true } });
  const existing: any[] = Array.isArray(service?.comments) ? (service!.comments as any[]) : [];
  const newComment = {
    id: Date.now().toString(),
    text: text.trim(),
    author: (session.user as any).name || 'Admin',
    createdAt: new Date().toISOString(),
  };
  const updated = await prisma.service.update({
    where: { id },
    data: { comments: [...existing, newComment] },
    select: { comments: true }
  });

  // Log activity
  const userId = (session.user as any).id;
  await prisma.activityLog.create({
    data: { userId, action: 'COMMENT_ADDED', entity: 'Service', entityId: id, details: text.trim().slice(0, 100) }
  }).catch(() => {});

  return NextResponse.json({ comment: newComment, comments: updated.comments });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { commentId } = await req.json();
  const service = await prisma.service.findUnique({ where: { id }, select: { comments: true } });
  const existing: any[] = Array.isArray(service?.comments) ? (service!.comments as any[]) : [];
  const updated = await prisma.service.update({
    where: { id },
    data: { comments: existing.filter((c: any) => c.id !== commentId) },
    select: { comments: true }
  });
  return NextResponse.json({ comments: updated.comments });
}
