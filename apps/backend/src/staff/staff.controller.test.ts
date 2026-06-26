import { describe, it, expect, vi } from 'vitest';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { Request, Response } from 'express';

vi.mock('./staff.service.js');

describe('StaffController', () => {
  it('should get staff list with pagination', async () => {
    const req = {
      query: { page: '1', limit: '10' },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
    } as unknown as Response;

    const mockStaff = [{ id: '1', name: 'John Doe', email: 'john@doe.com' }];
    vi.mocked(StaffService.getStaff).mockResolvedValue({ staff: mockStaff as any, total: 1 });

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
      json: vi.fn(),
    } as unknown as Response;

    const mockStaff = { id: '1', name: 'John Doe', email: 'john@doe.com' };
    vi.mocked(StaffService.getStaffById).mockResolvedValue(mockStaff as any);

    await StaffController.getStaffById(req, res);

    expect(StaffService.getStaffById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ data: mockStaff });
  });
});
