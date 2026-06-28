import { jest, describe, it, expect } from '@jest/globals';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import type { Request, Response } from 'express';

describe('StaffController', () => {
  it('should get staff list with pagination', async () => {
    const req = {
      query: { page: '1', limit: '10' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    const mockStaff = [{ id: '1', name: 'John Doe', email: 'john@doe.com' }];
    jest.spyOn(StaffService, 'getStaff').mockResolvedValue({ staff: mockStaff as any, total: 1 });

    await StaffController.getStaff(req, res);

    expect(StaffService.getStaff).toHaveBeenCalledWith(1, 10, undefined);
    expect(res.json).toHaveBeenCalledWith({
      data: mockStaff,
      pagination: { page: 1, limit: 10, total: 1 },
    });
  });

  it('should get staff by id', async () => {
    const req = {
      params: { id: '1' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    const mockStaff = { id: '1', name: 'John Doe', email: 'john@doe.com' };
    jest.spyOn(StaffService, 'getStaffById').mockResolvedValue(mockStaff as any);

    await StaffController.getStaffById(req, res);

    expect(StaffService.getStaffById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ data: mockStaff });
  });

  describe('updateStaff', () => {
    it('should allow admin to edit any profile', async () => {
      const req = {
        params: { id: '2' },
        user: { role: 'admin', userId: '1' },
        body: { name: 'Updated Name' },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const mockStaff = { id: '2', name: 'Updated Name', userId: '2' };
      jest.spyOn(StaffService, 'updateStaff').mockResolvedValue(mockStaff as any);

      await StaffController.updateStaff(req, res);

      expect(StaffService.updateStaff).toHaveBeenCalledWith('2', { name: 'Updated Name' });
      expect(res.json).toHaveBeenCalledWith({ data: mockStaff });
    });

    it('should allow staff to edit their own profile', async () => {
      const req = {
        params: { id: '2' },
        user: { role: 'user', userId: 'user-2' },
        body: { name: 'Updated Name' },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const mockStaff = { id: '2', name: 'Original Name', userId: 'user-2' };
      const updatedStaff = { id: '2', name: 'Updated Name', userId: 'user-2' };
      
      jest.spyOn(StaffService, 'getStaffById').mockResolvedValue(mockStaff as any);
      jest.spyOn(StaffService, 'updateStaff').mockResolvedValue(updatedStaff as any);

      await StaffController.updateStaff(req, res);

      expect(StaffService.updateStaff).toHaveBeenCalledWith('2', { name: 'Updated Name' });
      expect(res.json).toHaveBeenCalledWith({ data: updatedStaff });
    });

    it('should return 403 if staff tries to edit another profile', async () => {
      const req = {
        params: { id: '2' },
        user: { role: 'user', userId: 'user-3' },
        body: { name: 'Updated Name' },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockStaff = { id: '2', name: 'Original Name', userId: 'user-2' };
      jest.spyOn(StaffService, 'getStaffById').mockResolvedValue(mockStaff as any);

      await StaffController.updateStaff(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: You can only edit your own profile' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const req = {
        params: { id: '1' },
        body: { password: 'newpassword123' },
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      jest.spyOn(StaffService, 'resetPassword').mockResolvedValue({ success: true });

      await StaffController.resetPassword(req, res);

      expect(StaffService.resetPassword).toHaveBeenCalledWith('1', 'newpassword123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('should throw an error if password is missing', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;

      await expect(StaffController.resetPassword(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Password is required',
      });
    });
  });
});
