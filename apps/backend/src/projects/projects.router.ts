import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateProjectSchema, UpdateProjectSchema } from '@cv-generator/shared';
import { participationsRouter } from './participations.router.js';

export const projectsRouter: Router = Router();

projectsRouter.use('/:projectId/participations', participationsRouter);

// GET /api/projects
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          participations: {
            include: {
              staff: true,
            },
          },
        },
      }),
      prisma.project.count(),
    ]);

    res.json({ data: projects, pagination: { page, limit, total } });
  }),
);

// GET /api/projects/:id
projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        participations: {
          include: {
            staff: true,
          },
        },
      },
    });
    if (!project) throw new AppError(404, 'Project not found');
    res.json({ data: project });
  }),
);

// POST /api/projects (admin only)
projectsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(CreateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.create({
      data: req.body,
    });
    res.status(201).json({ data: project });
  }),
);

// PATCH /api/projects/:id (admin only)
projectsRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(UpdateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) throw new AppError(404, 'Project not found');

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: updatedProject });
  }),
);

// DELETE /api/projects/:id (admin only)
projectsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) throw new AppError(404, 'Project not found');

    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
