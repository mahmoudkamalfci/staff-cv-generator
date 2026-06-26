import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateTemplateInputSchema, UpdateTemplateInputSchema } from '@cv-generator/shared';

export const templatesRouter: Router = Router();

// GET /api/templates — all active templates (public, auth not required)
templatesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: templates });
  }),
);

// GET /api/templates/:id — single template
templatesRouter.get(
  '/:id',
  requireAuth,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError(404, 'Template not found');
    res.json({ data: template });
  }),
);

// POST /api/templates — admin creates a new custom template
templatesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(z.object({ body: CreateTemplateInputSchema })),
  asyncHandler(async (req, res) => {
    const { name, description, config } = req.body as {
      name: string;
      description: string;
      config: unknown;
    };

    const template = await prisma.template.create({
      data: {
        name,
        description,
        layoutKey: randomUUID(), // custom templates get a UUID as layoutKey
        isBuiltIn: false,
        isActive: true,
        config: config as object,
      },
    });

    res.status(201).json({ data: template });
  }),
);

// PATCH /api/templates/:id — admin updates a custom template (403 if built-in)
templatesRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: UpdateTemplateInputSchema,
    }),
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Template not found');
    if (existing.isBuiltIn) throw new AppError(403, 'Built-in templates cannot be modified');

    const { name, description, config } = req.body as {
      name?: string;
      description?: string;
      config?: unknown;
    };

    const updated = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(config !== undefined && { config: config as object }),
      },
    });

    res.json({ data: updated });
  }),
);

// DELETE /api/templates/:id — admin deletes a custom template (403 if built-in)
templatesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Template not found');
    if (existing.isBuiltIn) throw new AppError(403, 'Built-in templates cannot be deleted');

    await prisma.template.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
