import { describe, it, expect, vi } from 'vitest';
import { SkillsService } from './skills.service.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    staff: {
      findUnique: vi.fn(),
    },
    skill: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('SkillsService', () => {
  describe('getSkillsByStaffId', () => {
    it('should throw if staff not found', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);
      await expect(SkillsService.getSkillsByStaffId('1')).rejects.toThrow('Staff not found');
    });

    it('should return skills', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue({ id: '1' } as any);
      vi.mocked(prisma.skill.findMany).mockResolvedValue([{ id: 'skill1' }] as any);

      const result = await SkillsService.getSkillsByStaffId('1');
      expect(result).toEqual([{ id: 'skill1' }]);
    });
  });
});
