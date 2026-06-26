import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class ProjectsService {
  static async getProjects(page: number, limit: number) {
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          participations: {
            include: {
              staff: true,
            },
          },
        },
      }),
      prisma.project.count(),
    ]);

    return { projects, total };
  }

  static async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        participations: {
          include: {
            staff: true,
          },
        },
      },
    });
    if (!project) throw new AppError(404, 'Project not found');
    return project;
  }

  static async createProject(data: any) {
    return prisma.project.create({ data });
  }

  static async updateProject(id: string, data: any) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError(404, 'Project not found');

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  static async deleteProject(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError(404, 'Project not found');

    await prisma.project.delete({ where: { id } });
  }
}
