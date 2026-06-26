import { describe, it, expect, vi } from 'vitest';
import { CvService } from './cv.service.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    staff: { findUnique: vi.fn() },
    template: { findUnique: vi.fn() },
    generatedCV: { create: vi.fn() },
  },
}));

describe('CvService', () => {
  it('should generate cv', async () => {
    vi.mocked(prisma.staff.findUnique).mockResolvedValue({ id: 'staff1' } as any);
    vi.mocked(prisma.template.findUnique).mockResolvedValue({ id: 'tpl1' } as any);
    vi.mocked(prisma.generatedCV.create).mockResolvedValue({ id: 'cv1' } as any);

    const result = await CvService.generateCv('staff1', 'tpl1', 'user1');
    expect(result.generatedCV.id).toBe('cv1');
  });
});
