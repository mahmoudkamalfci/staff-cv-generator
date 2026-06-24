# CV Generator — Plan 1: Monorepo Scaffold & Shared Packages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Turborepo + pnpm monorepo with shared ESLint config and shared Zod schemas/types used by both frontend and backend.

**Architecture:** pnpm workspaces declare `apps/*` and `packages/*`. Turborepo orchestrates build/lint/dev pipelines. `packages/config` exports a flat ESLint config. `packages/shared` exports Zod schemas and inferred TypeScript types. Both app packages depend on these shared packages via `workspace:*`.

**Tech Stack:** pnpm 9+, Turborepo 2+, TypeScript 5+, Zod 3+, ESLint 9 (flat config), Prettier 3+

## Global Constraints

- Package manager: pnpm (use `pnpm` for all install commands, never `npm` or `yarn`)
- Node version: 20+
- TypeScript strict mode everywhere
- ESLint flat config format (eslint.config.js, NOT .eslintrc)
- All packages use `"type": "module"` in package.json
- Workspace package names use `@cv-generator/` prefix (e.g. `@cv-generator/shared`)
- Monorepo root: `/home/mahmoud/frontend-projects/practise-projects/staff-cv-generator`

---

### Task 1: Root Monorepo Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `.gitignore`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `tsconfig.base.json`
- Create: `.vscode/settings.json`
- Create: `.vscode/extensions.json`

**Interfaces:**
- Produces: root workspace that `apps/*` and `packages/*` can be added to; `pnpm install` at root installs all workspace deps

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "cv-generator",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,css,md}\" --ignore-path .prettierignore",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `.npmrc`**

```ini
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Turborepo
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test
coverage/

# Uploads (runtime)
apps/backend/uploads/*
!apps/backend/uploads/.gitkeep
```

- [ ] **Step 6: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

- [ ] **Step 7: Create `.prettierignore`**

```
node_modules
dist
build
.turbo
*.lock
pnpm-lock.yaml
```

- [ ] **Step 8: Create `tsconfig.base.json`** (shared base — extended by each package)

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 9: Create `.vscode/settings.json`** (lint-on-save for whole monorepo)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/.turbo": true
  }
}
```

- [ ] **Step 10: Create `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

- [ ] **Step 11: Create `apps/` and `packages/` placeholder dirs**

```bash
mkdir -p apps packages
touch apps/.gitkeep packages/.gitkeep
```

- [ ] **Step 12: Install root dependencies**

```bash
pnpm install
```

Expected: `node_modules/` created at root, `pnpm-lock.yaml` generated.

- [ ] **Step 13: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo root with Turborepo + pnpm workspaces"
```

---

### Task 2: Shared ESLint Config Package (`packages/config`)

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/eslint-config.js`
- Create: `packages/config/tsconfig.json`

**Interfaces:**
- Produces: `@cv-generator/config` package exporting `eslintConfig` — a flat ESLint config array. Consumed by `apps/frontend/eslint.config.js` and `apps/backend/eslint.config.js` as: `import { eslintConfig } from '@cv-generator/config'`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@cv-generator/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./eslint-config.js",
  "exports": {
    ".": "./eslint-config.js"
  },
  "scripts": {
    "lint": "echo 'No lint for config package'",
    "type-check": "echo 'No type-check for config package'"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

- [ ] **Step 2: Install config package deps**

```bash
pnpm install --filter @cv-generator/config
```

- [ ] **Step 3: Create `packages/config/eslint-config.js`**

```js
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.FlatConfig[]} */
export const eslintConfig = [
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
```

- [ ] **Step 4: Create `packages/config/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["*.js"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/config
git commit -m "chore: add shared ESLint flat config package"
```

---

### Task 3: Shared Zod Schemas Package (`packages/shared`)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/schemas/user.ts`
- Create: `packages/shared/src/schemas/staff.ts`
- Create: `packages/shared/src/schemas/skill.ts`
- Create: `packages/shared/src/schemas/project.ts`
- Create: `packages/shared/src/schemas/participation.ts`
- Create: `packages/shared/src/schemas/template.ts`
- Create: `packages/shared/src/schemas/cv.ts`
- Create: `packages/shared/src/schemas/auth.ts`
- Create: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: `@cv-generator/shared` package. Consumers import as:
  ```ts
  import type { Staff, CreateStaffInput } from '@cv-generator/shared';
  import { CreateStaffSchema } from '@cv-generator/shared';
  ```

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@cv-generator/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@cv-generator/config": "workspace:*",
    "typescript": "^5.5.0",
    "eslint": "^9.0.0"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/shared/src/schemas/auth.ts`**

```ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'staff']).default('staff'),
});

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['admin', 'staff']),
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
```

- [ ] **Step 4: Create `packages/shared/src/schemas/user.ts`**

```ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'staff']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'staff']).default('staff'),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'staff']).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

