import { Router } from 'express';
import { z } from 'zod';
import { TemplatesController } from './templates.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateTemplateInputSchema, UpdateTemplateInputSchema } from '@cv-generator/shared';

export const templatesRouter: Router = Router();

templatesRouter.get('/', asyncHandler(TemplatesController.getActiveTemplates));

templatesRouter.get(
  '/:id',
  requireAuth,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(TemplatesController.getTemplateById),
);

templatesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(z.object({ body: CreateTemplateInputSchema })),
  asyncHandler(TemplatesController.createTemplate),
);

templatesRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: UpdateTemplateInputSchema,
    }),
  ),
  asyncHandler(TemplatesController.updateTemplate),
);

templatesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(TemplatesController.deleteTemplate),
);
