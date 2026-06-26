import { jest, describe, it, expect } from '@jest/globals';
import { TemplatesService } from './templates.service.js';
import { prisma } from '../db/prisma.js';


describe('TemplatesService', () => {
  it('should create template', async () => {
    jest.spyOn(prisma.template, 'create').mockResolvedValue({ id: '1' } as any);
    const result = await TemplatesService.createTemplate({ name: 'T1', description: 'desc', config: {} });
    expect(result).toEqual({ id: '1' });
  });
});
