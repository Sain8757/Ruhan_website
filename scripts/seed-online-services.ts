import { PrismaClient } from '@prisma/client';
import { allServicesData } from '../app/(dashboard)/online-work/data';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed Online Services...');
  
  await prisma.onlineServiceLink.deleteMany({});
  await prisma.onlineServiceCategory.deleteMany({});
  console.log('Cleared existing online services data.');

  let categoryOrder = 1;
  for (const service of allServicesData) {
    const category = await prisma.onlineServiceCategory.create({
      data: {
        title: service.title,
        description: service.description,
        tag: service.tag,
        icon: 'Link',
        order: categoryOrder,
      },
    });

    let linkOrder = 1;
    if (service.subLinks && service.subLinks.length > 0) {
      for (const link of service.subLinks) {
        await prisma.onlineServiceLink.create({
          data: {
            categoryId: category.id,
            title: link.title,
            href: link.href,
            order: linkOrder,
          }
        });
        linkOrder++;
      }
    }
    categoryOrder++;
  }

  console.log(`Successfully seeded ${allServicesData.length} online service categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
