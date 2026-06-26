import { jest, describe, it, expect } from '@jest/globals';
import { ParticipationsService } from './participations.service.js';
import { prisma } from '../db/prisma.js';


describe('ParticipationsService', () => {
  it('should create participation', async () => {
    jest.spyOn(prisma.participation, 'create').mockResolvedValue({ id: '1' } as any);
    const result = await ParticipationsService.createParticipation('proj1', { role: 'Dev' });
    expect(result).toEqual({ id: '1' });
  });
});
