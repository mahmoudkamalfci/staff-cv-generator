# Plan 5: Backend Template Extension

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the already-implemented backend with a `config Json` + `isBuiltIn Boolean` column on the `Template` model, update seed data with full `TemplateConfig` objects, add `TemplateConfig` Zod schemas to `packages/shared`, and add admin-only CRUD endpoints for template management.

**Architecture:** Additive Prisma migration (no destructive changes). New schemas in `packages/shared`. Existing `templates.router.ts` is expanded with POST/PATCH/DELETE routes guarded by `requireAuth` + `requireAdmin` middleware. The existing `GET /api/cv/:staffId/:templateId` route automatically returns the `config` field once the column exists — no changes needed there.

**Tech Stack:** Prisma 5, PostgreSQL, Express 4, TypeScript 5, Zod 3, ESM imports (`.js` extension required on all local imports)

## Global Constraints

- All local imports must use `.js` extension (ESM project)
- All route handlers wrapped with `asyncHandler` — no raw try/catch in route files
- All request bodies validated via `validate()` middleware before any DB access
- `requireAuth` + `requireAdmin` middleware guard all mutation routes
- `isBuiltIn` is server-controlled only — never writable via API input
- `layoutKey` for custom templates is set server-side to a UUID — never user-supplied
- Workspace root: `/home/mahmoud/frontend-projects/practise-projects/staff-cv-generator`

---

### Task 1: Shared Schemas — TemplateConfig

**Files:**
- Modify: `packages/shared/src/schemas/template.ts`
- Modify: `packages/shared/src/schemas/cv.ts`

**Interfaces:**
- Produces:
  - `SectionConfigSchema` → `SectionConfig` type
  - `TemplateConfigSchema` → `TemplateConfig` type
  - `CreateTemplateInputSchema` → `CreateTemplateInput` type
  - `UpdateTemplateInputSchema` → `UpdateTemplateInput` type
  - `CVTemplateSchema` updated to include `config: TemplateConfig` and `isBuiltIn: boolean`
  - `LayoutKey` type updated from strict enum to `string`

- [ ] **Step 1: Replace `packages/shared/src/schemas/template.ts`**

```ts
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
```

- [ ] **Step 2: Update `packages/shared/src/schemas/cv.ts`** — `CVDataSchema` now uses the updated `CVTemplateSchema` (no code change needed in the file itself since it imports `CVTemplateSchema` by name — but the `template` field in `CVData` now automatically carries `config` + `isBuiltIn`). Verify the file still compiles:

```ts
// No change needed — imports CVTemplateSchema which is now extended.
// File content remains:
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
```

- [ ] **Step 3: Build `packages/shared` and confirm no type errors**

```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator
pnpm --filter @cv-generator/shared build
```

Expected: `packages/shared/dist/` updated with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/template.ts packages/shared/src/schemas/cv.ts
git commit -m "feat(shared): add TemplateConfig, SectionConfig, CreateTemplateInput schemas"
```

---

### Task 2: Prisma Migration — Add config + isBuiltIn to Template

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`

**Interfaces:**
- Consumes: `TemplateConfig` JSON shape from Task 1 (used in seed data)
- Produces: Extended `Template` model with `isBuiltIn` and `config` columns. All existing rows get `isBuiltIn: false` and an empty config via the migration default.

> **Warning:** The `config Json` column has no default at the Prisma level — we set it to a placeholder `{}` using `@default("{}")` is not supported for Json in Prisma. Instead, we run a data migration in the seed script to update existing rows. The migration adds the column as nullable first, then the seed populates all rows, then we make it required.

