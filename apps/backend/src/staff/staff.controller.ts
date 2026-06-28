import type { Request, Response } from 'express';
import { StaffService } from './staff.service.js';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler.js';

export class StaffController {
  static async getStaff(req: Request, res: Response) {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const search = req.query.search as string | undefined;

    const { staff, total } = await StaffService.getStaff(page, limit, search);
    res.json({ data: staff, pagination: { page, limit, total } });
  }

  static async getStaffById(req: Request, res: Response) {
    const staff = await StaffService.getStaffById(req.params.id as string);
    res.json({ data: staff });
  }

  static async createStaff(req: Request, res: Response) {
    const staff = await StaffService.createStaff(req.body);
    res.status(201).json({ data: staff });
  }

  static async updateStaff(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = req.user;

    if (user?.role !== 'admin') {
      const staff = await StaffService.getStaffById(id);
      if (!staff || staff.userId !== user?.userId) {
        res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
        return;
      }
    }

    const updatedStaff = await StaffService.updateStaff(id, req.body);
    res.json({ data: updatedStaff });
  }

  static async deleteStaff(req: Request, res: Response) {
    await StaffService.deleteStaff(req.params.id as string);
    res.status(204).send();
  }

  static async uploadPhoto(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, 'No photo provided');

    try {
      const updatedStaff = await StaffService.uploadPhoto(
        req.params.id as string,
        req.file.filename,
      );
      res.json({ data: updatedStaff });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      throw error;
    }
  }

  static async resetPassword(req: Request, res: Response) {
    const { password } = req.body;
    if (!password) throw new AppError(400, 'Password is required');

    await StaffService.resetPassword(req.params.id as string, password);
    res.json({ message: 'Password reset successfully' });
  }

  static async getSuggestions(req: Request, res: Response) {
    const { technologies } = req.body;
    if (!Array.isArray(technologies)) {
      throw new AppError(400, 'technologies must be an array of strings');
    }
    const suggestions = await StaffService.getSuggestions(technologies);
    res.json({ data: suggestions });
  }
}
