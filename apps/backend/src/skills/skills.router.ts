import { Router } from 'express';
import { SkillsController } from './skills.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateSkillSchema, UpdateSkillSchema } from '@cv-generator/shared';

export const skillsRouter: Router = Router({ mergeParams: true });

skillsRouter.get('/', asyncHandler(SkillsController.getSkillsByStaffId));

skillsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(CreateSkillSchema),
  asyncHandler(SkillsController.createSkill),
);

skillsRouter.patch(
  '/:skillId',
  requireAuth,
  requireAdmin,
  validate(UpdateSkillSchema),
  asyncHandler(SkillsController.updateSkill),
);

skillsRouter.delete(
  '/:skillId',
  requireAuth,
  requireAdmin,
  asyncHandler(SkillsController.deleteSkill),
);
