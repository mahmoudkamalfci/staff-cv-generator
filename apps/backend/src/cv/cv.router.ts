import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const cvRouter: Router = Router();

// GET /api/cv/:staffId/:templateId
cvRouter.get('/:staffId/:templateId', requireAuth, asyncHandler(async (req, res) => {
  const { staffId, templateId } = req.params;
  const userId = req.user!.userId;

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      skills: true,
      participations: {
        include: {
          project: true
        }
      }
    }
  });

  if (!staff) {
    throw new AppError(404, 'Staff not found');
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    throw new AppError(404, 'Template not found');
  }

  const generatedCV = await prisma.generatedCV.create({
    data: {
      staffId: staff.id,
      templateId: template.id,
      generatedBy: userId
    }
  });

  res.json({
    data: {
      staff,
      template,
      generatedCV
    }
  });
}));
