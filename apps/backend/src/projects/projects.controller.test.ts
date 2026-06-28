import { jest, describe, it, expect } from '@jest/globals';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import type { Request, Response } from 'express';


describe('ProjectsController', () => {
  it('should get projects', async () => {
    const req = {
      query: { page: '1', limit: '10' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(ProjectsService, 'getProjects').mockResolvedValue({ projects: [{ id: '1' }] as any, total: 1 });

    await ProjectsController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: [{ id: '1' }], pagination: { page: 1, limit: 10, total: 1 } });
  });

  it('should pass staffId to service if user is a staff member', async () => {
    const req = {
      query: { page: '1', limit: '10' },
      user: { role: 'staff', userId: 'user-id-123' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(ProjectsService, 'getProjects').mockResolvedValue({ projects: [{ id: '2' }] as any, total: 1 });
    
    const { prisma } = await import('../db/prisma.js');
    jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue({ id: 'staff-id-456' } as any);

    await ProjectsController.getProjects(req, res);

    expect(prisma.staff.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-id-123' },
      select: { id: true }
    });
    expect(ProjectsService.getProjects).toHaveBeenCalledWith(1, 10, undefined, 'staff-id-456');
    expect(res.json).toHaveBeenCalledWith({ data: [{ id: '2' }], pagination: { page: 1, limit: 10, total: 1 } });
  });

  it('should return empty list if user is a staff member but has no profile', async () => {
    const req = {
      query: { page: '1', limit: '10' },
      user: { role: 'staff', userId: 'user-id-no-profile' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    const { prisma } = await import('../db/prisma.js');
    jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(null);

    await ProjectsController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: [], pagination: { page: 1, limit: 10, total: 0 } });
    expect(ProjectsService.getProjects).not.toHaveBeenCalled();
  });
});
