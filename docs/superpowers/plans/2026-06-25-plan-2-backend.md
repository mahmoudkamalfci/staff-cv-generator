# CV Generator — Plan 2: Backend (Express + PostgreSQL)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Node.js + Express + PostgreSQL backend with JWT auth, file uploads, and all REST API endpoints for staff, projects, participations, templates, and CV generation.

**Architecture:** Express app with TypeScript, organized by feature (auth, staff, projects, etc.). Knex.js for SQL query building and database migrations. Zod middleware validates all request bodies using schemas from `@cv-generator/shared`. JWT access tokens (15min) stored in memory; refresh tokens (7d) in httpOnly cookies. Multer handles photo uploads to `uploads/`.

**Tech Stack:** Express 4, TypeScript 5, Knex.js, pg (node-postgres), Zod (via @cv-generator/shared), bcrypt, jsonwebtoken, multer, cors, helmet

## Global Constraints

- All imports use `.js` extension (ESM)
- All route handlers wrapped with async error catcher — never use try/catch in route files
- All request bodies validated with Zod before touching the database
- UUIDs generated with `crypto.randomUUID()` (Node built-in, no uuid package needed)
- Timestamps stored as ISO strings in PostgreSQL (timestamptz)
- Database connection via `DATABASE_URL` environment variable
- Port via `PORT` env var, default 3001
- JWT_SECRET and JWT_REFRESH_SECRET via env vars
- Photo uploads stored in `apps/backend/uploads/`, served as `/uploads/:filename`

---

### Task 1: Backend Project Setup

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

**Interfaces:**
- Consumes: `@cv-generator/shared` (all schemas), `@cv-generator/config` (eslintConfig)
- Produces:
  - `app` — Express Application, exported from `src/app.ts`
  - `asyncHandler(fn)` — wraps async route handlers, exported from `src/middleware/asyncHandler.ts`
  - `validate(schema)` — Zod middleware factory, exported from `src/middleware/validate.ts`
  - `errorHandler` — Express error middleware, exported from `src/middleware/errorHandler.ts`

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
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "seed": "knex seed:run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@cv-generator/shared": "workspace:*",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.0",
    "knex": "^3.1.0",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@cv-generator/config": "workspace:*",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.14.0",
    "eslint": "^9.0.0",
    "tsx": "^4.15.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `apps/backend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "outDir": "dist",
    "rootDir": "src",
    "paths": {}
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/backend/eslint.config.js`**

```js
import { eslintConfig } from '@cv-generator/config';

export default [
  ...eslintConfig,
  {
    rules: {
      'no-console': 'off',
    },
  },
];
```

- [ ] **Step 4: Create `apps/backend/.env.example`**

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cv_generator
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 5: Create `apps/backend/src/config.ts`**

```ts
export const config = {
  port: Number(process.env['PORT'] ?? 3001),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  databaseUrl: process.env['DATABASE_URL'] ?? '',
  jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret-change-me',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret-change-me',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  uploadDir: 'uploads',
} as const;
```

- [ ] **Step 6: Create `apps/backend/src/middleware/asyncHandler.ts`**

```ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

- [ ] **Step 7: Create `apps/backend/src/middleware/validate.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
```

- [ ] **Step 8: Create `apps/backend/src/middleware/errorHandler.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
```

- [ ] **Step 9: Create `apps/backend/src/app.ts`**

```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes will be mounted here in later tasks

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 10: Create `apps/backend/src/index.ts`**

```ts
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.info(`Server running on http://localhost:${config.port}`);
  console.info(`Environment: ${config.nodeEnv}`);
});
```

- [ ] **Step 11: Install backend dependencies**

```bash
pnpm install --filter @cv-generator/backend
```

- [ ] **Step 12: Copy `.env.example` to `.env` and fill in values**

```bash
cp apps/backend/.env.example apps/backend/.env
```

Then edit `apps/backend/.env` with your PostgreSQL credentials.

- [ ] **Step 13: Verify dev server starts**

```bash
pnpm --filter @cv-generator/backend dev
```

Expected output: `Server running on http://localhost:3001`

Visit `http://localhost:3001/api/health` — should return `{"status":"ok","timestamp":"..."}`.

- [ ] **Step 14: Commit**

```bash
git add apps/backend
git commit -m "feat(backend): scaffold Express app with middleware"
```

