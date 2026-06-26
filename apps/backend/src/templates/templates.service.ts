import { prisma } from '../db/prisma.js';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler.js';

export class TemplatesService {
  static async getActiveTemplates() {
    return prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getTemplateById(id: string) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new AppError(404, 'Template not found');
    return template;
  }

  static async createTemplate(data: { name: string; description: string; config: unknown }) {
    return prisma.template.create({
      data: {
        name: data.name,
        description: data.description,
        layoutKey: randomUUID(), // custom templates get a UUID as layoutKey
        isBuiltIn: false,
        isActive: true,
        config: data.config as object,
      },
    });
  }

  static async updateTemplate(
    id: string,
    data: { name?: string; description?: string; config?: unknown },
  ) {
    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Template not found');
    if (existing.isBuiltIn) throw new AppError(403, 'Built-in templates cannot be modified');

    return prisma.template.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.config !== undefined && { config: data.config as object }),
      },
    });
  }

  static async deleteTemplate(id: string) {
    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Template not found');
    if (existing.isBuiltIn) throw new AppError(403, 'Built-in templates cannot be deleted');

    await prisma.template.delete({ where: { id } });
  }
}
