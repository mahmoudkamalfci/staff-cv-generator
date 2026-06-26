import { Request, Response } from 'express';
import { SkillsService } from './skills.service.js';

export class SkillsController {
  static async getSkillsByStaffId(req: Request, res: Response) {
    const { staffId } = req.params as { staffId: string };
    const skills = await SkillsService.getSkillsByStaffId(staffId);
    res.json({ data: skills });
  }

  static async createSkill(req: Request, res: Response) {
    const { staffId } = req.params as { staffId: string };
    const skill = await SkillsService.createSkill(staffId, req.body);
    res.status(201).json({ data: skill });
  }

  static async updateSkill(req: Request, res: Response) {
    const { staffId, skillId } = req.params as { staffId: string; skillId: string };
    const updatedSkill = await SkillsService.updateSkill(staffId, skillId, req.body);
    res.json({ data: updatedSkill });
  }

  static async deleteSkill(req: Request, res: Response) {
    const { staffId, skillId } = req.params as { staffId: string; skillId: string };
    await SkillsService.deleteSkill(staffId, skillId);
    res.status(204).send();
  }
}