---

### Task 2: Database Setup with Knex Migrations

**Files:**
- Create: `apps/backend/knexfile.ts`
- Create: `apps/backend/src/db/knex.ts`
- Create: `apps/backend/src/db/migrations/001_create_users.ts`
- Create: `apps/backend/src/db/migrations/002_create_staff.ts`
- Create: `apps/backend/src/db/migrations/003_create_skills.ts`
- Create: `apps/backend/src/db/migrations/004_create_projects.ts`
- Create: `apps/backend/src/db/migrations/005_create_participations.ts`
- Create: `apps/backend/src/db/migrations/006_create_templates.ts`
- Create: `apps/backend/src/db/migrations/007_create_generated_cvs.ts`
- Create: `apps/backend/src/db/seeds/001_templates.ts`

**Interfaces:**
- Produces: `db` — Knex instance exported from `src/db/knex.ts`. Used by all repository functions as: `import { db } from '../db/knex.js'`

- [ ] **Step 1: Create `apps/backend/knexfile.ts`**

```ts
import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env['DATABASE_URL'],
  migrations: {
    directory: './src/db/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: './src/db/seeds',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default config;
```

- [ ] **Step 2: Create `apps/backend/src/db/knex.ts`**

```ts
import Knex from 'knex';
import { config } from '../config.js';

export const db = Knex({
  client: 'pg',
  connection: config.databaseUrl,
  pool: { min: 2, max: 10 },
});
```

- [ ] **Step 3: Create migration `001_create_users.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'staff']).notNullable().defaultTo('staff');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
```

- [ ] **Step 4: Create migration `002_create_staff.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('staff', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('name', 200).notNullable();
    table.string('job_title', 200).notNullable();
    table.integer('years_experience').notNullable().defaultTo(0);
    table.text('summary').notNullable();
    table.string('photo_url', 500).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('staff');
}
```

- [ ] **Step 5: Create migration `003_create_skills.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.enum('level', ['beginner', 'intermediate', 'advanced', 'expert']).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('skills');
}
```

- [ ] **Step 6: Create migration `004_create_projects.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name', 300).notNullable();
    table.text('description').notNullable();
    table.string('client', 200).notNullable();
    table.string('location', 200).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.specificType('technologies', 'text[]').notNullable().defaultTo('{}');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('projects');
}
```

- [ ] **Step 7: Create migration `005_create_participations.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_participations', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('role', 200).notNullable();
    table.text('responsibilities').notNullable();
    table.unique(['staff_id', 'project_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('project_participations');
}
```

- [ ] **Step 8: Create migration `006_create_templates.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cv_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('name', 100).notNullable();
    table.enum('layout_key', ['classic', 'modern', 'compact']).notNullable().unique();
    table.text('description').notNullable().defaultTo('');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('cv_templates');
}
```

- [ ] **Step 9: Create migration `007_create_generated_cvs.ts`**

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('generated_cvs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('template_id').notNullable().references('id').inTable('cv_templates').onDelete('CASCADE');
    table.uuid('generated_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('generated_cvs');
}
```

- [ ] **Step 10: Create seed `001_templates.ts`**

```ts
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('cv_templates').del();
  await knex('cv_templates').insert([
    {
      id: knex.fn.uuid(),
      name: 'Classic',
      layout_key: 'classic',
      description: 'Traditional two-column layout with a professional sidebar for skills and a main content area for project experience.',
      is_active: true,
    },
    {
      id: knex.fn.uuid(),
      name: 'Modern',
      layout_key: 'modern',
      description: 'Full-width card-based layout with an accent color header, skill tag pills, and project cards.',
      is_active: true,
    },
    {
      id: knex.fn.uuid(),
      name: 'Compact',
      layout_key: 'compact',
      description: 'Single-column dense layout optimized for one page. Maximum information density with minimal decoration.',
      is_active: true,
    },
  ]);
}
```

- [ ] **Step 11: Run migrations and seeds**

```bash
cd apps/backend
DATABASE_URL=your_url npx knex --esm migrate:latest
DATABASE_URL=your_url npx knex --esm seed:run
```

Or add to `.env` and run:

```bash
pnpm --filter @cv-generator/backend migrate
pnpm --filter @cv-generator/backend seed
```

Expected: 7 tables created, 3 template rows inserted.

- [ ] **Step 12: Commit**

```bash
git add apps/backend/src/db apps/backend/knexfile.ts
git commit -m "feat(backend): add Knex migrations for all tables + template seeds"
```

---

### Task 3: Auth Routes (Login, Refresh, Logout)

**Files:**
- Create: `apps/backend/src/auth/auth.repository.ts`
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/auth.router.ts`
- Modify: `apps/backend/src/app.ts` (mount auth router)
- Create: `apps/backend/src/middleware/requireAuth.ts`

