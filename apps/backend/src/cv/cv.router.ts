import { Router } from 'express';
import { CvController } from './cv.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

export const cvRouter: Router = Router();

const paramSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
    templateId: z.string().uuid(),
  }),
});

cvRouter.get(
  '/:staffId/:templateId',
  requireAuth,
  validate(paramSchema),
  asyncHandler(CvController.generateCv),
);
