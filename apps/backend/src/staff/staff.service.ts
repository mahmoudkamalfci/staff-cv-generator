import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class StaffService {
  private static formatPhotoUrl(photoUrl: string | null): string | null {
    if (!photoUrl) return null;
    return photoUrl.startsWith('http') ? photoUrl : `${config.backendUrl}${photoUrl}`;
  }
  static async getStaff(page: number, limit: number, search?: string) {
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { jobTitle: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.staff.count({ where: whereClause }),
    ]);

    return {
      staff: staff.map((s) => ({
        ...s,
        photoUrl: StaffService.formatPhotoUrl(s.photoUrl),
      })),
      total,
    };
  }

  static async getStaffById(id: string) {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        skills: true,
        participations: { include: { project: true } },
        user: { select: { email: true } },
      },
    });
    if (!staff) throw new AppError(404, 'Staff not found');

    const { user, ...rest } = staff;
    return {
      ...rest,
      photoUrl: StaffService.formatPhotoUrl(rest.photoUrl),
      email: user?.email,
    };
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

      const newStaff = await tx.staff.create({
        data: {
          ...rest,
          userId: user.id,
          skills: skills ? { create: skills } : undefined,
          participations: participations ? { create: participations } : undefined,
        },
      });
      return {
        ...newStaff,
        photoUrl: StaffService.formatPhotoUrl(newStaff.photoUrl),
      };
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

      const updated = await tx.staff.update({
        where: { id },
        data: {
          ...rest,
          skills: skills ? { deleteMany: {}, create: skills } : undefined,
          participations: participations ? { deleteMany: {}, create: participations } : undefined,
        },
      });
      return {
        ...updated,
        photoUrl: StaffService.formatPhotoUrl(updated.photoUrl),
      };
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

    await prisma.$transaction(async (tx) => {
      await tx.staff.delete({ where: { id } });
      if (staff.userId) {
        await tx.user.delete({ where: { id: staff.userId } });
      }
    });

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

    return {
      ...updatedStaff,
      photoUrl: StaffService.formatPhotoUrl(updatedStaff.photoUrl),
    };
  }

  static async getSuggestions(technologies: string[]) {
    if (!technologies || technologies.length === 0) return [];

    // Step 1: fetch staff with skills that might match
    const staffMembers = await prisma.staff.findMany({
      include: { skills: true },
    });

    // Step 2: process and sort
    const results = staffMembers
      .map((staff) => {
        const matchedSkills = staff.skills
          .filter((skill) =>
            technologies.some((tech) => {
              const t = tech.toLowerCase();
              const s = skill.name.toLowerCase();
              return s.includes(t) || t.includes(s); // Bi-directional fuzzy match
            }),
          )
          .map((s) => s.name);
        return {
          ...staff,
          photoUrl: StaffService.formatPhotoUrl(staff.photoUrl),
          matchedSkills,
        };
      })
      .filter((staff) => staff.matchedSkills.length > 0);

    return results.sort((a, b) => b.matchedSkills.length - a.matchedSkills.length);
  }
}
