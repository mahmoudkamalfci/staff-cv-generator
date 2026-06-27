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
    it('should create staff with user account, skills and participations', async () => {
      const mockUser = { id: 'u1', email: 'john@doe.com', passwordHash: 'hash', role: 'staff' };
      const mockStaff = { id: '1', name: 'John Doe', userId: 'u1' };
      
      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return (cb as any)(prisma);
      });
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.staff, 'create').mockResolvedValue(mockStaff as any);

      const data = {
        name: 'John Doe',
        email: 'john@doe.com',
        password: 'password123',
        jobTitle: 'Developer',
        summary: 'Expert dev',
        skills: [{ name: 'React', level: 'expert' }],
        participations: [{ projectId: 'p1', role: 'Dev', responsibilities: 'Code' }],
      };

      const result = await StaffService.createStaff(data);

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: 'john@doe.com',
          role: 'staff',
        })
      }));

      expect(prisma.staff.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          jobTitle: 'Developer',
          summary: 'Expert dev',
          userId: 'u1',
          skills: { create: data.skills },
          participations: { create: data.participations },
        },
      });
      expect(result).toEqual(mockStaff);
    });
  });

  describe('updateStaff', () => {
    it('should update staff with nested relations and update user email', async () => {
      const mockStaff = { id: '1', name: 'John Doe', userId: 'u1' };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => (cb as any)(prisma));
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.staff, 'update').mockResolvedValue(mockStaff as any);

      const data = {
        name: 'John Doe Update',
        email: 'new@email.com',
        jobTitle: 'Senior Dev',
        summary: 'Expert dev',
        skills: [{ name: 'React', level: 'expert' }],
        participations: [{ projectId: 'p1', role: 'Dev', responsibilities: 'Code' }],
      };

      const result = await StaffService.updateStaff('1', data);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { email: 'new@email.com' },
      });

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'John Doe Update',
          jobTitle: 'Senior Dev',
          summary: 'Expert dev',
          skills: { deleteMany: {}, create: data.skills },
          participations: { deleteMany: {}, create: data.participations },
        },
      });
      expect(result).toEqual(mockStaff);
    });
  });

  describe('resetPassword', () => {
    it('should update user password hash', async () => {
      const mockStaff = { id: '1', userId: 'u1' };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);

      const result = await StaffService.resetPassword('1', 'newpass123');

      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'u1' }
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe('getSuggestions', () => {
    it('returns staff matching technologies using fuzzy search', async () => {
      const mockStaff = [
        {
          id: '1',
          name: 'Jane Doe',
          skills: [{ name: 'React' }, { name: 'Node.js' }]
        },
        {
          id: '2',
          name: 'John Smith',
          skills: [{ name: 'Angular' }]
        }
      ];

      jest.spyOn(prisma.staff, 'findMany').mockResolvedValue(mockStaff as any);

      // Testing user's requirement: user types "react.js" and matches skill "React"
      const result = await StaffService.getSuggestions(['react.js']);
      expect(result).toBeDefined();
      expect(prisma.staff.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Jane Doe');
      expect(result[0].matchedSkills).toContain('React');
    });
  });
  describe('deleteStaff', () => {
    it('should delete staff and associated user within a transaction', async () => {
      const mockStaff = { id: '1', userId: 'u1' };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => (cb as any)(prisma));
      jest.spyOn(prisma.staff, 'delete').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma.user, 'delete').mockResolvedValue({} as any);

      await StaffService.deleteStaff('1');

      expect(prisma.staff.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('should delete staff only if no associated user exists', async () => {
      const mockStaff = { id: '1', userId: null };
      jest.spyOn(prisma.staff, 'findUnique').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => (cb as any)(prisma));
      jest.spyOn(prisma.staff, 'delete').mockResolvedValue(mockStaff as any);
      jest.spyOn(prisma.user, 'delete').mockResolvedValue({} as any);

      await StaffService.deleteStaff('1');

      expect(prisma.staff.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
