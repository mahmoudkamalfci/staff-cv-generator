import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateSkillSchema, UpdateSkillSchema } from '@cv-generator/shared';

export const skillsRouter = Router({ mergeParams: true });

// GET /api/staff/:staffId/skills
skillsRouter.get('/', asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) throw new AppError(404, 'Staff not found');

  const skills = await prisma.skill.findMany({
    where: { staffId },
    orderBy: { name: 'asc' }
  });

  res.json({ data: skills });
}));

// POST /api/staff/:staffId/skills (admin only)
skillsRouter.post('/', requireAuth, requireAdmin, validate(CreateSkillSchema), asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) throw new AppError(404, 'Staff not found');

  const skill = await prisma.skill.create({
    data: {
      ...req.body,
      staffId
    }
  });

  res.status(201).json({ data: skill });
}));

// PATCH /api/staff/:staffId/skills/:skillId (admin only)
skillsRouter.patch('/:skillId', requireAuth, requireAdmin, validate(UpdateSkillSchema), asyncHandler(async (req, res) => {
  const { staffId, skillId } = req.params;

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, staffId }
  });
  if (!skill) throw new AppError(404, 'Skill not found');

  const updatedSkill = await prisma.skill.update({
    where: { id: skillId },
    data: req.body
  });

  res.json({ data: updatedSkill });
}));

// DELETE /api/staff/:staffId/skills/:skillId (admin only)
skillsRouter.delete('/:skillId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { staffId, skillId } = req.params;

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, staffId }
  });
  if (!skill) throw new AppError(404, 'Skill not found');

  await prisma.skill.delete({ where: { id: skillId } });

  res.status(204).send();
}));
