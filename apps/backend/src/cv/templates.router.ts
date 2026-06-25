import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const templatesRouter: Router = Router();

// GET /api/templates
templatesRouter.get('/', asyncHandler(async (req, res) => {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: templates });
}));