- [ ] **Step 1: Replace `apps/backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  role         String        @default("staff") // 'admin' | 'staff'
  staff        Staff?
  generatedCvs GeneratedCV[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Staff {
  id              String          @id @default(uuid())
  userId          String?         @unique
  user            User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  name            String
  jobTitle        String
  yearsExperience Int             @default(0)
  summary         String
  photoUrl        String?
  skills          Skill[]
  participations  Participation[]
  generatedCvs    GeneratedCV[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Skill {
  id      String @id @default(uuid())
  staffId String
  staff   Staff  @relation(fields: [staffId], references: [id], onDelete: Cascade)
  name    String
  level   String // 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

model Project {
  id             String          @id @default(uuid())
  name           String
  description    String
  client         String
  location       String
  startDate      DateTime
  endDate        DateTime?
  technologies   String[]        @default([])
  participations Participation[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Participation {
  id               String  @id @default(uuid())
  staffId          String
  projectId        String
  role             String
  responsibilities String
  staff            Staff   @relation(fields: [staffId], references: [id], onDelete: Cascade)
  project          Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([staffId, projectId])
}

model Template {
  id           String        @id @default(uuid())
  name         String
  layoutKey    String        @unique
  description  String        @default("")
  isActive     Boolean       @default(true)
  isBuiltIn    Boolean       @default(false)
  config       Json          @default("{}")
  generatedCvs GeneratedCV[]
  createdAt    DateTime      @default(now())
}

model GeneratedCV {
  id          String   @id @default(uuid())
  staffId     String
  templateId  String
  generatedBy String
  staff       Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)
  template    Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [generatedBy], references: [id], onDelete: Cascade)
  generatedAt DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator/apps/backend
pnpm db:migrate
```

When prompted for migration name, enter: `add_template_config_and_is_builtin`

Expected: Migration applied, Prisma client regenerated.

- [ ] **Step 3: Replace `apps/backend/prisma/seed.ts`** with full config for each built-in template

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const classicConfig = {
  baseLayout: 'two-column',
  primaryColor: '#1e293b',
  accentColor: '#475569',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 1 },
    { id: 'summary',    label: 'Profile',    visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

const modernConfig = {
  baseLayout: 'one-column',
  primaryColor: '#1d4ed8',
  accentColor: '#3b82f6',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'summary',    label: 'About',      visible: true,  order: 1 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

const compactConfig = {
  baseLayout: 'one-column',
  primaryColor: '#111827',
  accentColor: '#374151',
  sections: [
    { id: 'header',     label: 'Header',     visible: true,  order: 0 },
    { id: 'summary',    label: 'Summary',    visible: true,  order: 1 },
    { id: 'skills',     label: 'Skills',     visible: true,  order: 2 },
    { id: 'experience', label: 'Experience', visible: true,  order: 3 },
  ],
};

async function main() {
  // Upsert built-in templates (idempotent — safe to re-run)
  await prisma.template.upsert({
    where: { layoutKey: 'classic' },
    update: { isBuiltIn: true, config: classicConfig },
    create: {
      name: 'Classic',
      layoutKey: 'classic',
      description: 'Traditional two-column layout with sidebar skills.',
      isActive: true,
      isBuiltIn: true,
      config: classicConfig,
    },
  });

  await prisma.template.upsert({
    where: { layoutKey: 'modern' },
    update: { isBuiltIn: true, config: modernConfig },
    create: {
      name: 'Modern',
      layoutKey: 'modern',
      description: 'Full-width single-column card-based layout.',
      isActive: true,
      isBuiltIn: true,
      config: modernConfig,
    },
  });

  await prisma.template.upsert({
    where: { layoutKey: 'compact' },
    update: { isBuiltIn: true, config: compactConfig },
    create: {
      name: 'Compact',
      layoutKey: 'compact',
      description: 'Dense single-column layout, maximises information density.',
      isActive: true,
      isBuiltIn: true,
      config: compactConfig,
    },
  });

  console.log('✅ Templates seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run seed**

```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator/apps/backend
pnpm db:seed
```

Expected: `✅ Templates seeded successfully`

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/seed.ts
git commit -m "feat(backend): add isBuiltIn and config columns to Template model"
```

---

### Task 3: Template CRUD Routes

**Files:**
- Modify: `apps/backend/src/cv/templates.router.ts`

**Interfaces:**
- Consumes:
  - `requireAuth`, `requireAdmin` from `../middleware/requireAuth.js`
  - `asyncHandler` from `../middleware/asyncHandler.js`
  - `validate` from `../middleware/validate.js`
  - `AppError` from `../middleware/errorHandler.js`
  - `prisma` from `../db/prisma.js`
  - `CreateTemplateInputSchema`, `UpdateTemplateInputSchema` from `@cv-generator/shared`
- Produces:
  - `GET /api/templates` → `{ data: Template[] }` (unchanged, now includes `config` + `isBuiltIn`)
  - `GET /api/templates/:id` → `{ data: Template }`
  - `POST /api/templates` → `{ data: Template }` (admin only)
  - `PATCH /api/templates/:id` → `{ data: Template }` (admin only, 403 if isBuiltIn)
  - `DELETE /api/templates/:id` → `204 No Content` (admin only, 403 if isBuiltIn)

- [ ] **Step 1: Replace `apps/backend/src/cv/templates.router.ts`**

```ts
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
templatesRouter.get('/', asyncHandler(async (_req, res) => {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ data: templates });
}));

// GET /api/templates/:id — single template
templatesRouter.get(
  '/:id',
  requireAuth,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError(404, 'Template not found');
    res.json({ data: template });
  })
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
  })
);

