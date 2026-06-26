import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class CvService {
  static async generateCv(staffId: string, templateId: string, userId: string) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        skills: true,
        participations: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!staff) {
      throw new AppError(404, 'Staff not found');
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    const generatedCV = await prisma.generatedCV.create({
      data: {
        staffId: staff.id,
        templateId: template.id,
        generatedBy: userId,
      },
    });

    return {
      staff,
      template,
      generatedCV,
    };
  }
}
