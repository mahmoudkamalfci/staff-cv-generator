import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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
    const { skills, participations, email, password, ...rest } = data;
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'staff',
        },
      });

      return tx.staff.create({
        data: {
          ...rest,
          userId: user.id,
          skills: skills ? { create: skills } : undefined,
          participations: participations ? { create: participations } : undefined,
        }
      });
    });
  }

  static async updateStaff(id: string, data: any) {
    const { skills, participations, email, ...rest } = data;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new AppError(404, 'Staff not found');

    return prisma.$transaction(async (tx) => {
      if (email && staff.userId) {
        await tx.user.update({
          where: { id: staff.userId },
          data: { email },
        });
      }

      return tx.staff.update({
        where: { id },
        data: {
          ...rest,
          skills: skills ? { deleteMany: {}, create: skills } : undefined,
          participations: participations ? { deleteMany: {}, create: participations } : undefined,
        },
      });
    });
  }

  static async resetPassword(id: string, newPassword: string) {
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new AppError(404, 'Staff not found');
    if (!staff.userId) throw new AppError(400, 'Staff member has no associated user account');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash },
    });

    return { success: true };
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
