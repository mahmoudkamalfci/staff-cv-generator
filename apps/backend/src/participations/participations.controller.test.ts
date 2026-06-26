import { describe, it, expect, vi } from 'vitest';
import { ParticipationsController } from './participations.controller.js';
import { ParticipationsService } from './participations.service.js';
import { Request, Response } from 'express';

vi.mock('./participations.service.js');

describe('ParticipationsController', () => {
  it('should create participation', async () => {
    const req = {
      params: { projectId: '1' },
      body: { role: 'Dev' },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(ParticipationsService.createParticipation).mockResolvedValue({ id: '1' } as any);

    await ParticipationsController.createParticipation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: { id: '1' } });
  });
});
