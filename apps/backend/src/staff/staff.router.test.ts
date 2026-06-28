import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import { staffRouter } from './staff.router.js';
import { StaffService } from './staff.service.js';
import type * as http from 'http';
import jwt from 'jsonwebtoken';

jest.mock('./staff.service.js');

describe('staff.router', () => {
  let app: express.Application;
  let server: http.Server;
  let port: number;

  beforeAll((done) => {
    app = express();
    app.use(express.json());
    app.use('/staff', staffRouter);
    server = app.listen(0, () => {
      port = (server.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const getUrl = (path: string) => `http://localhost:${port}${path}`;

  describe('POST /staff/:id/reset-password', () => {
    const adminToken = jwt.sign({ userId: 'admin-id', email: 'admin@test.com', role: 'admin' }, process.env.JWT_SECRET || 'supersecretjwtkeythatyoushouldchange');
    const userToken = jwt.sign({ userId: 'user-id', email: 'user@test.com', role: 'user' }, process.env.JWT_SECRET || 'supersecretjwtkeythatyoushouldchange');

    it('should reject requests without authentication', async () => {
      const response = await fetch(getUrl('/staff/1/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'newpassword123' })
      });
      
      expect(response.status).toBe(401);
    });

    it('should reject requests from non-admin users', async () => {
      const response = await fetch(getUrl('/staff/1/reset-password'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ password: 'newpassword123' })
      });
      
      expect(response.status).toBe(403);
    });

    it('should successfully reset password for admin users', async () => {
      jest.spyOn(StaffService, 'resetPassword').mockResolvedValue({ success: true });

      const response = await fetch(getUrl('/staff/1/reset-password'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ password: 'newpassword123' })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('POST /staff/suggestions', () => {
    const adminToken = jwt.sign({ userId: 'admin-id', email: 'admin@test.com', role: 'admin' }, process.env.JWT_SECRET || 'supersecretjwtkeythatyoushouldchange');

    it('should return suggestions', async () => {
      jest.spyOn(StaffService, 'getSuggestions').mockResolvedValue([{ id: '1', name: 'John', matchedSkills: ['React'] }] as any);

      const response = await fetch(getUrl('/staff/suggestions'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ technologies: ['react'] })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.length).toBe(1);
    });
  });
});
