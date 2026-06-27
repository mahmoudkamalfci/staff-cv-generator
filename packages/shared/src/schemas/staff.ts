import { z } from 'zod';
import { SkillSchema } from './skill.js';
import { ParticipationWithProjectSchema } from './participation.js';

export const StaffSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  name: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  yearsExperience: z.number().int().min(0).max(60),
  summary: z.string().min(1).max(2000),
  photoUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const StaffWithSkillsSchema = StaffSchema.extend({
  skills: z.array(SkillSchema),
  participations: z.array(ParticipationWithProjectSchema).optional(),
  email: z.string().email().optional(),
});

export const CreateStaffSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  yearsExperience: z.number().int().min(0).max(60),
  summary: z.string().min(1, 'Summary is required').max(2000),
  skills: z.array(z.object({
    name: z.string().min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  })).optional(),
  participations: z.array(z.object({
    projectId: z.string().uuid(),
    role: z.string().min(1),
    responsibilities: z.string().min(1),
  })).optional(),
});

export const UpdateStaffSchema = CreateStaffSchema.omit({ password: true }).partial();

export const ResetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type Staff = z.infer<typeof StaffSchema>;
export type StaffWithSkills = z.infer<typeof StaffWithSkillsSchema>;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
