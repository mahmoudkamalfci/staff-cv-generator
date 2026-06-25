# CV Generator — Plan 2: Backend (Express + Prisma + PostgreSQL)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Node.js + Express + PostgreSQL backend with JWT auth, file uploads, and all REST API endpoints for staff, projects, participations, templates, and CV generation. Follows best practices using Prisma ORM.

**Architecture:** Express app with TypeScript, organized by feature. **Prisma ORM** for database access, schema definition, and migrations. Zod middleware validates all request bodies. JWT access tokens (15min) stored in memory; refresh tokens (7d) in httpOnly cookies. Multer handles photo uploads to `uploads/`. Includes pagination for lists and centralized error handling for `Prisma` exceptions.

**Tech Stack:** Express 4, TypeScript 5, Prisma, Zod (via @cv-generator/shared), bcryptjs, jsonwebtoken, multer, cors, helmet

## Global Constraints

- All imports use `.js` extension (ESM)
- All route handlers wrapped with async error catcher — never use try/catch in route files
- All request bodies validated with Zod before touching the database
- UUIDs generated via Prisma's `uuid()` default
- Database connection via `DATABASE_URL` environment variable
- Port via `PORT` env var, default 3001
- JWT_SECRET and JWT_REFRESH_SECRET via env vars
- Photo uploads stored in `apps/backend/uploads/`, served as `/uploads/:filename`

---

### Task 1: Backend Project Setup & Core Middleware

**Files:**
- Modify: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/eslint.config.js`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/config.ts`
- Create: `apps/backend/src/middleware/errorHandler.ts`
- Create: `apps/backend/src/middleware/asyncHandler.ts`
- Create: `apps/backend/src/middleware/validate.ts`
- Create: `apps/backend/src/middleware/logger.ts`

- [ ] **Step 1: Replace `apps/backend/package.json`**
```json
{
  "name": "@cv-generator/backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@cv-generator/shared": "workspace:*",
    "@prisma/client": "^5.15.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@cv-generator/config": "workspace:*",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.14.0",
    "eslint": "^9.0.0",
    "prisma": "^5.15.0",
    "tsx": "^4.15.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`, `eslint.config.js`, `.env.example`, `src/config.ts`, `src/middleware/asyncHandler.ts`, `src/middleware/validate.ts` as per standard setup.**
Ensure `config.ts` exports `databaseUrl`, `port`, `jwtSecret`, etc.

- [ ] **Step 3: Create `apps/backend/src/middleware/logger.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};
```

- [ ] **Step 4: Create `apps/backend/src/middleware/errorHandler.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;

  // Handle Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Unique constraint violation', details: err.meta });
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
```

- [ ] **Step 5: Create `apps/backend/src/app.ts`**
```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(logger);
  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes mounted later
  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 6: Create `apps/backend/src/index.ts`**
```ts
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
app.listen(config.port, () => {
  console.info(`Server running on port ${config.port}`);
});
```

- [ ] **Step 7: Install deps, test dev server, and Commit.**

---

### Task 2: Database Setup with Prisma

**Files:**
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/db/prisma.ts`
- Create: `apps/backend/prisma/seed.ts`

- [ ] **Step 1: Create `prisma/schema.prisma`**
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

- [ ] **Step 2: Create `src/db/prisma.ts`**
```ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

- [ ] **Step 3: Create `prisma/seed.ts`**
```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.template.createMany({
    data: [
      { name: 'Classic', layoutKey: 'classic', description: 'Traditional two-column layout.', isActive: true },
      { name: 'Modern', layoutKey: 'modern', description: 'Full-width card-based layout.', isActive: true },
      { name: 'Compact', layoutKey: 'compact', description: 'Single-column dense layout.', isActive: true },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run `pnpm db:push` and `pnpm db:generate`, then `pnpm db:seed`**
- [ ] **Step 5: Commit changes**

---

### Task 3: Auth Routes (Login, Refresh, Logout)

**Files:**
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/auth.router.ts`
- Create: `apps/backend/src/middleware/requireAuth.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Create `requireAuth.ts`** (Middleware extracting `Authorization: Bearer <token>` and setting `req.user`)
- [ ] **Step 2: Create `auth.service.ts` using `prisma.user.findUnique({ where: { email } })`**
- [ ] **Step 3: Create `auth.router.ts` using `asyncHandler`**
- [ ] **Step 4: Mount router in `app.ts` and commit.**

---

### Task 4: Staff & Skills Routes (With Pagination)

**Files:**
- Create: `apps/backend/src/staff/staff.router.ts`
- Create: `apps/backend/src/staff/skills.router.ts`
- Create: `apps/backend/src/upload/upload.ts` (multer config)

- [ ] **Step 1: Create `staff.router.ts` with Pagination**
```ts
staffRouter.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' }
    }),
    prisma.staff.count()
  ]);
  
  res.json({ data: staff, pagination: { page, limit, total } });
}));

staffRouter.get('/:id', asyncHandler(async (req, res) => {
  const staff = await prisma.staff.findUnique({
    where: { id: req.params.id },
    include: { skills: true }
  });
  if (!staff) throw new AppError(404, 'Staff not found');
  res.json({ data: staff });
}));
```
*(Implement POST, PATCH, DELETE for Staff and Photo Upload as admin-only)*

- [ ] **Step 2: Create `skills.router.ts` for managing specific skills.**
- [ ] **Step 3: Mount in `app.ts` and commit.**

---

### Task 5: Projects & Participations Routes (With Pagination)

**Files:**
- Create: `apps/backend/src/projects/projects.router.ts`
- Create: `apps/backend/src/projects/participations.router.ts`

- [ ] **Step 1: Create `projects.router.ts` with `prisma.project.findMany` (paginated) and `include: { participations: { include: { staff: true } } }`.**
- [ ] **Step 2: Create `participations.router.ts` for adding staff to projects.**
- [ ] **Step 3: Mount in `app.ts` and commit.**

---

### Task 6: CV Generation & Templates Routes

**Files:**
- Create: `apps/backend/src/cv/cv.router.ts`
- Create: `apps/backend/src/cv/templates.router.ts`

- [ ] **Step 1: Implement `GET /api/cv/:staffId/:templateId`**
Fetch Staff via `prisma.staff.findUnique` with `include: { skills: true, participations: { include: { project: true } } }`.
Fetch Template via `prisma.template.findUnique`.
Log generation via `prisma.generatedCV.create`.
Return assembled JSON.
- [ ] **Step 2: Mount in `app.ts` and commit.**

---

## Plan 2 Complete ✅

**Deliverable:** A fully functional REST API with Prisma ORM, JWT auth, all CRUD endpoints with pagination, structured error handling, photo upload, and CV assembly — ready for the frontend (Plan 3).
