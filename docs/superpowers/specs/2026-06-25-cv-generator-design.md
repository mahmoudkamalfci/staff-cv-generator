# GISCON CV Generator — Design Specification

**Date:** 2026-06-25  
**Status:** Approved

---

## Background

GISCON regularly submits technical proposals for software development tenders. Staff CVs are currently prepared manually — a time-consuming and repetitive process. This system replaces manual CV creation with a structured internal tool that stores staff profiles and project experiences, then assembles them into professional CVs using predefined templates.

---

## Assumptions

1. The system is internal-only — no public-facing pages.
2. Only admins create user accounts; self-registration is not supported.
3. Staff photos are stored in an `uploads/` folder on the backend server (local filesystem).
4. CV export will use browser print (CSS print media queries) initially. A more robust export solution (e.g., Puppeteer PDF generation) is planned for a future phase.
5. Three CV template layouts will be implemented: **Classic**, **Modern**, and **Compact**. Templates are rendered by the frontend as React components keyed by `layout_key`.
6. JWT access tokens expire in 15 minutes; refresh tokens expire in 7 days.
7. PostgreSQL is the target database.
8. `admin` role users do not need staff profiles (they manage the system, not appear in CVs).
9. ESLint runs on save via committed VS Code workspace settings (`.vscode/settings.json`).
10. The monorepo uses **Turborepo + pnpm workspaces**.

---

## Architecture

### Monorepo Structure

```
staff-cv-generator/                 ← monorepo root
├── apps/
│   ├── frontend/                   ← React 18 + Vite + TypeScript + shadcn/ui + Tailwind v4
│   └── backend/                    ← Node.js + Express + PostgreSQL (pg / Knex)
├── packages/
│   ├── shared/                     ← Shared Zod schemas + inferred TypeScript types
│   └── config/                     ← Shared ESLint flat config
├── .vscode/
│   └── settings.json               ← Lint on save for the whole monorepo
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                    ← Root (private, devDependencies: turbo, prettier)
└── README.md
```

### Technology Stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| Frontend     | React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS v4 |
| Backend      | Node.js, Express, TypeScript                           |
| Database     | PostgreSQL                                             |
| ORM/Query    | Knex.js (SQL query builder with migrations)            |
| Validation   | Zod (shared between FE and BE via `packages/shared`)   |
| Auth         | JWT (access + refresh tokens), bcrypt                  |
| Monorepo     | Turborepo + pnpm workspaces                            |
| Linting      | ESLint (shared config in `packages/config`)            |
| Code Quality | Prettier, TypeScript strict mode                       |

---

## Database Schema

### `users`

| Column        | Type                  | Notes            |
| ------------- | --------------------- | ---------------- |
| id            | UUID PK               |                  |
| email         | VARCHAR UNIQUE        | Login credential |
| password_hash | VARCHAR               | bcrypt hash      |
| role          | ENUM('admin','staff') |                  |
| created_at    | TIMESTAMP             |                  |
| updated_at    | TIMESTAMP             |                  |

### `staff`

| Column           | Type               | Notes                                      |
| ---------------- | ------------------ | ------------------------------------------ |
| id               | UUID PK            |                                            |
| user_id          | UUID FK → users.id | One-to-one, nullable (staff without login) |
| name             | VARCHAR            | Full name                                  |
| job_title        | VARCHAR            | e.g. "Senior Software Engineer"            |
| years_experience | INTEGER            |                                            |
| summary          | TEXT               | Profile summary paragraph                  |
| photo_url        | VARCHAR            | Relative path to uploaded photo            |
| created_at       | TIMESTAMP          |                                            |
| updated_at       | TIMESTAMP          |                                            |

### `skills`

| Column   | Type                                                | Notes                      |
| -------- | --------------------------------------------------- | -------------------------- |
| id       | UUID PK                                             |                            |
| staff_id | UUID FK → staff.id                                  |                            |
| name     | VARCHAR                                             | e.g. "React", "PostgreSQL" |
| level    | ENUM('beginner','intermediate','advanced','expert') |                            |

### `projects`

| Column       | Type      | Notes                          |
| ------------ | --------- | ------------------------------ |
| id           | UUID PK   |                                |
| name         | VARCHAR   |                                |
| description  | TEXT      |                                |
| client       | VARCHAR   |                                |
| location     | VARCHAR   |                                |
| start_date   | DATE      |                                |
| end_date     | DATE      | Nullable (ongoing)             |
| technologies | TEXT[]    | PostgreSQL array of tech names |
| created_at   | TIMESTAMP |                                |
| updated_at   | TIMESTAMP |                                |

### `project_participations`

