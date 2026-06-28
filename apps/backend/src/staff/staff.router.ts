import { Router } from 'express';
import { StaffController } from './staff.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateStaffSchema, UpdateStaffSchema } from '@cv-generator/shared';
import { upload } from '../upload/upload.js';

export const staffRouter: Router = Router();

staffRouter.get('/', asyncHandler(StaffController.getStaff));
staffRouter.post('/suggestions', requireAuth, asyncHandler(StaffController.getSuggestions));
staffRouter.get('/:id', asyncHandler(StaffController.getStaffById));
staffRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(CreateStaffSchema),
  asyncHandler(StaffController.createStaff),
);
staffRouter.patch(
  '/:id',
  requireAuth,
  validate(UpdateStaffSchema),
  asyncHandler(StaffController.updateStaff),
);
staffRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(StaffController.deleteStaff),
);
staffRouter.post(
  '/:id/photo',
  requireAuth,
  requireAdmin,
  upload.single('photo'),
  asyncHandler(StaffController.uploadPhoto),
);
staffRouter.post(
  '/:id/reset-password',
  requireAuth,
  requireAdmin,
  asyncHandler(StaffController.resetPassword),
);
