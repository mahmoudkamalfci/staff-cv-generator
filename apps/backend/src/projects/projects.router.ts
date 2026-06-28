import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateProjectSchema, UpdateProjectSchema } from '@cv-generator/shared';

export const projectsRouter: Router = Router();

projectsRouter.get('/', requireAuth, asyncHandler(ProjectsController.getProjects));
projectsRouter.get('/:id', requireAuth, asyncHandler(ProjectsController.getProjectById));

projectsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(CreateProjectSchema),
  asyncHandler(ProjectsController.createProject),
);

projectsRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(UpdateProjectSchema),
  asyncHandler(ProjectsController.updateProject),
);

projectsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(ProjectsController.deleteProject),
);