| Column           | Type                  | Notes                        |
| ---------------- | --------------------- | ---------------------------- |
| id               | UUID PK               |                              |
| staff_id         | UUID FK → staff.id    |                              |
| project_id       | UUID FK → projects.id |                              |
| role             | VARCHAR               | e.g. "Lead Developer"        |
| responsibilities | TEXT                  | Description of contributions |

### `cv_templates`

| Column      | Type                               | Notes                           |
| ----------- | ---------------------------------- | ------------------------------- |
| id          | UUID PK                            |                                 |
| name        | VARCHAR                            | Display name                    |
| layout_key  | ENUM('classic','modern','compact') | Frontend component key          |
| description | TEXT                               | Short description of the layout |
| is_active   | BOOLEAN                            | Soft-disable templates          |
| created_at  | TIMESTAMP                          |                                 |

### `generated_cvs` (audit log)

| Column       | Type                      | Notes                    |
| ------------ | ------------------------- | ------------------------ |
| id           | UUID PK                   |                          |
| staff_id     | UUID FK → staff.id        |                          |
| template_id  | UUID FK → cv_templates.id |                          |
| generated_by | UUID FK → users.id        | Who triggered generation |
| generated_at | TIMESTAMP                 |                          |

---

## Backend API

### Auth

| Method | Path                | Description                                 |
| ------ | ------------------- | ------------------------------------------- |
| POST   | `/api/auth/login`   | Returns access + refresh tokens             |
| POST   | `/api/auth/refresh` | Exchange refresh token for new access token |
| POST   | `/api/auth/logout`  | Invalidate refresh token                    |

### Users (admin only)

| Method | Path             | Description                                |
| ------ | ---------------- | ------------------------------------------ |
| GET    | `/api/users`     | List all users                             |
| POST   | `/api/users`     | Create user (and optionally link to staff) |
| PATCH  | `/api/users/:id` | Update role or email                       |
| DELETE | `/api/users/:id` | Deactivate user                            |

### Staff

| Method | Path                   | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | `/api/staff`           | List all staff (with skills count) |
| GET    | `/api/staff/:id`       | Full staff profile                 |
| POST   | `/api/staff`           | Create staff member                |
| PATCH  | `/api/staff/:id`       | Update profile                     |
| DELETE | `/api/staff/:id`       | Remove staff member                |
| POST   | `/api/staff/:id/photo` | Upload photo (multipart)           |

### Skills

| Method | Path                    | Description      |
| ------ | ----------------------- | ---------------- |
| GET    | `/api/staff/:id/skills` | Get staff skills |
| POST   | `/api/staff/:id/skills` | Add skill        |
| PATCH  | `/api/skills/:id`       | Update skill     |
| DELETE | `/api/skills/:id`       | Remove skill     |

### Projects

| Method | Path                | Description                        |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/api/projects`     | List all projects                  |
| GET    | `/api/projects/:id` | Project detail with participations |
| POST   | `/api/projects`     | Create project                     |
| PATCH  | `/api/projects/:id` | Update project                     |
| DELETE | `/api/projects/:id` | Remove project                     |

### Project Participations

| Method | Path                            | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/api/staff/:id/participations` | Staff's project history      |
| POST   | `/api/participations`           | Assign staff to project      |
| PATCH  | `/api/participations/:id`       | Update role/responsibilities |
| DELETE | `/api/participations/:id`       | Remove assignment            |

### CV Templates

