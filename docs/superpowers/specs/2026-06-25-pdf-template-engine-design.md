# Design Spec: PDF Generation & Custom Template Engine

**Date:** 2026-06-25  
**Status:** Approved  
**Affects Plans:** Plan 4 (Frontend) — Task 5 & 6 replaced/extended. New Plan 5 (Backend Extension). New Plan 6 (Frontend Template Builder).

---

## Background & Problem

The original plans (Plan 3 & 4) used `window.print()` with `@media print` CSS for PDF export. This approach:

1. Produces inconsistent output across browsers and OS print engines
2. Cannot be triggered programmatically ("generate immediately on click")
3. Does not provide a predictable, pixel-perfect A4 layout
4. Has no mechanism for per-template customization

The existing `Template` model in the database only stores a `layoutKey` string — it has no fields for colors, section order, or layout structure.

This spec defines a replacement architecture using `@react-pdf/renderer` as the **single rendering engine** for both in-app PDF preview and file download, alongside a database-backed template configuration system and a wizard UI for admins to create custom templates.

---

## Goals

1. Replace `window.print()` with `@react-pdf/renderer` for all PDF output
2. Keep 3 built-in templates (Classic, Modern, Compact) backed by seeded config objects
3. Allow admin users to create custom templates by:
   - Choosing a base layout (1-column, 2-column, 3-column)
   - Configuring section visibility, order, and adding free-form custom text sections
   - Choosing primary and accent colors
4. Store all template configuration in the database as a JSON column
5. No duplicate component trees — one `CVDocument` component drives both the live preview iframe and the downloaded PDF file

---

## Non-Goals

- Server-side PDF generation (no Puppeteer, no headless Chrome)
- Non-admin users creating templates
- Per-staff-member template overrides
- Font family or font size customization (deferred to v2)
- Template sharing/publishing workflow
- PDF watermarks or company branding

---

## Architecture Overview

```
packages/shared
└── TemplateConfigSchema (Zod)     ← single validation source for frontend + backend

apps/backend
├── prisma/schema.prisma           ← Template model extended: isBuiltIn + config (Json)
├── prisma/migrations/             ← new migration for schema change
├── prisma/seed.ts                 ← 3 built-in templates seeded with default configs
└── src/templates/templates.router.ts  ← CRUD endpoints for template management

apps/frontend
├── src/components/cv-templates/
│   └── CVDocument.tsx             ← THE ONLY FILE that imports @react-pdf/renderer
├── src/pages/cv/
│   ├── CVGeneratorPage.tsx        ← "Preview CV" + "Download PDF" buttons
│   └── CVPreviewPage.tsx          ← PDFViewer iframe
└── src/pages/templates/
    ├── TemplatesPage.tsx           ← List + "New Template" (admin)
    └── TemplateWizardPage.tsx      ← 4-step wizard (create + edit)
```

---

## Data Model

### Extended `Template` Prisma Model

```prisma
model Template {
  id           String        @id @default(uuid())
  name         String
  layoutKey    String        @unique
  description  String        @default("")
  isActive     Boolean       @default(true)
  isBuiltIn    Boolean       @default(false)
  config       Json
  createdAt    DateTime      @default(now())
  generatedCvs GeneratedCV[]
}
```

**Field notes:**
- `layoutKey`: `'classic' | 'modern' | 'compact'` for built-in templates; UUID string for custom ones
- `isBuiltIn`: when `true`, PATCH and DELETE are blocked at the API level (returns 403)
- `config`: a `TemplateConfig` JSON object — see below

### `TemplateConfig` Type (in `packages/shared`)

```ts
type TemplateConfig = {
  baseLayout: 'one-column' | 'two-column' | 'three-column';
  primaryColor: string;    // hex color, e.g. "#1e3a5f"
  accentColor: string;     // hex color, e.g. "#2e86de"
  sections: SectionConfig[];
};

type SectionConfig = {
  id: 'header' | 'summary' | 'skills' | 'experience' | 'custom';
  label: string;           // display name shown in PDF
  visible: boolean;        // if false, section is skipped in rendering
  order: number;           // ascending sort order
  content?: string;        // only used when id === 'custom' (admin-written static text)
};
```

**Section rules:**
- `header` is always `visible: true` and cannot be toggled off — it is enforced at the schema level with a Zod refinement
- `custom` sections have a user-defined `label` and static `content` field (plain text, no markdown)
- Max 10 sections total (Zod `.max(10)` constraint to prevent abuse)

### Zod Schemas (in `packages/shared/src/schemas/template.ts`)

