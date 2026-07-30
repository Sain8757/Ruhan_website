import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    // Delete files older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await prisma.fileDrop.deleteMany({
      where: {
        createdAt: {
          lt: twentyFourHoursAgo
        }
      }
    });
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Cleanup FileDrop Error:', error);
    return NextResponse.json({ error: 'Failed to cleanup old files' }, { status: 500 });
  }
}