| Method | Path                 | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/api/templates`     | List all active templates |
| GET    | `/api/templates/:id` | Template detail           |

### CV Generation

| Method | Path                           | Description                                              |
| ------ | ------------------------------ | -------------------------------------------------------- |
| GET    | `/api/cv/:staffId/:templateId` | Returns assembled CV data (JSON) + logs to generated_cvs |

---

## Frontend Structure

```
apps/frontend/src/
├── main.tsx
├── App.tsx
├── index.css                       ← Tailwind v4 @theme config + design tokens
├── lib/
│   ├── api.ts                      ← Axios instance with JWT interceptors
│   ├── auth.ts                     ← Auth context + hooks
│   └── utils.ts
├── components/
│   ├── ui/                         ← shadcn/ui components (Button, Card, Input, etc.)
│   ├── layout/
│   │   ├── AppShell.tsx            ← Sidebar + topbar layout wrapper
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── cv-templates/
│       ├── ClassicTemplate.tsx
│       ├── ModernTemplate.tsx
│       └── CompactTemplate.tsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── staff/
│   │   ├── StaffListPage.tsx
│   │   ├── StaffDetailPage.tsx
│   │   └── StaffFormPage.tsx
│   ├── projects/
│   │   ├── ProjectListPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── ProjectFormPage.tsx
│   ├── cv/
│   │   ├── CVGeneratorPage.tsx     ← Select staff + template → preview
│   │   └── CVPreviewPage.tsx       ← Print-ready CV view
│   └── templates/
│       └── TemplatesPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useStaff.ts
│   ├── useProjects.ts
│   └── useCVData.ts
└── types/                          ← Re-exports from @cv-generator/shared
```

### Pages Summary

| Page           | Route                                 | Description                         |
| -------------- | ------------------------------------- | ----------------------------------- |
| Login          | `/login`                              | JWT login form                      |
| Dashboard      | `/`                                   | Stats cards, recent activity        |
| Staff List     | `/staff`                              | Searchable staff table              |
| Staff Detail   | `/staff/:id`                          | Profile view with skills + projects |
| Staff Form     | `/staff/new`, `/staff/:id/edit`       | Create/edit form with photo upload  |
| Projects List  | `/projects`                           | Searchable projects table           |
| Project Detail | `/projects/:id`                       | Project info + assigned staff       |
| Project Form   | `/projects/new`, `/projects/:id/edit` | Create/edit form                    |
| CV Generator   | `/cv`                                 | Staff + template picker             |
| CV Preview     | `/cv/preview/:staffId/:templateId`    | Print-ready rendered CV             |
| Templates      | `/templates`                          | Browse available templates          |

---

## Shared Package (`packages/shared`)

Zod schemas and inferred types, zero framework dependencies:

- `StaffSchema`, `CreateStaffSchema`, `UpdateStaffSchema`
- `ProjectSchema`, `CreateProjectSchema`, `UpdateProjectSchema`
- `ParticipationSchema`, `CreateParticipationSchema`
- `SkillSchema`, `CreateSkillSchema`
- `CVTemplateSchema`
- `CVDataSchema` (assembled CV response)
- `LoginSchema`, `TokenResponseSchema`
- All types inferred via `z.infer<typeof Schema>`

---

## Design System (Tailwind v4 + shadcn/ui)

- **CSS-first config** via `@theme` block in `index.css`
- **OKLCH semantic color tokens**: `--color-primary`, `--color-background`, `--color-muted`, etc.
- **Dark mode** via `@custom-variant dark (&:where(.dark, .dark *))`
- **Typography**: Inter font from Google Fonts
- **shadcn/ui** components: Button, Card, Input, Select, Dialog, Table, Badge, Avatar, Tabs, Skeleton, Tooltip, Sheet (sidebar)
- **Animations**: fade-in, slide-in via `@keyframes` inside `@theme`

---

## CV Templates

| Key       | Name    | Description                                                                                                          |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `classic` | Classic | Traditional two-column layout. Header with photo + name, then skills sidebar, main content with experience timeline. |
| `modern`  | Modern  | Full-width, card-based layout. Accent color header, skills as tag pills, projects as cards.                          |
| `compact` | Compact | Single-column, dense layout optimized for one page. Minimal decoration, max information density.                     |

All three templates render the same `CVData` shape, differ only in visual presentation.

---

## Auth Flow

1. Admin logs in → receives `accessToken` (15min) + `refreshToken` (7d, httpOnly cookie)
2. Frontend stores `accessToken` in memory (not localStorage)
3. Axios interceptor attaches `Bearer` token to every request
4. On 401, interceptor calls `/api/auth/refresh` automatically, retries original request
5. Logout clears memory token + calls server to invalidate refresh token

---

## Linting & Code Quality

- **Shared ESLint flat config** in `packages/config/eslint-config.js`
- Extended in each app's `eslint.config.js`
- **`.vscode/settings.json`** committed to root with `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }`
- **Prettier** for formatting (separate from ESLint)
- **TypeScript strict mode** across all packages

---

## Key Design Decisions

1. **Separate `users` and `staff` tables**: Admins need auth credentials but don't appear in CVs. Keeping auth and domain data separate avoids nullable CV fields on admin accounts and follows the single-responsibility principle.
2. **Zod as the single source of truth**: Schemas live in `packages/shared` and are imported by both frontend (form validation) and backend (request validation middleware). No duplicated type definitions.
3. **Knex.js over a full ORM**: Provides SQL query building + migrations without the overhead of an ORM. Keeps queries readable and gives full control over SQL.
4. **Template-as-component pattern**: CV templates are React components, not DB-driven config. This gives full design freedom per template while the `layout_key` in the DB connects the template choice to the correct React component.
5. **Print CSS for export**: Browser's native print dialog produces high-quality PDFs without a server-side dependency. `@media print` CSS hides chrome, formats pages correctly.

---

## Out of Scope (v1)

- Self-registration for staff
- Email notifications
- Server-side PDF generation (Puppeteer) — planned for v2
- Multi-language CV generation
- CV versioning / history beyond the audit log
- Role-based field-level permissions
