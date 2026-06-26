import { jest, describe, it, expect } from '@jest/globals';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';
import { Request, Response } from 'express';


describe('SkillsController', () => {
  it('should get skills by staff id', async () => {
    const req = {
      params: { staffId: '1' },
    } as unknown as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    const mockSkills = [{ id: '1', name: 'TypeScript', level: 'Expert', staffId: '1' }];
    jest.spyOn(SkillsService, 'getSkillsByStaffId').mockResolvedValue(mockSkills as any);

    await SkillsController.getSkillsByStaffId(req, res);

    expect(SkillsService.getSkillsByStaffId).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ data: mockSkills });
  });

  it('should create a skill', async () => {
    const req = {
      params: { staffId: '1' },
      body: { name: 'TypeScript', level: 'Expert' },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockSkill = { id: '1', name: 'TypeScript', level: 'Expert', staffId: '1' };
    jest.spyOn(SkillsService, 'createSkill').mockResolvedValue(mockSkill as any);

    await SkillsController.createSkill(req, res);

    expect(SkillsService.createSkill).toHaveBeenCalledWith('1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: mockSkill });
  });

  it('should delete a skill', async () => {
    const req = {
      params: { staffId: '1', skillId: '2' },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    jest.spyOn(SkillsService, 'deleteSkill').mockResolvedValue(undefined as any);

    await SkillsController.deleteSkill(req, res);

    expect(SkillsService.deleteSkill).toHaveBeenCalledWith('1', '2');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
