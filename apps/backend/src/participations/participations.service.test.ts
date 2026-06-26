import { describe, it, expect, vi } from 'vitest';
import { ParticipationsService } from './participations.service.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    participation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('ParticipationsService', () => {
  it('should create participation', async () => {
    vi.mocked(prisma.participation.create).mockResolvedValue({ id: '1' } as any);
    const result = await ParticipationsService.createParticipation('proj1', { role: 'Dev' });
    expect(result).toEqual({ id: '1' });
  });
});
