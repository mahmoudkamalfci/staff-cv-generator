import { jest, describe, it, expect } from '@jest/globals';
import { ProjectsService } from './projects.service.js';
import { prisma } from '../db/prisma.js';


describe('ProjectsService', () => {
  describe('getProjects', () => {
    it('should return paginated projects', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([{ id: '1' }] as any);
      jest.spyOn(prisma.project, 'count').mockResolvedValue(1);

      const result = await ProjectsService.getProjects(1, 10);
      expect(result).toEqual({ projects: [{ id: '1' }], total: 1 });
    });
  });

  describe('getProjectById', () => {
    it('should throw if project not found', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);
      await expect(ProjectsService.getProjectById('1')).rejects.toThrow('Project not found');
    });

    it('should return project', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue({ id: '1' } as any);
      const result = await ProjectsService.getProjectById('1');
      expect(result).toEqual({ id: '1' });
    });
  });
});
