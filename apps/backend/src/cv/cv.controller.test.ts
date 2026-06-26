import { jest, describe, it, expect } from '@jest/globals';
import { CvController } from './cv.controller.js';
import { CvService } from './cv.service.js';
import { Request, Response } from 'express';


describe('CvController', () => {
  it('should generate cv', async () => {
    const req = {
      params: { staffId: '1', templateId: '2' },
      user: { userId: 'user1' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    jest.spyOn(CvService, 'generateCv').mockResolvedValue({ generatedCV: { id: '3' } } as any);

    await CvController.generateCv(req, res);

    expect(res.json).toHaveBeenCalledWith({ data: { generatedCV: { id: '3' } } });
  });
});
