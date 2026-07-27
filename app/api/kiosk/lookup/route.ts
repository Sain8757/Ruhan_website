import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public endpoint - no auth needed
// Returns customer name if mobile exists
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json({ found: false });
    }

    const customer = await prisma.customer.findUnique({
      where: { mobile },
      select: { name: true, mobile: true }
    });

    if (!customer) return NextResponse.json({ found: false });

    return NextResponse.json({ found: true, name: customer.name });
  } catch (error) {
    return NextResponse.json({ found: false });
  }
}