```ts
export const SectionConfigSchema = z.object({
  id: z.enum(['header', 'summary', 'skills', 'experience', 'custom']),
  label: z.string().min(1).max(60),
  visible: z.boolean(),
  order: z.number().int().min(0),
  content: z.string().max(2000).optional(),
});

export const TemplateConfigSchema = z.object({
  baseLayout: z.enum(['one-column', 'two-column', 'three-column']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  sections: z
    .array(SectionConfigSchema)
    .min(1)
    .max(10)
    .refine(
      (sections) => sections.some((s) => s.id === 'header' && s.visible),
      { message: 'Header section must always be visible' }
    ),
});

export const CreateTemplateInputSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).default(''),
  config: TemplateConfigSchema,
});

export const UpdateTemplateInputSchema = CreateTemplateInputSchema.partial();

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;
```

### Built-in Template Default Configs (seeded)

**Classic** (`two-column`, dark slate header):
```json
{
  "baseLayout": "two-column",
  "primaryColor": "#1e293b",
  "accentColor": "#475569",
  "sections": [
    { "id": "header",     "label": "Header",     "visible": true,  "order": 0 },
    { "id": "skills",     "label": "Skills",     "visible": true,  "order": 1 },
    { "id": "summary",    "label": "Profile",    "visible": true,  "order": 2 },
    { "id": "experience", "label": "Experience", "visible": true,  "order": 3 }
  ]
}
```

**Modern** (`one-column`, blue gradient header):
```json
{
  "baseLayout": "one-column",
  "primaryColor": "#1d4ed8",
  "accentColor": "#3b82f6",
  "sections": [
    { "id": "header",     "label": "Header",     "visible": true,  "order": 0 },
    { "id": "summary",    "label": "About",      "visible": true,  "order": 1 },
    { "id": "skills",     "label": "Skills",     "visible": true,  "order": 2 },
    { "id": "experience", "label": "Experience", "visible": true,  "order": 3 }
  ]
}
```

**Compact** (`one-column`, minimal monochrome):
```json
{
  "baseLayout": "one-column",
  "primaryColor": "#111827",
  "accentColor": "#374151",
  "sections": [
    { "id": "header",     "label": "Header",     "visible": true,  "order": 0 },
    { "id": "summary",    "label": "Summary",    "visible": true,  "order": 1 },
    { "id": "skills",     "label": "Skills",     "visible": true,  "order": 2 },
    { "id": "experience", "label": "Experience", "visible": true,  "order": 3 }
  ]
}
```

---

## Backend Changes (Plan 5)

> Plan 2 is already implemented. Plan 5 is a minimal additive migration — it does not touch auth, staff, projects, participations, or the CV assembly route.

### Tasks

**Task 1 — Prisma Migration**
- Add `isBuiltIn Boolean @default(false)` and `config Json` columns to `Template`
- Run `prisma migrate dev --name add-template-config`
- Update seed to populate `config` and set `isBuiltIn: true` for the 3 built-in templates

**Task 2 — Shared Schema**
- Add `TemplateConfigSchema`, `CreateTemplateInputSchema`, `UpdateTemplateInputSchema` to `packages/shared`
- Export new types: `TemplateConfig`, `CreateTemplateInput`, `UpdateTemplateInput`

**Task 3 — Template CRUD Routes**
- `POST /api/templates` — admin only; validates body with `CreateTemplateInputSchema`; generates UUID as `layoutKey`
- `PATCH /api/templates/:id` — admin only; validates body with `UpdateTemplateInputSchema`; returns 403 if `isBuiltIn`
- `DELETE /api/templates/:id` — admin only; returns 403 if `isBuiltIn`
- `GET /api/templates` — unchanged (returns all active templates, now includes `config` and `isBuiltIn`)
- `GET /api/templates/:id` — unchanged route, returns full template object

**Task 4 — CV Assembly Route Update**
- `GET /api/cv/:staffId/:templateId` already returns the template object; confirm it now includes the `config` field in its response (should be automatic once the column exists)

### API Constraints
- All template mutation routes require `requireAuth` + `requireAdmin` middleware
- `isBuiltIn` is never writable via the API — it is server-controlled only
- `layoutKey` for custom templates is set server-side to `uuid()` — not user-supplied

---

## Frontend Changes — Part A: PDF Rendering Engine (Plan 4 Update)

> Replaces Task 6 of Plan 4 (the static `ClassicTemplate`, `ModernTemplate`, `CompactTemplate` React DOM components and the `window.print()` approach). Task 1–5 of Plan 4 remain unchanged.

