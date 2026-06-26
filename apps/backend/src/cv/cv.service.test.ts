import { jest, describe, it, expect } from '@jest/globals';
import { CvService } from './cv.service.js';
import { prisma } from '../db/prisma.js';


describe('CvService', () => {
  it('should generate cv', async () => {
    jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue({ id: 'staff1' } as any);
    jest.spyOn(prisma.template, 'findUnique').mockResolvedValue({ id: 'tpl1' } as any);
    jest.spyOn(prisma.generatedCV, 'create').mockResolvedValue({ id: 'cv1' } as any);

    const result = await CvService.generateCv('staff1', 'tpl1', 'user1');
    expect(result.generatedCV.id).toBe('cv1');
  });
});
