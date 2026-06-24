import { z } from 'zod';

export const SkillLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const SkillSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  name: z.string().min(1).max(100),
  level: SkillLevelEnum,
});

export const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  level: SkillLevelEnum,
});

export const UpdateSkillSchema = CreateSkillSchema.partial();

export type SkillLevel = z.infer<typeof SkillLevelEnum>;
export type Skill = z.infer<typeof SkillSchema>;
export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;
