import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'services', id);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/services/${id}/${filename}`;

    // Save URL to service
    const service = await prisma.service.findUnique({ where: { id }, select: { serviceDocUrls: true } });
    const existing = service?.serviceDocUrls || [];
    await prisma.service.update({
      where: { id },
      data: { serviceDocUrls: [...existing, publicUrl] }
    });

    // Log
    const userId = (session.user as any).id;
    await prisma.activityLog.create({
      data: { userId, action: 'DOCUMENT_UPLOADED', entity: 'Service', entityId: id, details: file.name }
    }).catch(() => {});

    return NextResponse.json({ success: true, url: publicUrl, filename: file.name });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { url } = await req.json();

  const service = await prisma.service.findUnique({ where: { id }, select: { serviceDocUrls: true } });
  const updated = await prisma.service.update({
    where: { id },
    data: { serviceDocUrls: (service?.serviceDocUrls || []).filter(u => u !== url) }
  });
  return NextResponse.json({ success: true, serviceDocUrls: updated.serviceDocUrls });
}
