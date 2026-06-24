import { z } from 'zod';
import { ProjectSchema } from './project.js';

export const ParticipationSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  projectId: z.string().uuid(),
  role: z.string().min(1).max(200),
  responsibilities: z.string().min(1),
});

export const ParticipationWithProjectSchema = ParticipationSchema.extend({
  project: ProjectSchema,
});

export const CreateParticipationSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  projectId: z.string().uuid('Invalid project ID'),
  role: z.string().min(1, 'Role is required').max(200),
  responsibilities: z.string().min(1, 'Responsibilities are required'),
});

export const UpdateParticipationSchema = z.object({
  role: z.string().min(1).max(200).optional(),
  responsibilities: z.string().min(1).optional(),
});

export type Participation = z.infer<typeof ParticipationSchema>;
export type ParticipationWithProject = z.infer<typeof ParticipationWithProjectSchema>;
export type CreateParticipationInput = z.infer<typeof CreateParticipationSchema>;
export type UpdateParticipationInput = z.infer<typeof UpdateParticipationSchema>;