**Interfaces:**
- Consumes: `db` from `../db/knex.js`, `LoginSchema` from `@cv-generator/shared`, `AppError` from `../middleware/errorHandler.js`
- Produces:
  - `requireAuth` middleware — attaches `req.user: { id: string; email: string; role: 'admin' | 'staff' }` to request
  - `POST /api/auth/login` → `{ accessToken: string, user: { id, email, role } }`
  - `POST /api/auth/refresh` → `{ accessToken: string }`
  - `POST /api/auth/logout` → `{ message: 'Logged out' }`
  - `POST /api/auth/register` → `{ message: 'User created', userId: string }` (admin only)

- [ ] **Step 1: Create `apps/backend/src/auth/auth.repository.ts`**

```ts
import { db } from '../db/knex.js';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'staff';
  created_at: Date;
  updated_at: Date;
}

export const authRepository = {
  findByEmail: (email: string) =>
    db<DbUser>('users').where({ email }).first(),

  findById: (id: string) =>
    db<DbUser>('users').where({ id }).first(),

  create: (data: { email: string; passwordHash: string; role: 'admin' | 'staff' }) =>
    db<DbUser>('users')
      .insert({ email: data.email, password_hash: data.passwordHash, role: data.role })
      .returning('*')
      .then((rows) => rows[0]!),
};
```

- [ ] **Step 2: Create `apps/backend/src/auth/auth.service.ts`**

```ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authRepository } from './auth.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import type { LoginInput, RegisterInput } from '@cv-generator/shared';

export const authService = {
  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    });

    return { accessToken, refreshToken, user: payload };
  },

  async refresh(token: string) {
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, config.jwtRefreshSecret) as { id: string };
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await authRepository.findById(decoded.id);
    if (!user) throw new AppError(401, 'User not found');

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return { accessToken };
  },

  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, 'Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({ email: input.email, passwordHash, role: input.role });
    return { userId: user.id };
  },
};
```

- [ ] **Step 3: Create `apps/backend/src/middleware/requireAuth.ts`**

```ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthPayload {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
```

- [ ] **Step 4: Create `apps/backend/src/auth/auth.router.ts`**

```ts
import { Router } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { LoginSchema, RegisterSchema } from '@cv-generator/shared';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post(
  '/login',
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({ accessToken, user });
  }),
);

// POST /api/auth/refresh
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.['refreshToken'] as string | undefined;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }
    const result = await authService.refresh(token);
    res.json(result);
  }),
);

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// POST /api/auth/register (admin only)
authRouter.post(
  '/register',
  requireAuth,
  requireAdmin,
  validate(RegisterSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({ message: 'User created', ...result });
  }),
);
```

- [ ] **Step 5: Mount auth router in `apps/backend/src/app.ts`**

Add after the existing imports:
```ts
import cookieParser from 'cookie-parser';
import { authRouter } from './auth/auth.router.js';
```

Add `"cookie-parser": "^1.4.6"` and `"@types/cookie-parser": "^1.4.7"` to `package.json` deps, then install:
```bash
pnpm add cookie-parser --filter @cv-generator/backend
pnpm add -D @types/cookie-parser --filter @cv-generator/backend
```

In `createApp()`, add after `app.use(express.urlencoded(...))`:
```ts
app.use(cookieParser());
app.use('/api/auth', authRouter);
```

- [ ] **Step 6: Verify auth endpoint works**

Start server: `pnpm --filter @cv-generator/backend dev`

Test login (should 401 with no users yet):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```
Expected: `{"error":"Invalid email or password"}`

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/auth apps/backend/src/middleware
git commit -m "feat(backend): add JWT auth with login, refresh, logout endpoints"
```

---

### Task 4: Staff & Skills Routes

