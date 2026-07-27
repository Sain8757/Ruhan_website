import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const trackingId = formData.get('trackingId') as string;

    if (!file || !trackingId) {
      return NextResponse.json({ error: 'Missing file or trackingId' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { trackingId },
      select: { id: true, isKioskRequest: true, serviceDocUrls: true, customerId: true }
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

    // Upload to Cloudinary using upload_stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `ruhan/services/${service.id}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const publicUrl = uploadResult.secure_url;

    // Add to service documents
    const existing = service.serviceDocUrls || [];
    await prisma.service.update({
      where: { id: service.id },
      data: { serviceDocUrls: [...existing, publicUrl] }
    });

    // Auto-Save to Permanent Locker (Customer.documents)
    if (service.customerId) {
      await prisma.document.create({
        data: {
          customerId: service.customerId,
          name: file.name,
          url: publicUrl,
          type: 'Auto-Sync'
        }
      });
    }

    // Log Activity (system user)
    const systemUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (systemUser) {
      await prisma.activityLog.create({
        data: {
          userId: systemUser.id,
          action: 'DOCUMENT_UPLOADED',
          entity: 'Service',
          entityId: service.id,
          details: `Customer uploaded file: ${file.name} (Kiosk)`
        }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, url: publicUrl, filename: file.name });
  } catch (error) {
    console.error('Kiosk Cloudinary Upload Error:', error);
    return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
  }
}
