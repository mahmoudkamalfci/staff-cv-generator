import { jest, describe, it, expect } from '@jest/globals';
import { AuthService } from './auth.service.js';
import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';





describe('AuthService', () => {
  describe('login', () => {
    it('should throw an error for invalid credentials (user not found)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(AuthService.login('test@test.com', 'password')).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error if password does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(AuthService.login('test@test.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    it('should return user and tokens on success', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock_token' as never);

      const result = await AuthService.login('test@test.com', 'password');

      expect(result.user).toEqual({ id: '1', email: 'test@test.com', role: 'ADMIN' });
      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
    });
  });
});
