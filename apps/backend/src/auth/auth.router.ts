import { Router } from 'express';
import { AuthService } from './auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

export const authRouter: Router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['staff', 'admin']).optional()
});

authRouter.post('/register', asyncHandler(async (req, res) => {
  const { email, password, role } = registerSchema.parse(req.body);
  try {
    const user = await AuthService.register(email, password, role);
    res.status(201).json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  try {
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);
    
    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user, accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}));

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  try {
    const { accessToken } = await AuthService.verifyRefresh(refreshToken);
    res.json({ accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}));