### `CVDocument.tsx` — The Single Rendering Component

File: `apps/frontend/src/components/cv-templates/CVDocument.tsx`

**Responsibility:** Accept `CVData` and `TemplateConfig`, produce a react-pdf `<Document>`.

```
CVDocument({ data: CVData, config: TemplateConfig })
  ├─ Builds StyleSheet from config.primaryColor + config.accentColor
  ├─ Sorts sections: config.sections.filter(visible).sort(order)
  └─ Renders based on config.baseLayout:
      ├─ 'one-column'   → single Page > full-width column, sections stacked vertically
      ├─ 'two-column'   → single Page > sidebar (skills) + main column (summary + experience)
      └─ 'three-column' → single Page > narrow col (skills) + wide col (exp) + info col (custom)
```

**Section renderers (internal sub-components in same file):**
- `HeaderSection` — staff name, job title, years experience, photo (react-pdf `<Image>`)
- `SummarySection` — plain text paragraph from `staff.summary`
- `SkillsSection` — skill name + level indicator chips
- `ExperienceSection` — project participation cards: project name, client, dates, role, responsibilities, tech tags
- `CustomSection` — renders `section.content` as a plain text block with `section.label` as heading

**Import boundary:** `@react-pdf/renderer` is ONLY imported at the top of `CVDocument.tsx`. All other files that need to render a CV reference `CVDocument` by name — they never import react-pdf directly.

### Updated `CVPreviewPage.tsx`

- Fetches `CVData` (which now includes `template.config`) via `useSuspenseQuery`
- Renders a `<PDFViewer>` iframe containing `<CVDocument data={cvData} config={cvData.template.config} />`
- Static toolbar renders immediately (Back button, Download PDF button) — toolbar is outside the Suspense boundary
- "Download PDF" button calls `pdf(<CVDocument .../>).toBlob()` and triggers browser download

### Updated `CVGeneratorPage.tsx`

Adds a **"Download PDF"** button alongside the existing "Preview CV" button:
- "Preview CV" → `navigate('/cv/preview/:staffId/:templateId')`
- "Download PDF" → inline download (fetches CV data, renders `CVDocument`, downloads blob) without navigating away
- Both buttons are disabled until staff + template are selected

---

## Frontend Changes — Part B: Template Builder Wizard (Plan 6)

### New Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/templates` | `TemplatesPage` | Template list with admin actions |
| `/templates/new` | `TemplateWizardPage` | 4-step create wizard |
| `/templates/:id/edit` | `TemplateWizardPage` | 4-step edit wizard (pre-filled) |

### `TemplatesPage` (Updated)

- Displays all templates as cards (existing behavior)
- Cards now show `isBuiltIn` badge ("Built-in")
- Admin users see **"New Template"** button → navigates to `/templates/new`
- Admin users see **"Edit"** icon button on each card → navigates to `/templates/:id/edit`
- Admin users see **"Delete"** icon button on each card — disabled with tooltip for built-in templates
- Delete shows a confirmation dialog before calling `DELETE /api/templates/:id`

### `TemplateWizardPage` — 4-Step Wizard

State managed with `React.useState` — a single `draftConfig: TemplateConfig` object updated as the user progresses. When editing, initial state is pre-populated from the fetched template.

**Step 1 — Base Template**
- Template name `<Input>` field (required)
- Template description `<Textarea>` (optional)
- Grid of 3 cards (Classic, Modern, Compact) — clicking one sets `draftConfig` to that built-in template's default config (copied, not referenced)
- If editing an existing template, the wizard skips base selection (the existing config is the starting point)

**Step 2 — Sections**
- Uses `@hello-pangea/dnd` (fork of `react-beautiful-dnd`) for drag-and-drop reordering
- Each section row:
  - Drag handle icon
  - Section label (editable text input for `custom` sections; read-only display for built-in ones)
  - Visibility toggle switch (disabled for `header`)
  - "Remove" button (only for `custom` sections)
- "Add custom section" button at bottom → appends a new `custom` section with empty label and content
- Custom sections show an expandable textarea for `content`

**Step 3 — Colors**
- Two `<input type="color">` pickers: Primary Color + Accent Color
- Live color swatch previews next to each picker
- HEX value shown and editable as a text input alongside the color picker

**Step 4 — Preview**
- Fetches the first available staff member from the API (or falls back to a hardcoded sample if none exist)
- Renders `<PDFViewer>` with `<CVDocument data={sampleData} config={draftConfig} />`
- Shows the actual PDF output before saving
- "Save Template" button:
  - On create: `POST /api/templates` → redirects to `/templates` on success
  - On edit: `PATCH /api/templates/:id` → redirects to `/templates` on success

