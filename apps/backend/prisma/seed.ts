import 'dotenv/config';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

// CommonJS require to bypass ESM named export issues with Prisma
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/staff-cv-generator?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const classicConfig = {
  /* ... your existing classicConfig ... */ baseLayout: 'two-column',
  primaryColor: '#1e293b',
  accentColor: '#475569',
  sections: [
    { id: 'header', label: 'Header', visible: true, order: 0 },
    { id: 'skills', label: 'Skills', visible: true, order: 1 },
    { id: 'summary', label: 'Profile', visible: true, order: 2 },
    { id: 'experience', label: 'Experience', visible: true, order: 3 },
  ],
};

const modernConfig = {
  /* ... your existing modernConfig ... */ baseLayout: 'one-column',
  primaryColor: '#1d4ed8',
  accentColor: '#3b82f6',
  sections: [
    { id: 'header', label: 'Header', visible: true, order: 0 },
    { id: 'summary', label: 'About', visible: true, order: 1 },
    { id: 'skills', label: 'Skills', visible: true, order: 2 },
    { id: 'experience', label: 'Experience', visible: true, order: 3 },
  ],
};

const compactConfig = {
  /* ... your existing compactConfig ... */ baseLayout: 'one-column',
  primaryColor: '#111827',
  accentColor: '#374151',
  sections: [
    { id: 'header', label: 'Header', visible: true, order: 0 },
    { id: 'summary', label: 'Summary', visible: true, order: 1 },
    { id: 'skills', label: 'Skills', visible: true, order: 2 },
    { id: 'experience', label: 'Experience', visible: true, order: 3 },
  ],
};

async function main() {
  console.log('🧹 Cleaning database (ignoring templates)...');
  await prisma.generatedCV.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding Templates...');
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

  const compactTemplate = await prisma.template.upsert({
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

  console.log('👤 Seeding Users & Staff...');
  const users = [];

  // 1. Create one GUARANTEED admin user you can log in with
  const knownPasswordHash = await bcrypt.hash('password123', 10);
  const fakePasswordHash = '$2a$10$x4sW.sHxg.W4V/w/D3OOGeU8AqzRjP3Kx/Z6XyG5q2Q2g4sW.sHxg'; // Dummy bcrypt hash

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cvgenerator.local',
      passwordHash: knownPasswordHash,
      role: 'admin',
      staff: {
        create: {
          name: 'System Admin',
          jobTitle: 'Lead Developer',
          yearsExperience: 6,
          summary: 'Platform administrator account.',
          skills: {
            create: [
              { name: 'TypeScript', level: 'expert' },
              { name: 'PostgreSQL', level: 'advanced' },
            ],
          },
        },
      },
    },
    include: { staff: true },
  });
  users.push(adminUser);

  // 2. Generate the rest of the random users
  for (let i = 0; i < 49; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        passwordHash: fakePasswordHash, // They all get 'password123'
        role: 'staff',
        staff: {
          create: {
            name: faker.person.fullName(),
            jobTitle: faker.person.jobTitle(),
            yearsExperience: faker.number.int({ min: 1, max: 15 }),
            summary: faker.lorem.paragraph(),
            photoUrl: faker.image.avatar(),
            skills: {
              create: Array.from({ length: faker.number.int({ min: 3, max: 7 }) }).map(() => ({
                name: faker.hacker.adjective() + ' ' + faker.hacker.noun(),
                level: faker.helpers.arrayElement([
                  'beginner',
                  'intermediate',
                  'advanced',
                  'expert',
                ]),
              })),
            },
          },
        },
      },
      include: { staff: true },
    });
    users.push(user);
  }

  console.log('🏗️ Seeding Projects...');
  const techStackOptions = [
    'React',
    'Node.js',
    'PostgreSQL',
    'TypeScript',
    'Docker',
    'AWS',
    'Vue',
    'Python',
    'GraphQL',
    'Prisma',
  ];
  const projects = [];

  for (let i = 0; i < 50; i++) {
    const project = await prisma.project.create({
      data: {
        name: faker.company.catchPhrase(),
        description: faker.lorem.sentences(2),
        client: faker.company.name(),
        location: faker.location.city(),
        startDate: faker.date.past({ years: 2 }),
        endDate: faker.datatype.boolean() ? faker.date.recent() : null, // Some projects ongoing
        technologies: faker.helpers.arrayElements(techStackOptions, { min: 2, max: 5 }),
      },
    });
    projects.push(project);
  }

  console.log('🤝 Seeding Participations...');
  // Link random staff to random projects
  for (const project of projects) {
    // Pick 2 to 4 random staff members for this project
    const assignedStaff = faker.helpers.arrayElements(
      users.filter((u) => u.staff),
      { min: 2, max: 4 },
    );

    for (const user of assignedStaff) {
      if (!user.staff) continue;

      await prisma.participation.create({
        data: {
          staffId: user.staff.id,
          projectId: project.id,
          role: faker.person.jobTitle(),
          responsibilities: faker.lorem.paragraph(),
        },
      });
    }
  }

  console.log('📄 Seeding Generated CVs...');
  for (let i = 0; i < 5; i++) {
    const randomUser = faker.helpers.arrayElement(users.filter((u) => u.staff));
    if (!randomUser.staff) continue;

    await prisma.generatedCV.create({
      data: {
        staffId: randomUser.staff.id,
        templateId: compactTemplate.id, // Just using compact template for mock data
        generatedBy: randomUser.id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
