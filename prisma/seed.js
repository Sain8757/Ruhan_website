const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@raseva.com" },
    update: {},
    create: {
      name: "RA Seva Admin",
      email: "admin@raseva.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  const operatorPassword = await bcrypt.hash("operator123", 10);

  const operator = await prisma.user.upsert({
    where: { email: "operator@raseva.com" },
    update: {},
    create: {
      name: "RA Operator",
      email: "operator@raseva.com",
      password: operatorPassword,
      role: "OPERATOR",
      isActive: true,
    },
  });

  console.log({ admin, operator });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
