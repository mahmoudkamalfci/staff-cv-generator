import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(300),
  description: z.string().min(1),
  client: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  startDate: z.string().date(),
  endDate: z.string().date().nullable(),
  technologies: z.array(z.string().min(1)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(300),
  description: z.string().min(1, 'Description is required'),
  client: z.string().min(1, 'Client is required').max(200),
  location: z.string().min(1, 'Location is required').max(200),
  startDate: z.string().date('Invalid date format, use YYYY-MM-DD'),
  endDate: z.string().date().nullable().optional(),
  technologies: z.array(z.string().min(1)).min(1, 'At least one technology is required'),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
