import { ProjectsService } from '../apps/backend/src/projects/projects.service.js';
import { prisma } from '../apps/backend/src/db/prisma.js';

async function run() {
  try {
    const data = {
      name: 'Reduced discrete data-warehouse',
      description: 'Abstergo curso amplitudo conforto conservo conscendo. Ait numquam accusamus tenus caelum.',
      client: 'Kerluke and Sons',
      location: 'Beahanfort',
      startDate: '2026-06-07T15:21:49.574Z',
      endDate: null,
      technologies: ['GraphQL', 'AWS', 'PostgreSQL', 'Node.js'],
      participations: [
        {
          staffId: '56accbbb-fc98-4dd6-9804-0f5f8377c9a2',
          role: 'Forward Integration Analyst',
          responsibilities: 'Civitas cuius ambitus. Adeo depraedor curiositas triduana dens explicabo sapiente degero ullam vehemens. Crastinus demitto volup infit tabgo tristis.'
        }
      ]
    };
    await ProjectsService.updateProject('f8da7612-340a-4475-baac-bb356e22621f', data);
    console.log('Success');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
