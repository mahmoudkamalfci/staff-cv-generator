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
});
