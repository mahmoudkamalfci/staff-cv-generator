import { z } from 'zod';
import { StaffWithSkillsSchema } from './staff.js';
import { CVTemplateSchema } from './template.js';

export const CVDataSchema = z.object({
  staff: StaffWithSkillsSchema,
  template: CVTemplateSchema,
  generatedCV: z.object({
    id: z.string().uuid(),
    staffId: z.string().uuid(),
    templateId: z.string().uuid(),
    generatedBy: z.string().uuid(),
    generatedAt: z.string().datetime(),
  }),
});

export type CVData = z.infer<typeof CVDataSchema>;
