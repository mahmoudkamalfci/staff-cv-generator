import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staff-cv-generator?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const classicConfig = {
  baseLayout: 'two-column',
  primaryColor: '#1e293b',
  accentColor: '#475569',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 1 },
    { id: 'summary',    label: 'Profile',    visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

const modernConfig = {
  baseLayout: 'one-column',
  primaryColor: '#1d4ed8',
  accentColor: '#3b82f6',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'summary',    label: 'About',      visible: true,  order: 1 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

const compactConfig = {
  baseLayout: 'one-column',
  primaryColor: '#111827',
  accentColor: '#374151',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'summary',    label: 'Summary',    visible: true,  order: 1 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

async function main() {
  // Upsert built-in templates (idempotent — safe to re-run)
  await prisma.template.upsert({
    where: { layoutKey: 'classic' },
    update: { isBuiltIn: true, config: classicConfig },
    create: {
      name: 'Classic',
      layoutKey: 'classic',
      description: 'Traditional two-column layout with sidebar skills.',
      isActive: true,
      isBuiltIn: true,
      config: classicConfig,
    },
  });

  await prisma.template.upsert({
    where: { layoutKey: 'modern' },
    update: { isBuiltIn: true, config: modernConfig },
    create: {
      name: 'Modern',
      layoutKey: 'modern',
      description: 'Full-width single-column card-based layout.',
      isActive: true,
      isBuiltIn: true,
      config: modernConfig,
    },
  });

  await prisma.template.upsert({
    where: { layoutKey: 'compact' },
    update: { isBuiltIn: true, config: compactConfig },
    create: {
      name: 'Compact',
      layoutKey: 'compact',
      description: 'Dense single-column layout, maximises information density.',
      isActive: true,
      isBuiltIn: true,
      config: compactConfig,
    },
  });

  console.log('✅ Templates seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
