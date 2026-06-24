import { z } from 'zod';

export const LayoutKeyEnum = z.enum(['classic', 'modern', 'compact']);

export const CVTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  layoutKey: LayoutKeyEnum,
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type LayoutKey = z.infer<typeof LayoutKeyEnum>;
export type CVTemplate = z.infer<typeof CVTemplateSchema>;
