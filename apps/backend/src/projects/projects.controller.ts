import { Request, Response } from 'express';
import { ProjectsService } from './projects.service.js';

export class ProjectsController {
  static async getProjects(req: Request, res: Response) {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const search = req.query.search as string | undefined;

    const { projects, total } = await ProjectsService.getProjects(page, limit, search);
    res.json({ data: projects, pagination: { page, limit, total } });
  }

  static async getProjectById(req: Request, res: Response) {
    const project = await ProjectsService.getProjectById(req.params.id as string);
    res.json({ data: project });
  }

  static async createProject(req: Request, res: Response) {
    const project = await ProjectsService.createProject(req.body);
    res.status(201).json({ data: project });
  }

  static async updateProject(req: Request, res: Response) {
    const updatedProject = await ProjectsService.updateProject(req.params.id as string, req.body);
    res.json({ data: updatedProject });
  }

  static async deleteProject(req: Request, res: Response) {
    await ProjectsService.deleteProject(req.params.id as string);
    res.status(204).send();
  }
}
