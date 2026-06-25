import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateParticipationSchema, UpdateParticipationSchema } from '@cv-generator/shared';

export const participationsRouter: Router = Router({ mergeParams: true });

// POST /api/projects/:projectId/participations (admin only)
participationsRouter.post('/', requireAuth, requireAdmin, (req, res, next) => {
  // Inject projectId from params into body so validation passes
  if (req.params.projectId) req.body.projectId = req.params.projectId;
  next();
}, validate(CreateParticipationSchema), asyncHandler(async (req, res) => {
  
  // CreateParticipationSchema validation requires `projectId` in body, 
  // but we can inject it before validating if we aren't using a unified schema.
  // Wait, validate happens before asyncHandler. 
  // We need to inject projectId into req.body so validate passes.
  const { projectId } = req.params;
  
  const participation = await prisma.participation.create({
    data: {
      ...req.body,
      projectId
    }
  });
  
  // We need to make sure we return staff with it?
  // Wait, let's just return the created participation
  res.status(201).json({ data: participation });
}));

// PATCH /api/projects/:projectId/participations/:id (admin only)
participationsRouter.patch('/:id', requireAuth, requireAdmin, validate(UpdateParticipationSchema), asyncHandler(async (req, res) => {
  const { projectId, id } = req.params;
  
  const participation = await prisma.participation.findFirst({
    where: { id, projectId }
  });
  if (!participation) throw new AppError(404, 'Participation not found');

  const updated = await prisma.participation.update({
    where: { id },
    data: req.body
  });
  
  res.json({ data: updated });
}));

// DELETE /api/projects/:projectId/participations/:id (admin only)
participationsRouter.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { projectId, id } = req.params;
  
  const participation = await prisma.participation.findFirst({
    where: { id, projectId }
  });
  if (!participation) throw new AppError(404, 'Participation not found');

  await prisma.participation.delete({ where: { id } });
  
  res.status(204).send();
}));
