import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

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

    // Update service record with new document URL
    const existingUrls = service.serviceDocUrls || [];
    await prisma.service.update({
      where: { id },
      data: {
        serviceDocUrls: [...existingUrls, publicUrl]
      }
    });

    const userId = (session.user as any)?.id;
    if (userId && userId !== "admin-hardcoded") {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: 'DOCUMENT_UPLOADED',
          entity: 'Service',
          entityId: service.id,
          details: `Admin uploaded file: ${file.name}`
        }
      });
    }

    return NextResponse.json({ success: true, url: publicUrl, filename: file.name });
  } catch (error) {
    console.error('Cloudinary Admin Upload Error:', error);
    return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const { url } = await req.json();

    const service = await prisma.service.findUnique({ where: { id }, select: { serviceDocUrls: true } });
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Optional: Delete from Cloudinary as well
    // Extract public_id from Cloudinary URL (ruhan/services/[id]/[filename])
    try {
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folderPath = `ruhan/services/${id}/${filename}`;
      await cloudinary.uploader.destroy(folderPath);
    } catch (e) {
      console.error('Failed to delete from Cloudinary:', e);
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { serviceDocUrls: (service.serviceDocUrls || []).filter(u => u !== url) }
    });
    
    return NextResponse.json({ success: true, serviceDocUrls: updated.serviceDocUrls });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
