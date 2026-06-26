import { jest, describe, it, expect } from '@jest/globals';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';


describe('AuthController', () => {
  it('should login successfully', async () => {
    const req = {
      body: { email: 'test@example.com', password: 'password123' },
    } as Request;

    const res = {
      cookie: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    jest.spyOn(AuthService, 'login').mockResolvedValue({
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });

    await AuthController.login(req, res);

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
      accessToken: 'access_token',
    });
  });
});
