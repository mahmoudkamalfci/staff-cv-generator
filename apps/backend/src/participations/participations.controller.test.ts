import { jest, describe, it, expect } from '@jest/globals';
import { ParticipationsController } from './participations.controller.js';
import { ParticipationsService } from './participations.service.js';
import { Request, Response } from 'express';


describe('ParticipationsController', () => {
  it('should create participation', async () => {
    const req = {
      params: { projectId: '1' },
      body: { role: 'Dev' },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(ParticipationsService, 'createParticipation').mockResolvedValue({ id: '1' } as any);

    await ParticipationsController.createParticipation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: { id: '1' } });
  });
});
