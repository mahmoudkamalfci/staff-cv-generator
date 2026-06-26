import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class ParticipationsService {
  static async createParticipation(projectId: string, data: any) {
    return prisma.participation.create({
      data: {
        ...data,
        projectId,
      },
    });
  }

  static async updateParticipation(projectId: string, id: string, data: any) {
    const participation = await prisma.participation.findFirst({
      where: { id, projectId },
    });
    if (!participation) throw new AppError(404, 'Participation not found');

    return prisma.participation.update({
      where: { id },
      data,
    });
  }

  static async deleteParticipation(projectId: string, id: string) {
    const participation = await prisma.participation.findFirst({
      where: { id, projectId },
    });
    if (!participation) throw new AppError(404, 'Participation not found');

    await prisma.participation.delete({ where: { id } });
  }
}