**Files:**
- Create: `apps/backend/src/staff/staff.repository.ts`
- Create: `apps/backend/src/staff/staff.router.ts`
- Create: `apps/backend/src/upload/upload.ts`
- Modify: `apps/backend/src/app.ts` (mount staff router)

**Interfaces:**
- Consumes: `db`, `requireAuth`, `requireAdmin`, `asyncHandler`, `validate`, `CreateStaffSchema`, `UpdateStaffSchema`, `CreateSkillSchema`, `UpdateSkillSchema` from `@cv-generator/shared`
- Produces:
  - `GET /api/staff` → `Staff[]`
  - `GET /api/staff/:id` → `StaffWithSkills`
  - `POST /api/staff` → `Staff` (admin only)
  - `PATCH /api/staff/:id` → `Staff` (admin only)
  - `DELETE /api/staff/:id` → `204` (admin only)
  - `POST /api/staff/:id/photo` → `{ photoUrl: string }` (admin only)
  - `GET /api/staff/:id/skills` → `Skill[]`
  - `POST /api/staff/:id/skills` → `Skill` (admin only)
  - `PATCH /api/skills/:id` → `Skill` (admin only)
  - `DELETE /api/skills/:id` → `204` (admin only)

- [ ] **Step 1: Create `apps/backend/src/upload/upload.ts`**

```ts
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
```

- [ ] **Step 2: Create `apps/backend/src/staff/staff.repository.ts`**

```ts
import { db } from '../db/knex.js';

export const staffRepository = {
  findAll: () => db('staff').select('*').orderBy('name'),

  findById: (id: string) => db('staff').where({ id }).first(),

  findWithSkills: async (id: string) => {
    const staff = await db('staff').where({ id }).first();
    if (!staff) return null;
    const skills = await db('skills').where({ staff_id: id });
    return { ...staff, skills };
  },

  create: (data: {
    userId?: string;
    name: string;
    jobTitle: string;
    yearsExperience: number;
    summary: string;
  }) =>
    db('staff')
      .insert({
        user_id: data.userId ?? null,
        name: data.name,
        job_title: data.jobTitle,
        years_experience: data.yearsExperience,
        summary: data.summary,
      })
      .returning('*')
      .then((rows) => rows[0]!),

  update: (id: string, data: Partial<{ name: string; jobTitle: string; yearsExperience: number; summary: string; photoUrl: string }>) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update['name'] = data.name;
    if (data.jobTitle !== undefined) update['job_title'] = data.jobTitle;
    if (data.yearsExperience !== undefined) update['years_experience'] = data.yearsExperience;
    if (data.summary !== undefined) update['summary'] = data.summary;
    if (data.photoUrl !== undefined) update['photo_url'] = data.photoUrl;
    update['updated_at'] = db.fn.now();
    return db('staff').where({ id }).update(update).returning('*').then((rows) => rows[0]!);
  },

  delete: (id: string) => db('staff').where({ id }).delete(),

  // Skills
  getSkills: (staffId: string) => db('skills').where({ staff_id: staffId }),

  addSkill: (staffId: string, name: string, level: string) =>
    db('skills').insert({ staff_id: staffId, name, level }).returning('*').then((rows) => rows[0]!),

  updateSkill: (id: string, data: { name?: string; level?: string }) =>
    db('skills').where({ id }).update(data).returning('*').then((rows) => rows[0]!),

  deleteSkill: (id: string) => db('skills').where({ id }).delete(),
};
```

- [ ] **Step 3: Create `apps/backend/src/staff/staff.router.ts`**