// PATCH /api/templates/:id — admin updates a custom template (403 if built-in)
templatesRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: UpdateTemplateInputSchema,
  })),
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
  })
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
  })
);
```

- [ ] **Step 2: Verify the backend starts and all routes respond**

Start the backend:
```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator
pnpm --filter @cv-generator/backend dev
```

In a second terminal, test the GET route (no token needed):
```bash
curl -s http://localhost:3001/api/templates | jq '.data[0] | {name, isBuiltIn, layoutKey}'
```

Expected:
```json
{
  "name": "Classic",
  "isBuiltIn": true,
  "layoutKey": "classic"
}
```

- [ ] **Step 3: Verify built-in protection — attempt PATCH on a built-in template**

First get an admin token (login):
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.data.accessToken')
```

Get the classic template ID:
```bash
CLASSIC_ID=$(curl -s http://localhost:3001/api/templates | jq -r '.data[] | select(.layoutKey=="classic") | .id')
```

Attempt PATCH:
```bash
curl -s -X PATCH http://localhost:3001/api/templates/$CLASSIC_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}' | jq .
```

Expected: `{ "error": "Built-in templates cannot be modified" }` with status 403.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/cv/templates.router.ts
git commit -m "feat(backend): add CRUD endpoints for custom template management"
```

---

### Task 4: Verify CV Assembly Route Returns config

**Files:**
- Read only: `apps/backend/src/cv/cv.router.ts` (no changes expected)

**Interfaces:**
- Consumes: Extended `Template` model (from Task 2)
- Produces: Confirmation that `GET /api/cv/:staffId/:templateId` response includes `template.config`

- [ ] **Step 1: Call the CV assembly route and verify config is present**

Get a staff ID and template ID from the database first, then:

```bash
# Replace with real UUIDs from your seeded data
STAFF_ID="<uuid-of-a-staff-member>"
TEMPLATE_ID=$(curl -s http://localhost:3001/api/templates | jq -r '.data[0].id')

curl -s -X GET "http://localhost:3001/api/cv/$STAFF_ID/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.template | {name, isBuiltIn, config}'
```

Expected: Response includes `.data.template.config` with `baseLayout`, `primaryColor`, `accentColor`, `sections`.

- [ ] **Step 2: Commit with final verification note**

```bash
git commit --allow-empty -m "chore(backend): verify cv route returns template.config after migration"
```

---

## Plan 5 Complete ✅

**Deliverable:** Extended Template model with `isBuiltIn` + `config Json`, updated seed data, full `TemplateConfig` Zod schemas in `packages/shared`, and CRUD API endpoints — ready for Plan 4 Task 6 update and Plan 6 (template builder frontend).
