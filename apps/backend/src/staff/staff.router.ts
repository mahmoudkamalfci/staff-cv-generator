import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateStaffSchema, UpdateStaffSchema } from '@cv-generator/shared';
import { upload } from '../upload/upload.js';
import { skillsRouter } from './skills.router.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const staffRouter: Router = Router();

staffRouter.use('/:staffId/skills', skillsRouter);

// GET /api/staff
staffRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.staff.count(),
    ]);

    res.json({ data: staff, pagination: { page, limit, total } });
  }),
);

// GET /api/staff/:id
staffRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { skills: true },
    });
    if (!staff) throw new AppError(404, 'Staff not found');
    res.json({ data: staff });
  }),
);

// POST /api/staff (admin only)
staffRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(CreateStaffSchema),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.create({
      data: req.body,
    });
    res.status(201).json({ data: staff });
  }),
);

// PATCH /api/staff/:id (admin only)
staffRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(UpdateStaffSchema),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) throw new AppError(404, 'Staff not found');

    const updatedStaff = await prisma.staff.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: updatedStaff });
  }),
);

// DELETE /api/staff/:id (admin only)
staffRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) throw new AppError(404, 'Staff not found');

    await prisma.staff.delete({ where: { id: req.params.id } });

    // If there's a photo, delete it
    if (staff.photoUrl) {
      const photoPath = path.join(__dirname, '..', '..', 'uploads', path.basename(staff.photoUrl));
      try {
        fs.unlinkSync(photoPath);
      } catch (e: any) {
        if (e.code !== 'ENOENT') console.error('Failed to delete photo:', e);
      }
    }

    res.status(204).send();
  }),
);

// POST /api/staff/:id/photo (admin only)
staffRouter.post(
  '/:id/photo',
  requireAuth,
  requireAdmin,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) {
      // Clean up uploaded file if staff not found
      if (req.file) fs.unlinkSync(req.file.path);
      throw new AppError(404, 'Staff not found');
    }

    if (!req.file) throw new AppError(400, 'No photo provided');

    const photoUrl = `/uploads/${req.file.filename}`;
    let updatedStaff;
    try {
      updatedStaff = await prisma.staff.update({
        where: { id: req.params.id },
        data: { photoUrl },
      });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      throw error;
    }

    // Delete old photo if exists
    if (staff.photoUrl) {
      const oldPhotoPath = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        path.basename(staff.photoUrl),
      );
      try {
        fs.unlinkSync(oldPhotoPath);
      } catch (e: any) {
        if (e.code !== 'ENOENT') console.error('Failed to delete old photo:', e);
      }
    }

    res.json({ data: updatedStaff });
  }),
);
