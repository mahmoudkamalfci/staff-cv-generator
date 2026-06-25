import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.template.createMany({
    data: [
      { name: 'Classic', layoutKey: 'classic', description: 'Traditional two-column layout.', isActive: true },
      { name: 'Modern', layoutKey: 'modern', description: 'Full-width card-based layout.', isActive: true },
      { name: 'Compact', layoutKey: 'compact', description: 'Single-column dense layout.', isActive: true },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