```ts
import { Router } from 'express';
import { staffRepository } from './staff.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { upload } from '../upload/upload.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateStaffSchema, UpdateStaffSchema, CreateSkillSchema, UpdateSkillSchema } from '@cv-generator/shared';

export const staffRouter = Router();

staffRouter.use(requireAuth);

// GET /api/staff
staffRouter.get('/', asyncHandler(async (_req, res) => {
  const staff = await staffRepository.findAll();
  res.json(staff.map(camelizeStaff));
}));

// GET /api/staff/:id
staffRouter.get('/:id', asyncHandler(async (req, res) => {
  const staff = await staffRepository.findWithSkills(req.params.id!);
  if (!staff) throw new AppError(404, 'Staff member not found');
  res.json(camelizeStaff(staff));
}));

// POST /api/staff (admin only)
staffRouter.post('/', requireAdmin, validate(CreateStaffSchema), asyncHandler(async (req, res) => {
  const staff = await staffRepository.create(req.body);
  res.status(201).json(camelizeStaff(staff));
}));

// PATCH /api/staff/:id (admin only)
staffRouter.patch('/:id', requireAdmin, validate(UpdateStaffSchema), asyncHandler(async (req, res) => {
  const staff = await staffRepository.update(req.params.id!, req.body);
  if (!staff) throw new AppError(404, 'Staff member not found');
  res.json(camelizeStaff(staff));
}));

// DELETE /api/staff/:id (admin only)
staffRouter.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await staffRepository.delete(req.params.id!);
  res.status(204).send();
}));

// POST /api/staff/:id/photo (admin only)
staffRouter.post('/:id/photo', requireAdmin, upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');
  const photoUrl = `/uploads/${req.file.filename}`;
  const staff = await staffRepository.update(req.params.id!, { photoUrl });
  if (!staff) throw new AppError(404, 'Staff member not found');
  res.json({ photoUrl });
}));

// GET /api/staff/:id/skills
staffRouter.get('/:id/skills', asyncHandler(async (req, res) => {
  const skills = await staffRepository.getSkills(req.params.id!);
  res.json(skills.map(camelizeSkill));
}));

// POST /api/staff/:id/skills (admin only)
staffRouter.post('/:id/skills', requireAdmin, validate(CreateSkillSchema), asyncHandler(async (req, res) => {
  const skill = await staffRepository.addSkill(req.params.id!, req.body.name, req.body.level);
  res.status(201).json(camelizeSkill(skill));
}));

// PATCH /api/skills/:skillId (admin only) — note: mounted on staffRouter but uses different param
// This is handled by a separate skills router mounted at /api/skills

// Helper: snake_case → camelCase for staff rows
function camelizeStaff(row: Record<string, unknown>) {
  return {
    id: row['id'],
    userId: row['user_id'],
    name: row['name'],
    jobTitle: row['job_title'],
    yearsExperience: row['years_experience'],
    summary: row['summary'],
    photoUrl: row['photo_url'],
    createdAt: row['created_at'],
    updatedAt: row['updated_at'],
    skills: Array.isArray(row['skills']) ? row['skills'].map(camelizeSkill) : undefined,
  };
}

function camelizeSkill(row: Record<string, unknown>) {
  return {
    id: row['id'],
    staffId: row['staff_id'],
    name: row['name'],
    level: row['level'],
  };
}
```

- [ ] **Step 4: Create `apps/backend/src/staff/skills.router.ts`** (for PATCH/DELETE on skills by ID)

```ts
import { Router } from 'express';
import { staffRepository } from './staff.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { UpdateSkillSchema } from '@cv-generator/shared';

export const skillsRouter = Router();

skillsRouter.use(requireAuth, requireAdmin);

skillsRouter.patch('/:id', validate(UpdateSkillSchema), asyncHandler(async (req, res) => {
  const skill = await staffRepository.updateSkill(req.params.id!, req.body);
  res.json({ id: skill['id'], staffId: skill['staff_id'], name: skill['name'], level: skill['level'] });
}));

skillsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await staffRepository.deleteSkill(req.params.id!);
  res.status(204).send();
}));
```

- [ ] **Step 5: Mount routers in `apps/backend/src/app.ts`**

Add imports:
```ts
import { staffRouter } from './staff/staff.router.js';
import { skillsRouter } from './staff/skills.router.js';
```

Add after auth router mount:
```ts
app.use('/api/staff', staffRouter);
app.use('/api/skills', skillsRouter);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/staff apps/backend/src/upload
git commit -m "feat(backend): add staff and skills CRUD endpoints with photo upload"
```

---

### Task 5: Projects & Participations Routes

