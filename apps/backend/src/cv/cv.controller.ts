import { Request, Response } from 'express';
import { CvService } from './cv.service.js';

export class CvController {
  static async generateCv(req: Request, res: Response) {
    const { staffId, templateId } = req.params as { staffId: string; templateId: string };
    const userId = req.user!.userId;

    const data = await CvService.generateCv(staffId, templateId, userId);

    res.json({ data });
  }
}
