import { describe, expect, it } from '@jest/globals';
import {
  LoginSchema,
  CreateStaffSchema,
  CreateSkillSchema,
  CreateProjectSchema,
  LayoutKeySchema,
  SectionConfigSchema,
  TemplateConfigSchema,
  CVTemplateSchema,
  CreateTemplateInputSchema,
  UpdateTemplateInputSchema,
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

describe('Layout key schema', () => {
  it('accepts non-empty strings', () => {
    expect(LayoutKeySchema.safeParse('classic').success).toBe(true);
    expect(LayoutKeySchema.safeParse('modern').success).toBe(true);
    expect(LayoutKeySchema.safeParse('compact').success).toBe(true);
    expect(LayoutKeySchema.safeParse('custom-uuid-string').success).toBe(true);
  });

  it('rejects empty layout key', () => {
    expect(LayoutKeySchema.safeParse('').success).toBe(false);
  });
});

describe('Template schemas', () => {
  const validConfig = {
    baseLayout: 'two-column',
    primaryColor: '#0055ff',
    accentColor: '#ff5500',
    sections: [
      { id: 'header', label: 'Header Info', visible: true, order: 0 },
      { id: 'summary', label: 'Summary Info', visible: true, order: 1 },
    ],
  };

  it('validates a correct section config', () => {
    const result = SectionConfigSchema.safeParse({
      id: 'custom',
      label: 'My Custom Section',
      visible: false,
      order: 4,
      content: 'Some template content text',
    });
    expect(result.success).toBe(true);
  });

  it('validates a correct template config', () => {
    const result = TemplateConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('rejects config when primary color is not valid hex', () => {
    const result = TemplateConfigSchema.safeParse({
      ...validConfig,
      primaryColor: '0055ff', // missing #
    });
    expect(result.success).toBe(false);
  });

  it('rejects config when header section is invisible', () => {
    const result = TemplateConfigSchema.safeParse({
      ...validConfig,
      sections: [
        { id: 'header', label: 'Header Info', visible: false, order: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects config when header section is missing', () => {
    const result = TemplateConfigSchema.safeParse({
      ...validConfig,
      sections: [
        { id: 'summary', label: 'Summary Info', visible: true, order: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('validates a correct CV template payload', () => {
    const result = CVTemplateSchema.safeParse({
      id: 'd9b0a1d4-8d96-48c0-81cd-7a3bb4fa047c',
      name: 'Modern Compact',
      layoutKey: 'compact',
      description: 'A very compact layout for dense CVs',
      isActive: true,
      isBuiltIn: true,
      config: validConfig,
      createdAt: '2026-06-25T12:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('validates CreateTemplateInput schema and provides default description', () => {
    const result = CreateTemplateInputSchema.safeParse({
      name: 'Custom Template',
      config: validConfig,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
    }
  });

  it('validates UpdateTemplateInput schema', () => {
    const result = UpdateTemplateInputSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });
});
