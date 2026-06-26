import { jest, describe, it, expect } from '@jest/globals';
import { StaffService } from './staff.service.js';
import { prisma } from '../db/prisma.js';


describe('StaffService', () => {
  describe('getStaff', () => {
    it('should return paginated staff list', async () => {
      const mockStaff = [{ id: '1', name: 'John Doe', email: 'john@doe.com' }];
      jest.spyOn(prisma.staff, 'findMany').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma.staff, 'count').mockResolvedValue(1);

      const result = await StaffService.getStaff(1, 10);

      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual({ staff: mockStaff, total: 1 });
    });
  });

  describe('getStaffById', () => {
    it('should throw error if staff not found', async () => {
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(null);
      await expect(StaffService.getStaffById('invalid')).rejects.toThrow('Staff not found');
    });

    it('should return staff by id', async () => {
      const mockStaff = { id: '1', name: 'John Doe', email: 'john@doe.com' };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);

      const result = await StaffService.getStaffById('1');
      expect(result).toEqual(mockStaff);
    });
  });
  describe('createStaff', () => {
    it('should create staff with skills and participations', async () => {
      const mockStaff = { id: '1', name: 'John Doe' };
      jest.spyOn(prisma.staff, 'create').mockResolvedValue(mockStaff as any);

      const data = {
        name: 'John Doe',
        skills: [{ name: 'React', level: 'expert' }],
        participations: [{ projectId: 'p1', role: 'Dev', responsibilities: 'Code' }],
      };

      const result = await StaffService.createStaff(data);

      expect(prisma.staff.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          skills: { create: data.skills },
          participations: { create: data.participations },
        },
      });
      expect(result).toEqual(mockStaff);
    });
  });

  describe('updateStaff', () => {
    it('should update staff with nested relations', async () => {
      const mockStaff = { id: '1', name: 'John Doe' };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma.staff, 'update').mockResolvedValue(mockStaff as any);

      const data = {
        name: 'John Doe',
        skills: [{ name: 'React', level: 'expert' }],
        participations: [{ projectId: 'p1', role: 'Dev', responsibilities: 'Code' }],
      };

      const result = await StaffService.updateStaff('1', data);

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'John Doe',
          skills: { deleteMany: {}, create: data.skills },
          participations: { deleteMany: {}, create: data.participations },
        },
      });
      expect(result).toEqual(mockStaff);
    });
  });
});
