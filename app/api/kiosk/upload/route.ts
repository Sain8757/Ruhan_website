import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const trackingId = formData.get('trackingId') as string;

    if (!file || !trackingId) {
      return NextResponse.json({ error: 'Missing file or trackingId' }, { status: 400 });
    }

    // Verify the service belongs to this trackingId and is a Kiosk request
    const service = await prisma.service.findUnique({
      where: { trackingId },
      select: { id: true, isKioskRequest: true, serviceDocUrls: true, customer: { select: { id: true } } }
    });

    if (!service || !service.isKioskRequest) {
      return NextResponse.json({ error: 'Invalid or expired tracking ID' }, { status: 403 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save under the service ID directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'services', service.id);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/services/${service.id}/${filename}`;

    // Add to service documents
    const existing = service.serviceDocUrls || [];
    await prisma.service.update({
      where: { id: service.id },
      data: { serviceDocUrls: [...existing, publicUrl] }
    });

    // Log Activity (system user)
    const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (systemUser) {
      await prisma.activityLog.create({
        data: {
          userId: systemUser.id,
          action: 'DOCUMENT_UPLOADED',
          entity: 'Service',
          entityId: service.id,
          details: `Customer uploaded file: ${file.name}`
        }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, url: publicUrl, filename: file.name });
  } catch (error) {
    console.error('Kiosk Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
