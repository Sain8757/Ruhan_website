import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { amount, paymentMode } = await req.json();

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  if (!paymentMode) return NextResponse.json({ error: 'Payment mode required' }, { status: 400 });

  const service = await prisma.service.findUnique({ where: { id }, include: { customer: true } });
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  const newAmountPaid = (service.amountPaid || 0) + parseFloat(amount);
  const newPaymentStatus = newAmountPaid >= service.fees ? 'PAID' : 'PARTIAL';

  const updated = await prisma.service.update({
    where: { id },
    data: {
      amountPaid: newAmountPaid,
      paymentStatus: newPaymentStatus as any,
      paymentMode: paymentMode as any,
    }
  });

  await prisma.customerPayment.create({
    data: {
      customerId: service.customerId,
      serviceId: service.id,
      amount: parseFloat(amount),
      paymentMode: paymentMode as any,
      notes: "Service fee payment",
    }
  });


  // Log
  const userId = (session.user as any).id;
  await prisma.activityLog.create({
    data: {
      userId, action: 'PAYMENT_COLLECTED', entity: 'Service', entityId: id,
      details: `₹${amount} collected via ${paymentMode} — Status: ${newPaymentStatus}`
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, paymentStatus: newPaymentStatus, service: updated });
}
