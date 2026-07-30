import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const files = await prisma.fileDrop.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ files });
  } catch (error) {
    console.error('File Drop Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
