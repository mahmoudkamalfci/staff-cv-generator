import { Request, Response } from 'express';
import { TemplatesService } from './templates.service.js';

export class TemplatesController {
  static async getActiveTemplates(req: Request, res: Response) {
    const templates = await TemplatesService.getActiveTemplates();
    res.json({ data: templates });
  }

  static async getTemplateById(req: Request, res: Response) {
    const template = await TemplatesService.getTemplateById(req.params.id as string);
    res.json({ data: template });
  }

  static async createTemplate(req: Request, res: Response) {
    const template = await TemplatesService.createTemplate(req.body);
    res.status(201).json({ data: template });
  }

  static async updateTemplate(req: Request, res: Response) {
    const updated = await TemplatesService.updateTemplate(req.params.id as string, req.body);
    res.json({ data: updated });
  }

  static async deleteTemplate(req: Request, res: Response) {
    await TemplatesService.deleteTemplate(req.params.id as string);
    res.status(204).send();
  }
}