**Files:**
- Create: `apps/backend/src/projects/projects.repository.ts`
- Create: `apps/backend/src/projects/projects.router.ts`
- Create: `apps/backend/src/projects/participations.router.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: `CreateProjectSchema`, `UpdateProjectSchema`, `CreateParticipationSchema`, `UpdateParticipationSchema` from `@cv-generator/shared`
- Produces:
  - `GET /api/projects` → `Project[]`
  - `GET /api/projects/:id` → `Project & { participations: ParticipationWithStaff[] }`
  - `POST /api/projects` → `Project`
  - `PATCH /api/projects/:id` → `Project`
  - `DELETE /api/projects/:id` → `204`
  - `GET /api/staff/:id/participations` → `ParticipationWithProject[]`
  - `POST /api/participations` → `Participation`
  - `PATCH /api/participations/:id` → `Participation`
  - `DELETE /api/participations/:id` → `204`

- [ ] **Step 1: Create `apps/backend/src/projects/projects.repository.ts`**

```ts
import { db } from '../db/knex.js';

export const projectsRepository = {
  findAll: () =>
    db('projects').select('*').orderBy('start_date', 'desc').then((rows) => rows.map(camelizeProject)),

  findById: async (id: string) => {
    const project = await db('projects').where({ id }).first();
    if (!project) return null;
    const participations = await db('project_participations as pp')
      .join('staff as s', 'pp.staff_id', 's.id')
      .where('pp.project_id', id)
      .select('pp.*', 's.name as staff_name', 's.job_title as staff_job_title');
    return { ...camelizeProject(project), participations: participations.map(camelizeParticipation) };
  },

  create: (data: { name: string; description: string; client: string; location: string; startDate: string; endDate?: string | null; technologies: string[] }) =>
    db('projects')
      .insert({
        name: data.name,
        description: data.description,
        client: data.client,
        location: data.location,
        start_date: data.startDate,
        end_date: data.endDate ?? null,
        technologies: data.technologies,
      })
      .returning('*')
      .then((rows) => camelizeProject(rows[0]!)),

  update: (id: string, data: Partial<{ name: string; description: string; client: string; location: string; startDate: string; endDate: string | null; technologies: string[] }>) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update['name'] = data.name;
    if (data.description !== undefined) update['description'] = data.description;
    if (data.client !== undefined) update['client'] = data.client;
    if (data.location !== undefined) update['location'] = data.location;
    if (data.startDate !== undefined) update['start_date'] = data.startDate;
    if (data.endDate !== undefined) update['end_date'] = data.endDate;
    if (data.technologies !== undefined) update['technologies'] = data.technologies;
    update['updated_at'] = db.fn.now();
    return db('projects').where({ id }).update(update).returning('*').then((rows) => camelizeProject(rows[0]!));
  },

  delete: (id: string) => db('projects').where({ id }).delete(),

  // Participations
  getStaffParticipations: (staffId: string) =>
    db('project_participations as pp')
      .join('projects as p', 'pp.project_id', 'p.id')
      .where('pp.staff_id', staffId)
      .select('pp.*', 'p.name as project_name', 'p.client as project_client', 'p.start_date as project_start_date', 'p.end_date as project_end_date', 'p.description as project_description', 'p.location as project_location', 'p.technologies as project_technologies')
      .orderBy('p.start_date', 'desc'),

  createParticipation: (data: { staffId: string; projectId: string; role: string; responsibilities: string }) =>
    db('project_participations')
      .insert({ staff_id: data.staffId, project_id: data.projectId, role: data.role, responsibilities: data.responsibilities })
      .returning('*')
      .then((rows) => rows[0]!),

  updateParticipation: (id: string, data: { role?: string; responsibilities?: string }) =>
    db('project_participations').where({ id }).update(data).returning('*').then((rows) => rows[0]!),

  deleteParticipation: (id: string) => db('project_participations').where({ id }).delete(),
};

function camelizeProject(row: Record<string, unknown>) {
  return {
    id: row['id'],
    name: row['name'],
    description: row['description'],
    client: row['client'],
    location: row['location'],
    startDate: row['start_date'],
    endDate: row['end_date'],
    technologies: row['technologies'],
    createdAt: row['created_at'],
    updatedAt: row['updated_at'],
  };
}

