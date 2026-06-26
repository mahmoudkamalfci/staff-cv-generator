import { Router } from 'express';
import { ParticipationsController } from './participations.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateParticipationSchema, UpdateParticipationSchema } from '@cv-generator/shared';

export const participationsRouter: Router = Router({ mergeParams: true });

participationsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    // Inject projectId from params into body so validation passes
    if (!req.body) req.body = {};
    if (req.params.projectId) req.body.projectId = req.params.projectId;
    next();
  },
  validate(CreateParticipationSchema),
  asyncHandler(ParticipationsController.createParticipation),
);

participationsRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(UpdateParticipationSchema),
  asyncHandler(ParticipationsController.updateParticipation),
);

participationsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(ParticipationsController.deleteParticipation),
);
