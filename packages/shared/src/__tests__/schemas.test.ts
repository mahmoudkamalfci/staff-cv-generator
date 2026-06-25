import { describe, expect, it } from '@jest/globals';
import {
  LoginSchema,
  CreateStaffSchema,
  CreateSkillSchema,
  CreateProjectSchema,
  LayoutKeyEnum,
} from '../index.js';

describe('Auth schemas', () => {
  it('validates a correct login payload', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('Staff schemas', () => {
  it('validates a correct staff payload', () => {
    const result = CreateStaffSchema.safeParse({
      name: 'Alice Smith',
      jobTitle: 'Senior Engineer',
      yearsExperience: 5,
      summary: 'Experienced engineer with broad expertise.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = CreateStaffSchema.safeParse({ name: 'Alice' });
    expect(result.success).toBe(false);
  });
});

describe('Skill schemas', () => {
  it('validates a correct skill payload', () => {
    const result = CreateSkillSchema.safeParse({ name: 'TypeScript', level: 'expert' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid skill level', () => {
    const result = CreateSkillSchema.safeParse({ name: 'TypeScript', level: 'ninja' });
    expect(result.success).toBe(false);
  });
});

describe('Project schemas', () => {
  it('validates a correct project payload', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'CV Platform',
      description: 'A platform for generating CVs.',
      client: 'GISCON',
      location: 'Cairo',
      startDate: '2024-01-01',
      technologies: ['React', 'Node.js'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing technologies', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'CV Platform',
      description: 'A platform for generating CVs.',
      client: 'GISCON',
      location: 'Cairo',
      startDate: '2024-01-01',
      technologies: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('Layout key enum', () => {
  it('accepts valid layout keys', () => {
    const r1 = LayoutKeyEnum.safeParse('classic');
    const r2 = LayoutKeyEnum.safeParse('modern');
    const r3 = LayoutKeyEnum.safeParse('compact');
    expect(r1.success && r2.success && r3.success).toBe(true);
  });

  it('rejects unknown layout key', () => {
    const result = LayoutKeyEnum.safeParse('fancy');
    expect(result.success).toBe(false);
  });
});