- [ ] **Step 5: Create `packages/shared/src/schemas/skill.ts`**

```ts
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
```

- [ ] **Step 6: Create `packages/shared/src/schemas/staff.ts`**

```ts
import { z } from 'zod';
import { SkillSchema } from './skill.js';

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
});

export const CreateStaffSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  yearsExperience: z.number().int().min(0).max(60),
  summary: z.string().min(1, 'Summary is required').max(2000),
});

export const UpdateStaffSchema = CreateStaffSchema.partial();

export type Staff = z.infer<typeof StaffSchema>;
export type StaffWithSkills = z.infer<typeof StaffWithSkillsSchema>;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
```

- [ ] **Step 7: Create `packages/shared/src/schemas/project.ts`**

```ts
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
```

- [ ] **Step 8: Create `packages/shared/src/schemas/participation.ts`**

```ts
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
```

- [ ] **Step 9: Create `packages/shared/src/schemas/template.ts`**

```ts
import { z } from 'zod';

export const LayoutKeyEnum = z.enum(['classic', 'modern', 'compact']);

export const CVTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  layoutKey: LayoutKeyEnum,
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type LayoutKey = z.infer<typeof LayoutKeyEnum>;
export type CVTemplate = z.infer<typeof CVTemplateSchema>;
```

- [ ] **Step 10: Create `packages/shared/src/schemas/cv.ts`**

```ts
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

- [ ] **Step 11: Create `packages/shared/src/index.ts`** (barrel export)

```ts
export * from './schemas/auth.js';
export * from './schemas/user.js';
export * from './schemas/staff.js';
export * from './schemas/skill.js';
export * from './schemas/project.js';
export * from './schemas/participation.js';
export * from './schemas/template.js';
export * from './schemas/cv.js';
```

- [ ] **Step 12: Install shared package deps and build**

```bash
pnpm install --filter @cv-generator/shared
pnpm --filter @cv-generator/shared build
```

Expected: `packages/shared/dist/` created with `.js` and `.d.ts` files.

- [ ] **Step 13: Verify TypeScript compiles cleanly**

```bash
pnpm --filter @cv-generator/shared type-check
```

Expected: No errors.

- [ ] **Step 14: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared Zod schemas and TypeScript types package"
```

---

### Task 4: Create `apps/backend` and `apps/frontend` placeholder packages

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/frontend/package.json`
- Create: `apps/backend/uploads/.gitkeep`

**Interfaces:**
- Produces: Both apps registered in pnpm workspace; `pnpm install` installs their deps; both appear in `turbo run` pipelines.

- [ ] **Step 1: Create `apps/backend/package.json`** (minimal, full setup in Plan 2)

```json
{
  "name": "@cv-generator/backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'Backend not yet set up'",
    "build": "echo 'Backend not yet set up'",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
```

- [ ] **Step 2: Create `apps/frontend/package.json`** (minimal, full setup in Plan 3)

```json
{
  "name": "@cv-generator/frontend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "echo 'Frontend not yet set up'",
    "build": "echo 'Frontend not yet set up'",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
```

- [ ] **Step 3: Create uploads directory placeholder**

```bash
mkdir -p apps/backend/uploads
touch apps/backend/uploads/.gitkeep
```

- [ ] **Step 4: Install all workspace deps from root**

```bash
pnpm install
```

Expected: All workspace packages resolved. No errors.

- [ ] **Step 5: Verify Turborepo pipeline works**

```bash
pnpm build
```

Expected: Both apps echo their placeholder messages. `packages/shared` builds successfully.

- [ ] **Step 6: Commit**

```bash
git add apps/ pnpm-lock.yaml
git commit -m "chore: scaffold apps/backend and apps/frontend workspace packages"
```

---

## Plan 1 Complete ✅

**Deliverable:** A working pnpm monorepo with Turborepo pipelines, shared ESLint flat config, and shared Zod schemas/types — ready for backend (Plan 2) and frontend (Plan 3) implementation.