**Step navigation:**
- "Next" / "Back" buttons persist state across steps (no data lost on step change)
- Step indicator (1 of 4) shown in wizard header
- "Cancel" link returns to `/templates` without saving

### New Data Hook: `useTemplates.ts` (extended)

Adds to the existing `useTemplateList`:
- `useTemplateDetail(id)` — `GET /api/templates/:id`
- `useCreateTemplate()` — `POST /api/templates`
- `useUpdateTemplate(id)` — `PATCH /api/templates/:id`
- `useDeleteTemplate()` — `DELETE /api/templates/:id`

All mutations invalidate `['templates']` query on success.

---

## Data Flow: End-to-End

```
[Admin: Create Template]
TemplateWizardPage
  → POST /api/templates { name, description, config: TemplateConfig }
  → Template saved to DB with isBuiltIn: false, layoutKey: uuid()
  → Cache invalidated → TemplatesPage refreshes

[User: Generate CV]
CVGeneratorPage
  → Selects staff + template
  → Clicks "Preview CV"
      → navigate('/cv/preview/:staffId/:templateId')
      → CVPreviewPage fetches GET /api/cv/:staffId/:templateId
          → response includes { staff, skills, participations, template: { config } }
      → CVDocument renders in <PDFViewer> iframe
      → User clicks "Download PDF" → pdf().toBlob() → browser download
  OR
  → Clicks "Download PDF" (inline)
      → Fetches GET /api/cv/:staffId/:templateId
      → CVDocument renders → pdf().toBlob() → browser download (no page navigation)
```

---

## Performance Constraints

- `@react-pdf/renderer` MUST be lazy-loaded — never a static import at module level (except inside `CVDocument.tsx` itself which is only loaded when needed)
- `CVDocument.tsx` is loaded via `React.lazy` so it is its own JS chunk
- `<PDFViewer>` and `pdf()` are imported from the same already-loaded chunk — no second network request
- The wizard's drag-and-drop library (`@hello-pangea/dnd`) is also lazy-loaded — only the wizard page loads it

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| `CVData` fetch fails | Error boundary shows "Failed to load CV data" with Back button |
| `pdf().toBlob()` throws | Toast error: "PDF generation failed. Please try again." |
| Template create/update fails | Toast error with server message |
| Delete built-in template (403) | Toast error: "Built-in templates cannot be deleted" |
| Staff member has no photo | `<Image>` is omitted (conditional render) |
| Custom section has empty content | Section still renders with label only |

---

## Implementation Plan Summary

This spec produces **3 plan documents**:

| Plan | Title | Scope |
|------|-------|-------|
| Plan 5 | Backend Template Extension | Prisma migration, shared schemas, template CRUD routes |
| Plan 4 (update) | Frontend — Task 6 replaced | CVDocument.tsx, updated CVPreviewPage, updated CVGeneratorPage |
| Plan 6 | Frontend Template Builder | TemplatesPage update, TemplateWizardPage, drag-and-drop sections |

> **Note:** Plan 4 Tasks 1–5 (data hooks, dashboard, staff pages, project pages, CV generator page base) are NOT affected by this spec. Only Task 6 is replaced.

---

## Dependencies

**New frontend packages:**
- `@react-pdf/renderer` — already in discussion; must be added to `apps/frontend/package.json`
- `@hello-pangea/dnd` — drag-and-drop for section reordering in wizard

**New backend packages:** None — `config Json` column uses Prisma's built-in JSON support.

**New shared schemas:** `TemplateConfigSchema`, `CreateTemplateInputSchema`, `UpdateTemplateInputSchema`

---

## Assumptions

1. The staff member used for the wizard preview (Step 4) is the first result from `GET /api/staff`. If no staff exist yet, a hardcoded sample data object is used as fallback so the wizard is always usable.
2. Custom sections' `content` field is plain text only — no markdown, no HTML.
3. The `LayoutKeyEnum` in `packages/shared` is updated to remove the hardcoded `z.enum(['classic','modern','compact'])` restriction — it becomes `z.string().min(1)` since custom templates have UUID layout keys.
4. `@react-pdf/renderer` renders font via embedded PDFKit — internet access is not required for PDF generation (it uses a default sans-serif font bundle).
5. Photo images in the PDF are fetched at render time from the backend's `/uploads/` endpoint — if the URL is unreachable, the image is silently omitted.
