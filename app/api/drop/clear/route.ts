import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    // Delete all records in the database.
    // Cloudinary files will remain unless we write a script to bulk delete them from Cloudinary via Admin API.
    // Since we're doing local deletion, clearing the DB is the primary step.
    const result = await prisma.fileDrop.deleteMany({});
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Clear All FileDrop Error:', error);
    return NextResponse.json({ error: 'Failed to clear files' }, { status: 500 });
  }
}
