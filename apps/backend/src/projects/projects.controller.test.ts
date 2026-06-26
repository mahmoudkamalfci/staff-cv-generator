import { describe, it, expect, vi } from 'vitest';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { Request, Response } from 'express';

vi.mock('./projects.service.js');

describe('ProjectsController', () => {
  it('should get projects', async () => {
    const req = {
      query: { page: '1', limit: '10' },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(ProjectsService.getProjects).mockResolvedValue({ projects: [{ id: '1' }] as any, total: 1 });

    await ProjectsController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: [{ id: '1' }], pagination: { page: 1, limit: 10, total: 1 } });
  });
});
