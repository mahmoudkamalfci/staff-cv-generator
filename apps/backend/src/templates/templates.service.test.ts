import { describe, it, expect, vi } from 'vitest';
import { TemplatesService } from './templates.service.js';
import { prisma } from '../db/prisma.js';

vi.mock('../db/prisma.js', () => ({
  prisma: {
    template: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('TemplatesService', () => {
  it('should create template', async () => {
    vi.mocked(prisma.template.create).mockResolvedValue({ id: '1' } as any);
    const result = await TemplatesService.createTemplate({ name: 'T1', description: 'desc', config: {} });
    expect(result).toEqual({ id: '1' });
  });
});
