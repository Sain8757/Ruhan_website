import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const customerName = formData.get('customerName') as string || null;
    const direction = formData.get('direction') as string || "MOBILE_TO_PC";

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB limit for general drops
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const filenameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: `ruhan/file-drops`,
          public_id: filenameWithoutExt + "_" + Date.now(),
          unique_filename: true,
          overwrite: false,
          resource_type: "auto"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const publicUrl = uploadResult.secure_url;

    // Save to database
    const fileDrop = await prisma.fileDrop.create({
      data: {
        filename: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type || "unknown",
        customerName: customerName,
        direction: direction
      }
    });

    return NextResponse.json({ success: true, url: publicUrl, file: fileDrop });
  } catch (error) {
    console.error('File Drop Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
