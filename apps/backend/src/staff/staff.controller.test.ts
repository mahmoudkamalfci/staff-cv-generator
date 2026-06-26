import { jest, describe, it, expect } from '@jest/globals';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { Request, Response } from 'express';


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

    expect(StaffService.getStaff).toHaveBeenCalledWith(1, 10);
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
});
