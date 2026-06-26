import { jest, describe, it, expect } from '@jest/globals';
import { SkillsService } from './skills.service.js';
import { prisma } from '../db/prisma.js';


describe('SkillsService', () => {
  describe('getSkillsByStaffId', () => {
    it('should throw if staff not found', async () => {
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(null);
      await expect(SkillsService.getSkillsByStaffId('1')).rejects.toThrow('Staff not found');
    });

    it('should return skills', async () => {
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.skill, 'findMany').mockResolvedValue([{ id: 'skill1' }] as any);

      const result = await SkillsService.getSkillsByStaffId('1');
      expect(result).toEqual([{ id: 'skill1' }]);
    });
  });
});
