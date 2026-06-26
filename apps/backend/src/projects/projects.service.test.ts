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

  describe('createProject', () => {
    it('creates a project with participations', async () => {
      const data = {
        name: 'New Project',
        description: 'Test',
        client: 'Client',
        location: 'Location',
        startDate: '2026-01-01',
        technologies: ['React'],
        participations: [
          { staffId: '123e4567-e89b-12d3-a456-426614174000', role: 'Dev', responsibilities: 'Coding' }
        ]
      };
      
      // mock prisma.project.create
      jest.spyOn(prisma.project, 'create').mockResolvedValue({ id: 'proj-1', ...data } as any);
      
      const result = await ProjectsService.createProject(data);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          description: 'Test',
          client: 'Client',
          location: 'Location',
          startDate: '2026-01-01',
          technologies: ['React'],
          participations: {
            create: data.participations
          }
        }
      });
    });
  });
  describe('updateProject', () => {
    it('updates a project with participations', async () => {
      const data = {
        name: 'Updated Project',
        participations: [
          { staffId: '123e4567-e89b-12d3-a456-426614174000', role: 'Dev', responsibilities: 'Coding' }
        ]
      };
      
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue({ id: 'proj-1' } as any);
      jest.spyOn(prisma.project, 'update').mockResolvedValue({ id: 'proj-1', ...data } as any);
      
      await ProjectsService.updateProject('proj-1', data);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: {
          name: 'Updated Project',
          participations: {
            deleteMany: {},
            create: data.participations
          }
        }
      });
    });
  });
});
