import { describe, it, expect, vi } from 'vitest';
import { TemplatesController } from './templates.controller.js';
import { TemplatesService } from './templates.service.js';
import { Request, Response } from 'express';

vi.mock('./templates.service.js');

describe('TemplatesController', () => {
  it('should create template', async () => {
    const req = {
      body: { name: 'T1', description: 'desc', config: {} },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(TemplatesService.createTemplate).mockResolvedValue({ id: '1' } as any);

    await TemplatesController.createTemplate(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: { id: '1' } });
  });
});
