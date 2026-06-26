import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class SkillsService {
  static async getSkillsByStaffId(staffId: string) {
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new AppError(404, 'Staff not found');

    return prisma.skill.findMany({
      where: { staffId },
      orderBy: { name: 'asc' },
    });
  }

  static async createSkill(staffId: string, data: any) {
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new AppError(404, 'Staff not found');

    return prisma.skill.create({
      data: {
        ...data,
        staffId,
      },
    });
  }

  static async updateSkill(staffId: string, skillId: string, data: any) {
    const skill = await prisma.skill.findFirst({
      where: { id: skillId, staffId },
    });
    if (!skill) throw new AppError(404, 'Skill not found');

    return prisma.skill.update({
      where: { id: skillId },
      data,
    });
  }

  static async deleteSkill(staffId: string, skillId: string) {
    const skill = await prisma.skill.findFirst({
      where: { id: skillId, staffId },
    });
    if (!skill) throw new AppError(404, 'Skill not found');

    await prisma.skill.delete({ where: { id: skillId } });
  }
}
