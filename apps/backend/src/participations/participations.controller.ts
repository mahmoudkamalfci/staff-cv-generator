import type { Request, Response } from 'express';
import { ParticipationsService } from './participations.service.js';

export class ParticipationsController {
  static async createParticipation(req: Request, res: Response) {
    const { projectId } = req.params as { projectId: string };
    const participation = await ParticipationsService.createParticipation(projectId, req.body);
    res.status(201).json({ data: participation });
  }

  static async updateParticipation(req: Request, res: Response) {
    const { projectId, id } = req.params as { projectId: string; id: string };
    const updated = await ParticipationsService.updateParticipation(projectId, id, req.body);
    res.json({ data: updated });
  }

  static async deleteParticipation(req: Request, res: Response) {
    const { projectId, id } = req.params as { projectId: string; id: string };
    await ParticipationsService.deleteParticipation(projectId, id);
    res.status(204).send();
  }
}
