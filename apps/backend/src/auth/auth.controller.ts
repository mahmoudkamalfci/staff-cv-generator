import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user, accessToken });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    try {
      const { accessToken, user } = await AuthService.verifyRefresh(refreshToken);
      res.json({ accessToken, user });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  }
}
