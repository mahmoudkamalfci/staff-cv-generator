import { z } from 'zod';
import { StaffSchema } from './staff.js';
import { SkillSchema } from './skill.js';
import { ParticipationWithProjectSchema } from './participation.js';
import { CVTemplateSchema } from './template.js';

export const CVDataSchema = z.object({
  staff: StaffSchema,
  skills: z.array(SkillSchema),
  participations: z.array(ParticipationWithProjectSchema),
  template: CVTemplateSchema,
  generatedAt: z.string().datetime(),
});

export type CVData = z.infer<typeof CVDataSchema>;
