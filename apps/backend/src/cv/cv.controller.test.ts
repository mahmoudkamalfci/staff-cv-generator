import { describe, it, expect, vi } from 'vitest';
import { CvController } from './cv.controller.js';
import { CvService } from './cv.service.js';
import { Request, Response } from 'express';

vi.mock('./cv.service.js');

describe('CvController', () => {
  it('should generate cv', async () => {
    const req = {
      params: { staffId: '1', templateId: '2' },
      user: { userId: 'user1' },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
    } as unknown as Response;

    vi.mocked(CvService.generateCv).mockResolvedValue({ generatedCV: { id: '3' } } as any);

    await CvController.generateCv(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: { generatedCV: { id: '3' } } });
  });
});
