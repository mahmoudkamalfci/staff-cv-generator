import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter: Router = Router();

authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/refresh', asyncHandler(AuthController.refresh));
authRouter.post('/logout', asyncHandler(AuthController.logout));
