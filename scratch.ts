import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    await prisma.invoice.create({
      data: {
        invoiceNumber: "TEST-123",
        customerId: "dummy",
        createdById: "admin-hardcoded",
        subtotal: 100,
        total: 100
      }
    });
  } catch (e) {
    console.log(e);
  }
}
main()