function camelizeParticipation(row: Record<string, unknown>) {
  return {
    id: row['id'],
    staffId: row['staff_id'],
    projectId: row['project_id'],
    role: row['role'],
    responsibilities: row['responsibilities'],
    staffName: row['staff_name'],
    staffJobTitle: row['staff_job_title'],
    projectName: row['project_name'],
    projectClient: row['project_client'],
    projectStartDate: row['project_start_date'],
    projectEndDate: row['project_end_date'],
    projectDescription: row['project_description'],
    projectLocation: row['project_location'],
    projectTechnologies: row['project_technologies'],
  };
}
```

- [ ] **Step 2: Create `apps/backend/src/projects/projects.router.ts`**

```ts
import { Router } from 'express';
import { projectsRepository } from './projects.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateProjectSchema, UpdateProjectSchema } from '@cv-generator/shared';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', asyncHandler(async (_req, res) => {
  const projects = await projectsRepository.findAll();
  res.json(projects);
}));

projectsRouter.get('/:id', asyncHandler(async (req, res) => {
  const project = await projectsRepository.findById(req.params.id!);
  if (!project) throw new AppError(404, 'Project not found');
  res.json(project);
}));

projectsRouter.post('/', requireAdmin, validate(CreateProjectSchema), asyncHandler(async (req, res) => {
  const project = await projectsRepository.create(req.body);
  res.status(201).json(project);
}));

projectsRouter.patch('/:id', requireAdmin, validate(UpdateProjectSchema), asyncHandler(async (req, res) => {
  const project = await projectsRepository.update(req.params.id!, req.body);
  res.json(project);
}));

projectsRouter.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await projectsRepository.delete(req.params.id!);
  res.status(204).send();
}));
```

- [ ] **Step 3: Create `apps/backend/src/projects/participations.router.ts`**

```ts
import { Router } from 'express';
import { projectsRepository } from './projects.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { CreateParticipationSchema, UpdateParticipationSchema } from '@cv-generator/shared';

export const participationsRouter = Router();

participationsRouter.use(requireAuth, requireAdmin);

participationsRouter.post('/', validate(CreateParticipationSchema), asyncHandler(async (req, res) => {
  const p = await projectsRepository.createParticipation(req.body);
  res.status(201).json(p);
}));

participationsRouter.patch('/:id', validate(UpdateParticipationSchema), asyncHandler(async (req, res) => {
  const p = await projectsRepository.updateParticipation(req.params.id!, req.body);
  res.json(p);
}));

participationsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await projectsRepository.deleteParticipation(req.params.id!);
  res.status(204).send();
}));
```

- [ ] **Step 4: Mount in `apps/backend/src/app.ts`**

Add imports and mount:
```ts
import { projectsRouter } from './projects/projects.router.js';
import { participationsRouter } from './projects/participations.router.js';
// ...
app.use('/api/projects', projectsRouter);
app.use('/api/participations', participationsRouter);
```

Also add staff participations to `staffRouter` in `staff.router.ts`:
```ts
// GET /api/staff/:id/participations
staffRouter.get('/:id/participations', asyncHandler(async (req, res) => {
  const { projectsRepository } = await import('../projects/projects.repository.js');
  const participations = await projectsRepository.getStaffParticipations(req.params.id!);
  res.json(participations);
}));
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects
git commit -m "feat(backend): add projects and participations CRUD endpoints"
```

---

### Task 6: CV Generation & Templates Routes

**Files:**
- Create: `apps/backend/src/cv/cv.repository.ts`
- Create: `apps/backend/src/cv/cv.router.ts`
- Create: `apps/backend/src/cv/templates.router.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: all repositories above
- Produces:
  - `GET /api/templates` → `CVTemplate[]`
  - `GET /api/templates/:id` → `CVTemplate`
  - `GET /api/cv/:staffId/:templateId` → `CVData` (assembled from staff + skills + participations + template)

- [ ] **Step 1: Create `apps/backend/src/cv/cv.repository.ts`**

