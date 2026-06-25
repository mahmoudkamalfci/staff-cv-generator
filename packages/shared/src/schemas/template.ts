import { z } from 'zod';

// LayoutKey is now a plain string — built-ins use 'classic'|'modern'|'compact',
// custom templates use a UUID. The strict enum is removed.
export const LayoutKeySchema = z.string().min(1);

export const SectionConfigSchema = z.object({
  id: z.enum(['header', 'summary', 'skills', 'experience', 'custom']),
  label: z.string().min(1).max(60),
  visible: z.boolean(),
  order: z.number().int().min(0),
  content: z.string().max(2000).optional(),
});

export const TemplateConfigSchema = z.object({
  baseLayout: z.enum(['one-column', 'two-column', 'three-column']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color'),
  sections: z
    .array(SectionConfigSchema)
    .min(1)
    .max(10)
    .refine(
      (sections) => sections.some((s) => s.id === 'header' && s.visible),
      { message: 'Header section must always be visible' }
    ),
});

export const CVTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  layoutKey: LayoutKeySchema,
  description: z.string(),
  isActive: z.boolean(),
  isBuiltIn: z.boolean(),
  config: TemplateConfigSchema,
  createdAt: z.string().datetime(),
});

export const CreateTemplateInputSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).default(''),
  config: TemplateConfigSchema,
});

export const UpdateTemplateInputSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(200).optional(),
  config: TemplateConfigSchema.optional(),
});

export type LayoutKey = z.infer<typeof LayoutKeySchema>;
export type SectionConfig = z.infer<typeof SectionConfigSchema>;
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type CVTemplate = z.infer<typeof CVTemplateSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;
