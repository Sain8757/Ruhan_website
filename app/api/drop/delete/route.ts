import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    // Delete from database
    await prisma.fileDrop.delete({
      where: { id },
    });

    // Note: We are just deleting the database record to hide it from the dashboard.
    // The Cloudinary file will remain unless a separate cron job cleans it up.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File Drop Delete Error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
