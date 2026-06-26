import { ProjectsService } from '../apps/backend/src/projects/projects.service.js';
import { prisma } from '../apps/backend/src/db/prisma.js';

async function run() {
  try {
    const project = await ProjectsService.getProjectById('f8da7612-340a-4475-baac-bb356e22621f');
    console.log('Success:', !!project);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
