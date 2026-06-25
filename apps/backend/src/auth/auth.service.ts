import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export class AuthService {
  static async login(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtRefreshSecret,
      { expiresIn: config.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  }

  static async verifyRefresh(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwtSecret,
        { expiresIn: config.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
