import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class StaffService {
  static async getStaff(page: number, limit: number) {
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.staff.count(),
    ]);

    return { staff, total };
  }

  static async getStaffById(id: string) {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: { 
        skills: true,
        participations: { include: { project: true } }
      },
    });
    if (!staff) throw new AppError(404, 'Staff not found');
    return staff;
  }

  static async createStaff(data: any) {
    const { skills, participations, ...rest } = data;
    return prisma.staff.create({ 
      data: {
        ...rest,
        skills: skills ? { create: skills } : undefined,
        participations: participations ? { create: participations } : undefined,
      }
    });
  }

  static async updateStaff(id: string, data: any) {
    const { skills, participations, ...rest } = data;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new AppError(404, 'Staff not found');

    return prisma.staff.update({
      where: { id },
      data: {
        ...rest,
        skills: skills ? { deleteMany: {}, create: skills } : undefined,
        participations: participations ? { deleteMany: {}, create: participations } : undefined,
      },
    });
  }

  static async deleteStaff(id: string) {
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new AppError(404, 'Staff not found');

    await prisma.staff.delete({ where: { id } });

    if (staff.photoUrl) {
      const photoPath = path.join(__dirname, '..', '..', 'uploads', path.basename(staff.photoUrl));
      try {
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      } catch (e: any) {
        if (e.code !== 'ENOENT') console.error('Failed to delete photo:', e);
      }
    }
  }

  static async uploadPhoto(id: string, filename: string) {
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      throw new AppError(404, 'Staff not found');
    }

    const photoUrl = `/uploads/${filename}`;
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { photoUrl },
    });

    if (staff.photoUrl) {
      const oldPhotoPath = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        path.basename(staff.photoUrl),
      );
      try {
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      } catch (e: any) {
        if (e.code !== 'ENOENT') console.error('Failed to delete old photo:', e);
      }
    }

    return updatedStaff;
  }
}