```ts
import { db } from '../db/knex.js';

export const cvRepository = {
  getAllTemplates: () =>
    db('cv_templates').where({ is_active: true }).select('*').orderBy('name').then((rows) =>
      rows.map((r) => ({
        id: r['id'],
        name: r['name'],
        layoutKey: r['layout_key'],
        description: r['description'],
        isActive: r['is_active'],
        createdAt: r['created_at'],
      }))
    ),

  getTemplateById: (id: string) =>
    db('cv_templates').where({ id, is_active: true }).first().then((r) =>
      r
        ? {
            id: r['id'],
            name: r['name'],
            layoutKey: r['layout_key'],
            description: r['description'],
            isActive: r['is_active'],
            createdAt: r['created_at'],
          }
        : null
    ),

  logGeneration: (staffId: string, templateId: string, generatedBy: string) =>
    db('generated_cvs').insert({ staff_id: staffId, template_id: templateId, generated_by: generatedBy }),

  assembleCVData: async (staffId: string, templateId: string) => {
    const staff = await db('staff').where({ id: staffId }).first();
    if (!staff) return null;

    const skills = await db('skills').where({ staff_id: staffId });

    const participations = await db('project_participations as pp')
      .join('projects as p', 'pp.project_id', 'p.id')
      .where('pp.staff_id', staffId)
      .select('pp.*', 'p.*', 'pp.id as participation_id')
      .orderBy('p.start_date', 'desc');

    const template = await db('cv_templates').where({ id: templateId, is_active: true }).first();
    if (!template) return null;

    return {
      staff: {
        id: staff['id'],
        userId: staff['user_id'],
        name: staff['name'],
        jobTitle: staff['job_title'],
        yearsExperience: staff['years_experience'],
        summary: staff['summary'],
        photoUrl: staff['photo_url'],
        createdAt: staff['created_at'],
        updatedAt: staff['updated_at'],
      },
      skills: skills.map((s) => ({ id: s['id'], staffId: s['staff_id'], name: s['name'], level: s['level'] })),
      participations: participations.map((p) => ({
        id: p['participation_id'],
        staffId: p['staff_id'],
        projectId: p['project_id'],
        role: p['role'],
        responsibilities: p['responsibilities'],
        project: {
          id: p['id'],
          name: p['name'],
          description: p['description'],
          client: p['client'],
          location: p['location'],
          startDate: p['start_date'],
          endDate: p['end_date'],
          technologies: p['technologies'],
          createdAt: p['created_at'],
          updatedAt: p['updated_at'],
        },
      })),
      template: {
        id: template['id'],
        name: template['name'],
        layoutKey: template['layout_key'],
        description: template['description'],
        isActive: template['is_active'],
        createdAt: template['created_at'],
      },
      generatedAt: new Date().toISOString(),
    };
  },
};
```

- [ ] **Step 2: Create `apps/backend/src/cv/templates.router.ts`**

```ts
import { Router } from 'express';
import { cvRepository } from './cv.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { AppError } from '../middleware/errorHandler.js';

export const templatesRouter = Router();

templatesRouter.use(requireAuth);

templatesRouter.get('/', asyncHandler(async (_req, res) => {
  const templates = await cvRepository.getAllTemplates();
  res.json(templates);
}));

templatesRouter.get('/:id', asyncHandler(async (req, res) => {
  const template = await cvRepository.getTemplateById(req.params.id!);
  if (!template) throw new AppError(404, 'Template not found');
  res.json(template);
}));
```

- [ ] **Step 3: Create `apps/backend/src/cv/cv.router.ts`**

```ts
import { Router } from 'express';
import { cvRepository } from './cv.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { AppError } from '../middleware/errorHandler.js';

export const cvRouter = Router();

cvRouter.use(requireAuth);

// GET /api/cv/:staffId/:templateId
cvRouter.get('/:staffId/:templateId', asyncHandler(async (req, res) => {
  const { staffId, templateId } = req.params as { staffId: string; templateId: string };
  const data = await cvRepository.assembleCVData(staffId, templateId);
  if (!data) throw new AppError(404, 'Staff member or template not found');

  // Log the generation
  await cvRepository.logGeneration(staffId, templateId, req.user!.id);

  res.json(data);
}));
```

- [ ] **Step 4: Mount in `apps/backend/src/app.ts`**

```ts
import { templatesRouter } from './cv/templates.router.js';
import { cvRouter } from './cv/cv.router.js';
// ...
app.use('/api/templates', templatesRouter);
app.use('/api/cv', cvRouter);
```

- [ ] **Step 5: Verify full API**

Start server and test:
```bash
# Should return 3 templates (after seed)
curl http://localhost:3001/api/templates \
  -H "Authorization: Bearer <token>"
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/cv
git commit -m "feat(backend): add CV generation endpoint and templates routes"
```

---

## Plan 2 Complete ✅

**Deliverable:** A fully functional REST API with JWT auth, all CRUD endpoints, photo upload, and CV assembly — ready for the frontend (Plan 3).
